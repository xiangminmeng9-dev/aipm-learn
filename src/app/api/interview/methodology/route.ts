import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { generateText } from '@/lib/ai/claude';
import { buildMethodologyPrompt, METHODOLOGY_SYSTEM_PROMPT } from '@/lib/ai/prompts';

const MIN_SOURCE_COUNT = 3; // 至少 3 次问答才能生成方法论

export async function GET() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: '未登录', code: 'UNAUTHORIZED' }, { status: 401 });
    }

    // 获取用户所有方法论
    const { data: methodologies, error } = await supabase
      .from('interview_methodologies')
      .select(
        'id, type_id, framework, key_steps, typical_cases, source_count, updated_at, question_types(id, name)'
      )
      .eq('user_id', user.id)
      .order('updated_at', { ascending: false });

    if (error) {
      return NextResponse.json(
        { error: '获取方法论失败', code: 'INTERNAL_ERROR' },
        { status: 500 }
      );
    }

    if (!methodologies || methodologies.length === 0) {
      return NextResponse.json({
        methodologies: [],
        total_types: 0,
        message: `需要至少 ${MIN_SOURCE_COUNT} 次问答练习才能生成方法论`,
      });
    }

    const result = methodologies.map((m) => ({
      id: m.id,
      type: m.question_types
        ? {
            id: (m.question_types as unknown as { id: string; name: string }).id,
            name: (m.question_types as unknown as { id: string; name: string }).name,
          }
        : { id: m.type_id, name: '未知类型' },
      framework: m.framework,
      key_steps: m.key_steps as string[],
      typical_cases: m.typical_cases as string[],
      source_count: m.source_count,
      updated_at: m.updated_at,
    }));

    return NextResponse.json({
      methodologies: result,
      total_types: result.length,
    });
  } catch (error) {
    console.error('Methodology API error:', error);
    return NextResponse.json({ error: '服务器内部错误', code: 'INTERNAL_ERROR' }, { status: 500 });
  }
}

/**
 * 生成或更新方法论（内部函数，供其他 API 调用）
 */
export async function generateOrUpdateMethodology(
  supabase: ReturnType<typeof createClient> extends Promise<infer T> ? T : never,
  userId: string,
  typeId: string
): Promise<void> {
  // 获取该类型的问答历史
  const { data: analyses } = await supabase
    .from('question_analyses')
    .select('analysis, thinking_framework, answer_approach, interview_questions(text, type_id)')
    .eq('user_id', userId)
    .eq('interview_questions.type_id', typeId);

  const qaHistory = (analyses ?? [])
    .filter((a) => a.interview_questions)
    .map((a) => ({
      question: (a.interview_questions as unknown as { text: string }).text,
      analysis: a.analysis,
      thinking_framework: a.thinking_framework,
      answer_approach: a.answer_approach,
    }));

  if (qaHistory.length < MIN_SOURCE_COUNT) {
    return; // 数据不足，不生成
  }

  // 获取类型名称
  const { data: typeData } = await supabase
    .from('question_types')
    .select('name')
    .eq('id', typeId)
    .single();

  // 生成方法论
  const prompt = buildMethodologyPrompt({
    typeName: typeData?.name ?? '综合',
    qaHistory,
  });

  const result = await generateText(prompt, {
    model: 'sonnet',
    system: METHODOLOGY_SYSTEM_PROMPT,
    maxTokens: 2048,
  });

  let methodology;
  try {
    methodology = JSON.parse(result.trim());
  } catch {
    methodology = {
      framework: result.trim(),
      key_steps: [],
      typical_cases: [],
    };
  }

  // 检查是否已有方法论
  const { data: existing } = await supabase
    .from('interview_methodologies')
    .select('id, source_count')
    .eq('user_id', userId)
    .eq('type_id', typeId)
    .single();

  if (existing) {
    // 仅当数据源增加时更新
    if (qaHistory.length > existing.source_count) {
      await supabase
        .from('interview_methodologies')
        .update({
          framework: methodology.framework,
          key_steps: methodology.key_steps,
          typical_cases: methodology.typical_cases,
          source_count: qaHistory.length,
          updated_at: new Date().toISOString(),
        })
        .eq('id', existing.id);
    }
  } else {
    // 创建新方法论
    await supabase.from('interview_methodologies').insert({
      user_id: userId,
      type_id: typeId,
      framework: methodology.framework,
      key_steps: methodology.key_steps,
      typical_cases: methodology.typical_cases,
      source_count: qaHistory.length,
    });
  }
}
