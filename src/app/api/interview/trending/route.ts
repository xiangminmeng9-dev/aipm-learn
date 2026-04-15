import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: '未登录', code: 'UNAUTHORIZED' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const limit = Math.min(parseInt(searchParams.get('limit') ?? '10'), 30);

    const { data: trending, error } = await supabase
      .from('trending_questions')
      .select('id, text, type_id, rank, updated_at, question_types(id, name)')
      .order('rank', { ascending: true })
      .limit(limit);

    if (error) {
      return NextResponse.json(
        { error: '获取热门问题失败', code: 'INTERNAL_ERROR' },
        { status: 500 }
      );
    }

    const questions = (trending ?? []).map((q) => ({
      id: q.id,
      text: q.text,
      type: q.question_types
        ? {
            id: (q.question_types as unknown as { id: string; name: string }).id,
            name: (q.question_types as unknown as { id: string; name: string }).name,
          }
        : null,
      rank: q.rank,
      updated_at: q.updated_at,
    }));

    return NextResponse.json({ questions });
  } catch (error) {
    console.error('Trending API error:', error);
    return NextResponse.json({ error: '服务器内部错误', code: 'INTERNAL_ERROR' }, { status: 500 });
  }
}
