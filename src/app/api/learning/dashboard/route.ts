import { NextRequest, NextResponse } from 'next/server';
import { createClient, createServiceClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: '请先登录' }, { status: 401 });

    const serviceClient = createServiceClient();

    // Time range support
    const { searchParams } = new URL(request.url);
    const rangeParam = searchParams.get('range') || '7d';
    const rangeDays = rangeParam === '90d' ? 90 : rangeParam === '30d' ? 30 : 7;
    const rangeAgo = new Date();
    rangeAgo.setDate(rangeAgo.getDate() - rangeDays);

    const sevenDaysAgo = rangeAgo;

    // -- Coding (dev_flows) --
    let codingFlowCount = 0, codingRecent = 0;
    let codingDaily: { date: string; count: number }[] = [];
    let codingByStage: { name: string; value: number }[] = [];
    try {
      const { data: devFlows } = await serviceClient
        .from('dev_flows')
        .select('id, created_at, mode_id')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
      codingFlowCount = devFlows?.length ?? 0;
      codingRecent = (devFlows ?? []).filter((f) => new Date(f.created_at) >= sevenDaysAgo).length;
      // 7-day daily
      const dailyMap: Record<string, number> = {};
      for (let i = 6; i >= 0; i--) { const d = new Date(); d.setDate(d.getDate() - i); dailyMap[d.toISOString().split('T')[0]] = 0; }
      for (const f of devFlows ?? []) { const date = new Date(f.created_at).toISOString().split('T')[0]; if (date in dailyMap) dailyMap[date]++; }
      codingDaily = Object.entries(dailyMap).sort(([a], [b]) => a.localeCompare(b)).map(([date, count]) => ({ date: date.slice(5), count }));
      // By mode
      const modeMap: Record<string, number> = {};
      for (const f of devFlows ?? []) { const m = f.mode_id || '未分类'; modeMap[m] = (modeMap[m] || 0) + 1; }
      // Try to resolve mode names
      try {
        const { data: modes } = await serviceClient.from('dev_modes').select('id, name');
        const modeNameMap: Record<string, string> = {};
        for (const m of modes ?? []) modeNameMap[m.id] = m.name;
        codingByStage = Object.entries(modeMap).map(([id, value]) => ({ name: modeNameMap[id] || id.slice(0, 6), value }));
      } catch {
        codingByStage = Object.entries(modeMap).map(([name, value]) => ({ name: name.slice(0, 6), value }));
      }
    } catch {}

    // -- Spec Practice --
    let specPracticeCount = 0, specPracticeAvgScore = 0;
    let specPracticeScoreTrend: { date: string; score: number }[] = [];
    let specPracticeDimensionDist: { dimension: string; avgScore: number }[] = [];
    try {
      const { data: specPractices } = await serviceClient
        .from('spec_practices')
        .select('id, total_score, dimension_scores, created_at')
        .eq('user_id', user.id)
        .order('created_at', { ascending: true });
      specPracticeCount = specPractices?.length ?? 0;
      if (specPractices && specPractices.length > 0) {
        const scores = specPractices.map((s) => s.total_score);
        specPracticeAvgScore = Math.round(scores.reduce((a, b) => a + b, 0) / scores.length);
        // 7-day score trend
        const trendMap: Record<string, { total: number; count: number }> = {};
        for (let i = 6; i >= 0; i--) { const d = new Date(); d.setDate(d.getDate() - i); trendMap[d.toISOString().split('T')[0]] = { total: 0, count: 0 }; }
        for (const s of specPractices) { const date = new Date(s.created_at).toISOString().split('T')[0]; if (date in trendMap) { trendMap[date].total += s.total_score; trendMap[date].count++; } }
        specPracticeScoreTrend = Object.entries(trendMap).sort(([a], [b]) => a.localeCompare(b)).map(([date, v]) => ({ date: date.slice(5), score: v.count > 0 ? Math.round(v.total / v.count) : 0 }));
        // Dimension distribution
        const dimMap: Record<string, { total: number; count: number }> = {};
        for (const s of specPractices) {
          const dims = s.dimension_scores as { dimension: string; score: number }[] | null;
          if (dims && Array.isArray(dims)) {
            for (const d of dims) {
              if (!dimMap[d.dimension]) dimMap[d.dimension] = { total: 0, count: 0 };
              dimMap[d.dimension].total += d.score;
              dimMap[d.dimension].count++;
            }
          }
        }
        specPracticeDimensionDist = Object.entries(dimMap).map(([dimension, v]) => ({ dimension, avgScore: Math.round(v.total / v.count) }));
      }
    } catch {}

    // -- Competitive Analysis --
    let competitiveAnalysisCount = 0, competitiveAnalysisAvgScore = 0;
    let competitiveAnalysisScoreTrend: { date: string; score: number }[] = [];
    try {
      const { data: compAnalyses } = await serviceClient
        .from('competitive_analyses')
        .select('id, total_score, created_at')
        .eq('user_id', user.id)
        .order('created_at', { ascending: true });
      competitiveAnalysisCount = compAnalyses?.length ?? 0;
      if (compAnalyses && compAnalyses.length > 0) {
        const scores = compAnalyses.map((c) => c.total_score);
        competitiveAnalysisAvgScore = Math.round(scores.reduce((a, b) => a + b, 0) / scores.length);
        const trendMap: Record<string, { total: number; count: number }> = {};
        for (let i = 6; i >= 0; i--) { const d = new Date(); d.setDate(d.getDate() - i); trendMap[d.toISOString().split('T')[0]] = { total: 0, count: 0 }; }
        for (const c of compAnalyses) { const date = new Date(c.created_at).toISOString().split('T')[0]; if (date in trendMap) { trendMap[date].total += c.total_score; trendMap[date].count++; } }
        competitiveAnalysisScoreTrend = Object.entries(trendMap).sort(([a], [b]) => a.localeCompare(b)).map(([date, v]) => ({ date: date.slice(5), score: v.count > 0 ? Math.round(v.total / v.count) : 0 }));
      }
    } catch {}

    // -- AI Learning Path --
    let learningPathCount = 0, learningPathTotalModules = 0;
    let learningPathModuleCategoryDist: { category: string; count: number }[] = [];
    try {
      const { data: aiPaths } = await serviceClient
        .from('ai_learning_paths')
        .select('id, recommended_modules, created_at')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
      learningPathCount = aiPaths?.length ?? 0;
      if (aiPaths && aiPaths.length > 0) {
        const priorityMap: Record<string, number> = {};
        for (const p of aiPaths) {
          const mods = p.recommended_modules as { priority: string }[] | null;
          if (mods && Array.isArray(mods)) {
            learningPathTotalModules += mods.length;
            for (const m of mods) {
              const cat = m.priority || 'low';
              priorityMap[cat] = (priorityMap[cat] || 0) + 1;
            }
          }
        }
        learningPathModuleCategoryDist = Object.entries(priorityMap).map(([category, count]) => ({ category, count }));
      }
    } catch {}

    // -- Skills --
    // Two sources: system modules (skill_modules + learning_tasks + learning_progress)
    //              user modules (user_skill_modules + user_module_tasks)
    let totalModules = 0, totalTaskCount = 0, completedTaskCount = 0, skillCoverage = 0;
    let skillModules: { id: string; name: string; level: string; total: number; completed: number }[] = [];
    let skillByLevel: { level: string; total: number; completed: number; custom: number }[] = [];
    let customModuleCount = 0;
    try {
      // System modules
      const { data: sysModules } = await serviceClient.from('skill_modules').select('id, name, level, level_name');
      // System tasks
      const { data: sysTasks } = await serviceClient.from('learning_tasks').select('id, module_id');
      // System progress (learning_progress)
      const { data: sysProgress } = await serviceClient.from('learning_progress').select('id, task_id, status, completed_at').eq('user_id', user.id);

      // User modules
      const { data: userModules } = await serviceClient.from('user_skill_modules').select('id, user_id, name, level, level_name').eq('user_id', user.id);
      // User tasks
      const { data: userTasks } = await serviceClient.from('user_module_tasks').select('id, module_id, status, completed_at');

      customModuleCount = userModules?.length ?? 0;

      // Build module map
      const moduleMap: Record<string, { name: string; level: string; total: number; completed: number; isCustom: boolean }> = {};

      // System modules
      for (const m of sysModules ?? []) {
        const lvl = m.level_name || (m.level ? `L${m.level}` : '未分类');
        moduleMap[m.id] = { name: m.name, level: lvl, total: 0, completed: 0, isCustom: false };
      }
      // User modules
      for (const m of userModules ?? []) {
        const lvl = m.level_name || (m.level ? `L${m.level}` : '自定义');
        moduleMap[m.id] = { name: m.name, level: lvl, total: 0, completed: 0, isCustom: true };
      }

      // Count system tasks per module
      for (const t of sysTasks ?? []) {
        if (moduleMap[t.module_id]) moduleMap[t.module_id].total++;
      }
      // Count user tasks per module
      for (const t of userTasks ?? []) {
        if (moduleMap[t.module_id]) {
          moduleMap[t.module_id].total++;
          if (t.status === 'completed') moduleMap[t.module_id].completed++;
        }
      }
      // Count system progress (completed tasks)
      const sysTaskModuleMap: Record<string, string> = {};
      for (const t of sysTasks ?? []) sysTaskModuleMap[t.id] = t.module_id;
      for (const p of sysProgress ?? []) {
        if (p.status === 'completed') {
          const moduleId = sysTaskModuleMap[p.task_id];
          if (moduleId && moduleMap[moduleId]) moduleMap[moduleId].completed++;
        }
      }

      totalModules = Object.keys(moduleMap).length;
      totalTaskCount = Object.values(moduleMap).reduce((s, m) => s + m.total, 0);
      completedTaskCount = Object.values(moduleMap).reduce((s, m) => s + m.completed, 0);
      const completedModuleIds = Object.entries(moduleMap).filter(([, m]) => m.total > 0 && m.completed === m.total).map(([id]) => id);
      skillCoverage = totalModules > 0 ? Math.round((completedModuleIds.length / totalModules) * 100) : 0;

      skillModules = Object.entries(moduleMap).map(([id, m]) => ({ id, name: m.name, level: m.level, total: m.total, completed: m.completed }));

      // By level aggregation
      const levelMap: Record<string, { total: number; completed: number; custom: number }> = {};
      for (const sm of skillModules) {
        if (!levelMap[sm.level]) levelMap[sm.level] = { total: 0, completed: 0, custom: 0 };
        levelMap[sm.level].total += sm.total;
        levelMap[sm.level].completed += sm.completed;
      }
      // Custom tasks by level
      for (const [, m] of Object.entries(moduleMap)) {
        if (m.isCustom && levelMap[m.level]) {
          levelMap[m.level].custom += m.total;
        }
      }
      skillByLevel = Object.entries(levelMap).map(([level, v]) => ({ level, ...v }));
    } catch {}

    // -- Notebook --
    let notebookNotes = 0, notebookTasks = 0, notebookAiAnalysis = 0;
    let notebookDaily: { date: string; notes: number; tasks: number }[] = [];
    let notebookByType: { name: string; value: number }[] = [];
    try {
      const { count: nCount } = await serviceClient.from('notebook_notes').select('id', { count: 'exact', head: true }).eq('user_id', user.id);
      notebookNotes = nCount ?? 0;
      const { count: tCount } = await serviceClient.from('notebook_tasks').select('id', { count: 'exact', head: true }).eq('user_id', user.id);
      notebookTasks = tCount ?? 0;
      // By category (column is 'category', not 'type')
      try {
        const { data: notesByCat } = await serviceClient.from('notebook_notes').select('category').eq('user_id', user.id);
        const catMap: Record<string, number> = {};
        for (const n of notesByCat ?? []) { const c = n.category || '未分类'; catMap[c] = (catMap[c] || 0) + 1; }
        notebookByType = Object.entries(catMap).map(([name, value]) => ({ name, value }));
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

    // -- Simulator --
    // simulator_sessions has: stage_scores (jsonb), status, scenario_id, current_stage
    let simulatorSessions = 0, simulatorStagesCompleted = 0, simulatorAvgScore = 0;
    let simulatorByScenario: { name: string; count: number; avgScore: number }[] = [];
    let simulatorScoreDist: { range: string; count: number }[] = [];
    try {
      const { data: simSessions } = await serviceClient.from('simulator_sessions').select('id, stage_scores, status, scenario_id, created_at').eq('user_id', user.id);
      simulatorSessions = simSessions?.length ?? 0;
      if (simSessions && simSessions.length > 0) {
        // Extract scores from stage_scores jsonb
        const scores: number[] = [];
        for (const s of simSessions) {
          const ss = s.stage_scores as Record<string, number> | null;
          if (ss && typeof ss === 'object') {
            const vals = Object.values(ss).filter((v) => typeof v === 'number' && v > 0);
            if (vals.length > 0) scores.push(Math.round(vals.reduce((a, b) => a + b, 0) / vals.length));
          }
        }
        simulatorAvgScore = scores.length > 0 ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : 0;
        simulatorStagesCompleted = simSessions.filter((s) => s.status === 'completed').length;
        // By scenario
        const scenarioMap: Record<string, { count: number; totalScore: number }> = {};
        for (const s of simSessions) { const sid = s.scenario_id || '默认场景'; if (!scenarioMap[sid]) scenarioMap[sid] = { count: 0, totalScore: 0 }; scenarioMap[sid].count++; }
        // Match scenario scores
        let idx = 0;
        for (const s of simSessions) {
          const sid = s.scenario_id || '默认场景';
          if (idx < scores.length && scenarioMap[sid]) scenarioMap[sid].totalScore += scores[idx];
          idx++;
        }
        simulatorByScenario = Object.entries(scenarioMap).map(([name, v]) => ({ name: name.length > 8 ? name.slice(0, 8) : name, count: v.count, avgScore: v.count > 0 ? Math.round(v.totalScore / v.count) : 0 }));
        // Score distribution
        const dist = { '0-20': 0, '21-40': 0, '41-60': 0, '61-80': 0, '81-100': 0 };
        for (const s of scores) { if (s <= 20) dist['0-20']++; else if (s <= 40) dist['21-40']++; else if (s <= 60) dist['41-60']++; else if (s <= 80) dist['61-80']++; else dist['81-100']++; }
        simulatorScoreDist = Object.entries(dist).map(([range, count]) => ({ range, count }));
      }
    } catch {}

    // -- Interview --
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
    // Chat sessions count
    try { const { count: sCount } = await serviceClient.from('chat_sessions').select('id', { count: 'exact', head: true }).eq('user_id', user.id); sessionCount = sCount ?? 0; } catch {}
    // Mock score distribution
    try {
      const { data: mockAnswers } = await serviceClient.from('interview_answers').select('score').in('mock_interview_id', (await serviceClient.from('mock_interviews').select('id').eq('user_id', user.id)).data?.map((m) => m.id) ?? []);
      const dist = { '0-20': 0, '21-40': 0, '41-60': 0, '61-80': 0, '81-100': 0 };
      for (const a of mockAnswers ?? []) { if (a.score == null) continue; const s = Number(a.score); if (s <= 20) dist['0-20']++; else if (s <= 40) dist['21-40']++; else if (s <= 60) dist['41-60']++; else if (s <= 80) dist['61-80']++; else dist['81-100']++; }
      mockScoreDistribution = Object.entries(dist).map(([range, count]) => ({ range, count }));
    } catch {}

    // -- Resume --
    let resumeVersions = 0, resumeMatchScore = 0;
    let resumeMatchTrend: { date: string; score: number }[] = [];
    let resumeJobStats: { status: string; count: number }[] = [];
    try {
      // resume_versions has no match_score, just count versions
      const { data: resumeData } = await serviceClient.from('resume_versions').select('id, created_at').eq('user_id', user.id).order('created_at', { ascending: true });
      resumeVersions = resumeData?.length ?? 0;
    } catch {}
    try {
      // resume_jobs has no status column, it's a cached RSS listing
      const { count: jobCount } = await serviceClient.from('resume_jobs').select('id', { count: 'exact', head: true });
      resumeJobStats = jobCount ? [{ status: '已缓存', count: jobCount }] : [];
    } catch {}

    // -- Resources --
    let resourcesCount = 0, articlesRead = 0;
    let resourcesByCategory: { name: string; total: number; read: number }[] = [];
    let readingPace: { date: string; count: number }[] = [];
    try {
      const { count: rCount } = await serviceClient.from('external_resources').select('id', { count: 'exact', head: true });
      resourcesCount = rCount ?? 0;
    } catch {}
    try {
      const { data: readData } = await serviceClient.from('user_task_resources').select('id, created_at, resource_id').eq('user_id', user.id);
      articlesRead = readData?.length ?? 0;
      // Reading pace (7-day)
      const paceMap: Record<string, number> = {};
      for (let i = 6; i >= 0; i--) { const d = new Date(); d.setDate(d.getDate() - i); paceMap[d.toISOString().split('T')[0]] = 0; }
      for (const r of readData ?? []) { const date = new Date(r.created_at).toISOString().split('T')[0]; if (date in paceMap) paceMap[date]++; }
      readingPace = Object.entries(paceMap).sort(([a], [b]) => a.localeCompare(b)).map(([date, count]) => ({ date: date.slice(5), count }));
    } catch {}
    try {
      const { data: resWithCat } = await serviceClient.from('external_resources').select('id, category');
      const { data: userReads } = await serviceClient.from('user_task_resources').select('resource_id').eq('user_id', user.id);
      const readSet = new Set((userReads ?? []).map((r) => r.resource_id));
      const catMap: Record<string, { total: number; read: number }> = {};
      for (const r of resWithCat ?? []) { const c = (r as Record<string, unknown>).category as string || '未分类'; if (!catMap[c]) catMap[c] = { total: 0, read: 0 }; catMap[c].total++; if (readSet.has(r.id)) catMap[c].read++; }
      resourcesByCategory = Object.entries(catMap).map(([name, v]) => ({ name, ...v }));
    } catch {}

    // -- Daily Challenge --
    let challengeCount = 0, dailyStreak = 0, challengeAvgScore = 0;
    let challengeScoreHistory: { date: string; score: number }[] = [];
    let challengeScoreDist: { range: string; count: number }[] = [];
    let challengeStreakCalendar: { date: string; hasSubmission: boolean }[] = [];
    try {
      // Column is submitted_at, not created_at
      const { data: challenges } = await serviceClient.from('daily_challenge_submissions').select('id, score, submitted_at').eq('user_id', user.id).order('submitted_at', { ascending: true });
      challengeCount = challenges?.length ?? 0;
      if (challenges && challenges.length > 0) {
        const scores = challenges.map((c) => c.score ?? 0).filter((s) => s > 0);
        challengeAvgScore = scores.length > 0 ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : 0;
        const dates = challenges.map((c) => new Date(c.submitted_at).toISOString().split('T')[0]);
        const uniqueDates = [...new Set(dates)].sort().reverse();
        let streak = 0;
        for (let i = 0; i < uniqueDates.length; i++) { const expected = new Date(); expected.setDate(expected.getDate() - i); if (uniqueDates[i] === expected.toISOString().split('T')[0]) streak++; else break; }
        dailyStreak = streak;
        challengeScoreHistory = challenges.slice(-20).map((c) => ({ date: new Date(c.submitted_at).toLocaleDateString('zh-CN', { month: 'numeric', day: 'numeric' }), score: c.score ?? 0 }));
        // Score distribution
        const dist = { '0-20': 0, '21-40': 0, '41-60': 0, '61-80': 0, '81-100': 0 };
        for (const s of scores) { if (s <= 20) dist['0-20']++; else if (s <= 40) dist['21-40']++; else if (s <= 60) dist['41-60']++; else if (s <= 80) dist['61-80']++; else dist['81-100']++; }
        challengeScoreDist = Object.entries(dist).map(([range, count]) => ({ range, count }));
        // 30-day streak calendar
        for (let i = 29; i >= 0; i--) { const d = new Date(); d.setDate(d.getDate() - i); const ds = d.toISOString().split('T')[0]; challengeStreakCalendar.push({ date: ds, hasSubmission: dates.includes(ds) }); }
      }
    } catch {}

    // -- Progress curve --
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

    // -- AI Usage Analytics --
    let aiUsageByModule: Record<string, { calls: number; inputTokens: number; outputTokens: number }> = {};
    let aiUsageDaily: { date: string; calls: number; tokens: number }[] = [];
    let totalAiCalls = 0, totalTokens = 0;
    try {
      const { data: aiLogs } = await serviceClient
        .from('user_activity_logs')
        .select('module, input_tokens, output_tokens, created_at')
        .eq('user_id', user.id)
        .eq('action', 'ai_call')
        .gte('created_at', rangeAgo.toISOString())
        .order('created_at', { ascending: true });
      if (aiLogs && aiLogs.length > 0) {
        const moduleMap: Record<string, { calls: number; inputTokens: number; outputTokens: number }> = {};
        const dailyMap: Record<string, { calls: number; tokens: number }> = {};
        // Initialize daily map
        for (let i = rangeDays - 1; i >= 0; i--) {
          const d = new Date(); d.setDate(d.getDate() - i);
          dailyMap[d.toISOString().split('T')[0]] = { calls: 0, tokens: 0 };
        }
        for (const log of aiLogs) {
          const mod = log.module || 'other';
          if (!moduleMap[mod]) moduleMap[mod] = { calls: 0, inputTokens: 0, outputTokens: 0 };
          moduleMap[mod].calls++;
          moduleMap[mod].inputTokens += log.input_tokens || 0;
          moduleMap[mod].outputTokens += log.output_tokens || 0;
          const date = new Date(log.created_at).toISOString().split('T')[0];
          if (date in dailyMap) {
            dailyMap[date].calls++;
            dailyMap[date].tokens += (log.input_tokens || 0) + (log.output_tokens || 0);
          }
        }
        aiUsageByModule = moduleMap;
        totalAiCalls = aiLogs.length;
        totalTokens = aiLogs.reduce((s, l) => s + (l.input_tokens || 0) + (l.output_tokens || 0), 0);
        aiUsageDaily = Object.entries(dailyMap).sort(([a], [b]) => a.localeCompare(b)).map(([date, v]) => ({ date: date.slice(5), ...v }));
      }
    } catch {}

    // -- Real Learning Duration --
    let durationDaily: { date: string; minutes: number; byModule: Record<string, number> }[] = [];
    let totalDurationMinutes = 0, avgDailyMinutes = 0;
    try {
      const { data: durationLogs } = await serviceClient
        .from('user_activity_logs')
        .select('module, duration_seconds, created_at')
        .eq('user_id', user.id)
        .eq('action', 'page_view')
        .gte('created_at', rangeAgo.toISOString())
        .order('created_at', { ascending: true });
      if (durationLogs && durationLogs.length > 0) {
        const dailyMap: Record<string, { seconds: number; byModule: Record<string, number> }> = {};
        for (let i = rangeDays - 1; i >= 0; i--) {
          const d = new Date(); d.setDate(d.getDate() - i);
          dailyMap[d.toISOString().split('T')[0]] = { seconds: 0, byModule: {} };
        }
        for (const log of durationLogs) {
          const date = new Date(log.created_at).toISOString().split('T')[0];
          if (date in dailyMap) {
            const secs = log.duration_seconds || 0;
            dailyMap[date].seconds += secs;
            const mod = log.module || 'other';
            dailyMap[date].byModule[mod] = (dailyMap[date].byModule[mod] || 0) + secs;
          }
        }
        durationDaily = Object.entries(dailyMap).sort(([a], [b]) => a.localeCompare(b)).map(([date, v]) => ({
          date: date.slice(5),
          minutes: Math.round(v.seconds / 60),
          byModule: Object.fromEntries(Object.entries(v.byModule).map(([m, s]) => [m, Math.round(s / 60)])),
        }));
        totalDurationMinutes = Math.round(durationLogs.reduce((s, l) => s + (l.duration_seconds || 0), 0) / 60);
        avgDailyMinutes = durationDaily.length > 0 ? Math.round(totalDurationMinutes / durationDaily.filter((d) => d.minutes > 0).length) : 0;
      }
    } catch {}

    // -- Skill Growth Over Time --
    let skillGrowthCurve: { date: string; coverage: number; tasksCompleted: number }[] = [];
    try {
      const { data: progressData } = await serviceClient
        .from('learning_progress')
        .select('completed_at, status')
        .eq('user_id', user.id)
        .eq('status', 'completed')
        .gte('completed_at', rangeAgo.toISOString())
        .order('completed_at', { ascending: true });
      if (progressData && progressData.length > 0) {
        let cumulative = 0;
        const map: Record<string, number> = {};
        for (const p of progressData) {
          const date = new Date(p.completed_at).toISOString().split('T')[0];
          cumulative++;
          map[date] = cumulative;
        }
        const baseCompleted = completedTaskCount - cumulative;
        skillGrowthCurve = Object.entries(map).sort(([a], [b]) => a.localeCompare(b)).map(([date, tasks]) => ({
          date: date.slice(5),
          coverage: totalTaskCount > 0 ? Math.round(((baseCompleted + tasks) / totalTaskCount) * 100) : 0,
          tasksCompleted: baseCompleted + tasks,
        }));
      }
    } catch {}

    // -- User Goals --
    let userGoals = { dailyMinutesTarget: 30, weeklySessionsTarget: 5, monthlyScoreTarget: 75 };
    try {
      const { data: goals } = await serviceClient
        .from('user_daily_goals')
        .select('daily_minutes_target, weekly_sessions_target, monthly_score_target')
        .eq('user_id', user.id)
        .maybeSingle();
      if (goals) userGoals = { dailyMinutesTarget: goals.daily_minutes_target, weeklySessionsTarget: goals.weekly_sessions_target, monthlyScoreTarget: goals.monthly_score_target };
    } catch {}

    // Calculate goal progress
    const todayStr = new Date().toISOString().split('T')[0];
    const todayDuration = durationDaily.find((d) => {
      const fullDate = new Date();
      fullDate.setDate(fullDate.getDate() - (rangeDays - 1 - durationDaily.indexOf(d)));
      return fullDate.toISOString().split('T')[0] === todayStr;
    })?.minutes || 0;

    const weekStart = new Date();
    weekStart.setDate(weekStart.getDate() - weekStart.getDay());
    let weeklySessions = 0;
    try {
      const { count: wCount } = await serviceClient
        .from('assistant_qa_records')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .gte('created_at', weekStart.toISOString());
      weeklySessions = wCount ?? 0;
    } catch {}

    return NextResponse.json({
      totalLearningMinutes: totalDurationMinutes || totalLearningMinutes, interviewCount, avgScore, challengeCount, skillCoverage,
      totalModules, completedModules: skillModules.filter((m) => m.completed === m.total && m.total > 0).length,
      totalTasks: totalTaskCount, completedTasks: completedTaskCount,
      progressCurve, scoreTrend,
      moduleDetails: {
        coding: { flows: codingFlowCount, recentActivity: codingRecent, dailyActivity: codingDaily, byStage: codingByStage, specPracticeCount, specPracticeAvgScore, specPracticeScoreTrend, specPracticeDimensionDist },
        skills: { coverage: skillCoverage, modules: totalModules, tasks: totalTaskCount, completedTasks: completedTaskCount, moduleBreakdown: skillModules, byLevel: skillByLevel, customModules: customModuleCount, learningPathCount, learningPathTotalModules, learningPathModuleCategoryDist },
        notebook: { notes: notebookNotes, tasks: notebookTasks, aiAnalysis: notebookAiAnalysis, dailyCreation: notebookDaily, byType: notebookByType },
        simulator: { sessions: simulatorSessions, stagesCompleted: simulatorStagesCompleted, avgScore: simulatorAvgScore, byScenario: simulatorByScenario, scoreDistribution: simulatorScoreDist },
        interview: { qaCount: interviewCount, mockCount, avgScore, sessions: sessionCount, scoreHistory: interviewScoreHistory, byCategory: interviewByCategory, mockScoreDistribution: mockScoreDistribution, methodStats: interviewMethodStats, competitiveAnalysisCount, competitiveAnalysisAvgScore, competitiveAnalysisScoreTrend },
        resume: { versions: resumeVersions, matchScore: resumeMatchScore, matchTrend: resumeMatchTrend, jobStats: resumeJobStats },
        resources: { count: resourcesCount, articlesRead, byCategory: resourcesByCategory, readingPace },
        dailyChallenge: { submissions: challengeCount, streak: dailyStreak, avgScore: challengeAvgScore, scoreHistory: challengeScoreHistory, scoreDistribution: challengeScoreDist, streakCalendar: challengeStreakCalendar },
      },
      aiUsage: { byModule: aiUsageByModule, daily: aiUsageDaily, totalCalls: totalAiCalls, totalTokens },
      duration: { daily: durationDaily, total: totalDurationMinutes, average: avgDailyMinutes },
      skillGrowth: { curve: skillGrowthCurve, currentCoverage: skillCoverage },
      goals: {
        ...userGoals,
        dailyProgress: todayDuration,
        weeklyProgress: weeklySessions,
        monthlyProgress: avgScore,
      },
    });
  } catch (err) {
    console.error('Learning dashboard error:', err);
    return NextResponse.json({ error: '获取数据失败' }, { status: 500 });
  }
}
