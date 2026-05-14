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
      .from('competitive_analyses')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', user.id);

    const { data, error } = await serviceClient
      .from('competitive_analyses')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .range((page - 1) * page_size, page * page_size - 1);

    if (error) {
      return NextResponse.json({ error: '查询失败' }, { status: 500 });
    }

    const records = (data ?? []).map((r) => ({
      id: r.id,
      productName: r.product_name,
      marketPosition: r.market_position,
      featureComparison: r.feature_comparison,
      strengthsWeaknesses: r.strengths_weaknesses,
      differentiationStrategy: r.differentiation_strategy,
      totalScore: r.total_score,
      dimensionScores: r.dimension_scores,
      createdAt: r.created_at,
    }));

    return NextResponse.json({ records, total: count ?? 0, page, page_size });
  } catch (error) {
    console.error('Competitive analysis history error:', error);
    return NextResponse.json({ error: '查询失败' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: '未登录' }, { status: 401 });

    const { id } = await request.json();
    if (!id) return NextResponse.json({ error: '缺少记录ID' }, { status: 400 });

    const serviceClient = createServiceClient();
    const { error } = await serviceClient
      .from('competitive_analyses')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id);

    if (error) {
      console.error('Delete competitive analysis error:', error);
      return NextResponse.json({ error: '删除失败' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Delete competitive analysis error:', error);
    return NextResponse.json({ error: '删除失败' }, { status: 500 });
  }
}
