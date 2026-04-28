'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import Markdown from '@/components/ui/markdown';

interface DimensionScore {
  score: number;
  comment: string;
}

interface AnswerEvaluationProps {
  score: number;
  gapAnalysis: string;
  perfectAnswer: string;
  dimensions?: Record<string, DimensionScore>;
  feedback?: string;
  keyPoints?: string[];
}

const DIMENSION_COLORS: Record<string, { bar: string; bg: string; text: string }> = {
  '专业深度': { bar: 'bg-violet-500', bg: 'bg-violet-50', text: 'text-violet-700' },
  '产品思维': { bar: 'bg-sky-500', bg: 'bg-sky-50', text: 'text-sky-700' },
  '逻辑表达': { bar: 'bg-amber-500', bg: 'bg-amber-50', text: 'text-amber-700' },
  '实战经验': { bar: 'bg-emerald-500', bg: 'bg-emerald-50', text: 'text-emerald-700' },
};

const DEFAULT_COLORS = { bar: 'bg-indigo-500', bg: 'bg-indigo-50', text: 'text-indigo-700' };

export default function AnswerEvaluation({
  score,
  gapAnalysis,
  perfectAnswer,
  dimensions,
  feedback,
  keyPoints,
}: AnswerEvaluationProps) {
  const scoreColor = score >= 80 ? 'text-emerald-600' : score >= 60 ? 'text-amber-600' : 'text-rose-600';
  const scoreBg = score >= 80 ? 'bg-emerald-50' : score >= 60 ? 'bg-amber-50' : 'bg-rose-50';
  const scoreLabel = score >= 80 ? '优秀' : score >= 60 ? '良好' : score >= 40 ? '待提升' : '需加强';
  const scoreLabelColor = score >= 80 ? 'text-emerald-700' : score >= 60 ? 'text-amber-700' : 'text-rose-700';

  return (
    <Card className="border-border bg-card">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base text-foreground">答题评价</CardTitle>
          <div className={`flex items-center gap-2 rounded-full px-3 py-1 ${scoreBg}`}>
            <span className={`text-2xl font-bold ${scoreColor}`}>{score}</span>
            <span className="text-xs text-muted-foreground">/100</span>
            <span className={`text-xs font-medium ${scoreLabelColor}`}>{scoreLabel}</span>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-5">
        {/* 4-Dimension Scoring */}
        {dimensions && Object.keys(dimensions).length > 0 && (
          <div>
            <span className="mb-3 inline-block rounded-full bg-indigo-50 px-2.5 py-0.5 text-xs font-medium text-indigo-700">
              四维评分
            </span>
            <div className="mt-2 space-y-3">
              {Object.entries(dimensions).map(([name, dim]) => {
                const colors = DIMENSION_COLORS[name] || DEFAULT_COLORS;
                const pct = Math.min(100, Math.max(0, dim.score));
                return (
                  <div key={name} className="rounded-lg border border-border p-3">
                    <div className="flex items-center justify-between">
                      <span className={`text-sm font-medium ${colors.text}`}>{name}</span>
                      <span className="text-sm font-bold text-foreground">{dim.score}<span className="text-xs text-muted-foreground">/100</span></span>
                    </div>
                    <div className="mt-1.5 h-2 w-full overflow-hidden rounded-full bg-secondary">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${colors.bar}`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    {dim.comment && (
                      <p className="mt-1.5 text-xs text-muted-foreground">{dim.comment}</p>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Feedback */}
        {feedback && (
          <div>
            <span className="mb-2 inline-block rounded-full bg-sky-50 px-2.5 py-0.5 text-xs font-medium text-sky-700">
              总体评价
            </span>
            <div className="mt-2 text-sm text-foreground">{feedback}</div>
          </div>
        )}

        {/* Key Points */}
        {keyPoints && keyPoints.length > 0 && (
          <div>
            <span className="mb-2 inline-block rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-medium text-emerald-700">
              得分要点
            </span>
            <div className="mt-2 space-y-1">
              {keyPoints.map((point, i) => (
                <div key={i} className="flex items-start gap-2 text-sm text-foreground">
                  <span className="mt-0.5 flex h-4 w-4 flex-shrink-0 items-center justify-center rounded-full bg-emerald-100 text-[10px] font-bold text-emerald-600">
                    {i + 1}
                  </span>
                  {point}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Gap Analysis */}
        {gapAnalysis && (
          <div>
            <span className="mb-2 inline-block rounded-full bg-amber-50 px-2.5 py-0.5 text-xs font-medium text-amber-700">
              差距分析
            </span>
            <div className="mt-2">
              <Markdown content={gapAnalysis} />
            </div>
          </div>
        )}

        {/* Perfect Answer */}
        {perfectAnswer && (
          <div>
            <span className="mb-2 inline-block rounded-full bg-rose-50 px-2.5 py-0.5 text-xs font-medium text-rose-700">
              满分回答
            </span>
            <div className="mt-2">
              <Markdown content={perfectAnswer} />
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
