import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { generateText } from '@/lib/ai/claude';
import { buildResumeAnalysisPrompt, RESUME_ANALYSIS_SYSTEM_PROMPT } from '@/lib/ai/prompts';

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
    const { resume_text, jd_text, company_name, company_type, company_preference } = body as {
      resume_text: string;
      jd_text?: string;
      company_name?: string;
      company_type?: string;
      company_preference?: string;
    };

    if (!resume_text || resume_text.trim().length < 5) {
      return NextResponse.json(
        { error: '简历内容不能为空', code: 'VALIDATION_ERROR' },
        { status: 400 }
      );
    }

    const hasJd = jd_text && jd_text.trim().length >= 20;
    const hasCompany = company_name && company_name.trim().length >= 2;

    if (!hasJd && !hasCompany) {
      return NextResponse.json(
        { error: '请提供JD（至少20字）或公司名称（至少2字）', code: 'VALIDATION_ERROR' },
        { status: 400 }
      );
    }

    // Build company profile for analysis
    const companyProfile = hasCompany ? {
      companyName: company_name!.trim(),
      companyType: company_type || undefined,
      companyPreference: company_preference || undefined,
    } : undefined;

    const prompt = buildResumeAnalysisPrompt(
      resume_text,
      hasJd ? jd_text : undefined,
      companyProfile
    );

    const resultText = await generateText(prompt, {
      model: 'haiku',
      system: RESUME_ANALYSIS_SYSTEM_PROMPT,
      maxTokens: 4096,
    });

    // Parse JSON response (strip markdown fences if present)
    let analysis;
    try {
      const cleaned = resultText
        .trim()
        .replace(/^```json?\s*\n?/i, '')
        .replace(/\n?```\s*$/i, '');
      analysis = JSON.parse(cleaned);
    } catch {
      analysis = {
        match_score: 0,
        strengths: [],
        gaps: [],
        suggestions: [],
        ats_analysis: { overall_score: 0, dimensions: [], improvement: '' },
        raw: resultText.trim(),
      };
    }

    // Normalize field names for frontend compatibility
    // Ensure arrays are actually arrays (AI may return strings or other types)
    const ensureArray = (val: unknown): string[] => {
      if (Array.isArray(val)) return val.map(String);
      if (typeof val === 'string') return [val];
      return [];
    };

    const normalized = {
      match_score: analysis.match_score ?? 0,
      strengths: ensureArray(analysis.strengths ?? analysis.extracted_skills),
      gaps: ensureArray(analysis.gaps ?? analysis.skill_gaps),
      suggestions: ensureArray(analysis.suggestions ?? analysis.suggested_focus),
      ats_analysis: analysis.ats_analysis ?? { overall_score: 0, dimensions: [], improvement: '' },
    };

    return NextResponse.json(normalized);
  } catch (error) {
    console.error('Resume analyze API error:', error);
    return NextResponse.json({ error: '服务器内部错误', code: 'INTERNAL_ERROR' }, { status: 500 });
  }
}
