'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { SIMULATOR_SCENARIOS, DIFFICULTY_LABELS, SimulatorScenario } from '@/lib/simulator-config';
import StageRoadmap from '@/components/simulator/StageRoadmap';
import { cacheGet, cacheSet, TTL } from '@/lib/cache';

interface StageScore {
  score: number;
  feedback: string;
  completed_at: string;
}

export default function SimulatorPage() {
  const [selectedScenario, setSelectedScenario] = useState<SimulatorScenario | null>(null);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [currentStageId, setCurrentStageId] = useState<string>('');
  const [stageScores, setStageScores] = useState<Record<string, StageScore>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [scenarioProgress, setScenarioProgress] = useState<Record<string, { currentStage: string; scores: Record<string, StageScore> }>>({});
  const router = useRouter();

  // Load scenario progress from DB on mount
  useEffect(() => {
    loadAllProgress();
  }, []);

  const loadAllProgress = async () => {
    try {
      // Load progress for each scenario
      const progressMap: Record<string, { currentStage: string; scores: Record<string, StageScore> }> = {};
      for (const scenario of SIMULATOR_SCENARIOS) {
        try {
          const res = await fetch(`/api/simulator/progress?scenario_id=${scenario.id}`);
          if (res.ok) {
            const data = await res.json();
            if (data.session) {
              progressMap[scenario.id] = {
                currentStage: data.session.current_stage || scenario.stages[0].id,
                scores: data.stageScores || {},
              };
            }
          }
        } catch { /* skip */ }
      }
      setScenarioProgress(progressMap);

      // Also check cache for current session
      const cached = cacheGet<{ scenarioId: string; sessionId: string; currentStageId: string; stageScores: Record<string, StageScore> }>('simulator-workflow-session');
      if (cached) {
        const scenario = SIMULATOR_SCENARIOS.find(s => s.id === cached.scenarioId);
        if (scenario) {
          setSelectedScenario(scenario);
          setSessionId(cached.sessionId);
          setCurrentStageId(cached.currentStageId);
          // Merge: DB scores take precedence, then cache
          const dbScores = progressMap[cached.scenarioId]?.scores || {};
          setStageScores({ ...cached.stageScores, ...dbScores });
        }
      }
    } catch { /* ignore */ }
  };

  const saveCache = (scenarioId: string, sid: string | null, stageId: string, scores: Record<string, StageScore>) => {
    cacheSet('simulator-workflow-session', { scenarioId, sessionId: sid, currentStageId: stageId, stageScores: scores }, TTL.DAILY);
  };

  const handleSelectScenario = async (scenario: SimulatorScenario) => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/simulator/progress', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'start', scenario_id: scenario.id }),
      });

      if (res.ok) {
        const data = await res.json();
        const sid = data.session?.id;
        const currentStage = data.session?.current_stage || scenario.stages[0].id;
        const scores = data.session?.stage_scores || {};

        setSelectedScenario(scenario);
        setSessionId(sid);
        setCurrentStageId(currentStage);
        setStageScores(scores);
        saveCache(scenario.id, sid, currentStage, scores);
      } else {
        // Not logged in, use local mode
        setSelectedScenario(scenario);
        setSessionId(null);
        setCurrentStageId(scenario.stages[0].id);
        setStageScores({});
        saveCache(scenario.id, null, scenario.stages[0].id, {});
      }
    } catch {
      setSelectedScenario(scenario);
      setSessionId(null);
      setCurrentStageId(scenario.stages[0].id);
      setStageScores({});
      saveCache(scenario.id, null, scenario.stages[0].id, {});
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectStage = (stageId: string) => {
    if (!selectedScenario) return;
    const params = new URLSearchParams();
    if (sessionId) params.set('sid', sessionId);
    params.set('scenario', selectedScenario.id);
    router.push(`/simulator/${stageId}?${params.toString()}`);
  };

  const handleBackToScenarios = () => {
    setSelectedScenario(null);
    setSessionId(null);
    setCurrentStageId('');
    setStageScores({});
    cacheSet('simulator-workflow-session', null as unknown as object, 0);
  };

  // Scenario selection screen
  if (!selectedScenario) {
    return (
      <div className="mx-auto max-w-4xl px-6 py-8">
        <div className="mb-6">
          <h1 className="text-lg font-bold text-foreground">工作流程模拟</h1>
          <p className="mt-1 text-sm text-muted-foreground">选择一个项目场景，体验完整的AI PM工作流程</p>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {SIMULATOR_SCENARIOS.map((scenario) => {
            const diff = DIFFICULTY_LABELS[scenario.difficulty];
            const progress = scenarioProgress[scenario.id];
            const completedCount = progress ? Object.keys(progress.scores).length : 0;
            const totalStages = scenario.stages.length;

            return (
              <button
                key={scenario.id}
                onClick={() => handleSelectScenario(scenario)}
                disabled={isLoading}
                className="rounded-2xl border border-border bg-card p-5 text-left transition-all hover:border-teal-300 hover:shadow-sm disabled:opacity-50"
              >
                <div className="mb-3 flex items-center gap-2">
                  <span className="text-2xl">{scenario.icon}</span>
                  <span className={`rounded-lg px-2 py-0.5 text-[10px] font-medium ${diff.color}`}>{diff.label}</span>
                  {completedCount > 0 && (
                    <span className="ml-auto rounded-full bg-teal-100 px-2 py-0.5 text-[10px] font-medium text-teal-700">
                      {completedCount}/{totalStages}
                    </span>
                  )}
                </div>
                <h3 className="text-sm font-semibold text-foreground">{scenario.title}</h3>
                <p className="mt-1 text-xs text-muted-foreground line-clamp-2">{scenario.description}</p>
                <div className="mt-3 flex flex-wrap gap-1">
                  {scenario.tags.map((tag) => (
                    <span key={tag} className="rounded-md bg-secondary px-1.5 py-0.5 text-[10px] text-muted-foreground">{tag}</span>
                  ))}
                </div>
                <div className="mt-3 flex items-center gap-1 text-[10px] text-muted-foreground">
                  <span>{totalStages} 个阶段</span>
                  <span>·</span>
                  {scenario.stages.slice(0, 3).map((s, i) => (
                    <span key={i}>{s.title}{i < 2 ? '→' : ''}</span>
                  ))}
                </div>
                {completedCount > 0 && (
                  <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-secondary">
                    <div
                      className="h-full rounded-full bg-teal-500 transition-all"
                      style={{ width: `${(completedCount / totalStages) * 100}%` }}
                    />
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </div>
    );
  }

  // Stage roadmap screen
  return (
    <div className="mx-auto max-w-3xl px-6 py-8">
      <div className="mb-6">
        <button onClick={handleBackToScenarios} className="mb-3 text-sm text-muted-foreground hover:text-foreground">
          ← 返回场景选择
        </button>
        <div className="flex items-center gap-3">
          <span className="text-3xl">{selectedScenario.icon}</span>
          <div>
            <h1 className="text-lg font-bold text-foreground">{selectedScenario.title}</h1>
            <p className="text-sm text-muted-foreground">{selectedScenario.description}</p>
          </div>
        </div>
      </div>

      <StageRoadmap
        stages={selectedScenario.stages}
        currentStageId={currentStageId}
        stageScores={stageScores}
        onSelectStage={handleSelectStage}
      />
    </div>
  );
}
