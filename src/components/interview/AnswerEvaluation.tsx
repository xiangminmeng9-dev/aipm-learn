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

function ScoreRing({ score, size = 80 }: { score: number; size?: number }) {
  const radius = (size - 8) / 2;
  const circumference = 2 * Math.PI * radius;
  const progress = circumference * (1 - score / 100);
  const color = score >= 90 ? '#22c55e' : score >= 70 ? '#3b82f6' : score >= 50 ? '#f59e0b' : '#ef4444';

  return (
    <div className="relative inline-flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="currentColor" strokeWidth={4} className="text-muted/20" />
        <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke={color} strokeWidth={4}
          strokeDasharray={circumference} strokeDashoffset={progress} strokeLinecap="round" />
      </svg>
      <span className="absolute text-lg font-bold" style={{ color }}>{score}</span>
    </div>
  );
}

function DimensionBar({ dim }: { dim: Dimension }) {
  const color = dim.score >= 90 ? 'bg-green-500' : dim.score >= 70 ? 'bg-blue-500' : dim.score >= 50 ? 'bg-yellow-500' : 'bg-red-500';
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-sm">
        <span className="text-foreground">{dim.name}</span>
        <span className="font-medium text-foreground">{dim.score}</span>
      </div>
      <div className="h-2 w-full rounded-full bg-muted/20">
        <div className={`h-2 rounded-full ${color}`} style={{ width: `${dim.score}%` }} />
      </div>
      <p className="text-xs text-muted-foreground">{dim.comment}</p>
    </div>
  );
}

export default function AnswerEvaluation({ score, gapAnalysis, perfectAnswer, thinkingFramework, dimensions }: AnswerEvaluationProps) {
  return (
    <div className="mx-auto max-w-2xl space-y-6">
      {/* Score Header */}
      <div className="flex items-center gap-4 rounded-lg border border-border bg-card p-4">
        <ScoreRing score={score} />
        <div className="flex-1">
          <div className="text-sm font-medium text-foreground">综合评分</div>
          <div className="text-xs text-muted-foreground">{score >= 90 ? '优秀' : score >= 70 ? '良好' : score >= 50 ? '及格' : '需加强'}</div>
          {gapAnalysis && <p className="mt-1 text-sm text-muted-foreground">{gapAnalysis}</p>}
        </div>
      </div>

      {/* Dimensions */}
      {dimensions && dimensions.length > 0 && (
        <div className="space-y-3 rounded-lg border border-border bg-card p-4">
          <h4 className="text-sm font-semibold text-foreground">维度评分</h4>
          {dimensions.map((dim) => (
            <DimensionBar key={dim.name} dim={dim} />
          ))}
        </div>
      )}

      {/* Thinking Framework */}
      {thinkingFramework && (
        <div className="rounded-lg border border-border bg-card p-4">
          <h4 className="mb-2 text-sm font-semibold text-foreground">答题思路</h4>
          <p className="text-sm text-muted-foreground">{thinkingFramework}</p>
        </div>
      )}

      {/* Perfect Answer */}
      {perfectAnswer && (
        <div className="rounded-lg border border-border bg-card p-4">
          <h4 className="mb-2 text-sm font-semibold text-foreground">满分回答</h4>
          <div className="prose prose-sm max-w-none text-muted-foreground whitespace-pre-wrap">{perfectAnswer}</div>
        </div>
      )}
    </div>
  );
}
