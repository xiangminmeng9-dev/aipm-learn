import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { generateText } from '@/lib/ai/claude';
import { buildMockQuestionPrompt, MOCK_QUESTION_SYSTEM_PROMPT } from '@/lib/ai/prompts';

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
    const { type_id, total_questions, jd_text, resume_text } = body as {
      type_id: string;
      total_questions: 3 | 5 | 8 | 10;
      jd_text?: string;
      resume_text?: string;
    };

    if (!type_id) {
      return NextResponse.json(
        { error: '请选择问题类型', code: 'VALIDATION_ERROR' },
        { status: 400 }
      );
    }

    if (![3, 5, 8, 10].includes(total_questions)) {
      return NextResponse.json(
        { error: '题目数量必须为 3/5/8/10', code: 'VALIDATION_ERROR' },
        { status: 400 }
      );
    }

    // 获取类型名称
    const { data: typeData } = await supabase
      .from('question_types')
      .select('id, name')
      .eq('id', type_id)
      .single();

    if (!typeData) {
      return NextResponse.json({ error: '问题类型不存在', code: 'NOT_FOUND' }, { status: 404 });
    }

    // 创建模拟面试记录
    const { data: mockInterview, error: mockError } = await supabase
      .from('mock_interviews')
      .insert({
        user_id: user.id,
        type_id,
        total_questions,
        current_question: 1,
        jd_text: jd_text?.trim() || null,
        resume_text: resume_text?.trim() || null,
        status: 'in_progress',
      })
      .select('id')
      .single();

    if (mockError || !mockInterview) {
      return NextResponse.json(
        { error: '创建模拟面试失败', code: 'INTERNAL_ERROR' },
        { status: 500 }
      );
    }

    // 生成第一题
    const questionPrompt = buildMockQuestionPrompt({
      typeName: typeData.name,
      jdText: jd_text,
      resumeText: resume_text,
      questionNumber: 1,
      totalQuestions: total_questions,
    });

    const questionText = await generateText(questionPrompt, {
      model: 'sonnet',
      system: MOCK_QUESTION_SYSTEM_PROMPT,
      maxTokens: 512,
    });

    // 保存第一题
    await supabase.from('interview_answers').insert({
      mock_interview_id: mockInterview.id,
      question_number: 1,
      question_text: questionText.trim(),
      question_type_id: type_id,
      is_skipped: false,
    });

    return NextResponse.json(
      {
        id: mockInterview.id,
        status: 'in_progress',
        current_question: 1,
        total_questions,
        question: {
          number: 1,
          text: questionText.trim(),
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Create mock interview API error:', error);
    return NextResponse.json({ error: '服务器内部错误', code: 'INTERNAL_ERROR' }, { status: 500 });
  }
}
