import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: '未登录' }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    // Single record detail
    if (id) {
      const { data, error } = await supabase
        .from('prompt_practices')
        .select('*')
        .eq('id', id)
        .eq('user_id', user.id)
        .single();

      if (error || !data) {
        return NextResponse.json({ error: '记录不存在' }, { status: 404 });
      }
      return NextResponse.json({ record: data });
    }

    // List
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = Math.min(parseInt(searchParams.get('limit') || '20', 10), 50);
    const from = (page - 1) * limit;

    const [queryRes, countRes] = await Promise.all([
      supabase
        .from('prompt_practices')
        .select('id, question, question_category, difficulty, total_score, created_at')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .range(from, from + limit - 1),
      supabase
        .from('prompt_practices')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', user.id),
    ]);

    return NextResponse.json({
      records: queryRes.data || [],
      total: countRes.count || 0,
      page,
      limit,
    });
  } catch (error) {
    console.error('Prompt practice history error:', error);
    return NextResponse.json({ error: '服务器内部错误' }, { status: 500 });
  }
}
