'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { SIMULATOR_SCENARIOS, SimulatorStageConfig, findStageByStageId } from '@/lib/simulator-config';
import InteractiveChat from '@/components/simulator/InteractiveChat';
import StageDetail from '@/components/simulator/StageDetail';
import { cacheGet, cacheSet, TTL } from '@/lib/cache';

interface StageScore {
  score: number;
  feedback: string;
  completed_at: string;
}

function StagePageContent({ params }: { params: Promise<{ stageId: string }> }) {
  const [stageId, setStageId] = useState<string>('');
  const [scenarioId, setScenarioId] = useState<string>('');
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [stage, setStage] = useState<SimulatorStageConfig | null>(null);
  const [allStages, setAllStages] = useState<SimulatorStageConfig[]>([]);
  const [stageScores, setStageScores] = useState<Record<string, StageScore>>({});
  const [savedMessages, setSavedMessages] = useState<{ role: string; content: string }[]>([]);
  const [isStarted, setIsStarted] = useState(false);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const searchParams = useSearchParams();
  const router = useRouter();

  useEffect(() => {
    params.then(p => setStageId(p.stageId));
  }, [params]);

  useEffect(() => {
    if (!stageId) return;
    const sid = searchParams.get('sid');
    const scenId = searchParams.get('scenario');

    if (sid) setSessionId(sid);
    if (scenId) setScenarioId(scenId);

    // Find stage config from scenario
    if (scenId) {
      const scenario = SIMULATOR_SCENARIOS.find(s => s.id === scenId);
      if (scenario) {
        const found = scenario.stages.find(s => s.id === stageId);
        if (found) {
          setStage(found);
          setAllStages(scenario.stages);
        }
      }
    } else {
      const result = findStageByStageId(stageId);
      if (result) {
        setStage(result.stage);
        setAllStages(result.scenario.stages);
        setScenarioId(result.scenario.id);
      }
    }

    // Restore scores from cache
    const cached = cacheGet<{ stageScores: Record<string, StageScore> }>('simulator-workflow-session');
    if (cached?.stageScores) {
      setStageScores(cached.stageScores);
    }
  }, [stageId, searchParams]);

  // Load saved messages from DB
  const loadHistory = async (sid: string | null, stgId: string): Promise<{ role: string; content: string }[]> => {
    if (!sid) return [];
    try {
      const res = await fetch(`/api/simulator/messages?session_id=${sid}&stage_id=${stgId}`);
      if (res.ok) {
        const data = await res.json();
        if (data.messages && data.messages.length > 0) {
          return data.messages
            .filter((m: { role: string }) => m.role === 'user' || m.role === 'assistant')
            .map((m: { role: string; content: string }) => ({ role: m.role, content: m.content }));
        }
      }
    } catch { /* ignore */ }
    return [];
  };

  const handleStartChat = async () => {
    setIsLoadingHistory(true);
    const history = await loadHistory(sessionId, stageId);
    setSavedMessages(history);
    setIsLoadingHistory(false);
    setIsStarted(true);
  };

  const handleEvaluationComplete = (result: { score: number; feedback: string }) => {
    const newScores = {
      ...stageScores,
      [stageId]: { score: result.score, feedback: result.feedback, completed_at: new Date().toISOString() },
    };
    setStageScores(newScores);

    // Update cache
    const cached = cacheGet<{ scenarioId: string; sessionId: string; currentStageId: string; stageScores: Record<string, StageScore> }>('simulator-workflow-session');
    if (cached) {
      const currentIdx = allStages.findIndex(s => s.id === stageId);
      const nextStageId = currentIdx < allStages.length - 1 ? allStages[currentIdx + 1].id : stageId;
      cacheSet('simulator-workflow-session', {
        ...cached,
        currentStageId: nextStageId,
        stageScores: newScores,
      }, TTL.DAILY);
    }
  };

  const handleBackToRoadmap = () => {
    const params = new URLSearchParams();
    if (scenarioId) params.set('scenario', scenarioId);
    router.push(`/simulator?${params.toString()}`);
  };

  if (!stage) {
    return (
      <div className="flex items-center justify-center py-20">
        <p className="text-muted-foreground">加载中...</p>
      </div>
    );
  }

  if (!isStarted) {
    return (
      <div className="px-6 py-8">
        <button onClick={handleBackToRoadmap} className="mb-4 text-sm text-muted-foreground hover:text-foreground">
          ← 返回路线图
        </button>
        <StageDetail
          stage={stage}
          stageScores={stageScores}
          onStart={handleStartChat}
        />
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="flex items-center gap-3 border-b border-border px-6 py-3">
        <button onClick={handleBackToRoadmap} className="text-muted-foreground hover:text-foreground">
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
          </svg>
        </button>
        <span className="text-xl">{stage.npcAvatar}</span>
        <div>
          <div className="text-sm font-semibold text-foreground">{stage.title}</div>
          <div className="text-xs text-muted-foreground">{stage.npcName} · {stage.npcRole}</div>
        </div>
      </div>

      {/* Chat */}
      <div className="flex-1 overflow-hidden">
        <InteractiveChat
          stage={stage}
          sessionId={sessionId}
          scenarioId={scenarioId}
          savedMessages={savedMessages}
          isLoadingHistory={isLoadingHistory}
          onEvaluationComplete={handleEvaluationComplete}
        />
      </div>
    </div>
  );
}

export default function StagePage({ params }: { params: Promise<{ stageId: string }> }) {
  return (
    <Suspense fallback={<div className="flex items-center justify-center py-20"><p className="text-muted-foreground">加载中...</p></div>}>
      <StagePageContent params={params} />
    </Suspense>
  );
}
