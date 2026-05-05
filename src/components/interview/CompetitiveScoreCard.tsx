'use client';

import type { DimensionScore } from '@/types';

interface CompetitiveScoreCardProps {
  totalScore: number;
  dimensionScores: DimensionScore[];
}

function getScoreColor(score: number): string {
  if (score >= 80) return 'text-emerald-600 dark:text-emerald-400';
  if (score >= 60) return 'text-amber-600 dark:text-amber-400';
  return 'text-rose-600 dark:text-rose-400';
}

function getBarColor(score: number): string {
  if (score >= 80) return 'from-emerald-400 to-emerald-500';
  if (score >= 60) return 'from-amber-400 to-amber-500';
  return 'from-rose-400 to-rose-500';
}

function getBarBg(score: number): string {
  if (score >= 80) return 'bg-emerald-100 dark:bg-emerald-900/30';
  if (score >= 60) return 'bg-amber-100 dark:bg-amber-900/30';
  return 'bg-rose-100 dark:bg-rose-900/30';
}

export default function CompetitiveScoreCard({ totalScore, dimensionScores }: CompetitiveScoreCardProps) {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-center rounded-2xl border bg-gradient-to-br from-purple-50 to-violet-50 p-8 dark:from-purple-950/30 dark:to-violet-950/30">
        <div className="text-center">
          <div className={`text-6xl font-bold ${getScoreColor(totalScore)}`}>{totalScore}</div>
          <div className="mt-1 text-sm text-muted-foreground">综合评分</div>
        </div>
      </div>

      <div className="space-y-3">
        <h3 className="text-sm font-semibold text-foreground">维度评分</h3>
        {dimensionScores.map((ds) => (
          <div key={ds.dimension} className="rounded-xl border bg-card p-4">
            <div className="mb-2 flex items-center justify-between">
              <span className="text-sm font-medium text-foreground">{ds.dimension}</span>
              <span className={`text-sm font-bold ${getScoreColor(ds.score)}`}>{ds.score}</span>
            </div>
            <div className={`mb-2 h-2 w-full overflow-hidden rounded-full ${getBarBg(ds.score)}`}>
              <div
                className={`h-full rounded-full bg-gradient-to-r ${getBarColor(ds.score)} transition-all duration-500`}
                style={{ width: `${ds.score}%` }}
              />
            </div>
            <p className="text-xs text-muted-foreground">{ds.comment}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
