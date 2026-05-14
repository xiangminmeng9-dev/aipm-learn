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

    // 并行查询所有数据
    const [
      assistantCountRes,
      qaCountRes,
      mockInterviewsRes,
      competitiveAnalysesRes,
      sessionCountRes,
      methodologyCountRes,
      methodologiesRes,
      qaAnalysesRes,
    ] = await Promise.all([
      supabase.from('assistant_qa_records').select('id', { count: 'exact', head: true }).eq('user_id', user.id),
      supabase.from('question_analyses').select('id', { count: 'exact', head: true }).eq('user_id', user.id),
      supabase.from('mock_interviews').select('id, total_score, created_at').eq('user_id', user.id),
      supabase.from('competitive_analyses').select('id, total_score, created_at').eq('user_id', user.id),
      supabase.from('interview_sessions').select('id', { count: 'exact', head: true }).eq('user_id', user.id),
      supabase.from('interview_methodologies').select('id', { count: 'exact', head: true }).eq('user_id', user.id),
      supabase.from('interview_methodologies').select('type_id, source_count').eq('user_id', user.id),
      supabase.from('question_analyses').select('question_id').eq('user_id', user.id),
    ]);

    const assistantCount = assistantCountRes.count || 0;
    const qaCount = qaCountRes.count || 0;
    const mockInterviews = mockInterviewsRes.data || [];
    const competitiveAnalyses = competitiveAnalysesRes.data || [];
    const sessionCount = sessionCountRes.count || 0;
    const methodologyCount = methodologyCountRes.count || 0;
    const methodologies = methodologiesRes.data || [];
    const qaAnalyses = qaAnalysesRes.data || [];

    const mockCount = mockInterviews.length;
    const competitiveCount = competitiveAnalyses.length;

    const validScores = mockInterviews.filter(m => m.total_score != null);
    const avgMockScore = validScores.length > 0
      ? Math.round(validScores.reduce((sum, m) => sum + (m.total_score || 0), 0) / validScores.length)
      : 0;

    const validCompScores = competitiveAnalyses.filter(c => c.total_score != null);
    const avgCompScore = validCompScores.length > 0
      ? Math.round(validCompScores.reduce((sum, c) => sum + (c.total_score || 0), 0) / validCompScores.length)
      : 0;

    // 方法论类型分布
    const methodTypeIds = methodologies.map(m => m.type_id).filter(Boolean);
    let methodologyTypeDistribution: { type: string; count: number }[] = [];
    if (methodTypeIds.length > 0) {
      const { data: methodTypes } = await supabase.from('question_types').select('id, name').in('id', methodTypeIds);
      const typeMap = new Map((methodTypes || []).map(t => [t.id, t.name]));
      methodologyTypeDistribution = methodologies
        .filter(m => m.type_id && m.source_count)
        .map(m => ({ type: typeMap.get(m.type_id) || '未知类型', count: m.source_count || 0 }))
        .sort((a, b) => b.count - a.count);
    }

    // 问答类型分布
    const qIds = qaAnalyses.map(a => a.question_id).filter(Boolean);
    let qaTypeDistribution: { type: string; count: number }[] = [];
    if (qIds.length > 0) {
      const { data: questions } = await supabase.from('interview_questions').select('id, type_id').in('id', qIds);
      const typeIds = [...new Set((questions || []).map(q => q.type_id).filter(Boolean))];
      if (typeIds.length > 0) {
        const { data: types } = await supabase.from('question_types').select('id, name').in('id', typeIds);
        const typeMap = new Map((types || []).map(t => [t.id, t.name]));
        const typeCountMap = new Map<string, number>();
        for (const q of questions || []) {
          if (q.type_id) {
            const typeName = typeMap.get(q.type_id) || '未知类型';
            typeCountMap.set(typeName, (typeCountMap.get(typeName) || 0) + 1);
          }
        }
        qaTypeDistribution = Array.from(typeCountMap.entries())
          .map(([type, count]) => ({ type, count }))
          .sort((a, b) => b.count - a.count);
      }
    }

    // 类型分布
    const typeDistribution = [
      { type: '问答分析', count: qaCount },
      { type: '模拟面试', count: mockCount },
      { type: '竞品分析', count: competitiveCount },
      { type: '助手对话', count: assistantCount },
    ].filter(t => t.count > 0);

    // 模拟面试得分趋势
    const mockScoreTrend = validScores
      .filter(m => m.created_at)
      .sort((a, b) => a.created_at!.localeCompare(b.created_at!))
      .slice(-30)
      .map(m => ({ date: m.created_at!.slice(0, 10), score: m.total_score! }));

    // 得分分布
    const scoreRanges = [
      { range: '0-50', count: validScores.filter(m => (m.total_score || 0) < 50).length },
      { range: '50-70', count: validScores.filter(m => (m.total_score || 0) >= 50 && (m.total_score || 0) < 70).length },
      { range: '70-90', count: validScores.filter(m => (m.total_score || 0) >= 70 && (m.total_score || 0) < 90).length },
      { range: '90-100', count: validScores.filter(m => (m.total_score || 0) >= 90).length },
    ];

    // 弱项领域
    let weakAreas: { name: string; avgScore: number }[] = [];
    if (mockInterviews.length > 0) {
      const { data: mockAnswers } = await supabase
        .from('interview_answers')
        .select('dimensions')
        .in('mock_interview_id', mockInterviews.map(m => m.id))
        .not('dimensions', 'is', null);

      const dimensionMap = new Map<string, number[]>();
      for (const a of mockAnswers || []) {
        const dims = a.dimensions as Array<{ name: string; score: number }> | null;
        if (dims) {
          for (const d of dims) {
            if (!dimensionMap.has(d.name)) dimensionMap.set(d.name, []);
            dimensionMap.get(d.name)!.push(d.score);
          }
        }
      }
      weakAreas = Array.from(dimensionMap.entries())
        .map(([name, scores]) => ({ name, avgScore: Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) }))
        .sort((a, b) => a.avgScore - b.avgScore)
        .slice(0, 6);
    }

    // 漏斗
    const totalPractices = assistantCount + qaCount + mockCount;
    const goodPractices = validScores.filter(m => (m.total_score || 0) >= 70).length +
                          validCompScores.filter(c => (c.total_score || 0) >= 70).length;
    const excellentPractices = validScores.filter(m => (m.total_score || 0) >= 90).length +
                               validCompScores.filter(c => (c.total_score || 0) >= 90).length;

    const funnelStages = [
      { stage: '总练习', count: totalPractices },
      { stage: '良好(≥70)', count: goodPractices },
      { stage: '优秀(≥90)', count: excellentPractices },
    ];

    // 环比
    const weekAgo = new Date(now.getTime() - 7 * 86400000).toISOString();
    const twoWeeksAgo = new Date(now.getTime() - 14 * 86400000).toISOString();
    const thisWeekMocks = mockInterviews.filter(m => m.created_at >= weekAgo).length;
    const lastWeekMocks = mockInterviews.filter(m => m.created_at >= twoWeeksAgo && m.created_at < weekAgo).length;
    const mockChange = lastWeekMocks > 0 ? Math.round(((thisWeekMocks - lastWeekMocks) / lastWeekMocks) * 100) : (thisWeekMocks > 0 ? 100 : 0);
    const thisWeekComp = competitiveAnalyses.filter(c => c.created_at >= weekAgo).length;
    const lastWeekComp = competitiveAnalyses.filter(c => c.created_at >= twoWeeksAgo && c.created_at < weekAgo).length;
    const compChange = lastWeekComp > 0 ? Math.round(((thisWeekComp - lastWeekComp) / lastWeekComp) * 100) : (thisWeekComp > 0 ? 100 : 0);

    return NextResponse.json({
      stats: {
        assistant_count: assistantCount,
        qa_count: qaCount,
        mock_count: mockCount,
        total_count: assistantCount + qaCount + mockCount,
        methodology_count: methodologyCount,
        competitive_count: competitiveCount,
        avg_mock_score: avgMockScore,
        avg_comp_score: avgCompScore,
        session_count: sessionCount,
        mock_change: mockChange,
        comp_change: compChange,
        type_distribution: typeDistribution,
        mock_score_trend: mockScoreTrend,
        score_ranges: scoreRanges,
        weak_areas: weakAreas,
        qa_type_distribution: qaTypeDistribution,
        funnel_stages: funnelStages,
        methodology_type_distribution: methodologyTypeDistribution,
      },
    });
  } catch (error) {
    console.error('Interview dashboard error:', error);
    return NextResponse.json({ error: '获取数据失败' }, { status: 500 });
  }
}