'use client';

import type { SimulatorStageConfig } from '@/lib/simulator-config';

interface StageRoadmapProps {
  stages: SimulatorStageConfig[];
  currentStageId: string;
  stageScores: Record<string, { score: number; feedback: string; completed_at: string }>;
  onSelectStage: (stageId: string) => void;
}

export default function StageRoadmap({ stages, currentStageId, stageScores, onSelectStage }: StageRoadmapProps) {
  return (
    <div className="space-y-3">
      {stages.map((stage, idx) => {
        const scoreData = stageScores[stage.id];
        const isCompleted = !!scoreData;
        const isCurrent = stage.id === currentStageId;
        const isLocked = !isCompleted && !isCurrent && idx > 0 && !stageScores[stages[idx - 1]?.id];

        return (
          <button
            key={stage.id}
            onClick={() => !isLocked && onSelectStage(stage.id)}
            disabled={isLocked}
            className={`w-full rounded-2xl border p-4 text-left transition-all ${
              isLocked
                ? 'cursor-not-allowed border-border bg-muted/50 opacity-60'
                : isCurrent
                ? 'border-teal-300 bg-teal-50/50 shadow-sm hover:border-teal-400'
                : isCompleted
                ? 'border-emerald-200 bg-emerald-50/30 hover:border-emerald-300'
                : 'border-border bg-card hover:border-teal-300 hover:shadow-sm'
            }`}
          >
            <div className="flex items-center gap-3">
              {/* Step indicator */}
              <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-sm font-bold ${
                isCompleted
                  ? 'bg-emerald-500 text-white'
                  : isCurrent
                  ? 'bg-teal-500 text-white'
                  : isLocked
                  ? 'bg-muted text-muted-foreground'
                  : 'bg-secondary text-muted-foreground'
              }`}>
                {isCompleted ? '✓' : stage.order}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold text-foreground">{stage.title}</span>
                  {isCompleted && (
                    <span className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${
                      scoreData.score >= 80 ? 'bg-emerald-100 text-emerald-700' : scoreData.score >= 60 ? 'bg-amber-100 text-amber-700' : 'bg-rose-100 text-rose-700'
                    }`}>
                      {scoreData.score}分
                    </span>
                  )}
                  {isCurrent && !isCompleted && (
                    <span className="rounded-full bg-teal-100 px-2 py-0.5 text-[10px] font-medium text-teal-700">当前</span>
                  )}
                  {isLocked && (
                    <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-medium text-muted-foreground">未解锁</span>
                  )}
                </div>
                <p className="mt-0.5 text-xs text-muted-foreground truncate">{stage.description}</p>
              </div>

              <div className="shrink-0 text-lg">{stage.npcAvatar}</div>
            </div>

            {/* Connector line */}
            {idx < stages.length - 1 && (
              <div className="ml-5 mt-1 h-3 w-0.5 bg-border" />
            )}
          </button>
        );
      })}
    </div>
  );
}
