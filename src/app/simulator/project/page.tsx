'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { PROJECT_SCENARIOS } from '@/lib/project-scenarios';

export default function ProjectSandboxPage() {
  const [existingProjects, setExistingProjects] = useState<any[]>([]);
  const [isCreating, setIsCreating] = useState(false);

  const fetchProjects = useCallback(async () => {
    try {
      const res = await fetch('/api/simulator/project');
      if (res.ok) {
        const data = await res.json();
        setExistingProjects(data.projects || []);
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
        const data = await res.json();
        window.location.href = `/simulator/project/${data.project.id}`;
      }
    } catch { /* ignore */ } finally { setIsCreating(false); }
  };

  const diffColor = (d: string) => d === 'beginner' ? 'text-emerald-600 bg-emerald-50' : d === 'advanced' ? 'text-rose-600 bg-rose-50' : 'text-amber-600 bg-amber-50';
  const diffLabel = (d: string) => d === 'beginner' ? '入门' : d === 'advanced' ? '进阶' : '中级';

  return (
    <div className="mx-auto max-w-3xl px-6 py-8">
      <div className="mb-6 flex items-center gap-4">
        <Link href="/simulator" className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm text-gray-500 hover:bg-gray-100 hover:text-gray-900">
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5 8.25 12l7.5-7.5" />
          </svg>
          返回模拟器
        </Link>
      </div>

      <h1 className="text-lg font-bold text-gray-900">项目实战沙盒</h1>
      <p className="mt-1 text-sm text-gray-500">选择一个虚拟 AI 产品项目，从 0 到 1 完成完整产出，AI 评审团队会逐项审查</p>

      {existingProjects.length > 0 && (
        <div className="mt-6 rounded-2xl border border-gray-200 bg-white p-4">
          <h3 className="text-sm font-semibold text-gray-700 mb-3">进行中的项目</h3>
          <div className="space-y-2">
            {existingProjects.filter(p => p.status === 'in_progress').map((p) => (
              <Link key={p.id} href={`/simulator/project/${p.id}`} className="flex items-center justify-between rounded-xl border border-gray-100 bg-gray-50 p-3 hover:bg-indigo-50">
                <span className="text-sm font-medium text-gray-800">{p.title}</span>
                <span className="text-xs text-gray-500">继续 →</span>
              </Link>
            ))}
          </div>
        </div>
      )}

      <div className="mt-6 space-y-4">
        <h3 className="text-sm font-semibold text-gray-700">选择项目场景</h3>
        {PROJECT_SCENARIOS.map((scenario) => {
          const existing = existingProjects.find(p => p.scenario_id === scenario.id);
          return (
            <div key={scenario.id} className="rounded-2xl border border-gray-200 bg-white p-5">
              <div className="flex items-center gap-3 mb-2">
                <h3 className="text-base font-semibold text-gray-900">{scenario.title}</h3>
                <span className={`rounded-lg px-2 py-0.5 text-xs font-medium ${diffColor(scenario.difficulty)}`}>
                  {diffLabel(scenario.difficulty)}
                </span>
              </div>
              <p className="text-sm text-gray-600">{scenario.description}</p>
              <div className="mt-3 flex flex-wrap gap-2">
                {scenario.deliverables.map((d) => (
                  <span key={d.name} className="rounded-lg bg-gray-100 px-2.5 py-1 text-xs text-gray-600">
                    {d.name}
                  </span>
                ))}
              </div>
              <button
                onClick={() => handleCreate(scenario.id)}
                disabled={isCreating || !!existing}
                className="mt-4 rounded-xl bg-teal-600 px-5 py-2 text-sm font-semibold text-white hover:bg-teal-700 disabled:bg-gray-300 disabled:text-gray-500"
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