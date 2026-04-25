import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { generateText } from '@/lib/ai/claude';
import { buildResumeGeneratePrompt, RESUME_GENERATE_SYSTEM_PROMPT } from '@/lib/ai/prompts';

const VALID_STYLE_TYPES = ['standard', 'big_company', 'industry_tech', 'industry_finance', 'industry_internet'];

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: '未登录', code: 'UNAUTHORIZED' }, { status: 401 });
    }

    const body = await request.json();
    const { resume_text, jd_text, style_type } = body as {
      resume_text: string;
      jd_text: string;
      style_type: string;
    };

    if (!resume_text || resume_text.trim().length < 5) {
      return NextResponse.json(
        { error: '简历内容不能为空', code: 'VALIDATION_ERROR' },
        { status: 400 }
      );
    }

    if (!jd_text || jd_text.trim().length < 20) {
      return NextResponse.json(
        { error: 'JD内容至少需要20个字符', code: 'VALIDATION_ERROR' },
        { status: 400 }
      );
    }

    if (!style_type || !VALID_STYLE_TYPES.includes(style_type)) {
      return NextResponse.json(
        { error: 'style_type 必须是: standard, big_company, industry_tech, industry_finance, industry_internet', code: 'VALIDATION_ERROR' },
        { status: 400 }
      );
    }

    const prompt = buildResumeGeneratePrompt({
      resumeText: resume_text,
      jdText: jd_text,
      styleType: style_type,
    });

    const resultText = await generateText(prompt, {
      model: 'sonnet',
      system: RESUME_GENERATE_SYSTEM_PROMPT,
      maxTokens: 8192,
    });

    // Parse JSON response (strip markdown fences if present)
    let parsed;
    try {
      const cleaned = resultText
        .trim()
        .replace(/^```json?\s*\n?/i, '')
        .replace(/\n?```\s*$/i, '');
      parsed = JSON.parse(cleaned);
    } catch {
      parsed = {
        modified_resume: resultText.trim(),
        changes_summary: '',
      };
    }

    // Save to resume_versions table
    const { data: version, error: insertError } = await supabase
      .from('resume_versions')
      .insert({
        user_id: user.id,
        original_resume_text: resume_text,
        modified_resume: parsed.modified_resume,
        changes_summary: parsed.changes_summary,
        style_type,
        jd_text,
      })
      .select('id')
      .single();

    if (insertError || !version) {
      console.error('Failed to save resume version:', insertError);
      // Still return the result even if saving fails
      return NextResponse.json({
        id: null,
        modified_resume: parsed.modified_resume,
        changes_summary: parsed.changes_summary,
      });
    }

    return NextResponse.json({
      id: version.id,
      modified_resume: parsed.modified_resume,
      changes_summary: parsed.changes_summary,
    });
  } catch (error) {
    console.error('Resume generate API error:', error);
    return NextResponse.json({ error: '服务器内部错误', code: 'INTERNAL_ERROR' }, { status: 500 });
  }
}
