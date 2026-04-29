'use client';

interface Dimension {
  name: string;
  score: number;
  comment: string;
}

interface AnswerEvaluationProps {
  score: number;
  gapAnalysis: string;
  perfectAnswer: string;
  thinkingFramework?: string;
  dimensions?: Dimension[];
}

function ScoreRing({ score, size = 72 }: { score: number; size?: number }) {
  const radius = (size - 8) / 2;
  const circumference = 2 * Math.PI * radius;
  const progress = circumference * (1 - score / 100);
  const color = score >= 90 ? '#22c55e' : score >= 70 ? '#3b82f6' : score >= 50 ? '#f59e0b' : '#ef4444';
  const label = score >= 90 ? '优秀' : score >= 70 ? '良好' : score >= 50 ? '及格' : '需加强';

  return (
    <div className="flex flex-col items-center gap-1">
      <div className="relative inline-flex items-center justify-center" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="-rotate-90">
          <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="#E5E7EB" strokeWidth={5} />
          <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke={color} strokeWidth={5}
            strokeDasharray={circumference} strokeDashoffset={progress} strokeLinecap="round" />
        </svg>
        <span className="absolute text-xl font-bold" style={{ color }}>{score}</span>
      </div>
      <span className="text-xs font-medium" style={{ color }}>{label}</span>
    </div>
  );
}

function DimensionBar({ dim }: { dim: Dimension }) {
  const color = dim.score >= 90 ? '#22c55e' : dim.score >= 70 ? '#3b82f6' : dim.score >= 50 ? '#f59e0b' : '#ef4444';
  return (
    <div className="flex items-center gap-3">
      <span className="w-20 shrink-0 text-sm text-foreground">{dim.name}</span>
      <div className="flex-1">
        <div className="h-2.5 w-full rounded-full bg-gray-100">
          <div className="h-2.5 rounded-full transition-all" style={{ width: `${dim.score}%`, backgroundColor: color }} />
        </div>
      </div>
      <span className="w-8 text-right text-sm font-bold" style={{ color }}>{dim.score}</span>
      <span className="flex-1 text-xs text-muted-foreground">{dim.comment}</span>
    </div>
  );
}

export default function AnswerEvaluation({ score, gapAnalysis, perfectAnswer, thinkingFramework, dimensions }: AnswerEvaluationProps) {
  return (
    <div className="space-y-4">
      {/* Row 1: Score + Thinking Framework side by side */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Score Card */}
        <div className="rounded-xl border border-border bg-card p-5 flex flex-col items-center justify-center gap-2">
          <h4 className="text-sm font-semibold text-muted-foreground">综合评分</h4>
          <ScoreRing score={score} />
        </div>

        {/* Thinking Framework Card */}
        <div className="rounded-xl border border-border bg-card p-5">
          <h4 className="mb-3 text-sm font-semibold text-muted-foreground">答题思路</h4>
          {thinkingFramework ? (
            <div className="space-y-2">
              {thinkingFramework.split(/[→>]/).filter(s => s.trim()).map((step, i) => (
                <div key={i} className="flex items-start gap-2">
                  <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-indigo-100 text-xs font-bold text-indigo-600">{i + 1}</span>
                  <span className="text-sm text-foreground">{step.trim()}</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">暂无思路框架</p>
          )}
        </div>
      </div>

      {/* Row 2: Dimensions */}
      {dimensions && dimensions.length > 0 && (
        <div className="rounded-xl border border-border bg-card p-5">
          <h4 className="mb-3 text-sm font-semibold text-muted-foreground">维度评分</h4>
          <div className="space-y-3">
            {dimensions.map((dim) => (
              <DimensionBar key={dim.name} dim={dim} />
            ))}
          </div>
        </div>
      )}

      {/* Row 3: Gap Analysis + Perfect Answer side by side */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Gap Analysis */}
        <div className="rounded-xl border border-amber-200 bg-amber-50/30 p-5">
          <h4 className="mb-2 text-sm font-semibold text-amber-700">差距分析</h4>
          <div className="text-sm text-foreground whitespace-pre-wrap">
            {gapAnalysis ? formatStructuredText(gapAnalysis) : '暂无分析'}
          </div>
        </div>

        {/* Perfect Answer */}
        <div className="rounded-xl border border-emerald-200 bg-emerald-50/30 p-5">
          <h4 className="mb-2 text-sm font-semibold text-emerald-700">满分回答</h4>
          <div className="text-sm text-foreground whitespace-pre-wrap">
            {perfectAnswer ? formatStructuredText(perfectAnswer) : '暂无参考'}
          </div>
        </div>
      </div>
    </div>
  );
}

/** Format text: if it contains numbered points or bullet-like patterns, render them as a list */
function formatStructuredText(text: string): React.ReactNode {
  // Split by common list patterns: "1." "2." "- " "• " or newlines
  const lines = text.split(/\n/).filter(l => l.trim());
  if (lines.length <= 1) return text;

  return (
    <ul className="space-y-1.5">
      {lines.map((line, i) => {
        const cleaned = line.replace(/^[\d]+[.、)\]]\s*/, '').replace(/^[-•*]\s*/, '').trim();
        if (!cleaned) return null;
        return (
          <li key={i} className="flex items-start gap-1.5">
            <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-current opacity-40" />
            <span>{cleaned}</span>
          </li>
        );
      })}
    </ul>
  );
}

import React from 'react';
