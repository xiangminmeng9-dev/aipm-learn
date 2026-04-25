import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: '未登录', code: 'UNAUTHORIZED' }, { status: 401 });
    }

    const { id: mockId } = await params;

    // 获取模拟面试状态
    const { data: mockInterview } = await supabase
      .from('mock_interviews')
      .select('id, status, current_question, total_questions')
      .eq('id', mockId)
      .eq('user_id', user.id)
      .single();

    if (!mockInterview) {
      return NextResponse.json({ error: '模拟面试不存在', code: 'NOT_FOUND' }, { status: 404 });
    }

    if (mockInterview.status === 'completed') {
      return NextResponse.json({
        status: 'completed',
        total_questions: mockInterview.total_questions,
      });
    }

    // 面试进行中：获取当前题目
    const { data: currentAnswer } = await supabase
      .from('interview_answers')
      .select('question_number, question_text')
      .eq('mock_interview_id', mockId)
      .eq('question_number', mockInterview.current_question)
      .single();

    return NextResponse.json({
      status: 'in_progress',
      current_question: currentAnswer
        ? { number: currentAnswer.question_number, text: currentAnswer.question_text }
        : { number: 1, text: '加载中...' },
      total_questions: mockInterview.total_questions,
    });
  } catch (error) {
    console.error('Mock state API error:', error);
    return NextResponse.json({ error: '服务器内部错误', code: 'INTERNAL_ERROR' }, { status: 500 });
  }
}
