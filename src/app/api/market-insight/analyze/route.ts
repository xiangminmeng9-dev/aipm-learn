import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { analyzeMarket } from '@/lib/market-insight/analyzer';
import type { AnalyzeRequest } from '@/lib/market-insight/types';

// POST: Trigger analysis on crawled JDs
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: '未登录' }, { status: 401 });
    }

    const body: AnalyzeRequest = await request.json();
    const { keyword, date_from, date_to } = body;

    if (!keyword) {
      return NextResponse.json({ error: '请指定分析关键词' }, { status: 400 });
    }

    const result = await analyzeMarket({
      keyword,
      userId: user.id,
      dateFrom: date_from,
      dateTo: date_to,
    });

    return NextResponse.json(result);
  } catch (err) {
    console.error('[market-insight/analyze] Error:', err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : '分析失败' },
      { status: 500 }
    );
  }
}

// GET: List analysis snapshots
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: '未登录' }, { status: 401 });
    }

    const keyword = request.nextUrl.searchParams.get('keyword');

    let query = supabase
      .from('market_analysis_snapshots')
      .select('id, query_keyword, jd_count, date_range_start, date_range_end, created_at')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(20);

    if (keyword) {
      query = query.eq('query_keyword', keyword);
    }

    const { data: snapshots, error } = await query;

    if (error) {
      return NextResponse.json({ error: '查询失败' }, { status: 500 });
    }

    return NextResponse.json({ snapshots: snapshots || [] });
  } catch (err) {
    console.error('[market-insight/analyze] GET Error:', err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : '查询失败' },
      { status: 500 }
    );
  }
}
