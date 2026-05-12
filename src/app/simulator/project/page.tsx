'use client';

import { useState, useEffect, useCallback } from 'react';
import { PROJECT_SCENARIOS } from '@/lib/project-scenarios';
import { cacheGet, cacheSet, cacheRemove, TTL } from '@/lib/cache';
import GradientBackground from '@/components/ui/gradient-background';

export default function ProjectSandboxPage() {
  const [existingProjects, setExistingProjects] = useState<{ id: string; title: string; scenario_id: string; status: string }[]>([]);
  const [isCreating, setIsCreating] = useState(false);

  const fetchProjects = useCallback(async () => {
    // Read from cache for instant display
    const cached = cacheGet<{ id: string; title: string; scenario_id: string; status: string }[]>('simulator-projects');
    if (cached) setExistingProjects(cached);
    try {
      const res = await fetch('/api/simulator/project');
      if (res.ok) {
        const data = await res.json();
        const projects = data.projects || [];
        setExistingProjects(projects);
        cacheSet('simulator-projects', projects, TTL.USER_DATA);
      }
    } catch { /* ignore */ }
  }, []);

  useEffect(() => { fetchProjects(); }, [fetchProjects]);

  const handleCreate = async (scenarioId: string) => {
    setIsCreating(true);
    try {
      const res = await fetch('/api/simulator/project', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ scenario_id: scenarioId }),
      });
      if (res.ok) {
        // Invalidate cache after creating a new project
        cacheRemove('simulator-projects');
        const data = await res.json();
        window.location.href = `/simulator/project/${data.project.id}`;
      }
    } catch { /* ignore */ } finally { setIsCreating(false); }
  };

  const diffColor = (d: string) => d === 'beginner' ? 'text-emerald-600 bg-emerald-50' : d === 'advanced' ? 'text-rose-600 bg-rose-50' : 'text-amber-600 bg-amber-50';
  const diffLabel = (d: string) => d === 'beginner' ? '入门' : d === 'advanced' ? '进阶' : '中级';

  return (
    <div className="p-6 md:p-8">
      <GradientBackground />
      <h1 className="relative z-10 text-lg font-bold text-foreground">项目实战沙盒</h1>
      <p className="relative z-10 mt-1 text-sm text-muted-foreground">选择一个虚拟 AI 产品项目，从 0 到 1 完成完整产出，AI 评审团队会逐项审查</p>

      {existingProjects.length > 0 && (
        <div className="relative z-10 mt-6 rounded-2xl border border-border bg-card p-4">
          <h3 className="text-sm font-semibold text-foreground mb-3">进行中的项目</h3>
          <div className="space-y-2">
            {existingProjects.filter(p => p.status === 'in_progress').map((p) => (
              <a key={p.id} href={`/simulator/project/${p.id}`} className="flex items-center justify-between rounded-xl border border-border bg-muted p-3 hover:bg-teal-50">
                <span className="text-sm font-medium text-foreground">{p.title}</span>
                <span className="text-xs text-muted-foreground">继续 →</span>
              </a>
            ))}
          </div>
        </div>
      )}

      <div className="relative z-10 mt-6 grid gap-4 lg:grid-cols-2 xl:grid-cols-3">
        {PROJECT_SCENARIOS.map((scenario) => {
          const existing = existingProjects.find(p => p.scenario_id === scenario.id);
          return (
            <div key={scenario.id} className="rounded-2xl border border-border bg-card p-5">
              <div className="flex items-center gap-3 mb-2">
                <h3 className="text-base font-semibold text-foreground">{scenario.title}</h3>
                <span className={`rounded-lg px-2 py-0.5 text-xs font-medium ${diffColor(scenario.difficulty)}`}>
                  {diffLabel(scenario.difficulty)}
                </span>
              </div>
              <p className="text-sm text-muted-foreground">{scenario.description}</p>
              <div className="mt-3 flex flex-wrap gap-2">
                {scenario.deliverables.map((d) => (
                  <span key={d.name} className="rounded-lg bg-secondary px-2.5 py-1 text-xs text-muted-foreground">
                    {d.name}
                  </span>
                ))}
              </div>
              <button
                onClick={() => handleCreate(scenario.id)}
                disabled={isCreating || !!existing}
                className="mt-4 rounded-xl bg-teal-600 px-5 py-2 text-sm font-semibold text-white hover:bg-teal-700 disabled:bg-gray-300 disabled:text-muted-foreground"
              >
                {existing ? '已创建' : isCreating ? '创建中...' : '开始项目'}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}