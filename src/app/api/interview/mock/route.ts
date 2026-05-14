import { NextRequest, NextResponse } from 'next/server';
import { createClient, createServiceClient } from '@/lib/supabase/server';
import { generateText } from '@/lib/ai/claude';
import { buildMockQuestionPrompt, MOCK_QUESTION_SYSTEM_PROMPT } from '@/lib/ai/prompts';
import { validateBody, createMockSchema } from '@/lib/validations';

const DEFAULT_TYPES = [
  { name: 'AI产品思维', description: '大模型应用、AI原生产品设计、Prompt Engineering' },
  { name: '数据分析', description: '数据驱动决策、指标体系、A/B测试' },
  { name: '用户研究', description: '用户画像、需求分析、用户体验优化' },
  { name: '项目管理', description: '敏捷开发、跨团队协作、资源管理' },
  { name: '商业思维', description: '商业模式、竞品分析、增长策略' },
  { name: '技术理解', description: '系统架构、API设计、技术选型评估' },
];

async function ensureQuestionTypes(serviceClient: ReturnType<typeof createServiceClient>) {
  const { data: existing } = await serviceClient
    .from('question_types')
    .select('id')
    .limit(1);

  if (existing && existing.length > 0) return;

  await serviceClient
    .from('question_types')
    .insert(DEFAULT_TYPES.map((t) => ({ name: t.name, description: t.description })));
}

// GET /api/interview/mock
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

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
      return NextResponse.json({ error: '未登录' }, { status: 401 });
    }

    const { searchParams } = request.nextUrl;
    const page = Math.max(1, parseInt(searchParams.get('page') || '1'));
    const page_size = Math.min(100, Math.max(1, parseInt(searchParams.get('page_size') || '20')));

    const serviceClient = createServiceClient();

    // Get total count
    const { count } = await serviceClient
      .from('mock_interviews')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', authenticatedUser.id);

    const { data: mocks, error } = await serviceClient
      .from('mock_interviews')
      .select('id, type_id, total_questions, current_question, status, total_score, created_at, completed_at, question_types(name)')
      .eq('user_id', authenticatedUser.id)
      .order('created_at', { ascending: false })
      .range((page - 1) * page_size, page * page_size - 1);

    if (error) {
      console.error('Get mock list error:', error);
      return NextResponse.json({ error: '获取列表失败' }, { status: 500 });
    }

    const data = (mocks ?? []).map((m) => ({
      id: m.id,
      type_id: m.type_id,
      type_name: (m.question_types as unknown as { name: string })?.name ?? '未知类型',
      total_questions: m.total_questions,
      current_question: m.current_question,
      status: m.status,
      total_score: m.total_score,
      created_at: m.created_at,
      completed_at: m.completed_at,
    }));

    return NextResponse.json({ data, total: count ?? 0, page, page_size });
  } catch (error) {
    console.error('Get mock list error:', error);
    return NextResponse.json({ error: '服务器内部错误' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: '未登录', code: 'UNAUTHORIZED' }, { status: 401 });
    }

    const body = await request.json();
    const validation = validateBody(createMockSchema, body);
    if (!validation.success) {
      return NextResponse.json({ error: validation.error, code: 'VALIDATION_ERROR' }, { status: 400 });
    }
    const { type_id, total_questions, jd_text, resume_text } = validation.data;

    const serviceClient = createServiceClient();

    // Ensure question types exist
    await ensureQuestionTypes(serviceClient);

    // Resolve type_id and name
    let typeId: string | undefined = type_id;
    let typeName = '综合';

    if (typeId) {
      const { data: typeData } = await serviceClient
        .from('question_types')
        .select('id, name')
        .eq('id', typeId)
        .single();
      if (typeData) {
        typeName = typeData.name;
      } else {
        typeId = undefined;
      }
    }

    // If no valid type_id, pick the first available
    if (!typeId) {
      const { data: firstType } = await serviceClient
        .from('question_types')
        .select('id, name')
        .limit(1)
        .single();
      if (firstType) {
        typeId = firstType.id;
        typeName = firstType.name;
      }
    }

    // Create mock interview
    const { data: mockInterview, error: mockError } = await serviceClient
      .from('mock_interviews')
      .insert({
        user_id: user.id,
        type_id: typeId,
        total_questions: total_questions,
        current_question: 1,
        jd_text: jd_text?.trim() || null,
        resume_text: resume_text?.trim() || null,
        status: 'in_progress',
      })
      .select('id')
      .single();

    if (mockError || !mockInterview) {
      console.error('Create mock interview error:', mockError);
      return NextResponse.json({ error: '创建模拟面试失败', code: 'INTERNAL_ERROR' }, { status: 500 });
    }

    // Generate first question
    const questionPrompt = buildMockQuestionPrompt({
      typeName,
      jdText: jd_text,
      resumeText: resume_text,
      questionNumber: 1,
      totalQuestions: total_questions,
    });

    let questionText = '';
    try {
      questionText = await generateText(questionPrompt, {
        model: 'sonnet',
        system: MOCK_QUESTION_SYSTEM_PROMPT,
        maxTokens: 512,
      });
    } catch (aiError) {
      console.error('AI question generation error:', aiError);
      questionText = '请描述一个你参与过的AI产品项目，重点说明你在产品定义和需求分析中的角色和贡献。';
    }

    // Save first question
    await serviceClient.from('interview_answers').insert({
      mock_interview_id: mockInterview.id,
      question_number: 1,
      question_text: questionText.trim(),
      question_type_id: typeId,
      is_skipped: false,
    });

    return NextResponse.json({
      id: mockInterview.id,
      status: 'in_progress',
      current_question: 1,
      total_questions: total_questions,
      question: {
        number: 1,
        text: questionText.trim(),
      },
    }, { status: 201 });
  } catch (error) {
    console.error('Create mock interview API error:', error);
    return NextResponse.json({ error: '服务器内部错误', code: 'INTERNAL_ERROR' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: '未登录' }, { status: 401 });
    }

    const { id } = await request.json();
    if (!id) return NextResponse.json({ error: '缺少记录ID' }, { status: 400 });

    const serviceClient = createServiceClient();

    // Delete answers first (foreign key)
    await serviceClient
      .from('interview_answers')
      .delete()
      .eq('mock_interview_id', id);

    // Delete the mock interview
    const { error } = await serviceClient
      .from('mock_interviews')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id);

    if (error) {
      console.error('Delete mock interview error:', error);
      return NextResponse.json({ error: '删除失败' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Delete mock interview API error:', error);
    return NextResponse.json({ error: '删除失败' }, { status: 500 });
  }
}