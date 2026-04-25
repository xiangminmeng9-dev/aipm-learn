'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { STAGES_CONFIG } from '@/lib/simulator-config';
import StageRoadmap from '@/components/simulator/StageRoadmap';
import StageDetail from '@/components/simulator/StageDetail';
import type { SimulatorSession } from '@/types';

export default function SimulatorPage() {
  const [session, setSession] = useState<SimulatorSession | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedStageId, setSelectedStageId] = useState<string | null>(null);
  const router = useRouter();

  const fetchProgress = useCallback(async () => {
    try {
      const res = await fetch('/api/simulator/progress');
      if (res.ok) {
        const data = await res.json();
        setSession(data.session);
      }
    } catch { /* ignore */ } finally { setIsLoading(false); }
  }, []);

  useEffect(() => { fetchProgress(); }, [fetchProgress]);

  const handleStart = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/simulator/progress', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'start' }),
      });
      if (res.ok) {
        const data = await res.json();
        setSession(data.session);
      }
    } catch { /* ignore */ } finally { setIsLoading(false); }
  };

  const handleSelectStage = (stageId: string) => {
    setSelectedStageId(stageId);
  };

  const handleEnterStage = (stageId: string) => {
    if (!session) return;
    router.push(`/simulator/${stageId}?sid=${session.id}`);
  };

  const selectedStage = STAGES_CONFIG.find(s => s.id === selectedStageId);
  const stageScores = (session?.stage_scores || {}) as Record<string, { score: number; feedback: string; completed_at: string }>;

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#F8F9FB]">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-teal-500 border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8F9FB]">
      {/* Header with back button */}
      <header className="sticky top-0 z-40 border-b border-gray-200 bg-white/80 backdrop-blur">
        <div className="flex items-center justify-between px-8 py-4 md:px-12">
          <div className="flex items-center gap-4">
            <Link
              href="/"
              className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-900"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5 8.25 12l7.5-7.5" />
              </svg>
              返回首页
            </Link>
            <span className="text-gray-300">|</span>
            <div>
              <h1 className="text-lg font-bold text-gray-900">AI PM 模拟工作流程</h1>
              <p className="text-xs text-gray-500">沉浸式体验大厂 AI 产品经理的日常</p>
            </div>
          </div>
          {session && (
            <div className="flex items-center gap-2">
              <span className="rounded-full bg-teal-50 px-3 py-1 text-xs font-medium text-teal-700">
                进度 {Object.keys((session.stage_scores || {}) as Record<string, unknown>).length}/{STAGES_CONFIG.length}
              </span>
            </div>
          )}
        </div>
      </header>

      {/* Content */}
      <div className="px-8 py-8 md:px-12">

        {!session ? (
          <div className="mx-auto max-w-2xl rounded-2xl border-2 border-dashed border-teal-300 bg-white p-12 text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-teal-100 text-3xl">
              🚀
            </div>
            <h2 className="text-lg font-semibold text-gray-800">准备好开始你的 AI PM 之旅了吗？</h2>
            <p className="mt-2 text-sm text-gray-500">你将依次经历 {STAGES_CONFIG.length} 个核心阶段，与不同角色的 AI 互动，完成实战挑战。</p>
            <button
              onClick={handleStart}
              className="mt-6 rounded-xl bg-teal-600 px-8 py-3 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-teal-700"
            >
              开始模拟
            </button>
          </div>
        ) : (
          <div className="grid gap-6 lg:grid-cols-5">
            <div className="lg:col-span-3">
              <StageRoadmap
                stages={STAGES_CONFIG}
                currentStageId={session.current_stage_id}
                stageScores={stageScores}
                onSelectStage={handleSelectStage}
              />
            </div>
            <div className="lg:col-span-2">
              {selectedStage ? (
                <div className="sticky top-28 space-y-4">
                  <StageDetail stage={selectedStage} />
                  <button
                    onClick={() => handleEnterStage(selectedStage.id)}
                    disabled={!!stageScores[selectedStage.id]}
                    className="w-full rounded-xl bg-teal-600 py-3 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-teal-700 disabled:bg-gray-300 disabled:text-gray-500"
                  >
                    {stageScores[selectedStage.id] ? '已完成' : '进入挑战'}
                  </button>
                </div>
              ) : (
                <div className="rounded-2xl border border-gray-200 bg-white p-8 text-center text-sm text-gray-400">
                  点击左侧阶段查看详情
                </div>
              )}
            </div>
          </div>
        )}

        {session?.status === 'completed' && (
          <div className="mt-8 rounded-2xl border border-emerald-200 bg-emerald-50 p-6 text-center">
            <div className="text-3xl">🎉</div>
            <h2 className="mt-2 text-lg font-bold text-emerald-800">恭喜完成全部模拟！</h2>
            <div className="mt-4 flex flex-wrap justify-center gap-3">
              {STAGES_CONFIG.map(stage => {
                const scoreData = stageScores[stage.id];
                return scoreData ? (
                  <div key={stage.id} className="rounded-xl border border-emerald-200 bg-white px-4 py-2">
                    <div className="text-xs text-gray-500">{stage.title.split('：')[1] || stage.title}</div>
                    <div className="text-lg font-bold text-emerald-600">{scoreData.score}</div>
                  </div>
                ) : null;
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
