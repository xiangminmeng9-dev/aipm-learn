import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createServiceClient } from '@/lib/supabase/server';

// GET /api/learning/dashboard — 学习数据看板
export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: '请先登录' }, { status: 401 });

    const serviceClient = createServiceClient();

    // 1. Skill coverage
    const { data: modules } = await serviceClient
      .from('skill_modules')
      .select('id, level');
    const { data: userModules } = await serviceClient
      .from('user_skill_modules')
      .select('id, level')
      .eq('user_id', user.id);
    const { data: userTasks } = await serviceClient
      .from('user_skill_tasks')
      .select('id, status, module_id')
      .eq('user_id', user.id);

    const allModuleIds = new Set([...(modules ?? []).map((m) => m.id), ...(userModules ?? []).map((m) => m.id)]);
    const totalModules = allModuleIds.size;

    const completedTasks = (userTasks ?? []).filter((t) => t.status === 'completed');
    const completedTaskCount = completedTasks.length;
    const totalTaskCount = (userTasks ?? []).length;
    const completedModuleIds = new Set(completedTasks.map((t) => t.module_id));
    const skillCoverage = totalModules > 0 ? Math.round((completedModuleIds.size / totalModules) * 100) : 0;

    // 2. Interview data from assistant_qa_records
    const { data: qaRecords } = await serviceClient
      .from('assistant_qa_records')
      .select('id, question, category, answer, evaluation, created_at')
      .eq('user_id', user.id)
      .order('created_at', { ascending: true });

    const interviewCount = qaRecords?.length ?? 0;
    // Extract scores from evaluation JSONB
    let totalScore = 0;
    let scoredCount = 0;
    for (const r of qaRecords ?? []) {
      const ev = r.evaluation as Record<string, unknown> | null;
      if (ev && typeof ev === 'object') {
        const s = ev.total_score ?? ev.score ?? ev.overall_score;
        if (typeof s === 'number') { totalScore += s; scoredCount++; }
      }
    }
    const avgScore = scoredCount > 0 ? Math.round((totalScore / scoredCount) * 10) / 10 : 0;

    // 3. Daily challenge stats
    let challengeCount = 0;
    let totalChallengeTime = 0;
    try {
      const { data: challenges } = await serviceClient
        .from('daily_challenge_submissions')
        .select('id, score, time_spent, created_at')
        .eq('user_id', user.id)
        .order('created_at', { ascending: true });
      challengeCount = challenges?.length ?? 0;
      totalChallengeTime = (challenges ?? []).reduce((sum, c) => sum + (c.time_spent ?? 0), 0);
    } catch { /* table may not exist */ }

    // 4. Learning time estimation
    const estimatedInterviewTime = interviewCount * 15;
    const estimatedTaskTime = completedTaskCount * 10;
    const totalLearningMinutes = estimatedInterviewTime + Math.round(totalChallengeTime / 60) + estimatedTaskTime;

    // 5. Progress curve: daily activity over last 30 days
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const recentQA = (qaRecords ?? []).filter((i) => new Date(i.created_at) >= thirtyDaysAgo);

    const dailyActivity: Record<string, { interviews: number; challenges: number; score: number }> = {};
    for (const i of recentQA) {
      const date = new Date(i.created_at).toISOString().split('T')[0];
      if (!dailyActivity[date]) dailyActivity[date] = { interviews: 0, challenges: 0, score: 0 };
      dailyActivity[date].interviews++;
      const ev = i.evaluation as Record<string, unknown> | null;
      if (ev) {
        const s = ev.total_score ?? ev.score ?? ev.overall_score;
        if (typeof s === 'number') dailyActivity[date].score += s;
      }
    }

    const progressCurve = Object.entries(dailyActivity)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, activity]) => ({
        date,
        interviews: activity.interviews,
        challenges: activity.challenges,
        totalActivity: activity.interviews + activity.challenges,
        avgScore: activity.interviews > 0 ? Math.round(activity.score / activity.interviews) : 0,
      }));

    // 6. Score trend (last 10 sessions)
    const scoreTrend = (qaRecords ?? []).slice(-10).map((i) => {
      const ev = i.evaluation as Record<string, unknown> | null;
      const s = ev ? (ev.total_score ?? ev.score ?? ev.overall_score ?? 0) : 0;
      return {
        date: new Date(i.created_at).toLocaleDateString('zh-CN'),
        score: typeof s === 'number' ? s : 0,
        category: i.category ?? 'unknown',
      };
    });

    return NextResponse.json({
      totalLearningMinutes,
      interviewCount,
      avgScore,
      challengeCount,
      skillCoverage,
      totalModules,
      completedModules: completedModuleIds.size,
      totalTasks: totalTaskCount,
      completedTasks: completedTaskCount,
      progressCurve,
      scoreTrend,
    });
  } catch (err) {
    console.error('Learning dashboard error:', err);
    return NextResponse.json({ error: '获取数据失败' }, { status: 500 });
  }
}
