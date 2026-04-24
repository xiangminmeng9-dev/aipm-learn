'use client';

import type { SimulatorStageConfig } from '@/lib/simulator-config';

interface StageRoadmapProps {
  stages: SimulatorStageConfig[];
  currentStageId: string;
  stageScores: Record<string, { score: number; feedback: string; completed_at: string }>;
  onSelectStage: (stageId: string) => void;
}

export default function StageRoadmap({ stages, currentStageId, stageScores, onSelectStage }: StageRoadmapProps) {
  const currentIndex = stages.findIndex(s => s.id === currentStageId);

  return (
    <div className="space-y-3">
      {stages.map((stage, index) => {
        const isCompleted = !!stageScores[stage.id];
        const isCurrent = stage.id === currentStageId;
        const isLocked = index > currentIndex && !isCompleted;
        const score = stageScores[stage.id]?.score;

        return (
          <button
            key={stage.id}
            onClick={() => { if (!isLocked) onSelectStage(stage.id); }}
            disabled={isLocked}
            className={`w-full rounded-2xl border p-5 text-left transition-all ${
              isCurrent
                ? 'border-teal-400 bg-teal-50/50 shadow-md shadow-teal-100/50'
                : isCompleted
                  ? 'border-emerald-200 bg-emerald-50/30 hover:shadow-sm'
                  : isLocked
                    ? 'cursor-not-allowed border-gray-200 bg-gray-50 opacity-60'
                    : 'border-gray-200 bg-white hover:shadow-sm'
            }`}
          >
            <div className="flex items-center gap-4">
              <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-lg ${
                isCompleted ? 'bg-emerald-500 text-white' : isCurrent ? 'bg-teal-500 text-white' : 'bg-gray-200 text-gray-400'
              }`}>
                {isCompleted ? '✓' : stage.order}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <h3 className={`text-sm font-semibold ${isCurrent ? 'text-teal-800' : isCompleted ? 'text-emerald-800' : 'text-gray-700'}`}>
                    {stage.title}
                  </h3>
                  {isCurrent && (
                    <span className="rounded-full bg-teal-500 px-2 py-0.5 text-[10px] font-bold text-white animate-pulse">
                      当前
                    </span>
                  )}
                  {isLocked && (
                    <span className="text-xs text-gray-400">🔒</span>
                  )}
                </div>
                <p className="mt-0.5 text-xs text-gray-500 line-clamp-1">{stage.description}</p>
                <div className="mt-1.5 flex items-center gap-3">
                  <span className="text-xs text-gray-400">{stage.npcAvatar} {stage.npcName}（{stage.npcRole}）</span>
                  {score !== undefined && (
                    <span className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${
                      score >= 80 ? 'bg-emerald-100 text-emerald-700' : score >= 60 ? 'bg-amber-100 text-amber-700' : 'bg-rose-100 text-rose-700'
                    }`}>
                      {score} 分
                    </span>
                  )}
                </div>
              </div>
              {!isLocked && (
                <svg className="h-5 w-5 shrink-0 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                </svg>
              )}
            </div>
          </button>
        );
      })}
    </div>
  );
}
