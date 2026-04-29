import { NextResponse } from 'next/server';
import { createClient, createServiceClient } from '@/lib/supabase/server';

export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: '请先登录' }, { status: 401 });

    const serviceClient = createServiceClient();
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    // ── Coding ──
    let codingFlowCount = 0, codingRecent = 0;
    let codingDaily: { date: string; count: number }[] = [];
    let codingByStage: { name: string; value: number }[] = [];
    try {
      const { data: codingFlows } = await serviceClient
        .from('coding_flows')
        .select('id, created_at, current_stage, status')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
      codingFlowCount = codingFlows?.length ?? 0;
      codingRecent = (codingFlows ?? []).filter((f) => new Date(f.created_at) >= sevenDaysAgo).length;
      // 7-day daily
      const dailyMap: Record<string, number> = {};
      for (let i = 6; i >= 0; i--) { const d = new Date(); d.setDate(d.getDate() - i); dailyMap[d.toISOString().split('T')[0]] = 0; }
      for (const f of codingFlows ?? []) { const date = new Date(f.created_at).toISOString().split('T')[0]; if (date in dailyMap) dailyMap[date]++; }
      codingDaily = Object.entries(dailyMap).sort(([a], [b]) => a.localeCompare(b)).map(([date, count]) => ({ date: date.slice(5), count }));
      // By stage
      const stageMap: Record<string, number> = {};
      for (const f of codingFlows ?? []) { const s = f.current_stage || '未开始'; stageMap[s] = (stageMap[s] || 0) + 1; }
      codingByStage = Object.entries(stageMap).map(([name, value]) => ({ name, value }));
    } catch {}

    // ── Skills ──
    let totalModules = 0, totalTaskCount = 0, completedTaskCount = 0, skillCoverage = 0;
    let skillModules: { id: string; name: string; level: string; total: number; completed: number }[] = [];
    let skillByLevel: { level: string; total: number; completed: number; custom: number }[] = [];
    let customModuleCount = 0;
    try {
      const { data: modules } = await serviceClient.from('skill_modules').select('id, name, level');
      const { data: userModules } = await serviceClient.from('user_skill_modules').select('id, module_id, is_custom, level').eq('user_id', user.id);
      const { data: userTasks } = await serviceClient.from('user_skill_tasks').select('id, status, module_id, is_custom').eq('user_id', user.id);
      const allModuleIds = new Set([...(modules ?? []).map((m) => m.id), ...(userModules ?? []).map((m) => m.module_id)]);
      totalModules = allModuleIds.size;
      completedTaskCount = (userTasks ?? []).filter((t) => t.status === 'completed').length;
      totalTaskCount = (userTasks ?? []).length;
      const completedModuleIds = new Set((userTasks ?? []).filter((t) => t.status === 'completed').map((t) => t.module_id));
      skillCoverage = totalModules > 0 ? Math.round((completedModuleIds.size / totalModules) * 100) : 0;
      // Per-module breakdown with level
      const moduleTaskMap: Record<string, { total: number; completed: number }> = {};
      for (const t of userTasks ?? []) { if (!moduleTaskMap[t.module_id]) moduleTaskMap[t.module_id] = { total: 0, completed: 0 }; moduleTaskMap[t.module_id].total++; if (t.status === 'completed') moduleTaskMap[t.module_id].completed++; }
      const moduleLevelMap: Record<string, string> = {};
      for (const m of modules ?? []) moduleLevelMap[m.id] = m.level || '未分类';
      for (const m of userModules ?? []) { if (m.level) moduleLevelMap[m.module_id] = m.level; if (m.is_custom) customModuleCount++; }
      skillModules = Object.entries(moduleTaskMap).map(([id, v]) => ({ id, name: (modules ?? []).find((m) => m.id === id)?.name ?? `模块${id.slice(0, 4)}`, level: moduleLevelMap[id] || '未分类', total: v.total, completed: v.completed }));
      // By level aggregation
      const levelMap: Record<string, { total: number; completed: number; custom: number }> = {};
      for (const sm of skillModules) {
        if (!levelMap[sm.level]) levelMap[sm.level] = { total: 0, completed: 0, custom: 0 };
        levelMap[sm.level].total += sm.total;
        levelMap[sm.level].completed += sm.completed;
      }
      const customTasks = (userTasks ?? []).filter((t) => t.is_custom);
      const customByModule: Record<string, number> = {};
      for (const t of customTasks) { customByModule[t.module_id] = (customByModule[t.module_id] || 0) + 1; }
      for (const [mid] of Object.entries(customByModule)) { const lvl = moduleLevelMap[mid] || '自定义'; if (levelMap[lvl]) levelMap[lvl].custom += customByModule[mid]; }
      skillByLevel = Object.entries(levelMap).map(([level, v]) => ({ level, ...v }));
    } catch {}

    // ── Notebook ──
    let notebookNotes = 0, notebookTasks = 0, notebookAiAnalysis = 0;
    let notebookDaily: { date: string; notes: number; tasks: number }[] = [];
    let notebookByType: { name: string; value: number }[] = [];
    try {
      const { count: nCount } = await serviceClient.from('notebook_notes').select('id', { count: 'exact', head: true }).eq('user_id', user.id);
      notebookNotes = nCount ?? 0;
      const { count: tCount } = await serviceClient.from('notebook_tasks').select('id', { count: 'exact', head: true }).eq('user_id', user.id);
      notebookTasks = tCount ?? 0;
      try { const { count: aCount } = await serviceClient.from('notebook_ai_analyses').select('id', { count: 'exact', head: true }).eq('user_id', user.id); notebookAiAnalysis = aCount ?? 0; } catch {}
      // By type/category
      try {
        const { data: notesByType } = await serviceClient.from('notebook_notes').select('type').eq('user_id', user.id);
        const typeMap: Record<string, number> = {};
        for (const n of notesByType ?? []) { const t = n.type || '未分类'; typeMap[t] = (typeMap[t] || 0) + 1; }
        notebookByType = Object.entries(typeMap).map(([name, value]) => ({ name, value }));
      } catch {}
      // 7-day daily
      try {
        const { data: recentNotes } = await serviceClient.from('notebook_notes').select('created_at').eq('user_id', user.id).gte('created_at', sevenDaysAgo.toISOString());
        const { data: recentTasks } = await serviceClient.from('notebook_tasks').select('created_at').eq('user_id', user.id).gte('created_at', sevenDaysAgo.toISOString());
        const noteMap: Record<string, number> = {}, taskMap: Record<string, number> = {};
        for (let i = 6; i >= 0; i--) { const d = new Date(); d.setDate(d.getDate() - i); const k = d.toISOString().split('T')[0]; noteMap[k] = 0; taskMap[k] = 0; }
        for (const n of recentNotes ?? []) { const date = new Date(n.created_at).toISOString().split('T')[0]; if (date in noteMap) noteMap[date]++; }
        for (const t of recentTasks ?? []) { const date = new Date(t.created_at).toISOString().split('T')[0]; if (date in taskMap) taskMap[date]++; }
        notebookDaily = Object.keys(noteMap).sort().map((date) => ({ date, notes: noteMap[date] ?? 0, tasks: taskMap[date] ?? 0 }));
      } catch {}
    } catch {}

    // ── Simulator ──
    let simulatorSessions = 0, simulatorStagesCompleted = 0, simulatorAvgScore = 0;
    let simulatorByScenario: { name: string; count: number; avgScore: number }[] = [];
    let simulatorScoreDist: { range: string; count: number }[] = [];
    try {
      const { data: simSessions } = await serviceClient.from('simulator_sessions').select('id, score, progress, scenario_id, created_at').eq('user_id', user.id);
      simulatorSessions = simSessions?.length ?? 0;
      if (simSessions && simSessions.length > 0) {
        const scores = simSessions.map((s) => s.score).filter((s): s is number => typeof s === 'number' && s > 0);
        simulatorAvgScore = scores.length > 0 ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : 0;
        simulatorStagesCompleted = simSessions.filter((s) => s.progress != null && Number(s.progress) > 0).length;
        // By scenario
        const scenarioMap: Record<string, { count: number; totalScore: number }> = {};
        for (const s of simSessions) { const sid = s.scenario_id || '未知'; if (!scenarioMap[sid]) scenarioMap[sid] = { count: 0, totalScore: 0 }; scenarioMap[sid].count++; if (typeof s.score === 'number' && s.score > 0) scenarioMap[sid].totalScore += s.score; }
        simulatorByScenario = Object.entries(scenarioMap).map(([name, v]) => ({ name: name.slice(0, 8), count: v.count, avgScore: v.count > 0 ? Math.round(v.totalScore / v.count) : 0 }));
        // Score distribution
        const dist = { '0-20': 0, '21-40': 0, '41-60': 0, '61-80': 0, '81-100': 0 };
        for (const s of scores) { if (s <= 20) dist['0-20']++; else if (s <= 40) dist['21-40']++; else if (s <= 60) dist['41-60']++; else if (s <= 80) dist['61-80']++; else dist['81-100']++; }
        simulatorScoreDist = Object.entries(dist).map(([range, count]) => ({ range, count }));
      }
    } catch {}

    // ── Interview ──
    let interviewCount = 0, avgScore = 0, mockCount = 0, sessionCount = 0;
    let interviewScoreHistory: { date: string; score: number }[] = [];
    let interviewByCategory: { name: string; count: number; avgScore: number }[] = [];
    let mockScoreDistribution: { range: string; count: number }[] = [];
    let interviewMethodStats: { method: string; count: number; avgScore: number }[] = [];
    let qaRecords: { evaluation: unknown; created_at: string; category?: string }[] = [];
    try {
      const { data: qa } = await serviceClient.from('assistant_qa_records').select('evaluation, created_at, category').eq('user_id', user.id).order('created_at', { ascending: true });
      qaRecords = qa ?? [];
      interviewCount = qaRecords.length;
      let totalScore = 0, scoredCount = 0;
      for (const r of qaRecords) {
        const ev = r.evaluation as Record<string, unknown> | null;
        if (ev && typeof ev === 'object') { const s = ev.total_score ?? ev.score ?? ev.overall_score; if (typeof s === 'number') { totalScore += s; scoredCount++; } }
      }
      avgScore = scoredCount > 0 ? Math.round((totalScore / scoredCount) * 10) / 10 : 0;
      interviewScoreHistory = qaRecords.filter((r) => { const ev = r.evaluation as Record<string, unknown> | null; return ev && typeof (ev.total_score ?? ev.score ?? ev.overall_score) === 'number'; }).slice(-20).map((r) => { const ev = r.evaluation as Record<string, unknown>; const s = ev.total_score ?? ev.score ?? ev.overall_score; return { date: new Date(r.created_at).toLocaleDateString('zh-CN', { month: 'numeric', day: 'numeric' }), score: typeof s === 'number' ? s : 0 }; });
      // By category
      const catMap: Record<string, { count: number; totalScore: number }> = {};
      for (const r of qaRecords) {
        const cat = r.category || '未分类';
        if (!catMap[cat]) catMap[cat] = { count: 0, totalScore: 0 };
        catMap[cat].count++;
        const ev = r.evaluation as Record<string, unknown> | null;
        if (ev) { const s = ev.total_score ?? ev.score ?? ev.overall_score; if (typeof s === 'number') catMap[cat].totalScore += s; }
      }
      interviewByCategory = Object.entries(catMap).map(([name, v]) => ({ name, count: v.count, avgScore: v.count > 0 ? Math.round(v.totalScore / v.count) : 0 }));
      // Method stats (from evaluation dimensions)
      const methodMap: Record<string, { count: number; totalScore: number }> = {};
      for (const r of qaRecords) {
        const ev = r.evaluation as Record<string, unknown> | null;
        if (ev && typeof ev === 'object') {
          const dims = ev.dimensions as { name: string; score: number }[] | null;
          if (dims && Array.isArray(dims)) {
            for (const dim of dims) {
              if (!methodMap[dim.name]) methodMap[dim.name] = { count: 0, totalScore: 0 };
              methodMap[dim.name].count++;
              methodMap[dim.name].totalScore += dim.score;
            }
          }
        }
      }
      interviewMethodStats = Object.entries(methodMap).map(([method, v]) => ({ method, count: v.count, avgScore: v.count > 0 ? Math.round(v.totalScore / v.count) : 0 }));
    } catch {}
    try { const { count: mCount } = await serviceClient.from('mock_interviews').select('id', { count: 'exact', head: true }).eq('user_id', user.id); mockCount = mCount ?? 0; } catch {}
    try { const { count: sCount } = await serviceClient.from('interview_sessions').select('id', { count: 'exact', head: true }).eq('user_id', user.id); sessionCount = sCount ?? 0; } catch {}
    // Mock score distribution
    try {
      const { data: mockAnswers } = await serviceClient.from('interview_answers').select('score').in('mock_interview_id', (await serviceClient.from('mock_interviews').select('id').eq('user_id', user.id)).data?.map((m) => m.id) ?? []);
      const dist = { '0-20': 0, '21-40': 0, '41-60': 0, '61-80': 0, '81-100': 0 };
      for (const a of mockAnswers ?? []) { if (a.score == null) continue; const s = Number(a.score); if (s <= 20) dist['0-20']++; else if (s <= 40) dist['21-40']++; else if (s <= 60) dist['41-60']++; else if (s <= 80) dist['61-80']++; else dist['81-100']++; }
      mockScoreDistribution = Object.entries(dist).map(([range, count]) => ({ range, count }));
    } catch {}

    // ── Resume ──
    let resumeVersions = 0, resumeMatchScore = 0;
    let resumeMatchTrend: { date: string; score: number }[] = [];
    let resumeJobStats: { status: string; count: number }[] = [];
    try {
      const { data: resumeData } = await serviceClient.from('resume_versions').select('id, match_score, created_at').eq('user_id', user.id).order('created_at', { ascending: true });
      resumeVersions = resumeData?.length ?? 0;
      if (resumeData && resumeData.length > 0) {
        resumeMatchScore = resumeData.reduce((best: number, r: { match_score: number | null }) => Math.max(best, r.match_score ?? 0), 0);
        resumeMatchTrend = resumeData.filter((r) => r.match_score != null).slice(-10).map((r) => ({ date: new Date(r.created_at).toLocaleDateString('zh-CN', { month: 'numeric', day: 'numeric' }), score: r.match_score ?? 0 }));
      }
    } catch {}
    try {
      const { data: jobs } = await serviceClient.from('resume_jobs').select('status').eq('user_id', user.id);
      const statusMap: Record<string, number> = {};
      for (const j of jobs ?? []) { const s = j.status || '未知'; statusMap[s] = (statusMap[s] || 0) + 1; }
      resumeJobStats = Object.entries(statusMap).map(([status, count]) => ({ status, count }));
    } catch {}

    // ── Resources ──
    let resourcesCount = 0, articlesRead = 0;
    let resourcesByCategory: { name: string; total: number; read: number }[] = [];
    let readingPace: { date: string; count: number }[] = [];
    try {
      const { count: rCount } = await serviceClient.from('resources').select('id', { count: 'exact', head: true });
      resourcesCount = rCount ?? 0;
    } catch {}
    try {
      const { data: readData } = await serviceClient.from('user_resource_reads').select('id, created_at, resource_id').eq('user_id', user.id);
      articlesRead = readData?.length ?? 0;
      // Reading pace (7-day)
      const paceMap: Record<string, number> = {};
      for (let i = 6; i >= 0; i--) { const d = new Date(); d.setDate(d.getDate() - i); paceMap[d.toISOString().split('T')[0]] = 0; }
      for (const r of readData ?? []) { const date = new Date(r.created_at).toISOString().split('T')[0]; if (date in paceMap) paceMap[date]++; }
      readingPace = Object.entries(paceMap).sort(([a], [b]) => a.localeCompare(b)).map(([date, count]) => ({ date: date.slice(5), count }));
    } catch {}
    try {
      const { data: resWithCat } = await serviceClient.from('resources').select('id, category');
      const { data: userReads } = await serviceClient.from('user_resource_reads').select('resource_id').eq('user_id', user.id);
      const readSet = new Set((userReads ?? []).map((r) => r.resource_id));
      const catMap: Record<string, { total: number; read: number }> = {};
      for (const r of resWithCat ?? []) { const c = r.category || '未分类'; if (!catMap[c]) catMap[c] = { total: 0, read: 0 }; catMap[c].total++; if (readSet.has(r.id)) catMap[c].read++; }
      resourcesByCategory = Object.entries(catMap).map(([name, v]) => ({ name, ...v }));
    } catch {}

    // ── Daily Challenge ──
    let challengeCount = 0, dailyStreak = 0, challengeAvgScore = 0;
    let challengeScoreHistory: { date: string; score: number }[] = [];
    let challengeScoreDist: { range: string; count: number }[] = [];
    let challengeStreakCalendar: { date: string; hasSubmission: boolean }[] = [];
    try {
      const { data: challenges } = await serviceClient.from('daily_challenge_submissions').select('id, score, created_at').eq('user_id', user.id).order('created_at', { ascending: true });
      challengeCount = challenges?.length ?? 0;
      if (challenges && challenges.length > 0) {
        const scores = challenges.map((c) => c.score ?? 0).filter((s) => s > 0);
        challengeAvgScore = scores.length > 0 ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : 0;
        const dates = challenges.map((c) => new Date(c.created_at).toISOString().split('T')[0]);
        const uniqueDates = [...new Set(dates)].sort().reverse();
        let streak = 0;
        for (let i = 0; i < uniqueDates.length; i++) { const expected = new Date(); expected.setDate(expected.getDate() - i); if (uniqueDates[i] === expected.toISOString().split('T')[0]) streak++; else break; }
        dailyStreak = streak;
        challengeScoreHistory = challenges.slice(-20).map((c) => ({ date: new Date(c.created_at).toLocaleDateString('zh-CN', { month: 'numeric', day: 'numeric' }), score: c.score ?? 0 }));
        // Score distribution
        const dist = { '0-20': 0, '21-40': 0, '41-60': 0, '61-80': 0, '81-100': 0 };
        for (const s of scores) { if (s <= 20) dist['0-20']++; else if (s <= 40) dist['21-40']++; else if (s <= 60) dist['41-60']++; else if (s <= 80) dist['61-80']++; else dist['81-100']++; }
        challengeScoreDist = Object.entries(dist).map(([range, count]) => ({ range, count }));
        // 30-day streak calendar
        for (let i = 29; i >= 0; i--) { const d = new Date(); d.setDate(d.getDate() - i); const ds = d.toISOString().split('T')[0]; challengeStreakCalendar.push({ date: ds, hasSubmission: dates.includes(ds) }); }
      }
    } catch {}

    // ── Progress curve ──
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const recentQA = qaRecords.filter((i) => new Date(i.created_at) >= thirtyDaysAgo);
    const dailyActivity: Record<string, { interviews: number; score: number }> = {};
    for (const i of recentQA) {
      const date = new Date(i.created_at).toISOString().split('T')[0];
      if (!dailyActivity[date]) dailyActivity[date] = { interviews: 0, score: 0 };
      dailyActivity[date].interviews++;
      const ev = i.evaluation as Record<string, unknown> | null;
      if (ev) { const s = ev.total_score ?? ev.score ?? ev.overall_score; if (typeof s === 'number') dailyActivity[date].score += s; }
    }
    const progressCurve = Object.entries(dailyActivity).sort(([a], [b]) => a.localeCompare(b)).map(([date, act]) => ({ date, interviews: act.interviews, challenges: 0, totalActivity: act.interviews, avgScore: act.interviews > 0 ? Math.round(act.score / act.interviews) : 0 }));
    const scoreTrend = qaRecords.slice(-15).map((i) => { const ev = i.evaluation as Record<string, unknown> | null; const s = ev ? (ev.total_score ?? ev.score ?? ev.overall_score ?? 0) : 0; return { date: new Date(i.created_at).toLocaleDateString('zh-CN'), score: typeof s === 'number' ? s : 0, type: 'interview' }; });

    const totalLearningMinutes = interviewCount * 15 + completedTaskCount * 10;

    return NextResponse.json({
      totalLearningMinutes, interviewCount, avgScore, challengeCount, skillCoverage,
      totalModules, completedModules: skillModules.filter((m) => m.completed === m.total && m.total > 0).length,
      totalTasks: totalTaskCount, completedTasks: completedTaskCount,
      progressCurve, scoreTrend,
      moduleDetails: {
        coding: { flows: codingFlowCount, recentActivity: codingRecent, dailyActivity: codingDaily, byStage: codingByStage },
        skills: { coverage: skillCoverage, modules: totalModules, tasks: totalTaskCount, completedTasks: completedTaskCount, moduleBreakdown: skillModules, byLevel: skillByLevel, customModules: customModuleCount },
        notebook: { notes: notebookNotes, tasks: notebookTasks, aiAnalysis: notebookAiAnalysis, dailyCreation: notebookDaily, byType: notebookByType },
        simulator: { sessions: simulatorSessions, stagesCompleted: simulatorStagesCompleted, avgScore: simulatorAvgScore, byScenario: simulatorByScenario, scoreDistribution: simulatorScoreDist },
        interview: { qaCount: interviewCount, mockCount, avgScore, sessions: sessionCount, scoreHistory: interviewScoreHistory, byCategory: interviewByCategory, mockScoreDistribution: mockScoreDistribution, methodStats: interviewMethodStats },
        resume: { versions: resumeVersions, matchScore: resumeMatchScore, matchTrend: resumeMatchTrend, jobStats: resumeJobStats },
        resources: { count: resourcesCount, articlesRead, byCategory: resourcesByCategory, readingPace },
        dailyChallenge: { submissions: challengeCount, streak: dailyStreak, avgScore: challengeAvgScore, scoreHistory: challengeScoreHistory, scoreDistribution: challengeScoreDist, streakCalendar: challengeStreakCalendar },
      },
    });
  } catch (err) {
    console.error('Learning dashboard error:', err);
    return NextResponse.json({ error: '获取数据失败' }, { status: 500 });
  }
}
