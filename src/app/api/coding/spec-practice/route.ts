import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { generateText } from '@/lib/ai/claude';
import {
  buildSpecPracticeQuestionPrompt,
  SPEC_PRACTICE_QUESTION_SYSTEM_PROMPT,
  buildSpecEvaluationPrompt,
  SPEC_EVALUATION_SYSTEM_PROMPT,
} from '@/lib/ai/prompts';

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: '未登录' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const refresh = searchParams.get('refresh');

    // If not refreshing, try to return a cached question (latest unanswered)
    if (refresh !== '1') {
      const { data: existing } = await supabase
        .from('spec_practices')
        .select('question, question_category')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (existing) {
        return NextResponse.json({
          question: existing.question,
          question_category: existing.question_category,
        });
      }
    }

    // Generate new question via AI
    const prompt = buildSpecPracticeQuestionPrompt();
    const result = await generateText(prompt, {
      model: 'sonnet',
      system: SPEC_PRACTICE_QUESTION_SYSTEM_PROMPT,
      maxTokens: 512,
    });

    let questionData;
    try {
      const cleaned = result.trim().replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '');
      questionData = JSON.parse(cleaned);
    } catch {
      return NextResponse.json({ error: '题目生成失败，请重试' }, { status: 500 });
    }

    return NextResponse.json({
      question: questionData.question,
      question_category: questionData.question_category,
    });
  } catch (error) {
    console.error('Spec practice question error:', error);
    return NextResponse.json({ error: '服务器内部错误' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: '未登录' }, { status: 401 });
    }

    const body = await request.json();
    const { question, question_category, user_spec } = body;

    if (!question || !question_category || !user_spec) {
      return NextResponse.json({ error: '缺少必填字段' }, { status: 400 });
    }

    if (user_spec.length < 50) {
      return NextResponse.json({ error: 'Spec 太短，至少需要 50 字' }, { status: 400 });
    }

    if (user_spec.length > 5000) {
      return NextResponse.json({ error: 'Spec 太长，最多 5000 字' }, { status: 400 });
    }

    // Evaluate spec via AI
    const prompt = buildSpecEvaluationPrompt(question, user_spec);
    const result = await generateText(prompt, {
      model: 'sonnet',
      system: SPEC_EVALUATION_SYSTEM_PROMPT,
      maxTokens: 2048,
    });

    let evaluation;
    try {
      const cleaned = result.trim().replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '');
      evaluation = JSON.parse(cleaned);
    } catch {
      return NextResponse.json({ error: 'AI 评分失败，请重试' }, { status: 500 });
    }

    // Save to database
    const { data, error } = await supabase
      .from('spec_practices')
      .insert({
        user_id: user.id,
        question,
        question_category,
        user_spec,
        total_score: evaluation.total_score,
        dimension_scores: evaluation.dimension_scores,
        suggestions: evaluation.suggestions,
      })
      .select()
      .single();

    if (error) {
      console.error('Spec practice save error:', error);
      return NextResponse.json({ error: '保存失败' }, { status: 500 });
    }

    return NextResponse.json({
      id: data.id,
      total_score: data.total_score,
      dimension_scores: data.dimension_scores,
      suggestions: data.suggestions,
      created_at: data.created_at,
    });
  } catch (error) {
    console.error('Spec practice evaluate error:', error);
    return NextResponse.json({ error: '服务器内部错误' }, { status: 500 });
  }
}
