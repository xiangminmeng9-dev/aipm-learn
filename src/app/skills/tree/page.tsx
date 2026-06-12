'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { cacheGet, cacheSet, TTL } from '@/lib/cache';
import GradientBackground from '@/components/ui/gradient-background';
import SkillModuleCard from '@/components/skills/SkillModuleCard';
import CustomModuleDialog from '@/components/skills/CustomModuleDialog';
import SkillTreeChart from '@/components/skills/SkillTreeChart';
import SkillRadarChart from '@/components/skills/SkillRadarChart';
import KnowledgeGraph from '@/components/skills/KnowledgeGraph';
import CompanySkillGraph from '@/components/skills/CompanySkillGraph';
import { buildSkillGraphData } from '@/components/skills/SkillTreeLayout';
import type { SkillModuleWithProgress } from '@/types';
import { apiFetch } from '@/lib/api/fetch';

const LEVEL_CONFIG: Record<number, { name: string; color: string; bg: string; desc: string }> = {
  1: { name: '基础入门', color: 'text-[#34c759]', bg: 'bg-[#34c759]', desc: '产品经理核心基础，零基础起步' },
  2: { name: '核心能力', color: 'text-[#ff9500]', bg: 'bg-[#ff9500]', desc: 'AI 产品经理必备技能' },
  3: { name: '进阶专项', color: 'text-[#af52de]', bg: 'bg-[#af52de]', desc: '深度专项能力提升' },
  4: { name: '实战综合', color: 'text-[#ff3b30]', bg: 'bg-[#ff3b30]', desc: '综合实战与领导力' },
};

type ModuleWithCustom = SkillModuleWithProgress & { is_custom?: boolean };
type ViewMode = 'tree' | 'cards' | 'graph' | 'kg';

export default function SkillsTreePage() {
  const [modules, setModules] = useState<ModuleWithCustom[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [dialogLevel, setDialogLevel] = useState<number | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>('tree');
  const [interviewAvgScore, setInterviewAvgScore] = useState<number>(0);
  const router = useRouter();

  const fetchModules = () => {
    // Read from cache for instant display
    const cached = cacheGet<ModuleWithCustom[]>('skill-modules');
    if (cached) {
      setModules(cached);
      setIsLoading(false);
    }
    apiFetch('/api/skills/modules')
      .then((r) => r.json())
      .then((data) => {
        const mods = data.modules ?? [];
        setModules(mods);
        cacheSet('skill-modules', mods, TTL.USER_DATA);
      })
      .catch(() => {})
      .finally(() => setIsLoading(false));
  };

  useEffect(() => {
    fetchModules();
    // Fetch interview average score for radar chart
    apiFetch('/api/interview/stats')
      .then((r) => r.ok ? r.json() : null)
      .then((data) => {
        if (data?.averageScore) setInterviewAvgScore(Math.round(data.averageScore));
      })
      .catch(() => {});
  }, []);

  const handleDeleteCustomModule = async (id: string) => {
    if (!confirm('确定删除此自定义模块？所有学习任务将一并删除。')) return;
    try {
      const res = await apiFetch(`/api/skills/custom-modules/${id}`, { method: 'DELETE' });
      if (res.ok) fetchModules();
    } catch {}
  };

  const handleNodeClick = useCallback(
    (moduleId: string, isCustom: boolean) => {
      if (moduleId === '__jd_gaps__') {
        router.push('/skills/jd-gaps');
      } else if (moduleId === '__bookmarked_tech__') {
        router.push('/skills/bookmarked-tech');
      } else {
        router.push(isCustom ? `/skills/custom-module/${moduleId}` : `/skills/module/${moduleId}`);
      }
    },
    [router],
  );

  const graphData = useMemo(() => buildSkillGraphData(modules), [modules]);

  const totalTasks = modules.reduce((sum, m) => sum + m.task_count, 0);
  const totalCompleted = modules.reduce((sum, m) => sum + m.completed_count, 0);
  const overallPct = totalTasks ? Math.round((totalCompleted / totalTasks) * 100) : 0;

  const levels = [1, 2, 3, 4];
  const modulesByLevel = levels.map((level) => ({
    level,
    config: LEVEL_CONFIG[level],
    modules: modules.filter((m) => m.level === level),
  }));

  return (
    <div className="p-8">
      <GradientBackground />
      {/* Header */}
      <div className="relative z-10 mb-6 flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-semibold text-foreground">AI PM 技能树</h1>
          <p className="mt-2 text-base text-muted-foreground">从零基础到 AI 产品经理，循序渐进的学习路径</p>
        </div>
        <div className="flex items-center gap-2">
          {/* View toggle */}
          <div className="flex rounded-lg border border-border bg-card p-0.5">
            <button
              onClick={() => setViewMode('tree')}
              className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
                viewMode === 'tree' ? 'bg-indigo-50 text-indigo-600' : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 12h4m4 0h4" />
              </svg>
              树视图
            </button>
            <button
              onClick={() => setViewMode('cards')}
              className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
                viewMode === 'cards' ? 'bg-indigo-50 text-indigo-600' : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 0 1 6 3.75h2.25A2.25 2.25 0 0 1 10.5 6v2.25a2.25 2.25 0 0 1-2.25 2.25H6a2.25 2.25 0 0 1-2.25-2.25V6ZM3.75 15.75A2.25 2.25 0 0 1 6 13.5h2.25a2.25 2.25 0 0 1 2.25 2.25V18a2.25 2.25 0 0 1-2.25 2.25H6A2.25 2.25 0 0 1 3.75 18v-2.25ZM13.5 6a2.25 2.25 0 0 1 2.25-2.25H18A2.25 2.25 0 0 1 20.25 6v2.25A2.25 2.25 0 0 1 18 10.5h-2.25a2.25 2.25 0 0 1-2.25-2.25V6ZM13.5 15.75a2.25 2.25 0 0 1 2.25-2.25H18a2.25 2.25 0 0 1 2.25 2.25V18A2.25 2.25 0 0 1 18 20.25h-2.25a2.25 2.25 0 0 1-2.25-2.25v-2.25Z" />
              </svg>
              卡片
            </button>
            <button
              onClick={() => setViewMode('graph')}
              className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
                viewMode === 'graph' ? 'bg-indigo-50 text-indigo-600' : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 21 3 16.5m0 0L7.5 12M3 16.5h13.5m0-9L21 3m0 0L16.5 7.5M21 3h-13.5" />
              </svg>
              知识图谱
            </button>
            <button
              onClick={() => setViewMode('kg')}
              className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
                viewMode === 'kg' ? 'bg-indigo-50 text-indigo-600' : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M13.828 10.172a4 4 0 0 0-5.656 0l-4 4a4 4 0 1 0 5.656 5.656l1.102-1.101m-.758-4.899a4 4 0 0 0 5.656 0l4-4a4 4 0 0 0-5.656-5.656l-1.1 1.1" />
              </svg>
              公司图谱
            </button>
          </div>
          {/* Add custom module */}
          <button
            onClick={() => setDialogLevel(1)}
            className="flex items-center gap-1.5 rounded-lg border border-border bg-card px-3 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:border-indigo-300 hover:bg-indigo-50 hover:text-indigo-600"
          >
            <span>+</span>
            添加技能
          </button>
        </div>
      </div>

      {isLoading ? (
        <div className="relative z-10 flex justify-center py-16">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-indigo-500 border-t-transparent" />
        </div>
      ) : (
        <>
          {/* Overall progress + Radar */}
          {modules.length > 0 && (
            <div className="relative z-10 mb-6 grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="rounded-2xl border border-border bg-card p-6">
                <div className="flex items-center justify-between text-base">
                  <span className="text-muted-foreground">
                    整体进度：{totalCompleted}/{totalTasks} 任务完成
                  </span>
                  <span className="font-semibold text-indigo-600">{overallPct}%</span>
                </div>
                <div className="mt-3 h-2 overflow-hidden rounded-full bg-muted">
                  <div className="h-full rounded-full progress-gradient transition-all" style={{ width: `${overallPct}%` }} />
                </div>
              </div>
              <SkillRadarChart modules={modules} interviewAvgScore={interviewAvgScore} />
            </div>
          )}

          {/* Tree view */}
          {viewMode === 'tree' && modules.length > 0 && (
            <div className="relative z-10 rounded-2xl border border-border bg-card p-4">
              <SkillTreeChart data={graphData} onNodeClick={handleNodeClick} onNodeDelete={handleDeleteCustomModule} />
            </div>
          )}

          {/* Card view */}
          {viewMode === 'cards' && (
            <div className="relative z-10 space-y-10">
              {modulesByLevel.map(({ level, config, modules: levelModules }) => (
                <div key={level}>
                  <div className="mb-4 flex items-center gap-3">
                    <div className={`flex h-8 w-8 items-center justify-center rounded-full ${config.bg} text-sm font-bold text-white`}>
                      {level}
                    </div>
                    <div>
                      <h2 className={`text-lg font-semibold ${config.color}`}>{config.name}</h2>
                      <p className="text-sm text-muted-foreground">{config.desc}</p>
                    </div>
                  </div>
                  <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                    {levelModules.map((m) => (
                      <SkillModuleCard
                        key={m.id}
                        module={m}
                        onClick={() => handleNodeClick(m.id, m.is_custom ?? false)}
                        onDelete={m.is_custom && m.id !== '__jd_gaps__' ? () => handleDeleteCustomModule(m.id) : undefined}
                      />
                    ))}
                    <button
                      onClick={() => setDialogLevel(level)}
                      className="flex min-h-[140px] items-center justify-center rounded-2xl border-2 border-dashed border-border bg-transparent p-5 text-muted-foreground transition-all hover:border-indigo-300 hover:bg-indigo-50 hover:text-indigo-600"
                    >
                      <div className="text-center">
                        <span className="block text-2xl">+</span>
                        <span className="block mt-1 text-sm">添加技能</span>
                      </div>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Knowledge graph view */}
          {viewMode === 'graph' && (
            <div className="relative z-10">
              <KnowledgeGraph modules={modules} />
            </div>
          )}

          {/* Company-Skill knowledge graph view */}
          {viewMode === 'kg' && (
            <div className="relative z-10">
              <CompanySkillGraph />
            </div>
          )}
        </>
      )}

      {/* Custom module dialog */}
      {dialogLevel !== null && (
        <CustomModuleDialog
          level={dialogLevel}
          levelName={LEVEL_CONFIG[dialogLevel].name}
          open={true}
          onOpenChange={(open) => { if (!open) setDialogLevel(null); }}
          onModuleCreated={fetchModules}
        />
      )}
    </div>
  );
}
