import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: '未登录', code: 'UNAUTHORIZED' }, { status: 401 });
    }

    const { data: types, error } = await supabase
      .from('question_types')
      .select('id, name, description, is_seed')
      .order('is_seed', { ascending: false });

    if (error) {
      return NextResponse.json(
        { error: '获取问题类型失败', code: 'INTERNAL_ERROR' },
        { status: 500 }
      );
    }

    // 获取各类型的题目数量 — single query + JS aggregation instead of N+1
    const { data: questions } = await supabase
      .from('interview_questions')
      .select('type_id');

    const countMap: Record<string, number> = {};
    for (const q of questions ?? []) {
      if (q.type_id) countMap[q.type_id] = (countMap[q.type_id] || 0) + 1;
    }

    const typesWithCount = (types ?? []).map(t => ({
      id: t.id,
      name: t.name,
      description: t.description,
      is_seed: t.is_seed,
      question_count: countMap[t.id] ?? 0,
    }));

    return NextResponse.json({ types: typesWithCount });
  } catch (error) {
    console.error('Question types API error:', error);
    return NextResponse.json({ error: '服务器内部错误', code: 'INTERNAL_ERROR' }, { status: 500 });
  }
}
