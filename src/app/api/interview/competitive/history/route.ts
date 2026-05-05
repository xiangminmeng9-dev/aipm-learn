import { NextRequest, NextResponse } from 'next/server';
import { createClient, createServiceClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: '请先登录' }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const page = Math.max(1, parseInt(searchParams.get('page') || '1'));
    const limit = Math.min(50, Math.max(1, parseInt(searchParams.get('limit') || '10')));

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
      .range((page - 1) * limit, page * limit - 1);

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

    return NextResponse.json({ records, total: count ?? 0, page, limit });
  } catch (error) {
    console.error('Competitive analysis history error:', error);
    return NextResponse.json({ error: '查询失败' }, { status: 500 });
  }
}
