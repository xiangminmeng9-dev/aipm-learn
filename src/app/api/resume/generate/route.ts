import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { generateText } from '@/lib/ai/claude';
import { buildResumeGeneratePrompt, RESUME_GENERATE_SYSTEM_PROMPT } from '@/lib/ai/prompts';
import { withTimeout, AI_TIMEOUT_MS } from '@/lib/ai/with-timeout';

export const maxDuration = 60;

const VALID_STYLE_TYPES = ['standard', 'big_company', 'industry_tech', 'industry_finance', 'industry_internet'];

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: '未登录', code: 'UNAUTHORIZED' }, { status: 401 });
    }

    const body = await request.json();
    const { resume_text, jd_text, style_type, company_name, position_name, company_type, company_preference, profile_weight, analysis_gaps, analysis_strengths } = body as {
      resume_text: string;
      jd_text?: string;
      style_type: string;
      company_name?: string;
      position_name?: string;
      company_type?: string;
      company_preference?: string;
      profile_weight?: 'strong' | 'moderate' | 'light';
      analysis_gaps?: string[];
      analysis_strengths?: string[];
    };

    if (!resume_text || resume_text.trim().length < 5) {
      return NextResponse.json({ error: '简历内容不能为空', code: 'VALIDATION_ERROR' }, { status: 400 });
    }

    const hasJd = jd_text && jd_text.trim().length >= 20;
    const hasCompany = company_name && company_name.trim().length >= 2;

    if (!hasJd && !hasCompany) {
      return NextResponse.json({ error: '请提供JD（至少20字）或公司名称（至少2字）', code: 'VALIDATION_ERROR' }, { status: 400 });
    }

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
      maxTokens: 8192,
    }), AI_TIMEOUT_MS);

    // Parse JSON response
    let modifiedResume = '';
    let changesSummary = '';

    try {
      const cleaned = resultText.trim().replace(/^```json?\s*\n?/i, '').replace(/\n?```\s*$/i, '');
      const parsed = JSON.parse(cleaned);

      // Normalize changes_summary: keep as JSON array for frontend rendering
      // Supports both old format {dimension, change, reason} and new format {dimension, location, before, after, reason}
      const normalizeSummary = (val: unknown): string => {
        if (typeof val === 'string') {
          // Try to parse as JSON array, otherwise return as-is
          try { const p = JSON.parse(val); if (Array.isArray(p)) return JSON.stringify(p); } catch { /* not JSON */ }
          return val;
        }
        if (Array.isArray(val)) {
          // Normalize each item: map old {change} to new {before,after} format
          const normalized = val.map(item => {
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
          return JSON.stringify(normalized);
        }
        return '';
      };

      // Expected format: { modified_resume, changes_summary }
      if (typeof parsed.modified_resume === 'string') {
        modifiedResume = normalizeResumeMarkdown(parsed.modified_resume);
        changesSummary = normalizeSummary(parsed.changes_summary || parsed.changesSummary);
      } else if (parsed.work_experience || parsed.name) {
        // Backward compat: if AI still returns old structured format,
        // convert to markdown preserving structure
        changesSummary = normalizeSummary(parsed.changes_summary || parsed.changesSummary);
        modifiedResume = convertStructuredToMarkdown(parsed);
      } else {
        // Fallback: use raw text
        modifiedResume = normalizeResumeMarkdown(resultText.trim());
      }
    } catch {
      // If JSON parse fails, use raw text as the modified resume
      modifiedResume = normalizeResumeMarkdown(resultText.trim());
    }

    // Save to resume_versions table
    const { data: version, error: insertError } = await supabase
      .from('resume_versions')
      .insert({
        user_id: user.id,
        original_resume_text: resume_text,
        modified_resume: modifiedResume,
        changes_summary: changesSummary,
        style_type,
        jd_text: hasJd ? jd_text : '',
        company_name: company_name || null,
        position_name: position_name || null,
        company_type: company_type || 'other',
        company_preference: company_preference || null,
      })
      .select('id')
      .single();

    if (insertError || !version) {
      console.error('Failed to save resume version:', insertError);
      return NextResponse.json({
        id: null,
        modified_resume: modifiedResume,
        changes_summary: changesSummary,
        resume_data: null,
      });
    }

    return NextResponse.json({
      id: version.id,
      modified_resume: modifiedResume,
      changes_summary: changesSummary,
      resume_data: null,
    });
  } catch (error) {
    console.error('Resume generate API error:', error);
    return NextResponse.json({ error: '服务器内部错误', code: 'INTERNAL_ERROR' }, { status: 500 });
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
 * Normalize AI-generated resume Markdown to ensure proper structure.
 * AI often forgets to use ##/### headings for sections and projects,
 * or doesn't add blank lines between blocks, causing everything to
 * render as one big paragraph.
 */
function normalizeResumeMarkdown(md: string): string {
  // Known section titles that should be ## headings
  const SECTION_TITLES = [
    '工作经历', '工作经验', '工作履历',
    '项目经历', '项目经验', '项目履历',
    '实习经历', '实习经验',
    '教育经历', '教育背景', '教育',
    '核心技能', '专业技能', '技能', '技术栈',
    '自我评价', '个人总结',
    '获奖经历', '荣誉奖项',
    '证书', '资格认证',
    '语言能力',
  ];

  // Keywords that indicate a new sub-block inside a section
  const BLOCK_STARTS = ['项目背景', '职责', '成果', '产品侧核心贡献', '核心贡献'];

  const lines = md.split('\n');
  const result: string[] = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmed = line.trim();

    // Empty line — keep it
    if (!trimmed) {
      result.push('');
      continue;
    }

    // Already a ##/###/#### heading — ensure blank line before and after
    if (/^#{1,4}\s/.test(trimmed)) {
      if (result.length > 0 && result[result.length - 1] !== '') {
        result.push('');
      }
      result.push(trimmed);
      result.push('');
      continue;
    }

    // Blockquote (> text) — ensure blank line before
    if (/^>\s/.test(trimmed)) {
      if (result.length > 0 && result[result.length - 1] !== '') {
        result.push('');
      }
      result.push(trimmed);
      continue;
    }

    // List item (- text) — keep as-is
    if (/^[-*+]\s/.test(trimmed)) {
      result.push(trimmed);
      continue;
    }

    // Check: is this a section title without ## prefix?
    // Also match **标题** (bold-wrapped) and 标题：/标题: variants
    let matchedSection = false;
    const strippedBold = trimmed.replace(/^\*\*(.+?)\*\*$/, '$1');
    for (const title of SECTION_TITLES) {
      if (strippedBold === title || strippedBold === title + '：' || strippedBold === title + ':') {
        result.push('');
        result.push('## ' + title);
        result.push('');
        matchedSection = true;
        break;
      }
    }
    if (matchedSection) continue;

    // Check: is this a sub-heading (company+position+date or project+role+date)?
    // Broader pattern: any line containing a date like "2024.7 - 2026.1" or "*2024.07 - 至今*"
    // that isn't a list item or too long
    const hasDateSuffix = /\d{4}[./]\d{1,2}\s*[-–—至]\s*(\d{4}[./]\d{1,2}|至今)/.test(trimmed)
      || /\*\d{4}[./]\d{1,2}\s*[-–—至]\s*(\d{4}[./]\d{1,2}|至今)\*/.test(trimmed);
    const looksLikeSubHeading = hasDateSuffix && trimmed.length <= 80 && !trimmed.startsWith('-');
    if (looksLikeSubHeading) {
      if (result.length > 0 && result[result.length - 1] !== '') {
        result.push('');
      }
      result.push('### ' + trimmed);
      result.push('');
      continue;
    }

    // Check: short line followed by "项目背景："/"职责：" — it's a project sub-heading
    // e.g. "政务 RAG 智能问答" followed by "项目背景：..."
    const nextTrimmed = (lines[i + 1] || '').trim();
    const isBlockKeywordLine = BLOCK_STARTS.some(kw => trimmed.startsWith(kw + '：') || trimmed.startsWith(kw + ':'));
    if (!isBlockKeywordLine && trimmed.length <= 30 && !trimmed.startsWith('-')) {
      const isProjectName = (nextTrimmed.startsWith('项目背景：') || nextTrimmed.startsWith('项目背景:') || nextTrimmed.startsWith('职责：') || nextTrimmed.startsWith('职责:'));
      if (isProjectName) {
        if (result.length > 0 && result[result.length - 1] !== '') {
          result.push('');
        }
        result.push('### ' + trimmed);
        result.push('');
        continue;
      }
    }

    // Check: line that starts with "项目背景：" etc — add blank line before for visual separation
    if (BLOCK_STARTS.some(kw => trimmed.startsWith(kw + '：') || trimmed.startsWith(kw + ':'))) {
      if (result.length > 0 && result[result.length - 1] !== '') {
        result.push('');
      }
    }

    // Regular line
    result.push(trimmed);
  }

  // Join and clean up excessive blank lines (max 2 consecutive newlines)
  return result
    .join('\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}