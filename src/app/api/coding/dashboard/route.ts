import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: '请先登录' }, { status: 401 });
    }

    const { searchParams } = request.nextUrl;
    const range = searchParams.get('range') || '30d';

    const now = new Date();
    const cutoffDate = range === '7d' ? new Date(now.getTime() - 7 * 86400000).toISOString()
                    : range === '30d' ? new Date(now.getTime() - 30 * 86400000).toISOString()
                    : new Date(0).toISOString();
    const weekAgo = new Date(now.getTime() - 7 * 86400000).toISOString();
    const twoWeeksAgo = new Date(now.getTime() - 14 * 86400000).toISOString();

    // 并行查询所有数据
    const [
      flowsCountRes,
      flowsWeekCountRes,
      lastWeekFlowsRes,
      specSessionsRes,
      methodologyCountRes,
      flowsRes,
      methodologiesRes,
    ] = await Promise.all([
      supabase.from('coding_flows').select('id', { count: 'exact', head: true }).eq('user_id', user.id),
      supabase.from('coding_flows').select('id', { count: 'exact', head: true }).eq('user_id', user.id).gte('created_at', weekAgo),
      supabase.from('coding_flows').select('id', { count: 'exact', head: true }).eq('user_id', user.id).gte('created_at', twoWeeksAgo).lt('created_at', weekAgo),
      supabase.from('spec_practice_sessions').select('score, created_at, dimensions').eq('user_id', user.id),
      supabase.from('coding_methodologies').select('id', { count: 'exact', head: true }).eq('user_id', user.id),
      supabase.from('coding_flows').select('created_at, mode').eq('user_id', user.id).order('created_at', { ascending: true }),
      supabase.from('coding_methodologies').select('status').eq('user_id', user.id),
    ]);

    const flowsCount = flowsCountRes.count || 0;
    const flowsWeekCount = flowsWeekCountRes.count || 0;
    const lastWeekFlows = lastWeekFlowsRes.count || 0;
    const specSessions = specSessionsRes.data || [];
    const methodologyCount = methodologyCountRes.count || 0;
    const flows = flowsRes.data || [];
    const methodologies = methodologiesRes.data || [];

    // Spec统计
    const validScores = specSessions.filter(s => s.score != null);
    const avgScore = validScores.length > 0
      ? Math.round(validScores.reduce((sum, s) => sum + (s.score || 0), 0) / validScores.length)
      : 0;

    // 每日活动趋势
    const days = range === '7d' ? 7 : range === '30d' ? 30 : 90;
    const activityMap = new Map<string, number>();
    for (const f of flows) {
      if (f.created_at) {
        const date = f.created_at.slice(0, 10);
        activityMap.set(date, (activityMap.get(date) || 0) + 1);
      }
    }
    const activityTrend = Array.from({ length: days }, (_, i) => {
      const d = new Date(now.getTime() - (days - 1 - i) * 86400000);
      const dateStr = d.toISOString().slice(0, 10);
      return { date: dateStr, count: activityMap.get(dateStr) || 0 };
    });

    // 模式分布
    const modeMap = new Map<string, number>();
    for (const f of flows) {
      const mode = f.mode || '未分类';
      modeMap.set(mode, (modeMap.get(mode) || 0) + 1);
    }
    const modeDistribution = Array.from(modeMap.entries())
      .map(([mode, count]) => ({ mode, count }))
      .sort((a, b) => b.count - a.count);

    // Spec得分趋势
    const scoreTrend = validScores
      .filter(s => s.created_at)
      .sort((a, b) => a.created_at!.localeCompare(b.created_at!))
      .slice(-30)
      .map(s => ({ date: s.created_at!.slice(0, 10), score: s.score! }));

    // 维度得分分布
    const dimensionMap = new Map<string, number[]>();
    for (const s of specSessions) {
      const dims = s.dimensions as Array<{ name: string; score: number }> | null;
      if (dims) {
        for (const d of dims) {
          if (!dimensionMap.has(d.name)) dimensionMap.set(d.name, []);
          dimensionMap.get(d.name)!.push(d.score);
        }
      }
    }
    const dimensionScores = Array.from(dimensionMap.entries())
      .map(([name, scores]) => ({ name, avgScore: Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) }))
      .sort((a, b) => b.avgScore - a.avgScore);

    // 方法论状态分布
    const statusMap = new Map<string, number>();
    for (const m of methodologies) {
      const status = m.status || 'draft';
      statusMap.set(status, (statusMap.get(status) || 0) + 1);
    }
    const methodologyStatus = Array.from(statusMap.entries()).map(([status, count]) => ({ status, count }));

    // 漏斗
    const totalSpecs = specSessions.length;
    const passedSpecs = specSessions.filter(s => (s.score || 0) >= 70).length;
    const excellentSpecs = specSessions.filter(s => (s.score || 0) >= 90).length;
    const funnelStages = [
      { stage: '开始练习', count: totalSpecs },
      { stage: '及格(≥70)', count: passedSpecs },
      { stage: '优秀(≥90)', count: excellentSpecs },
    ];

    // 环比
    const flowsChange = lastWeekFlows > 0
      ? Math.round(((flowsWeekCount - lastWeekFlows) / lastWeekFlows) * 100)
      : (flowsWeekCount > 0 ? 100 : 0);

    return NextResponse.json({
      stats: {
        flows_count: flowsCount,
        flows_week_count: flowsWeekCount,
        spec_count: specSessions.length,
        avg_score: avgScore,
        methodology_count: methodologyCount,
        flows_change: flowsChange,
        activity_trend: activityTrend,
        mode_distribution: modeDistribution,
        score_trend: scoreTrend,
        dimension_scores: dimensionScores,
        methodology_status: methodologyStatus,
        funnel_stages: funnelStages,
      },
    });
  } catch (error) {
    console.error('Coding dashboard error:', error);
    return NextResponse.json({ error: '获取数据失败' }, { status: 500 });
  }
}