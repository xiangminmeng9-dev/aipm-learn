'use client';

import type { DimensionScore, SpecSuggestion } from '@/types';

interface SpecScoreCardProps {
  totalScore: number;
  dimensionScores: DimensionScore[];
  suggestions: SpecSuggestion[];
}

function getScoreColor(score: number): string {
  if (score >= 80) return 'text-emerald-600';
  if (score >= 60) return 'text-amber-600';
  return 'text-rose-600';
}

function getBarColor(score: number): string {
  if (score >= 80) return 'from-emerald-400 to-emerald-500';
  if (score >= 60) return 'from-amber-400 to-amber-500';
  return 'from-rose-400 to-rose-500';
}

function getBarBg(score: number): string {
  if (score >= 80) return 'bg-emerald-100';
  if (score >= 60) return 'bg-amber-100';
  return 'bg-rose-100';
}

export default function SpecScoreCard({ totalScore, dimensionScores, suggestions }: SpecScoreCardProps) {
  return (
    <div className="space-y-6">
      {/* Total Score */}
      <div className="flex items-center justify-center rounded-2xl border bg-gradient-to-br from-indigo-50 to-violet-50 p-8 dark:from-indigo-950/30 dark:to-violet-950/30">
        <div className="text-center">
          <div className={`text-6xl font-bold ${getScoreColor(totalScore)}`}>{totalScore}</div>
          <div className="mt-1 text-sm text-muted-foreground">综合评分</div>
        </div>
      </div>

      {/* Dimension Scores */}
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

      {/* Suggestions */}
      {suggestions.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-foreground">优化建议</h3>
          {suggestions.map((s, i) => (
            <div key={i} className="rounded-xl border border-amber-200 bg-amber-50/50 p-4 dark:border-amber-900 dark:bg-amber-950/20">
              <div className="mb-2 flex items-start gap-2">
                <span className="mt-0.5 flex-shrink-0 text-amber-500">💡</span>
                <div className="min-w-0 flex-1">
                  <div className="mb-1 text-xs text-muted-foreground">
                    原文：<span className="text-foreground">&ldquo;{s.original_text}&rdquo;</span>
                  </div>
                  <div className="mb-1 text-xs font-medium text-amber-700 dark:text-amber-400">
                    改进方向：{s.improvement}
                  </div>
                  <div className="text-xs text-muted-foreground">{s.suggestion}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
