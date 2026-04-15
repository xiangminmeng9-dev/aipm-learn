import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { generateText } from '@/lib/ai/claude';
import {
  buildMockScoringPrompt,
  buildMockQuestionPrompt,
  MOCK_SCORING_SYSTEM_PROMPT,
  MOCK_QUESTION_SYSTEM_PROMPT,
} from '@/lib/ai/prompts';

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: '未登录', code: 'UNAUTHORIZED' }, { status: 401 });
    }

    const { id: mockId } = await params;
    const body = await request.json();
    const { answer, skip } = body as { answer?: string; skip?: boolean };

    // 获取模拟面试信息
    const { data: mockInterview } = await supabase
      .from('mock_interviews')
      .select('id, type_id, current_question, total_questions, status, jd_text, resume_text')
      .eq('id', mockId)
      .eq('user_id', user.id)
      .single();

    if (!mockInterview) {
      return NextResponse.json({ error: '模拟面试不存在', code: 'NOT_FOUND' }, { status: 404 });
    }

    if (mockInterview.status !== 'in_progress') {
      return NextResponse.json({ error: '面试已结束', code: 'VALIDATION_ERROR' }, { status: 400 });
    }

    // 获取当前题目
    const { data: currentAnswer } = await supabase
      .from('interview_answers')
      .select('id, question_number, question_text')
      .eq('mock_interview_id', mockId)
      .eq('question_number', mockInterview.current_question)
      .single();

    if (!currentAnswer) {
      return NextResponse.json({ error: '当前题目不存在', code: 'NOT_FOUND' }, { status: 404 });
    }

    const isSkipped = skip === true;
    const answerText = answer?.trim() ?? '';

    if (!isSkipped && !answerText) {
      return NextResponse.json(
        { error: '请输入回答或选择跳过', code: 'VALIDATION_ERROR' },
        { status: 400 }
      );
    }

    // 评分（非跳过时）
    let evaluation = { score: 0, gap_analysis: '已跳过', perfect_answer: '已跳过' };

    if (!isSkipped) {
      // 获取类型名称
      const { data: typeData } = await supabase
        .from('question_types')
        .select('name')
        .eq('id', mockInterview.type_id)
        .single();

      const scoringPrompt = buildMockScoringPrompt({
        question: currentAnswer.question_text,
        answer: answerText,
        typeName: typeData?.name ?? '综合',
      });

      const scoringResult = await generateText(scoringPrompt, {
        model: 'sonnet',
        system: MOCK_SCORING_SYSTEM_PROMPT,
        maxTokens: 2048,
      });

      try {
        evaluation = JSON.parse(scoringResult.trim());
      } catch {
        evaluation = {
          score: 5,
          gap_analysis: scoringResult.trim(),
          perfect_answer: '',
        };
      }
    }

    // 更新当前答案
    await supabase
      .from('interview_answers')
      .update({
        user_answer: isSkipped ? null : answerText,
        score: isSkipped ? null : evaluation.score,
        gap_analysis: evaluation.gap_analysis,
        perfect_answer: evaluation.perfect_answer,
        is_skipped: isSkipped,
        answered_at: new Date().toISOString(),
      })
      .eq('id', currentAnswer.id);

    const isLast = mockInterview.current_question >= mockInterview.total_questions;

    if (isLast) {
      // 面试结束
      await supabase
        .from('mock_interviews')
        .update({
          status: 'completed',
          completed_at: new Date().toISOString(),
        })
        .eq('id', mockId);

      // 面试结束后异步触发方法论更新
      triggerMethodologyUpdate(user.id, mockInterview.type_id).catch(() => {});

      return NextResponse.json({
        evaluation,
        next_question: null,
        is_last: true,
      });
    }

    // 生成下一题
    const nextQuestionNumber = mockInterview.current_question + 1;

    const { data: typeData } = await supabase
      .from('question_types')
      .select('name')
      .eq('id', mockInterview.type_id)
      .single();

    // 获取已出题目
    const { data: previousAnswers } = await supabase
      .from('interview_answers')
      .select('question_text')
      .eq('mock_interview_id', mockId);

    const questionPrompt = buildMockQuestionPrompt({
      typeName: typeData?.name ?? '综合',
      jdText: mockInterview.jd_text,
      resumeText: mockInterview.resume_text,
      previousQuestions: previousAnswers?.map((a) => a.question_text) ?? [],
      questionNumber: nextQuestionNumber,
      totalQuestions: mockInterview.total_questions,
    });

    const nextQuestionText = await generateText(questionPrompt, {
      model: 'sonnet',
      system: MOCK_QUESTION_SYSTEM_PROMPT,
      maxTokens: 512,
    });

    // 保存下一题
    await supabase.from('interview_answers').insert({
      mock_interview_id: mockId,
      question_number: nextQuestionNumber,
      question_text: nextQuestionText.trim(),
      question_type_id: mockInterview.type_id,
      is_skipped: false,
    });

    // 更新当前题号
    await supabase
      .from('mock_interviews')
      .update({ current_question: nextQuestionNumber })
      .eq('id', mockId);

    return NextResponse.json({
      evaluation,
      next_question: {
        number: nextQuestionNumber,
        text: nextQuestionText.trim(),
      },
      is_last: false,
    });
  } catch (error) {
    console.error('Answer API error:', error);
    return NextResponse.json({ error: '服务器内部错误', code: 'INTERNAL_ERROR' }, { status: 500 });
  }
}

/**
 * 异步触发方法论更新
 */
async function triggerMethodologyUpdate(userId: string, typeId: string): Promise<void> {
  try {
    const { createClient } = await import('@/lib/supabase/server');
    const { generateOrUpdateMethodology } = await import('@/app/api/interview/methodology/route');
    const supabase = await createClient();
    await generateOrUpdateMethodology(supabase, userId, typeId);
  } catch {
    // 静默失败
  }
}
