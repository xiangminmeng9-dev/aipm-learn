import { NextRequest, NextResponse } from 'next/server';
import { createClient, createServiceClient } from '@/lib/supabase/server';
import { generateText } from '@/lib/ai/claude';
import { buildMockSummaryPrompt, MOCK_SUMMARY_SYSTEM_PROMPT } from '@/lib/ai/prompts';

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    // Fallback: try Authorization header
    let authenticatedUser = user;
    if (!authenticatedUser) {
      const authHeader = request.headers.get('Authorization');
      if (authHeader?.startsWith('Bearer ')) {
        const token = authHeader.slice(7);
        const { data: { user: headerUser } } = await supabase.auth.getUser(token);
        authenticatedUser = headerUser;
      }
    }

    if (!authenticatedUser) {
      return NextResponse.json({ error: '未登录', code: 'UNAUTHORIZED' }, { status: 401 });
    }

    const { id: mockId } = await params;
    const serviceClient = createServiceClient();

    // 获取模拟面试
    const { data: mockInterview } = await serviceClient
      .from('mock_interviews')
      .select(
        'id, type_id, total_questions, status, total_score, summary_strengths, summary_weaknesses, summary_suggestions, weak_skill_modules'
      )
      .eq('id', mockId)
      .eq('user_id', authenticatedUser.id)
      .single();

    if (!mockInterview) {
      return NextResponse.json({ error: '模拟面试不存在', code: 'NOT_FOUND' }, { status: 404 });
    }

    if (mockInterview.status !== 'completed') {
      return NextResponse.json(
        { error: '面试尚未完成', code: 'VALIDATION_ERROR' },
        { status: 400 }
      );
    }

    // 获取所有答案
    const { data: answers } = await serviceClient
      .from('interview_answers')
      .select('question_number, question_text, user_answer, score, gap_analysis, is_skipped')
      .eq('mock_interview_id', mockId)
      .order('question_number', { ascending: true });

    const answerList = answers ?? [];
    const answeredCount = answerList.filter((a) => !a.is_skipped).length;
    const skippedCount = answerList.filter((a) => a.is_skipped).length;

    // 如果已有总结，直接返回
    if (mockInterview.summary_strengths) {
      return NextResponse.json({
        id: mockInterview.id,
        total_score: mockInterview.total_score,
        question_count: mockInterview.total_questions,
        answered_count: answeredCount,
        skipped_count: skippedCount,
        answers: answerList.map((a) => ({
          number: a.question_number,
          question: a.question_text,
          score: a.score,
          gap_analysis: a.gap_analysis,
          is_skipped: a.is_skipped,
        })),
        strengths: mockInterview.summary_strengths,
        weaknesses: mockInterview.summary_weaknesses,
        suggestions: mockInterview.summary_suggestions,
        weak_skill_modules: mockInterview.weak_skill_modules ?? [],
      });
    }

    // 生成总结
    const { data: typeData } = await serviceClient
      .from('question_types')
      .select('name')
      .eq('id', mockInterview.type_id)
      .single();

    const summaryPrompt = buildMockSummaryPrompt({
      answers: answerList.map((a) => ({
        question: a.question_text,
        answer: a.user_answer,
        score: a.score,
        is_skipped: a.is_skipped,
      })),
      typeName: typeData?.name ?? '综合',
    });

    const summaryResult = await generateText(summaryPrompt, {
      model: 'sonnet',
      system: MOCK_SUMMARY_SYSTEM_PROMPT,
      maxTokens: 2048,
    });

    let summary;
    try {
      summary = JSON.parse(summaryResult.trim());
    } catch {
      summary = {
        strengths: summaryResult.trim(),
        weaknesses: '',
        suggestions: '',
      };
    }

    // 计算总分
    const validScores = answerList.filter((a) => a.score !== null).map((a) => a.score!);
    const totalScore =
      validScores.length > 0
        ? Math.round((validScores.reduce((s, v) => s + v, 0) / validScores.length) * 10) / 10
        : 0;

    // 查询技能映射
    const { data: skillMappings } = await supabase
      .from('type_skill_mappings')
      .select('skill_module_id, recommended_tasks')
      .eq('type_id', mockInterview.type_id);

    const weakSkillModules = (skillMappings ?? []).map((m) => ({
      module_id: m.skill_module_id,
      module_name: `技能模块 ${m.skill_module_id.slice(0, 8)}`,
      recommended_tasks: (m.recommended_tasks as { task_id: string; task_name: string }[]) ?? [],
    }));

    // 更新模拟面试记录
    await supabase
      .from('mock_interviews')
      .update({
        total_score: totalScore,
        summary_strengths: summary.strengths,
        summary_weaknesses: summary.weaknesses,
        summary_suggestions: summary.suggestions,
        weak_skill_modules: weakSkillModules,
      })
      .eq('id', mockId);

    return NextResponse.json({
      id: mockInterview.id,
      total_score: totalScore,
      question_count: mockInterview.total_questions,
      answered_count: answeredCount,
      skipped_count: skippedCount,
      answers: answerList.map((a) => ({
        number: a.question_number,
        question: a.question_text,
        score: a.score,
        gap_analysis: a.gap_analysis,
        is_skipped: a.is_skipped,
      })),
      strengths: summary.strengths,
      weaknesses: summary.weaknesses,
      suggestions: summary.suggestions,
      weak_skill_modules: weakSkillModules,
    });
  } catch (error) {
    console.error('Summary API error:', error);
    return NextResponse.json({ error: '服务器内部错误', code: 'INTERNAL_ERROR' }, { status: 500 });
  }
}
