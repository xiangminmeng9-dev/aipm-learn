import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { SIMULATOR_SCENARIOS } from '@/lib/simulator-config';



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

    const [
      sessionsRes,
      projectsRes,
      bossSessionsRes,
    ] = await Promise.all([
      supabase.from('simulator_sessions').select('id, scenario_id, current_stage, stage_scores, status, created_at, updated_at').eq('user_id', user.id).gte('created_at', cutoffDate).order('created_at', { ascending: false }),
      supabase.from('simulator_projects').select('id, scenario_id, title, status, created_at, updated_at').eq('user_id', user.id).gte('created_at', cutoffDate).order('created_at', { ascending: false }),
      supabase.from('boss_1v1_sessions').select('id, boss_type, scenario_id, status, score, feedback, created_at').eq('user_id', user.id).gte('created_at', cutoffDate).order('created_at', { ascending: false }),
    ]);

    const sessions = sessionsRes.data || [];
    const projects = projectsRes.data || [];
    const bossSessions = bossSessionsRes.data || [];

    // 基础统计
    const totalSessions = sessions.length;
    const completedSessions = sessions.filter(s => s.status === 'completed').length;
    const totalProjects = projects.length;
    const completedProjects = projects.filter(p => p.status === 'completed').length;
    const totalBossSessions = bossSessions.length;
    const completedBossSessions = bossSessions.filter(b => b.status === 'completed').length;

    // 工作流场景分布
    const scenarioMap = new Map<string, number>();
    for (const s of sessions) {
      const scenarioId = s.scenario_id || 'unknown';
      scenarioMap.set(scenarioId, (scenarioMap.get(scenarioId) || 0) + 1);
    }
    const scenarioDistribution = Array.from(scenarioMap.entries())
      .map(([scenario_id, count]) => {
        const scenario = SIMULATOR_SCENARIOS.find(s => s.id === scenario_id);
        return { scenario_id, title: scenario?.title || scenario_id, count };
      })
      .sort((a, b) => b.count - a.count);

    // Boss类型分布
    const bossTypeMap = new Map<string, number>();
    for (const b of bossSessions) {
      const type = b.boss_type || 'unknown';
      bossTypeMap.set(type, (bossTypeMap.get(type) || 0) + 1);
    }
    const bossTypeDistribution = Array.from(bossTypeMap.entries())
      .map(([boss_type, count]) => ({ boss_type, count }))
      .sort((a, b) => b.count - a.count);

    // 工作流阶段完成度统计
    const stageCompletionMap = new Map<string, { completed: number; total: number }>();
    for (const s of sessions) {
      const scenarioId = s.scenario_id || 'unknown';
      const scenario = SIMULATOR_SCENARIOS.find(sc => sc.id === scenarioId);
      if (!scenario) continue;
      const totalStages = scenario.stages.length;
      const scores = s.stage_scores || {};
      const completedStages = Object.keys(scores).length;
      const existing = stageCompletionMap.get(scenarioId) || { completed: 0, total: 0 };
      existing.completed += completedStages;
      existing.total += totalStages;
      stageCompletionMap.set(scenarioId, existing);
    }
    const stageCompletion = Array.from(stageCompletionMap.entries())
      .map(([scenario_id, data]) => {
        const scenario = SIMULATOR_SCENARIOS.find(s => s.id === scenario_id);
        return { scenario_id, title: scenario?.title || scenario_id, ...data };
      });

    // Boss 1v1 分数分布
    const bossScores = bossSessions.filter(b => b.score != null).map(b => b.score as number);
    const avgBossScore = bossScores.length > 0 ? Math.round(bossScores.reduce((a, b) => a + b, 0) / bossScores.length) : 0;
    const scoreRanges = [
      { range: '0-40', count: 0, color: '#EF4444' },
      { range: '40-60', count: 0, color: '#F59E0B' },
      { range: '60-80', count: 0, color: '#10B981' },
      { range: '80-100', count: 0, color: '#6366F1' },
    ];
    for (const score of bossScores) {
      if (score < 40) scoreRanges[0].count++;
      else if (score < 60) scoreRanges[1].count++;
      else if (score < 80) scoreRanges[2].count++;
      else scoreRanges[3].count++;
    }

    // 活跃趋势
    const days = range === '7d' ? 7 : range === '30d' ? 30 : 90;
    const sessionTrendMap = new Map<string, number>();
    const bossTrendMap = new Map<string, number>();
    const projectTrendMap = new Map<string, number>();
    for (const s of sessions) {
      const date = s.created_at.slice(0, 10);
      sessionTrendMap.set(date, (sessionTrendMap.get(date) || 0) + 1);
    }
    for (const b of bossSessions) {
      const date = b.created_at.slice(0, 10);
      bossTrendMap.set(date, (bossTrendMap.get(date) || 0) + 1);
    }
    for (const p of projects) {
      const date = p.created_at.slice(0, 10);
      projectTrendMap.set(date, (projectTrendMap.get(date) || 0) + 1);
    }
    const activityTrend = Array.from({ length: days }, (_, i) => {
      const d = new Date(now.getTime() - (days - 1 - i) * 86400000);
      const dateStr = d.toISOString().slice(0, 10);
      return {
        date: dateStr,
        workflows: sessionTrendMap.get(dateStr) || 0,
        boss: bossTrendMap.get(dateStr) || 0,
        projects: projectTrendMap.get(dateStr) || 0,
      };
    });

    // 环比
    const weekAgo = new Date(now.getTime() - 7 * 86400000).toISOString();
    const twoWeeksAgo = new Date(now.getTime() - 14 * 86400000).toISOString();
    const thisWeekSessions = sessions.filter(s => s.created_at >= weekAgo).length;
    const lastWeekSessions = sessions.filter(s => s.created_at >= twoWeeksAgo && s.created_at < weekAgo).length;
    const sessionsChange = lastWeekSessions > 0 ? Math.round(((thisWeekSessions - lastWeekSessions) / lastWeekSessions) * 100) : (thisWeekSessions > 0 ? 100 : 0);
    const thisWeekBoss = bossSessions.filter(b => b.created_at >= weekAgo).length;
    const lastWeekBoss = bossSessions.filter(b => b.created_at >= twoWeeksAgo && b.created_at < weekAgo).length;
    const bossChange = lastWeekBoss > 0 ? Math.round(((thisWeekBoss - lastWeekBoss) / lastWeekBoss) * 100) : (thisWeekBoss > 0 ? 100 : 0);

    // 最近工作流
    const recentSessions = sessions.slice(0, 5).map(s => {
      const scenario = SIMULATOR_SCENARIOS.find(sc => sc.id === s.scenario_id);
      const scores = s.stage_scores || {};
      const completedStages = Object.keys(scores).length;
      const totalStages = scenario?.stages.length || 0;
      return {
        id: s.id,
        title: scenario?.title || s.scenario_id || '未知场景',
        status: s.status,
        progress: totalStages > 0 ? Math.round((completedStages / totalStages) * 100) : 0,
        updated_at: s.updated_at,
      };
    });

    // 最近Boss 1v1
    const recentBossSessions = bossSessions.slice(0, 5).map(b => ({
      id: b.id,
      boss_type: b.boss_type,
      status: b.status,
      score: b.score,
      created_at: b.created_at,
    }));

    return NextResponse.json({
      stats: {
        total_sessions: totalSessions,
        completed_sessions: completedSessions,
        total_projects: totalProjects,
        completed_projects: completedProjects,
        total_boss_sessions: totalBossSessions,
        completed_boss_sessions: completedBossSessions,
        avg_boss_score: avgBossScore,
        sessions_change: sessionsChange,
        boss_change: bossChange,
        scenario_distribution: scenarioDistribution,
        boss_type_distribution: bossTypeDistribution,
        stage_completion: stageCompletion,
        score_ranges: scoreRanges,
        activity_trend: activityTrend,
        recent_sessions: recentSessions,
        recent_boss_sessions: recentBossSessions,
      },
    });
  } catch (error) {
    console.error('Simulator dashboard error:', error);
    return NextResponse.json({ error: '获取数据失败' }, { status: 500 });
  }
}
