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
    const { resume_text, jd_text } = body as { resume_text: string; jd_text: string };

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

    const prompt = buildResumeAnalysisPrompt(resume_text, jd_text);
    const resultText = await generateText(prompt, {
      model: 'sonnet',
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
    const normalized = {
      match_score: analysis.match_score ?? 0,
      strengths: analysis.strengths ?? analysis.extracted_skills ?? [],
      gaps: analysis.gaps ?? analysis.skill_gaps ?? [],
      suggestions: analysis.suggestions ?? analysis.suggested_focus ?? [],
      ats_analysis: analysis.ats_analysis ?? { overall_score: 0, dimensions: [], improvement: '' },
    };

    return NextResponse.json(normalized);
  } catch (error) {
    console.error('Resume analyze API error:', error);
    return NextResponse.json({ error: '服务器内部错误', code: 'INTERNAL_ERROR' }, { status: 500 });
  }
}