import { NextResponse } from 'next/server';
import { createClient, createServiceClient } from '@/lib/supabase/server';

export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: '请先登录' }, { status: 401 });

    const serviceClient = createServiceClient();

    // ── Coding ──
    const { data: codingFlows } = await serviceClient
      .from('coding_flows')
      .select('id, created_at')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });
    const codingFlowCount = codingFlows?.length ?? 0;
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const codingRecent = (codingFlows ?? []).filter((f) => new Date(f.created_at) >= sevenDaysAgo).length;

    // Coding 7-day daily activity
    const codingDaily: Record<string, number> = {};
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      codingDaily[d.toISOString().split('T')[0]] = 0;
    }
    for (const f of codingFlows ?? []) {
      const date = new Date(f.created_at).toISOString().split('T')[0];
      if (date in codingDaily) codingDaily[date]++;
    }

    // ── Skills ──
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

    // Skills per-module breakdown
    const moduleTaskMap: Record<string, { total: number; completed: number }> = {};
    for (const t of userTasks ?? []) {
      if (!moduleTaskMap[t.module_id]) moduleTaskMap[t.module_id] = { total: 0, completed: 0 };
      moduleTaskMap[t.module_id].total++;
      if (t.status === 'completed') moduleTaskMap[t.module_id].completed++;
    }
    const skillModules = Object.entries(moduleTaskMap).map(([id, v]) => ({
      id,
      name: (modules ?? []).find((m) => m.id === id)?.level ?? `模块${id.slice(0, 4)}`,
      total: v.total,
      completed: v.completed,
    }));

    // ── Notebook ──
    let notebookNotes = 0, notebookTasks = 0, notebookAiAnalysis = 0;
    let notebookDaily: { date: string; notes: number; tasks: number }[] = [];
    try {
      const { count: nCount } = await serviceClient
        .from('notebook_notes')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', user.id);
      notebookNotes = nCount ?? 0;
      const { count: tCount } = await serviceClient
        .from('notebook_tasks')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', user.id);
      notebookTasks = tCount ?? 0;
      const { count: aCount } = await serviceClient
        .from('notebook_ai_analyses')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', user.id);
      notebookAiAnalysis = aCount ?? 0;

      // Notebook 7-day creation
      const { data: recentNotes } = await serviceClient
        .from('notebook_notes')
        .select('created_at')
        .eq('user_id', user.id)
        .gte('created_at', sevenDaysAgo.toISOString())
        .order('created_at', { ascending: true });
      const { data: recentTasks } = await serviceClient
        .from('notebook_tasks')
        .select('created_at')
        .eq('user_id', user.id)
        .gte('created_at', sevenDaysAgo.toISOString())
        .order('created_at', { ascending: true });

      const noteDailyMap: Record<string, number> = {};
      const taskDailyMap: Record<string, number> = {};
      for (let i = 6; i >= 0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        const key = d.toISOString().split('T')[0];
        noteDailyMap[key] = 0;
        taskDailyMap[key] = 0;
      }
      for (const n of recentNotes ?? []) {
        const date = new Date(n.created_at).toISOString().split('T')[0];
        if (date in noteDailyMap) noteDailyMap[date]++;
      }
      for (const t of recentTasks ?? []) {
        const date = new Date(t.created_at).toISOString().split('T')[0];
        if (date in taskDailyMap) taskDailyMap[date]++;
      }
      notebookDaily = Object.keys(noteDailyMap).sort().map((date) => ({
        date,
        notes: noteDailyMap[date] ?? 0,
        tasks: taskDailyMap[date] ?? 0,
      }));
    } catch { /* tables may not exist */ }

    // ── Simulator ──
    let simulatorSessions = 0, simulatorStagesCompleted = 0, simulatorAvgScore = 0;
    try {
      const { data: simSessions } = await serviceClient
        .from('simulator_sessions')
        .select('id, current_stage, stage_scores')
        .eq('user_id', user.id);
      simulatorSessions = simSessions?.length ?? 0;
      if (simSessions && simSessions.length > 0) {
        const allScores: number[] = [];
        for (const s of simSessions) {
          const scores = s.stage_scores as Record<string, { score: number }> | null;
          if (scores) {
            for (const v of Object.values(scores)) {
              if (v?.score) allScores.push(v.score);
              simulatorStagesCompleted++;
            }
          }
        }
        simulatorAvgScore = allScores.length > 0 ? Math.round(allScores.reduce((a, b) => a + b, 0) / allScores.length) : 0;
      }
    } catch { /* table may not exist */ }

    // ── Interview ──
    const { data: qaRecords } = await serviceClient
      .from('assistant_qa_records')
      .select('id, question, category, answer, evaluation, created_at')
      .eq('user_id', user.id)
      .order('created_at', { ascending: true });
    const interviewCount = qaRecords?.length ?? 0;
    let totalScore = 0, scoredCount = 0;
    for (const r of qaRecords ?? []) {
      const ev = r.evaluation as Record<string, unknown> | null;
      if (ev && typeof ev === 'object') {
        const s = ev.total_score ?? ev.score ?? ev.overall_score;
        if (typeof s === 'number') { totalScore += s; scoredCount++; }
      }
    }
    const avgScore = scoredCount > 0 ? Math.round((totalScore / scoredCount) * 10) / 10 : 0;

    let mockCount = 0, sessionCount = 0;
    try {
      const { count: mCount } = await serviceClient
        .from('mock_interviews')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', user.id);
      mockCount = mCount ?? 0;
      const { count: sCount } = await serviceClient
        .from('interview_sessions')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', user.id);
      sessionCount = sCount ?? 0;
    } catch {}

    // Interview score history (last 15)
    const interviewScoreHistory = (qaRecords ?? [])
      .filter((r) => {
        const ev = r.evaluation as Record<string, unknown> | null;
        return ev && typeof (ev.total_score ?? ev.score ?? ev.overall_score) === 'number';
      })
      .slice(-15)
      .map((r) => {
        const ev = r.evaluation as Record<string, unknown>;
        const s = ev.total_score ?? ev.score ?? ev.overall_score;
        return { date: new Date(r.created_at).toLocaleDateString('zh-CN', { month: 'numeric', day: 'numeric' }), score: typeof s === 'number' ? s : 0 };
      });

    // ── Resume ──
    let resumeVersions = 0, resumeMatchScore = 0;
    try {
      const { data: resumeData } = await serviceClient
        .from('resume_versions')
        .select('id, match_score, created_at')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
      resumeVersions = resumeData?.length ?? 0;
      if (resumeData && resumeData.length > 0) {
        const best = resumeData.reduce((best: number, r: { match_score: number | null }) => Math.max(best, r.match_score ?? 0), 0);
        resumeMatchScore = best;
      }
    } catch {}

    // ── Resources ──
    let resourcesCount = 0, articlesRead = 0;
    try {
      const { count: rCount } = await serviceClient
        .from('resources')
        .select('id', { count: 'exact', head: true });
      resourcesCount = rCount ?? 0;
      const { data: readData } = await serviceClient
        .from('user_resource_reads')
        .select('id, created_at')
        .eq('user_id', user.id);
      articlesRead = readData?.length ?? 0;
    } catch {}

    // ── Daily Challenge ──
    let challengeCount = 0, dailyStreak = 0, challengeAvgScore = 0;
    let challengeScoreHistory: { date: string; score: number }[] = [];
    try {
      const { data: challenges } = await serviceClient
        .from('daily_challenge_submissions')
        .select('id, score, time_spent, created_at')
        .eq('user_id', user.id)
        .order('created_at', { ascending: true });
      challengeCount = challenges?.length ?? 0;
      if (challenges && challenges.length > 0) {
        const scores = challenges.map((c) => c.score ?? 0).filter((s) => s > 0);
        challengeAvgScore = scores.length > 0 ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : 0;
        const dates = challenges.map((c) => new Date(c.created_at).toISOString().split('T')[0]);
        const uniqueDates = [...new Set(dates)].sort().reverse();
        let streak = 0;
        for (let i = 0; i < uniqueDates.length; i++) {
          const expected = new Date();
          expected.setDate(expected.getDate() - i);
          if (uniqueDates[i] === expected.toISOString().split('T')[0]) streak++;
          else break;
        }
        dailyStreak = streak;
        challengeScoreHistory = challenges.slice(-15).map((c) => ({
          date: new Date(c.created_at).toLocaleDateString('zh-CN', { month: 'numeric', day: 'numeric' }),
          score: c.score ?? 0,
        }));
      }
    } catch {}

    // ── Progress curve ──
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

    const scoreTrend = (qaRecords ?? []).slice(-10).map((i) => {
      const ev = i.evaluation as Record<string, unknown> | null;
      const s = ev ? (ev.total_score ?? ev.score ?? ev.overall_score ?? 0) : 0;
      return { date: new Date(i.created_at).toLocaleDateString('zh-CN'), score: typeof s === 'number' ? s : 0, category: i.category ?? 'unknown' };
    });

    const estimatedInterviewTime = interviewCount * 15;
    const estimatedTaskTime = completedTaskCount * 10;
    const totalLearningMinutes = estimatedInterviewTime + estimatedTaskTime;

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
      moduleDetails: {
        coding: {
          flows: codingFlowCount,
          recentActivity: codingRecent,
          dailyActivity: Object.entries(codingDaily).sort(([a], [b]) => a.localeCompare(b)).map(([date, count]) => ({ date: date.slice(5), count })),
        },
        skills: {
          coverage: skillCoverage,
          modules: totalModules,
          tasks: totalTaskCount,
          completedTasks: completedTaskCount,
          moduleBreakdown: skillModules,
        },
        notebook: {
          notes: notebookNotes,
          tasks: notebookTasks,
          aiAnalysis: notebookAiAnalysis,
          dailyCreation: notebookDaily,
        },
        simulator: { sessions: simulatorSessions, stagesCompleted: simulatorStagesCompleted, avgScore: simulatorAvgScore },
        interview: {
          qaCount: interviewCount,
          mockCount,
          avgScore,
          sessions: sessionCount,
          scoreHistory: interviewScoreHistory,
        },
        resume: { versions: resumeVersions, matchScore: resumeMatchScore },
        resources: { count: resourcesCount, articlesRead },
        dailyChallenge: {
          submissions: challengeCount,
          streak: dailyStreak,
          avgScore: challengeAvgScore,
          scoreHistory: challengeScoreHistory,
        },
      },
    });
  } catch (err) {
    console.error('Learning dashboard error:', err);
    return NextResponse.json({ error: '获取数据失败' }, { status: 500 });
  }
}
