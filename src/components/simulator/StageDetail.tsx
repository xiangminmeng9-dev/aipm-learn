'use client';

import type { SimulatorStageConfig } from '@/lib/simulator-config';

interface StageDetailProps {
  stage: SimulatorStageConfig;
  stageScores?: Record<string, { score: number; feedback: string; completed_at: string }>;
  onStart: () => void;
}

export default function StageDetail({ stage, stageScores, onStart }: StageDetailProps) {
  const scoreData = stageScores?.[stage.id];
  const isCompleted = !!scoreData;

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-teal-200 bg-teal-50/30 p-5">
        <div className="mb-3 flex items-center gap-3">
          <span className="text-2xl">{stage.npcAvatar}</span>
          <div>
            <h3 className="text-sm font-semibold text-teal-800">{stage.npcName}</h3>
            <p className="text-xs text-teal-600">{stage.npcRole}</p>
          </div>
        </div>
        <p className="text-sm leading-relaxed text-foreground">{stage.description}</p>
      </div>

      {stage.resources.length > 0 && (
        <div className="rounded-2xl border border-border bg-card p-5">
          <h4 className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">前置阅读</h4>
          <div className="space-y-2">
            {stage.resources.map((r, i) => (
              <div key={i} className="flex items-center gap-2 rounded-lg bg-muted px-3 py-2">
                <span className="text-xs">
                  {r.type === 'article' ? '📄' : r.type === 'book' ? '📚' : r.type === 'video' ? '🎬' : '📝'}
                </span>
                <span className="text-sm text-foreground">{r.title}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="rounded-2xl border border-amber-200 bg-amber-50/30 p-5">
        <h4 className="mb-2 text-xs font-semibold uppercase tracking-wider text-amber-600">通关标准</h4>
        <p className="text-sm text-amber-800">{stage.passCriteria}</p>
      </div>

      {isCompleted && (
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50/30 p-5">
          <h4 className="mb-2 text-xs font-semibold uppercase tracking-wider text-emerald-600">已完成</h4>
          <div className="flex items-center gap-2">
            <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${
              scoreData.score >= 80 ? 'bg-emerald-100 text-emerald-700' : scoreData.score >= 60 ? 'bg-amber-100 text-amber-700' : 'bg-rose-100 text-rose-700'
            }`}>
              {scoreData.score} 分
            </span>
            <span className="text-xs text-muted-foreground">{scoreData.feedback}</span>
          </div>
        </div>
      )}

      <button
        onClick={onStart}
        className="w-full rounded-xl bg-teal-600 px-4 py-3 text-sm font-medium text-white hover:bg-teal-700"
      >
        {isCompleted ? '重新挑战' : '开始挑战'}
      </button>
    </div>
  );
}
