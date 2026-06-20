import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import type { ReportResponse } from '@/lib/market-insight/types';

// GET: Get latest report + diff for a keyword
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
    if (!keyword) {
      return NextResponse.json({ error: '请指定关键词' }, { status: 400 });
    }

    // Get latest snapshot
    const { data: snapshots } = await supabase
      .from('market_analysis_snapshots')
      .select('*')
      .eq('user_id', user.id)
      .eq('query_keyword', keyword)
      .order('created_at', { ascending: false })
      .limit(1);

    const snapshot = snapshots?.[0] || null;

    if (!snapshot) {
      const response: ReportResponse = { snapshot: null, diff: null, previousSnapshot: null };
      return NextResponse.json(response);
    }

    // Get latest diff for this snapshot
    const { data: diffs } = await supabase
      .from('market_analysis_diffs')
      .select('*')
      .eq('user_id', user.id)
      .eq('current_snapshot_id', snapshot.id)
      .limit(1);

    const diff = diffs?.[0] || null;

    // Get previous snapshot if diff exists
    let previousSnapshot = null;
    if (diff?.previous_snapshot_id) {
      const { data: prevSnaps } = await supabase
        .from('market_analysis_snapshots')
        .select('*')
        .eq('id', diff.previous_snapshot_id)
        .limit(1);
      previousSnapshot = prevSnaps?.[0] || null;
    }

    const response: ReportResponse = { snapshot, diff, previousSnapshot };
    return NextResponse.json(response);
  } catch (err) {
    console.error('[market-insight/report] GET Error:', err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : '查询失败' },
      { status: 500 }
    );
  }
}
