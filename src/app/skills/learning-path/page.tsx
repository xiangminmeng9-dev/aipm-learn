'use client';

import { useState, useEffect } from 'react';
import { cacheGet, cacheSet, cacheRemove, TTL } from '@/lib/cache';
import GradientBackground from '@/components/ui/gradient-background';

interface SavedPath {
  id: string;
  target_position: string;
  current_level: string;
  time_budget: string;
  jd_text: string;
  path_data: {
    path_title: string;
    estimated_weeks: number;
    stages: {
      stage_name: string;
      duration_weeks: number;
      modules: {
        name: string;
        matched_module_slug: string | null;
        description: string;
        key_tasks: string[];
        priority: string;
      }[];
    }[];
  };
  created_at: string;
  updated_at: string;
}

export default function LearningPathPage() {
  const [targetPosition, setTargetPosition] = useState('');
  const [currentLevel, setCurrentLevel] = useState('初级');
  const [timeBudget, setTimeBudget] = useState('3个月');
  const [jdText, setJdText] = useState('');
  const [selectedPath, setSelectedPath] = useState<SavedPath | null>(null);
  const [dailyPlan, setDailyPlan] = useState<{ dailyTasks: { module: string; task: string; priority: string; description: string }[]; currentStage: string; currentStageIndex: number; totalStages: number; daysSinceStart: number; stageProgress: string; pathTitle: string } | null>(null);
  const [stageTest, setStageTest] = useState<{ questions: { question: string; key_points: string[]; sample_answer: string }[] } | null>(null);
  const [stageAnswers, setStageAnswers] = useState<Record<number, string>>({});
  const [stageEval, setStageEval] = useState<{ scores: { score: number; comment: string }[]; total_score: number; overall_comment: string; passed: boolean } | null>(null);
  const [isGeneratingTest, setIsGeneratingTest] = useState(false);
  const [isEvaluatingTest, setIsEvaluatingTest] = useState(false);

  // Fetch daily plan when a path is selected
  useEffect(() => {
    if (selectedPath) {
      fetch('/api/skills/learning-path/daily-plan')
        .then((r) => r.ok ? r.json() : null)
        .then((data) => {
          if (data?.dailyTasks) setDailyPlan(data);
        })
        .catch(() => {});
    }
  }, [selectedPath]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [path, setPath] = useState<SavedPath['path_data'] | null>(null);
  const [savedPaths, setSavedPaths] = useState<SavedPath[]>([]);
  const [viewingPathId, setViewingPathId] = useState<string | null>(null);

  // 加载已保存的路径
  useEffect(() => {
    // Read from cache for instant display
    const cached = cacheGet<SavedPath[]>('learning-paths');
    if (cached) setSavedPaths(cached);

    fetch('/api/skills/learning-path')
      .then((r) => r.ok ? r.json() : null)
      .then((data) => {
        if (data?.paths) {
          setSavedPaths(data.paths);
          cacheSet('learning-paths', data.paths, TTL.USER_DATA);
        }
      })
      .catch(() => {});
  }, []);

  const handleGenerate = async () => {
    if (!targetPosition.trim() || isGenerating) return;
    setIsGenerating(true);
    try {
      const res = await fetch('/api/skills/learning-path', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ target_position: targetPosition.trim(), current_level: currentLevel, time_budget: timeBudget, jd_text: jdText.trim() }),
      });
      if (res.ok) {
        const data = await res.json();
        setPath(data.path);
        // Invalidate cache after creating a new path
        cacheRemove('learning-paths');
        // 刷新已保存列表
        const listRes = await fetch('/api/skills/learning-path');
        if (listRes.ok) {
          const listData = await listRes.json();
          if (listData?.paths) {
            setSavedPaths(listData.paths);
            cacheSet('learning-paths', listData.paths, TTL.USER_DATA);
          }
        }
      }
    } catch { /* ignore */ } finally { setIsGenerating(false); }
  };

  const handleGenerateStageTest = async () => {
    if (!path?.stages || isGeneratingTest) return;
    const stage = path.stages[dailyPlan?.currentStageIndex ?? 0];
    if (!stage) return;
    setIsGeneratingTest(true);
    try {
      const res = await fetch('/api/skills/learning-path/stage-test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ stage_name: stage.stage_name, modules: stage.modules }),
      });
      if (res.ok) {
        const data = await res.json();
        setStageTest(data);
        setStageAnswers({});
        setStageEval(null);
      }
    } catch { /* ignore */ }
    finally { setIsGeneratingTest(false); }
  };

  const handleEvaluateStageTest = async () => {
    if (!stageTest || isEvaluatingTest) return;
    setIsEvaluatingTest(true);
    try {
      const answers = stageTest.questions.map((q, i) => ({
        question: q.question,
        answer: stageAnswers[i] || '',
        key_points: q.key_points,
      }));
      const res = await fetch('/api/skills/learning-path/stage-test', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ stage_name: dailyPlan?.currentStage ?? '', answers }),
      });
      if (res.ok) {
        const data = await res.json();
        setStageEval(data);
      }
    } catch { /* ignore */ }
    finally { setIsEvaluatingTest(false); }
  };

  const handleViewSaved = (sp: SavedPath) => {
    setPath(sp.path_data);
    setViewingPathId(sp.id);
    setSelectedPath(sp);
    setTargetPosition(sp.target_position);
    setCurrentLevel(sp.current_level);
    setTimeBudget(sp.time_budget);
    setJdText(sp.jd_text || '');
    setStageTest(null);
    setStageEval(null);
    setStageAnswers({});
  };

  const handleDelete = async (id: string) => {
    if (!confirm('确定删除此学习路径？')) return;
    try {
      const res = await fetch(`/api/skills/learning-path?id=${id}`, { method: 'DELETE' });
      if (res.ok) {
        setSavedPaths(prev => prev.filter(p => p.id !== id));
        cacheRemove('learning-paths');
        if (viewingPathId === id) { setPath(null); setViewingPathId(null); }
      }
    } catch { /* ignore */ }
  };

  const priorityColor = (p: string) => p === 'high' ? 'text-rose-600' : p === 'medium' ? 'text-amber-600' : 'text-muted-foreground';

  return (
    <div className="px-6 py-8">
      <GradientBackground />
      <div className="relative z-10">
        <h1 className="text-lg font-bold text-foreground">学习路径规划</h1>
        <p className="mt-1 text-sm text-muted-foreground">AI 根据你的目标岗位生成个性化学习路径，自动关联技能树</p>
      </div>

      {/* 已保存的路径 */}
      {savedPaths.length > 0 && !path && (
        <div className="mt-6 rounded-2xl border border-border bg-card p-5">
          <h2 className="text-sm font-semibold text-foreground mb-3">已保存的规划</h2>
          <div className="space-y-2">
            {savedPaths.map((sp) => (
              <div key={sp.id} className="flex items-center justify-between rounded-xl border border-border bg-muted p-3">
                <button onClick={() => handleViewSaved(sp)} className="flex-1 text-left">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-foreground">{sp.target_position}</span>
                    <span className="rounded-full bg-indigo-100 px-2 py-0.5 text-[10px] font-medium text-indigo-700">
                      {sp.current_level}
                    </span>
                    <span className="text-xs text-muted-foreground">{sp.time_budget}</span>
                    {sp.jd_text && (
                      <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-medium text-emerald-700">
                        含JD
                      </span>
                    )}
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {sp.path_data.path_title} · {sp.path_data.estimated_weeks}周 · {new Date(sp.updated_at).toLocaleDateString('zh-CN')}
                  </p>
                </button>
                <button onClick={() => handleDelete(sp.id)} className="ml-2 rounded-lg px-2 py-1 text-xs text-muted-foreground hover:bg-rose-50 hover:text-rose-500">
                  删除
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {!path ? (
        <div className="mt-6 rounded-2xl border border-border bg-card p-6">
          <div className="space-y-4">
            <div>
              <label className="mb-2 block text-sm font-medium text-foreground">目标岗位</label>
              <input
                value={targetPosition}
                onChange={(e) => setTargetPosition(e.target.value)}
                placeholder="如：字节跳动 AI PM、阿里算法产品经理"
                className="w-full rounded-xl border border-border px-4 py-2.5 text-sm"
              />
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium text-foreground">
                岗位 JD
                <span className="ml-2 text-xs font-normal text-muted-foreground">（选填，填入后 AI 将根据 JD 精准规划）</span>
              </label>
              <textarea
                value={jdText}
                onChange={(e) => setJdText(e.target.value)}
                placeholder="粘贴目标岗位的 JD 内容，AI 会根据 JD 要求精准匹配学习路径..."
                rows={5}
                className="w-full rounded-xl border border-border px-4 py-2.5 text-sm resize-y"
              />
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium text-foreground">当前水平</label>
              <div className="flex gap-2">
                {['初级', '中级', '高级'].map((l) => (
                  <button
                    key={l}
                    onClick={() => setCurrentLevel(l)}
                    className={`rounded-xl px-4 py-2 text-sm ${currentLevel === l ? 'bg-indigo-600 text-white' : 'border border-border text-muted-foreground'}`}
                  >
                    {l}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium text-foreground">时间预算</label>
              <div className="flex gap-2">
                {['1个月', '3个月', '6个月'].map((t) => (
                  <button
                    key={t}
                    onClick={() => setTimeBudget(t)}
                    className={`rounded-xl px-4 py-2 text-sm ${timeBudget === t ? 'bg-indigo-600 text-white' : 'border border-border text-muted-foreground'}`}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>
            <button
              onClick={handleGenerate}
              disabled={isGenerating || !targetPosition.trim()}
              className="w-full rounded-xl bg-indigo-600 py-3 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-50"
            >
              {isGenerating ? 'AI 生成中...' : '生成学习路径'}
            </button>
          </div>
        </div>
      ) : (
        <div className="mt-6 space-y-4">
          <div className="rounded-2xl border border-indigo-200 bg-indigo-50 p-4">
            <h2 className="text-base font-bold text-indigo-800">{path.path_title}</h2>
            <p className="text-sm text-indigo-600">预计 {path.estimated_weeks} 周完成</p>
          </div>

          {path.stages.map((stage, si) => (
            <div key={si} className="rounded-2xl border border-border bg-card p-5">
              <div className="flex items-center gap-3 mb-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-indigo-500 text-sm font-bold text-white">
                  {si + 1}
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-foreground">{stage.stage_name}</h3>
                  <p className="text-xs text-muted-foreground">{stage.duration_weeks} 周</p>
                </div>
              </div>
              <div className="space-y-3">
                {stage.modules.map((mod, mi) => (
                  <div key={mi} className="rounded-xl border border-border bg-muted p-4">
                    <div className="flex items-center gap-2">
                      <h4 className="text-sm font-semibold text-foreground">{mod.name}</h4>
                      <span className={`text-xs ${priorityColor(mod.priority)}`}>
                        {mod.priority === 'high' ? '高优先' : mod.priority === 'medium' ? '中优先' : '低优先'}
                      </span>
                      {mod.matched_module_slug && !mod.matched_module_slug.startsWith('custom-') && (
                        <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-medium text-emerald-700">
                          技能树已有
                        </span>
                      )}
                      {mod.matched_module_slug?.startsWith('custom-') && (
                        <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-medium text-amber-700">
                          已补充到技能树
                        </span>
                      )}
                    </div>
                    <p className="mt-1 text-xs text-muted-foreground">{mod.description}</p>
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {mod.key_tasks.map((task, ti) => (
                        <span key={ti} className="rounded-lg bg-card px-2 py-1 text-xs text-muted-foreground border border-border">
                          {task}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}

          {/* Daily Plan */}
          {dailyPlan && dailyPlan.dailyTasks.length > 0 && (
            <div className="rounded-2xl border border-border bg-card p-5">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-semibold text-foreground">今日学习任务</h3>
                <span className="text-xs text-muted-foreground">{dailyPlan.currentStage} · 第{dailyPlan.daysSinceStart + 1}天</span>
              </div>
              <div className="mb-3 flex items-center gap-2">
                <div className="flex-1 rounded-full bg-secondary h-2">
                  <div className="rounded-full bg-indigo-500 h-2" style={{ width: `${Math.min(100, ((dailyPlan.currentStageIndex + 1) / dailyPlan.totalStages) * 100)}%` }} />
                </div>
                <span className="text-xs text-muted-foreground">{dailyPlan.currentStageIndex + 1}/{dailyPlan.totalStages} 阶段</span>
              </div>
              <div className="space-y-2">
                {dailyPlan.dailyTasks.map((t, i) => (
                  <div key={i} className="flex items-start gap-3 rounded-xl border border-border bg-muted p-3">
                    <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-indigo-100 text-xs font-bold text-indigo-600">{i + 1}</div>
                    <div>
                      <p className="text-sm font-medium text-foreground">{t.task}</p>
                      <p className="text-xs text-muted-foreground">{t.module} · {t.priority === 'high' ? '高优先' : t.priority === 'medium' ? '中优先' : '低优先'}</p>
                    </div>
                  </div>
                ))}
              </div>
              {!stageTest && !stageEval && (
                <button
                  onClick={handleGenerateStageTest}
                  disabled={isGeneratingTest}
                  className="mt-3 w-full rounded-xl border border-indigo-300 bg-indigo-50 py-2.5 text-sm font-medium text-indigo-700 hover:bg-indigo-100 disabled:opacity-50"
                >
                  {isGeneratingTest ? 'AI 出题中...' : `生成"${dailyPlan.currentStage}"阶段自测`}
                </button>
              )}
            </div>
          )}

          {/* Stage Test */}
          {stageTest && !stageEval && (
            <div className="rounded-2xl border border-border bg-card p-5">
              <h3 className="mb-3 text-sm font-semibold text-foreground">阶段自测</h3>
              <div className="space-y-4">
                {stageTest.questions.map((q, i) => (
                  <div key={i} className="rounded-xl border border-border bg-muted p-4">
                    <p className="text-sm font-medium text-foreground">{i + 1}. {q.question}</p>
                    <p className="mt-1 text-xs text-muted-foreground">关键要点：{q.key_points.join('、')}</p>
                    <textarea
                      value={stageAnswers[i] || ''}
                      onChange={(e) => setStageAnswers((prev) => ({ ...prev, [i]: e.target.value }))}
                      placeholder="输入你的回答..."
                      rows={3}
                      className="mt-2 w-full rounded-xl border border-border bg-card px-3 py-2 text-sm text-foreground placeholder-muted-foreground focus:border-indigo-500 focus:outline-none"
                    />
                  </div>
                ))}
              </div>
              <div className="mt-3 flex gap-2">
                <button
                  onClick={() => { setStageTest(null); setStageAnswers({}); }}
                  className="rounded-xl border border-border px-4 py-2.5 text-sm text-muted-foreground hover:bg-muted"
                >
                  取消
                </button>
                <button
                  onClick={handleEvaluateStageTest}
                  disabled={isEvaluatingTest || !Object.values(stageAnswers).some((a) => a.trim())}
                  className="flex-1 rounded-xl bg-indigo-600 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-50"
                >
                  {isEvaluatingTest ? 'AI 评分中...' : '提交自测'}
                </button>
              </div>
            </div>
          )}

          {/* Stage Test Result */}
          {stageEval && (
            <div className="rounded-2xl border border-border bg-card p-5">
              <h3 className="mb-3 text-sm font-semibold text-foreground">自测结果</h3>
              <div className={`rounded-xl border p-4 mb-3 ${stageEval.passed ? 'border-emerald-200 bg-emerald-50' : 'border-rose-200 bg-rose-50'}`}>
                <div className="flex items-center gap-3">
                  <span className="text-3xl font-bold">{stageEval.total_score}</span>
                  <span className="text-sm text-muted-foreground">/ 100 分</span>
                  <span className={`text-sm font-medium ${stageEval.passed ? 'text-emerald-600' : 'text-rose-600'}`}>
                    {stageEval.passed ? '通过' : '未通过'}
                  </span>
                </div>
                {stageEval.overall_comment && <p className="mt-2 text-sm">{stageEval.overall_comment}</p>}
              </div>
              {stageEval.scores?.length > 0 && (
                <div className="space-y-2 mb-3">
                  {stageEval.scores.map((s, i) => (
                    <div key={i} className="flex items-center gap-3">
                      <span className="w-8 text-xs font-medium text-muted-foreground">第{i + 1}题</span>
                      <div className="flex-1 rounded-full bg-secondary h-2">
                        <div className={`rounded-full h-2 ${s.score >= 80 ? 'bg-emerald-500' : s.score >= 60 ? 'bg-amber-500' : 'bg-rose-500'}`} style={{ width: `${s.score}%` }} />
                      </div>
                      <span className="text-xs font-medium text-foreground">{s.score}</span>
                    </div>
                  ))}
                </div>
              )}
              {stageTest?.questions.map((q, i) => (
                <div key={i} className="rounded-xl bg-muted p-3 mb-2">
                  <p className="text-xs font-medium text-foreground">{q.question}</p>
                  <p className="mt-1 text-xs text-muted-foreground">参考答案：{q.sample_answer}</p>
                </div>
              ))}
              <button
                onClick={() => { setStageTest(null); setStageEval(null); setStageAnswers({}); }}
                className="w-full rounded-xl border border-border py-2.5 text-sm text-muted-foreground hover:bg-muted"
              >
                关闭
              </button>
            </div>
          )}

          <button
            onClick={() => { setPath(null); setViewingPathId(null); setJdText(''); }}
            className="w-full rounded-xl border border-border py-3 text-sm font-medium text-muted-foreground hover:bg-muted"
          >
            返回
          </button>
        </div>
      )}
    </div>
  );
}