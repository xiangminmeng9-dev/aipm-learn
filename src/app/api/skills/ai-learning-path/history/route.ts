import { NextRequest, NextResponse } from 'next/server';
import { createClient, createServiceClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: '请先登录' }, { status: 401 });

    const { searchParams } = request.nextUrl;
    const page = Math.max(1, parseInt(searchParams.get('page') || '1'));
    const page_size = Math.min(100, Math.max(1, parseInt(searchParams.get('page_size') || '20')));

    const serviceClient = createServiceClient();
    const { count } = await serviceClient
      .from('ai_learning_paths')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', user.id);

    const { data, error } = await serviceClient
      .from('ai_learning_paths')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .range((page - 1) * page_size, page * page_size - 1);

    if (error) {
      return NextResponse.json({ error: '查询失败' }, { status: 500 });
    }

    const records = (data ?? []).map((r) => ({
      id: r.id,
      weaknessSummary: r.weakness_summary,
      recommendedModules: r.recommended_modules,
      totalEstimatedHours: r.total_estimated_hours,
      createdAt: r.created_at,
    }));

    return NextResponse.json({ records, total: count ?? 0, page, page_size });
  } catch (error) {
    console.error('AI learning path history error:', error);
    return NextResponse.json({ error: '查询失败' }, { status: 500 });
  }
}
