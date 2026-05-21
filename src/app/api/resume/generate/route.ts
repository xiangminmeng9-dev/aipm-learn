import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { generateText } from '@/lib/ai/claude';
import { buildResumeGeneratePrompt, RESUME_GENERATE_SYSTEM_PROMPT } from '@/lib/ai/prompts';

const VALID_STYLE_TYPES = ['standard', 'big_company', 'industry_tech', 'industry_finance', 'industry_internet'];

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: '未登录', code: 'UNAUTHORIZED' }, { status: 401 });
    }

    const body = await request.json();
    const { resume_text, jd_text, style_type, company_name, position_name, company_type, company_preference } = body as {
      resume_text: string;
      jd_text: string;
      style_type: string;
      company_name?: string;
      position_name?: string;
      company_type?: string;
      company_preference?: string;
    };

    if (!resume_text || resume_text.trim().length < 5) {
      return NextResponse.json({ error: '简历内容不能为空', code: 'VALIDATION_ERROR' }, { status: 400 });
    }

    if (!jd_text || jd_text.trim().length < 20) {
      return NextResponse.json({ error: 'JD内容至少需要20个字符', code: 'VALIDATION_ERROR' }, { status: 400 });
    }

    if (!style_type || !VALID_STYLE_TYPES.includes(style_type)) {
      return NextResponse.json({ error: 'style_type 必须是: standard, big_company, industry_tech, industry_finance, industry_internet', code: 'VALIDATION_ERROR' }, { status: 400 });
    }

    const prompt = buildResumeGeneratePrompt({
      resumeText: resume_text,
      jdText: jd_text,
      styleType: style_type,
      companyType: company_type,
      companyPreference: company_preference,
    });

    const resultText = await generateText(prompt, {
      model: 'sonnet',
      system: RESUME_GENERATE_SYSTEM_PROMPT,
      maxTokens: 8192,
    });

    // Parse JSON response
    let parsed: Record<string, unknown>;
    try {
      const cleaned = resultText.trim().replace(/^```json?\s*\n?/i, '').replace(/\n?```\s*$/i, '');
      parsed = JSON.parse(cleaned);
    } catch {
      return NextResponse.json({ modified_resume: resultText.trim(), changes_summary: '', resume_data: null });
    }

    // Determine if this is new structured format or old format
    let modifiedResume: string;
    let changesSummary: string;
    let resumeData: Record<string, unknown> | null = null;

    if (parsed.work_experience || parsed.name) {
      // New structured format
      resumeData = parsed;
      changesSummary = (parsed.changes_summary as string) || '';

      // Generate markdown for backward compat (ResumeResult display)
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

      modifiedResume = md.join('\n');
    } else {
      // Old format
      modifiedResume = (parsed.modified_resume as string) || '';
      changesSummary = (parsed.changes_summary as string) || '';
      resumeData = null;
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
        jd_text,
        company_name: company_name || null,
        position_name: position_name || null,
      })
      .select('id')
      .single();

    if (insertError || !version) {
      console.error('Failed to save resume version:', insertError);
      return NextResponse.json({
        id: null,
        modified_resume: modifiedResume,
        changes_summary: changesSummary,
        resume_data: resumeData,
      });
    }

    return NextResponse.json({
      id: version.id,
      modified_resume: modifiedResume,
      changes_summary: changesSummary,
      resume_data: resumeData,
    });
  } catch (error) {
    console.error('Resume generate API error:', error);
    return NextResponse.json({ error: '服务器内部错误', code: 'INTERNAL_ERROR' }, { status: 500 });
  }
}