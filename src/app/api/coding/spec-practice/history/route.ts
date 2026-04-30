import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

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
    const page = Math.max(1, parseInt(searchParams.get('page') || '1'));
    const limit = Math.min(50, Math.max(1, parseInt(searchParams.get('limit') || '20')));
    const offset = (page - 1) * limit;

    const [recordsResult, countResult] = await Promise.all([
      supabase
        .from('spec_practices')
        .select('id, question, question_category, total_score, dimension_scores, suggestions, created_at')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1),
      supabase.from('spec_practices').select('id', { count: 'exact', head: true }).eq('user_id', user.id),
    ]);

    if (recordsResult.error) {
      console.error('Spec practice history error:', recordsResult.error);
      return NextResponse.json({ error: '查询失败' }, { status: 500 });
    }

    return NextResponse.json({
      records: recordsResult.data,
      total: countResult.count ?? 0,
      page,
      limit,
    });
  } catch (error) {
    console.error('Spec practice history error:', error);
    return NextResponse.json({ error: '服务器内部错误' }, { status: 500 });
  }
}
