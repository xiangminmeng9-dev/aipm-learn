// ─── Resume Optimization Agent ──────────────────────────────────────
// Agent loop: AI decides which tools to call, iterates until satisfied
// Replaces the previous one-shot generateText approach

import { generateWithTools, type ToolDefinition, type AgentMessage, type ToolUseCall } from '@/lib/ai/claude';
import { buildResumeAgentSystemPrompt, buildResumeAgentUserPrompt } from '@/lib/ai/prompts';

// ─── Types ───────────────────────────────────────────────────────

export interface ResumeAgentContext {
  originalResume: string;
  currentResume: string;
  jdText?: string;
  companyPreference?: string;
  companyName?: string;
  positionName?: string;
  styleType: string;
  companyType?: string;
  profileWeight: 'strong' | 'moderate' | 'light';
  analysisGaps?: string[];
  analysisStrengths?: string[];
  changesSummary: ChangeRecord[];
  originalStructure: ResumeStructure;
}

export interface ChangeRecord {
  dimension: string;
  location: string;
  before: string;
  after: string;
  reason: string;
}

export interface ResumeStructure {
  sections: Array<{ name: string; entryCount: number }>;
  personalInfo: { name: string; contact: string };
}

export type AgentEvent =
  | { type: 'start'; message: string }
  | { type: 'tool_call'; step: number; tool: string; input: Record<string, unknown> }
  | { type: 'tool_result'; step: number; tool: string; output: unknown }
  | { type: 'thinking'; content: string }
  | { type: 'done'; modifiedResume: string; changesSummary: ChangeRecord[] }
  | { type: 'error'; error: string };

const MAX_ITERATIONS = 8;

// ─── Tool Definitions ────────────────────────────────────────────

const RESUME_TOOLS: ToolDefinition[] = [
  {
    name: 'read_section',
    description: 'Read a section of the current resume. Returns the text content of that section. Use "full" to read the entire resume.',
    input_schema: {
      type: 'object',
      properties: {
        section: {
          type: 'string',
          enum: ['summary', 'work_experience', 'projects', 'internships', 'education', 'skills', 'full'],
          description: 'Which section to read',
        },
      },
      required: ['section'],
    },
  },
  {
    name: 'apply_changes',
    description: 'Apply changes to the resume. Each change replaces specific text (before) with new text (after). The "before" text must exist exactly in the current resume. For the skills section, you can add new skills from JD/profile, replace vague descriptions with specific ones, or restructure skill groups. All changes are validated before applying.',
    input_schema: {
      type: 'object',
      properties: {
        changes: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              section: { type: 'string', description: 'Section being modified' },
              before: { type: 'string', description: 'Exact text to find in current resume. For adding new skills, use the last skill in the group as before and append the new skill in after.' },
              after: { type: 'string', description: 'Replacement text. Can include new skills, restructured descriptions, or completely rewritten content.' },
              reason: { type: 'string', description: 'Why this change improves the resume' },
              dimension: { type: 'string', description: 'Optimization dimension (STAR法则, 量化指标, 画像融入, 核心技能重构, etc.)' },
            },
            required: ['section', 'before', 'after', 'reason', 'dimension'],
          },
          description: 'Array of changes to apply. For skills section, you can add JD/profile skills, replace vague skills with specific ones, or restructure groups.',
        },
      },
      required: ['changes'],
    },
  },
  {
    name: 'check_jd_alignment',
    description: 'Check how well the current resume aligns with the JD keywords. Returns which keywords are present, missing, and suggestions. Only available when a JD was provided.',
    input_schema: {
      type: 'object',
      properties: {
        focus_section: { type: 'string', description: 'Optional: only check alignment for this section' },
      },
    },
  },
  {
    name: 'check_profile_alignment',
    description: 'Check how well the current resume reflects the company profile preferences. Returns coverage status and suggestions. Only available when a company profile was provided.',
    input_schema: { type: 'object', properties: {} },
  },
  {
    name: 'validate_constraints',
    description: 'Validate that the resume still meets all hard constraints (no deleted entries, no fabricated data, structure preserved, personal info unchanged). Returns violations if any.',
    input_schema: { type: 'object', properties: {} },
  },
  {
    name: 'finish',
    description: 'Signal that optimization is complete. Call this when you are satisfied with the resume or have reached diminishing returns.',
    input_schema: {
      type: 'object',
      properties: {
        summary: { type: 'string', description: 'Brief summary of what was accomplished' },
      },
      required: ['summary'],
    },
  },
];

// ─── Agent Loop ──────────────────────────────────────────────────

export async function runResumeAgent(
  context: ResumeAgentContext,
  emit: (event: AgentEvent) => void,
): Promise<{ currentResume: string; changesSummary: ChangeRecord[] }> {
  const systemPrompt = buildResumeAgentSystemPrompt({
    hasJd: !!context.jdText,
    hasProfile: !!context.companyPreference,
    styleType: context.styleType,
    profileWeight: context.profileWeight,
  });

  const userPrompt = buildResumeAgentUserPrompt({
    resumeText: context.originalResume,
    jdText: context.jdText,
    companyPreference: context.companyPreference,
    companyName: context.companyName,
    positionName: context.positionName,
    analysisGaps: context.analysisGaps,
    analysisStrengths: context.analysisStrengths,
  });

  const messages: AgentMessage[] = [
    { role: 'user', content: userPrompt },
  ];

  let step = 0;
  let finished = false;
  let noToolCallCount = 0;
  const MAX_NO_TOOL_CALL_RETRIES = 2;

  while (step < MAX_ITERATIONS && !finished) {
    step++;

    const response = await generateWithTools({
      system: systemPrompt,
      messages,
      tools: RESUME_TOOLS,
      model: 'sonnet',
      maxTokens: 4096,
    });

    // Emit thinking text if any
    if (response.text.trim()) {
      emit({ type: 'thinking', content: response.text.trim() });
    }

    // No tool calls → agent might be done or stuck
    if (response.toolCalls.length === 0) {
      noToolCallCount++;

      // If no changes have been applied yet, try to recover
      if (context.changesSummary.length === 0) {
        if (noToolCallCount <= MAX_NO_TOOL_CALL_RETRIES) {
          // Retry: explicitly instruct the AI to use apply_changes tool
          emit({ type: 'thinking', content: `[重试 ${noToolCallCount}/${MAX_NO_TOOL_CALL_RETRIES}] AI未调用工具，正在引导其使用apply_changes...` });
          messages.push({ role: 'assistant', content: [{ type: 'text', text: response.text.trim() }] });
          messages.push({
            role: 'user',
            content: '你还没有调用任何工具来修改简历。请立即使用 apply_changes 工具对简历进行修改。不要只分析，必须实际调用 apply_changes 来应用修改。先从最重要的板块开始修改。',
          });
          continue;
        } else {
          // Exhausted retries — try to extract modified resume from text as last resort
          const extracted = extractResumeFromText(response.text, context.originalResume);
          if (extracted) {
            context.currentResume = extracted;
            context.changesSummary.push({
              dimension: '文本提取',
              location: '全文',
              before: '(原始简历)',
              after: '(从AI输出中提取的修改版)',
              reason: 'AI未调用apply_changes工具，从文本输出中提取修改版简历',
            });
            emit({ type: 'thinking', content: 'AI未调用工具，已从文本输出中提取修改版简历' });
          }
          break;
        }
      } else {
        // Changes were already applied in previous steps — agent is likely done
        break;
      }
    } else {
      // Reset counter when tool calls are made
      noToolCallCount = 0;
    }

    // Build assistant message with tool_use blocks
    const assistantContent: Array<{ type: 'text'; text: string } | { type: 'tool_use'; id: string; name: string; input: Record<string, unknown> }> = [];
    if (response.text.trim()) {
      assistantContent.push({ type: 'text', text: response.text.trim() });
    }

    const toolResults: Array<{ type: 'tool_result'; tool_use_id: string; content: string; is_error?: boolean }> = [];

    for (const toolCall of response.toolCalls) {
      assistantContent.push({ type: 'tool_use', id: toolCall.id, name: toolCall.name, input: toolCall.input });

      emit({ type: 'tool_call', step, tool: toolCall.name, input: toolCall.input });

      // Execute the tool
      const result = executeTool(toolCall.name, toolCall.input, context);

      emit({ type: 'tool_result', step, tool: toolCall.name, output: result.output });

      toolResults.push({
        type: 'tool_result',
        tool_use_id: toolCall.id,
        content: JSON.stringify(result.output),
        is_error: result.error,
      });

      // Check if finish was called
      if (toolCall.name === 'finish') {
        finished = true;
      }
    }

    // Add assistant message and tool results to conversation
    messages.push({ role: 'assistant', content: assistantContent });
    if (toolResults.length > 0) {
      messages.push({ role: 'user', content: toolResults });
    }
  }

  return { currentResume: context.currentResume, changesSummary: context.changesSummary };
}

// ─── Tool Execution ──────────────────────────────────────────────

function executeTool(
  name: string, input: Record<string, unknown>, context: ResumeAgentContext
): { output: unknown; error?: boolean } {
  try {
    switch (name) {
      case 'read_section':
        return { output: toolReadSection(input, context) };
      case 'apply_changes':
        return { output: toolApplyChanges(input, context) };
      case 'check_jd_alignment':
        return { output: toolCheckJdAlignment(input, context) };
      case 'check_profile_alignment':
        return { output: toolCheckProfileAlignment(input, context) };
      case 'validate_constraints':
        return { output: toolValidateConstraints(input, context) };
      case 'finish':
        return { output: { done: true, summary: input.summary || '优化完成' } };
      default:
        return { output: { error: `Unknown tool: ${name}` }, error: true };
    }
  } catch (err) {
    return { output: { error: err instanceof Error ? err.message : String(err) }, error: true };
  }
}

// ─── Tool Implementations ────────────────────────────────────────

function toolReadSection(input: Record<string, unknown>, context: ResumeAgentContext) {
  const section = String(input.section || 'full');
  if (section === 'full') return { content: context.currentResume };

  const lines = context.currentResume.split('\n');
  const sectionMap: Record<string, string[]> = {};
  let currentSection = '';

  for (const line of lines) {
    if (/^##\s/.test(line)) {
      currentSection = line.replace(/^##\s+/, '').trim();
      if (!sectionMap[currentSection]) sectionMap[currentSection] = [];
    }
    if (currentSection) {
      sectionMap[currentSection].push(line);
    }
  }

  // Map section enum to actual section names
  const sectionAliases: Record<string, string[]> = {
    summary: ['Summary', '定位', '个人简介', '自我评价'],
    work_experience: ['工作经历', '工作经验', '工作履历'],
    projects: ['项目经历', '项目经验', '项目履历'],
    internships: ['实习经历', '实习经验'],
    education: ['教育经历', '教育背景', '教育'],
    skills: ['核心技能', '专业技能', '技能', '技术栈'],
  };

  const aliases = sectionAliases[section] || [section];
  for (const [heading, content] of Object.entries(sectionMap)) {
    for (const alias of aliases) {
      if (heading.includes(alias) || alias.includes(heading)) {
        return { section: heading, content: content.join('\n') };
      }
    }
  }

  return { content: `未找到"${section}"板块，可用板块: ${Object.keys(sectionMap).join(', ')}` };
}

function toolApplyChanges(input: Record<string, unknown>, context: ResumeAgentContext) {
  const changes = input.changes as Array<{ section: string; before: string; after: string; reason: string; dimension: string }>;
  if (!Array.isArray(changes) || changes.length === 0) {
    return { applied: 0, failed: [], message: 'No changes provided' };
  }

  let applied = 0;
  const failed: Array<{ before: string; reason: string }> = [];
  const appliedChanges: ChangeRecord[] = [];

  for (const change of changes) {
    // Validate: before text must exist in current resume
    if (!context.currentResume.includes(change.before)) {
      failed.push({ before: change.before.slice(0, 50), reason: '要替换的文本在当前简历中不存在' });
      continue;
    }

    // Validate: no deleting bullet points (except skills section where we can add)
    const beforeBullets = (change.before.match(/^[-*+]\s/gm) || []).length;
    const afterBullets = (change.after.match(/^[-*+]\s/gm) || []).length;
    if (beforeBullets > afterBullets && change.section !== 'skills' && change.section !== '核心技能') {
      // Check if it's actually removing a whole entry
      const beforeLines = change.before.split('\n').filter(l => l.trim().startsWith('- '));
      const afterLines = change.after.split('\n').filter(l => l.trim().startsWith('- '));
      if (beforeLines.length > afterLines.length) {
        failed.push({ before: change.before.slice(0, 50), reason: '不能删除工作亮点条目' });
        continue;
      }
    }

    // For skills section: allow adding new skills (afterBullets > beforeBullets is OK)
    // But still don't allow removing existing skills
    if ((change.section === 'skills' || change.section === '核心技能' || change.section === '技能') && beforeBullets > afterBullets) {
      const beforeSkills = change.before.split(/[,，、;；\n]/).filter(s => s.trim());
      const afterSkills = change.after.split(/[,，、;；\n]/).filter(s => s.trim());
      if (afterSkills.length < beforeSkills.length) {
        failed.push({ before: change.before.slice(0, 50), reason: '核心技能板块不能删除已有技能' });
        continue;
      }
    }

    // Apply the change
    context.currentResume = context.currentResume.replace(change.before, change.after);
    applied++;

    appliedChanges.push({
      dimension: change.dimension,
      location: change.section,
      before: change.before,
      after: change.after,
      reason: change.reason,
    });

    context.changesSummary.push({
      dimension: change.dimension,
      location: change.section,
      before: change.before,
      after: change.after,
      reason: change.reason,
    });
  }

  return {
    applied,
    failed,
    totalChanges: context.changesSummary.length,
    message: `成功应用 ${applied} 处修改${failed.length > 0 ? `，${failed.length} 处被拒绝` : ''}`,
  };
}

function toolCheckJdAlignment(input: Record<string, unknown>, context: ResumeAgentContext) {
  if (!context.jdText) return { error: '没有提供JD' };

  // Simple keyword extraction from JD
  const jdKeywords = extractKeywords(context.jdText);
  const resumeLower = context.currentResume.toLowerCase();

  const present: string[] = [];
  const missing: string[] = [];

  for (const kw of jdKeywords) {
    if (resumeLower.includes(kw.toLowerCase())) {
      present.push(kw);
    } else {
      missing.push(kw);
    }
  }

  const focusSection = input.focus_section ? String(input.focus_section) : undefined;
  return {
    presentKeywords: present,
    missingKeywords: missing,
    coverage: `${present.length}/${jdKeywords.length} (${Math.round(present.length / Math.max(jdKeywords.length, 1) * 100)}%)`,
    suggestions: missing.slice(0, 5).map(kw => `考虑在相关经历中融入"${kw}"`),
    ...(focusSection ? { focusSection } : {}),
  };
}

function toolCheckProfileAlignment(_input: Record<string, unknown>, context: ResumeAgentContext) {
  if (!context.companyPreference) return { error: '没有提供公司画像' };

  let profile: { persona?: string; core_skills?: Array<{ name: string }>; soft_skills?: string[]; not_care?: string };
  try {
    profile = typeof context.companyPreference === 'string'
      ? JSON.parse(context.companyPreference)
      : context.companyPreference;
  } catch {
    return { error: '画像格式解析失败' };
  }

  const resumeLower = context.currentResume.toLowerCase();

  const coreSkillCoverage = (profile.core_skills || []).map((s: { name: string }) => ({
    skill: s.name,
    present: resumeLower.includes(s.name.toLowerCase()),
  }));

  const softSkillCoverage = (profile.soft_skills || []).map((s: string) => ({
    skill: s,
    present: resumeLower.includes(s.toLowerCase()),
  }));

  const missingCore = coreSkillCoverage.filter(s => !s.present).map(s => s.skill);
  const missingSoft = softSkillCoverage.filter(s => !s.present).map(s => s.skill);

  return {
    coreSkillCoverage: coreSkillCoverage,
    softSkillCoverage: softSkillCoverage,
    missingCoreSkills: missingCore,
    missingSoftSkills: missingSoft,
    suggestions: [
      ...missingCore.slice(0, 3).map(s => `在工作/项目经历中体现"${s}"`),
      ...missingSoft.slice(0, 2).map(s => `通过叙事体现"${s}"软技能`),
    ],
  };
}

function toolValidateConstraints(_input: Record<string, unknown>, context: ResumeAgentContext) {
  const violations: string[] = [];
  const currentStructure = parseResumeStructure(context.currentResume);

  // 1. Section count
  if (currentStructure.sections.length < context.originalStructure.sections.length) {
    violations.push(`板块减少：原始${context.originalStructure.sections.length}个，当前${currentStructure.sections.length}个`);
  }

  // 2. Entry count per section
  for (const origSection of context.originalStructure.sections) {
    const current = currentStructure.sections.find(s => s.name === origSection.name);
    if (!current) {
      violations.push(`板块"${origSection.name}"被删除`);
    } else if (current.entryCount < origSection.entryCount) {
      violations.push(`板块"${origSection.name}"条目减少：原始${origSection.entryCount}条，当前${current.entryCount}条`);
    }
  }

  // 3. Personal info
  const currentPersonal = extractPersonalInfo(context.currentResume);
  if (context.originalStructure.personalInfo.name && currentPersonal.name &&
      context.originalStructure.personalInfo.name !== currentPersonal.name) {
    violations.push(`姓名被修改：${context.originalStructure.personalInfo.name} → ${currentPersonal.name}`);
  }

  return {
    valid: violations.length === 0,
    violations,
  };
}

// ─── Helpers ─────────────────────────────────────────────────────

/**
 * Attempt to extract a modified resume from AI text output.
 * This is a fallback when the AI doesn't call apply_changes but outputs
 * a modified resume in its text response.
 */
function extractResumeFromText(text: string, originalResume: string): string | null {
  if (!text || text.trim().length < 100) return null;

  // Strategy 1: Look for JSON with modified_resume field
  const jsonMatch = text.match(/\{[\s\S]*?"modified_resume"\s*:\s*"([\s\S]*?)"\s*[,}]/);
  if (jsonMatch) {
    try {
      // Try to parse the full JSON
      const fullJsonMatch = text.match(/\{[\s\S]*"modified_resume"[\s\S]*\}/);
      if (fullJsonMatch) {
        const parsed = JSON.parse(fullJsonMatch[0]);
        if (parsed.modified_resume && typeof parsed.modified_resume === 'string' && parsed.modified_resume.length > 100) {
          return parsed.modified_resume;
        }
      }
    } catch { /* fall through */ }
  }

  // Strategy 2: Look for markdown resume content (## headings pattern matching original)
  const originalHeadings = originalResume.match(/^##\s+.+$/gm) || [];
  if (originalHeadings.length >= 2) {
    // Find a contiguous block of text that contains at least 2 of the same ## headings
    const lines = text.split('\n');
    let bestStart = -1;
    let bestMatchCount = 0;
    let bestEnd = -1;

    for (let i = 0; i < lines.length; i++) {
      const headingMatch = originalHeadings.some(h => lines[i].trim() === h.trim());
      if (headingMatch) {
        if (bestStart === -1) bestStart = i;
        let matchCount = 1;
        let end = i + 1;
        for (let j = i + 1; j < lines.length; j++) {
          if (originalHeadings.some(h => lines[j].trim() === h.trim())) matchCount++;
          end = j + 1;
        }
        if (matchCount > bestMatchCount) {
          bestMatchCount = matchCount;
          bestStart = i;
          bestEnd = end;
        }
      }
    }

    if (bestMatchCount >= 2 && bestStart >= 0) {
      const extracted = lines.slice(bestStart, bestEnd).join('\n').trim();
      if (extracted.length > originalResume.length * 0.3) {
        return extracted;
      }
    }
  }

  // Strategy 3: If the text is significantly long (> 80% of original) and contains
  // markdown headings, it might be the full modified resume
  if (text.length > originalResume.length * 0.8 && /^##\s+/m.test(text)) {
    return text.trim();
  }

  return null;
}

export function parseResumeStructure(md: string): ResumeStructure {
  const sections: ResumeStructure['sections'] = [];
  const lines = md.split('\n');
  let currentSection = '';
  let currentEntries = 0;
  let personalInfo = { name: '', contact: '' };

  for (const line of lines) {
    if (/^##\s/.test(line)) {
      if (currentSection) {
        sections.push({ name: currentSection, entryCount: currentEntries });
      }
      currentSection = line.replace(/^##\s+/, '').trim();
      currentEntries = 0;
    } else if (/^###\s/.test(line)) {
      currentEntries++;
    }
  }
  if (currentSection) {
    sections.push({ name: currentSection, entryCount: currentEntries });
  }

  // Extract personal info (first ## heading = name, next line = contact)
  personalInfo = extractPersonalInfo(md);

  return { sections, personalInfo };
}

function extractPersonalInfo(md: string): { name: string; contact: string } {
  const lines = md.split('\n');
  let name = '';
  let contact = '';

  for (const line of lines) {
    const trimmed = line.trim();
    if (/^##\s/.test(trimmed) && !name) {
      name = trimmed.replace(/^##\s+/, '').trim();
    } else if (name && !contact && trimmed && !trimmed.startsWith('#') && !trimmed.startsWith('>')) {
      contact = trimmed;
      break;
    }
  }

  return { name, contact };
}

function extractKeywords(text: string): string[] {
  // Simple keyword extraction: split by common delimiters, filter stop words and short terms
  const stopWords = new Set(['的', '了', '在', '是', '和', '与', '或', '等', '及', '中', '为', '对', '从', '到',
    'the', 'a', 'an', 'is', 'are', 'was', 'were', 'be', 'been', 'being', 'have', 'has', 'had',
    'do', 'does', 'did', 'will', 'would', 'could', 'should', 'may', 'might', 'shall', 'can',
    'to', 'of', 'in', 'for', 'on', 'with', 'at', 'by', 'from', 'as', 'into', 'through',
    'and', 'or', 'but', 'not', 'if', 'then', 'than', 'so', 'that', 'this', 'it', 'its']);

  const words = text
    .replace(/[^\w一-鿿+/.#-]/g, ' ')
    .split(/\s+/)
    .filter(w => w.length >= 2 && !stopWords.has(w.toLowerCase()));

  // Deduplicate and return top keywords
  return [...new Set(words)].slice(0, 30);
}
