'use client';

import { useState } from 'react';

export default function LearningPathPage() {
  const [targetPosition, setTargetPosition] = useState('');
  const [currentLevel, setCurrentLevel] = useState('初级');
  const [timeBudget, setTimeBudget] = useState('3个月');
  const [isGenerating, setIsGenerating] = useState(false);
  const [path, setPath] = useState<{
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
  } | null>(null);
  const [progressMap, setProgressMap] = useState<Record<string, string>>({});

  const handleGenerate = async () => {
    if (!targetPosition.trim() || isGenerating) return;
    setIsGenerating(true);
    try {
      const res = await fetch('/api/skills/learning-path', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ target_position: targetPosition.trim(), current_level: currentLevel, time_budget: timeBudget }),
      });
      if (res.ok) {
        const data = await res.json();
        setPath(data.path);
        setProgressMap(data.progressMap || {});
      }
    } catch { /* ignore */ } finally { setIsGenerating(false); }
  };

  const priorityColor = (p: string) => p === 'high' ? 'text-rose-600' : p === 'medium' ? 'text-amber-600' : 'text-gray-500';

  return (
    <div className="mx-auto max-w-3xl px-6 py-8">
      <h1 className="text-lg font-bold text-gray-900">学习路径规划</h1>
      <p className="mt-1 text-sm text-gray-500">AI 根据你的目标岗位生成个性化学习路径，自动关联技能树</p>

      {!path ? (
        <div className="mt-6 rounded-2xl border border-gray-200 bg-white p-6">
          <div className="space-y-4">
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">目标岗位</label>
              <input
                value={targetPosition}
                onChange={(e) => setTargetPosition(e.target.value)}
                placeholder="如：字节跳动 AI PM、阿里算法产品经理"
                className="w-full rounded-xl border border-gray-300 px-4 py-2.5 text-sm"
              />
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">当前水平</label>
              <div className="flex gap-2">
                {['初级', '中级', '高级'].map((l) => (
                  <button
                    key={l}
                    onClick={() => setCurrentLevel(l)}
                    className={`rounded-xl px-4 py-2 text-sm ${currentLevel === l ? 'bg-indigo-600 text-white' : 'border border-gray-300 text-gray-600'}`}
                  >
                    {l}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">时间预算</label>
              <div className="flex gap-2">
                {['1个月', '3个月', '6个月'].map((t) => (
                  <button
                    key={t}
                    onClick={() => setTimeBudget(t)}
                    className={`rounded-xl px-4 py-2 text-sm ${timeBudget === t ? 'bg-indigo-600 text-white' : 'border border-gray-300 text-gray-600'}`}
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
            <div key={si} className="rounded-2xl border border-gray-200 bg-white p-5">
              <div className="flex items-center gap-3 mb-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-indigo-500 text-sm font-bold text-white">
                  {si + 1}
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-gray-900">{stage.stage_name}</h3>
                  <p className="text-xs text-gray-500">{stage.duration_weeks} 周</p>
                </div>
              </div>
              <div className="space-y-3">
                {stage.modules.map((mod, mi) => (
                  <div key={mi} className="rounded-xl border border-gray-100 bg-gray-50 p-4">
                    <div className="flex items-center gap-2">
                      <h4 className="text-sm font-semibold text-gray-800">{mod.name}</h4>
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
                    <p className="mt-1 text-xs text-gray-600">{mod.description}</p>
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {mod.key_tasks.map((task, ti) => (
                        <span key={ti} className="rounded-lg bg-white px-2 py-1 text-xs text-gray-500 border border-gray-200">
                          {task}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}

          <button
            onClick={() => { setPath(null); setTargetPosition(''); }}
            className="w-full rounded-xl border border-gray-300 py-3 text-sm font-medium text-gray-600 hover:bg-gray-50"
          >
            重新规划
          </button>
        </div>
      )}
    </div>
  );
}