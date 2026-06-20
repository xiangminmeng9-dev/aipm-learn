import { NextRequest, NextResponse } from 'next/server';
import { createClient, createServiceClient } from '@/lib/supabase/server';
import { generateText } from '@/lib/ai/claude';
import { buildResumeGeneratePrompt, RESUME_GENERATE_SYSTEM_PROMPT } from '@/lib/ai/prompts';
import { withTimeout, AI_TIMEOUT_EXTENDED_MS } from '@/lib/ai/with-timeout';
import { normalizeResumeMarkdown } from '@/lib/resume/markdown-normalizer';
import { parseResumeStructure } from '@/lib/ai/resume-agent';

export const maxDuration = 120;

const VALID_STYLE_TYPES = ['standard', 'big_company', 'industry_tech', 'industry_finance', 'industry_internet'];

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: '未登录', code: 'UNAUTHORIZED' }, { status: 401 });
    }

    let body: Record<string, unknown>;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: '请求格式错误', code: 'BAD_REQUEST' }, { status: 400 });
    }

    const { resume_text, jd_text, style_type, company_name, position_name, company_type, company_preference, profile_weight, analysis_gaps, analysis_strengths } = body as {
      resume_text: string;
      jd_text?: string;
      style_type?: string;
      company_name?: string;
      position_name?: string;
      company_type?: string;
      company_preference?: string;
      profile_weight?: 'strong' | 'moderate' | 'light';
      analysis_gaps?: string[];
      analysis_strengths?: string[];
    };

    if (!resume_text?.trim()) {
      return NextResponse.json({ error: '请提供简历内容', code: 'VALIDATION_ERROR' }, { status: 400 });
    }

    const hasJd = !!(jd_text && jd_text.trim().length >= 20);
    const hasCompany = !!(company_name && company_name.trim().length >= 2);

    // Relax validation: allow generation even without JD if there's a company name or style
    if (!style_type || !VALID_STYLE_TYPES.includes(style_type)) {
      return NextResponse.json({ error: 'style_type 必须是: standard, big_company, industry_tech, industry_finance, industry_internet', code: 'VALIDATION_ERROR' }, { status: 400 });
    }

    const validWeights = ['strong', 'moderate', 'light'];
    const weight = validWeights.includes(profile_weight || '') ? profile_weight as 'strong' | 'moderate' | 'light' : 'strong';

    const prompt = buildResumeGeneratePrompt({
      resumeText: resume_text,
      jdText: hasJd ? jd_text : undefined,
      styleType: style_type,
      companyType: company_type,
      companyPreference: company_preference,
      companyName: company_name,
      profileWeight: weight,
      positionName: position_name || undefined,
      analysisGaps: Array.isArray(analysis_gaps) ? analysis_gaps : undefined,
      analysisStrengths: Array.isArray(analysis_strengths) ? analysis_strengths : undefined,
    });

    const resultText = await withTimeout(generateText(prompt, {
      model: 'sonnet',
      system: RESUME_GENERATE_SYSTEM_PROMPT,
      maxTokens: 16384,
    }), AI_TIMEOUT_EXTENDED_MS);

    // Parse JSON response
    let modifiedResume = '';
    let changesSummary: string | Array<{ dimension: string; location: string; before: string; after: string; reason: string }> = '';

    try {
      const cleaned = resultText.trim().replace(/^```json?\s*\n?/i, '').replace(/\n?```\s*$/i, '');
      const parsed = JSON.parse(cleaned);

      // Normalize changes_summary: keep as JSON array for frontend rendering
      const normalizeSummary = (val: unknown): string | Array<{ dimension: string; location: string; before: string; after: string; reason: string }> => {
        if (typeof val === 'string') {
          try { const p = JSON.parse(val); if (Array.isArray(p)) return p; } catch { /* not JSON */ }
          return val;
        }
        if (Array.isArray(val)) {
          return val.map(item => {
            if (typeof item === 'string') return { dimension: '', location: '', before: '', after: item, reason: '' };
            if (typeof item === 'object' && item !== null) {
              const obj = item as Record<string, string>;
              return {
                dimension: obj.dimension || '',
                location: obj.location || '',
                before: obj.before || '',
                after: obj.after || obj.change || obj.desc || '',
                reason: obj.reason || '',
              };
            }
            return { dimension: '', location: '', before: '', after: String(item), reason: '' };
          });
        }
        return '';
      };

      if (typeof parsed.modified_resume === 'string') {
        modifiedResume = normalizeResumeMarkdown(parsed.modified_resume);
        changesSummary = normalizeSummary(parsed.changes_summary || parsed.changesSummary);
      } else if (parsed.work_experience || parsed.name) {
        // Backward compat: old structured format
        changesSummary = normalizeSummary(parsed.changes_summary || parsed.changesSummary);
        modifiedResume = convertStructuredToMarkdown(parsed);
      } else {
        modifiedResume = normalizeResumeMarkdown(resultText.trim());
      }
    } catch {
      modifiedResume = normalizeResumeMarkdown(resultText.trim());
    }

    // Post-validation: check that no entries were deleted
    // If AI dropped bullet points or sections, patch them back from the original
    modifiedResume = validateAndPatchResume(modifiedResume, resume_text);

    // Save to resume_versions table
    try {
      const serviceSb = createServiceClient();
      await serviceSb.from('resume_versions').insert({
        user_id: user.id,
        original_resume_text: resume_text,
        modified_resume: modifiedResume,
        style_type,
        jd_text: hasJd ? jd_text : null,
        company_name: company_name || null,
        position_name: position_name || null,
        company_type: company_type || 'other',
        company_preference: company_preference || null,
        changes_summary: typeof changesSummary === 'string' ? changesSummary : JSON.stringify(changesSummary),
      });
    } catch (dbErr) {
      console.error('[resume/generate] DB save error:', dbErr);
    }

    // Return JSON response (compatible with both SSE and JSON frontend handlers)
    return NextResponse.json({
      modified_resume: modifiedResume,
      changes_summary: typeof changesSummary === 'string' ? changesSummary : JSON.stringify(changesSummary),
    });
  } catch (error) {
    console.error('Resume generate API error:', error);
    const message = error instanceof Error ? error.message : '服务器内部错误';
    return NextResponse.json({ error: message, code: 'INTERNAL_ERROR' }, { status: 500 });
  }
}

/** Convert old structured JSON format to markdown for backward compatibility */
function convertStructuredToMarkdown(parsed: Record<string, unknown>): string {
  const md: string[] = [];
  if (parsed.name) md.push('## ' + parsed.name);
  const contact = parsed.contact as Record<string, string> | undefined;
  if (contact) {
    const parts = [contact.phone, contact.email, contact.location, contact.linkedin, contact.github].filter(Boolean);
    if (parts.length) md.push(parts.join(' | '));
  }
  if (parsed.summary) md.push('\n> ' + parsed.summary + '\n');

  const workExp = parsed.work_experience as Array<Record<string, unknown>> | undefined;
  if (workExp?.length) {
    md.push('\n## 工作经历');
    for (const w of workExp) {
      md.push('### ' + (w.position || '') + ' | ' + (w.company || ''));
      if (w.period) md.push('*' + w.period + '*');
      const highlights = w.highlights as string[] | undefined;
      if (highlights) highlights.forEach(h => md.push('- ' + h));
    }
  }

  const projects = parsed.projects as Array<Record<string, unknown>> | undefined;
  if (projects?.length) {
    md.push('\n## 项目经验');
    for (const p of projects) {
      md.push('### ' + (p.name || '') + (p.role ? ' · ' + p.role : ''));
      if (p.period) md.push('*' + p.period + '*');
      if (p.description) md.push(p.description as string);
      const highlights = p.highlights as string[] | undefined;
      if (highlights) highlights.forEach(h => md.push('- ' + h));
    }
  }

  const education = parsed.education as Array<Record<string, unknown>> | undefined;
  if (education?.length) {
    md.push('\n## 教育背景');
    for (const e of education) {
      md.push('### ' + (e.school || '') + ' | ' + [e.degree, e.major].filter(Boolean).join(' · '));
      if (e.period) md.push('*' + e.period + '*');
      const highlights = e.highlights as string[] | undefined;
      if (highlights?.length) highlights.forEach(h => md.push('- ' + h));
    }
  }

  const skills = parsed.skills as Array<Record<string, unknown>> | undefined;
  if (skills?.length) {
    md.push('\n## 专业技能');
    for (const s of skills) {
      const items = s.items as string[] | undefined;
      if (items) md.push('**' + (s.category || '') + '**：' + items.join('、'));
    }
  }

  return md.join('\n');
}

/**
 * Post-validation: ensure the modified resume has at least as many entries
 * as the original. If AI deleted bullet points or sections, patch them back.
 */
function validateAndPatchResume(modified: string, original: string): string {
  const origStructure = parseResumeStructure(original);
  const modStructure = parseResumeStructure(modified);

  const violations: string[] = [];

  // 1. Check section count
  if (modStructure.sections.length < origStructure.sections.length) {
    violations.push(`板块减少：原始${origStructure.sections.length}个，修改后${modStructure.sections.length}个`);
  }

  // 2. Check entry count per section (### headings = entries like companies/projects)
  for (const origSection of origStructure.sections) {
    const modSection = modStructure.sections.find(s =>
      s.name === origSection.name || s.name.includes(origSection.name) || origSection.name.includes(s.name)
    );
    if (!modSection) {
      violations.push(`板块"${origSection.name}"缺失`);
    } else if (modSection.entryCount < origSection.entryCount) {
      violations.push(`板块"${origSection.name}"条目减少：原始${origSection.entryCount}条，修改后${modSection.entryCount}条`);
    }
  }

  // 3. Check bullet point count (- list items) per section
  const origBulletCounts = countBulletsPerSection(original);
  const modBulletCounts = countBulletsPerSection(modified);

  for (const [section, origCount] of Object.entries(origBulletCounts)) {
    const modCount = modBulletCounts[section] || 0;
    if (modCount < origCount) {
      violations.push(`板块"${section}"亮点减少：原始${origCount}条，修改后${modCount}条`);
    }
  }

  if (violations.length > 0) {
    console.warn('[resume/generate] Post-validation violations:', violations);
  }

  // If there are missing bullet points, append them from the original
  // This is a safety net — the prompt already says not to delete, but AI sometimes ignores it
  let patched = modified;
  for (const [section, origCount] of Object.entries(origBulletCounts)) {
    const modCount = modBulletCounts[section] || 0;
    if (modCount < origCount && origCount - modCount <= 3) {
      // Find the missing bullets from the original and append them
      const origBullets = extractBulletsFromSection(original, section);
      const modBullets = extractBulletsFromSection(modified, section);

      // Find bullets in original but not in modified (by content similarity)
      const missingBullets = origBullets.filter(ob =>
        !modBullets.some(mb => isSimilarBullet(ob, mb))
      );

      if (missingBullets.length > 0) {
        // Find the section in modified and append missing bullets at the end
        const sectionHeader = findSectionHeader(modified, section);
        if (sectionHeader) {
          const sectionEnd = findSectionEnd(modified, sectionHeader.index);
          const insertPos = sectionEnd !== -1 ? sectionEnd : modified.length;
          const bulletText = missingBullets.map(b => `- ${b}`).join('\n');
          patched = patched.slice(0, insertPos) + '\n' + bulletText + patched.slice(insertPos);
          console.warn(`[resume/generate] Patched ${missingBullets.length} missing bullets in "${section}"`);
        }
      }
    }
  }

  return patched;
}

/** Count bullet points (- list items) per ## section */
function countBulletsPerSection(md: string): Record<string, number> {
  const result: Record<string, number> = {};
  const lines = md.split('\n');
  let currentSection = '';

  for (const line of lines) {
    if (/^##\s/.test(line)) {
      currentSection = line.replace(/^##\s+/, '').trim();
      if (!result[currentSection]) result[currentSection] = 0;
    } else if (currentSection && /^[-*+]\s/.test(line.trim())) {
      result[currentSection] = (result[currentSection] || 0) + 1;
    }
  }

  return result;
}

/** Extract bullet point text from a specific section */
function extractBulletsFromSection(md: string, sectionName: string): string[] {
  const lines = md.split('\n');
  const bullets: string[] = [];
  let inSection = false;

  for (const line of lines) {
    if (/^##\s/.test(line)) {
      const name = line.replace(/^##\s+/, '').trim();
      inSection = name === sectionName || name.includes(sectionName) || sectionName.includes(name);
    } else if (inSection && /^[-*+]\s/.test(line.trim())) {
      bullets.push(line.trim().replace(/^[-*+]\s/, ''));
    }
  }

  return bullets;
}

/** Check if two bullets are similar (not identical, to handle AI rewording) */
function isSimilarBullet(a: string, b: string): boolean {
  // Normalize: remove bold markers, lowercase, strip punctuation
  const normalize = (s: string) => s.replace(/\*\*/g, '').toLowerCase().replace(/[，。、；：]/g, '');
  const na = normalize(a);
  const nb = normalize(b);

  // Check if one contains significant overlap with the other
  if (na.length < 10 || nb.length < 10) return false;

  // Simple overlap: check if any 8+ char substring of a appears in b
  const minLen = Math.min(na.length, nb.length);
  const windowSize = Math.min(8, Math.floor(minLen * 0.4));

  for (let i = 0; i <= na.length - windowSize; i++) {
    const substr = na.slice(i, i + windowSize);
    if (nb.includes(substr)) return true;
  }

  return false;
}

/** Find the header line index for a section */
function findSectionHeader(md: string, sectionName: string): { index: number; line: string } | null {
  const lines = md.split('\n');
  for (let i = 0; i < lines.length; i++) {
    if (/^##\s/.test(lines[i])) {
      const name = lines[i].replace(/^##\s+/, '').trim();
      if (name === sectionName || name.includes(sectionName) || sectionName.includes(name)) {
        return { index: i, line: lines[i] };
      }
    }
  }
  return null;
}

/** Find the end index of a section (start of next ## or end of document) */
function findSectionEnd(md: string, sectionStartIndex: number): number {
  const lines = md.split('\n');
  for (let i = sectionStartIndex + 1; i < lines.length; i++) {
    if (/^##\s/.test(lines[i])) {
      // Return position just before this next section header
      // (account for blank line before it)
      let end = i;
      while (end > sectionStartIndex + 1 && lines[end - 1].trim() === '') end--;
      // Convert line index to character position
      return lines.slice(0, end).join('\n').length;
    }
  }
  return md.length;
}
