'use client';

import Link from 'next/link';

interface MockSummaryProps {
  summary: {
    total_score: number;
    question_count: number;
    answered_count: number;
    skipped_count: number;
    answers: {
      number: number;
      question: string;
      score: number | null;
      gap_analysis: string | null;
      is_skipped: boolean;
    }[];
    strengths: string;
    weaknesses: string;
    suggestions: string;
    weak_skill_modules: {
      module_id: string;
      module_name: string;
      recommended_tasks: { task_id: string; task_name: string }[];
    }[];
  };
}

function ScoreRing({ score, size = 80 }: { score: number; size?: number }) {
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
        <span className="absolute text-2xl font-bold" style={{ color }}>{score}</span>
      </div>
      <span className="text-sm font-medium" style={{ color }}>{label}</span>
    </div>
  );
}

function StructuredList({ text }: { text: string }) {
  const lines = text.split(/\n/).filter(l => l.trim());
  if (lines.length <= 1) return <p className="whitespace-pre-wrap text-sm text-foreground">{text}</p>;

  return (
    <ul className="space-y-2">
      {lines.map((line, i) => {
        const cleaned = line.replace(/^[\d]+[.、)\]]\s*/, '').replace(/^[-•*]\s*/, '').trim();
        if (!cleaned) return null;
        return (
          <li key={i} className="flex items-start gap-2 text-sm text-foreground">
            <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-current opacity-40" />
            <span>{cleaned}</span>
          </li>
        );
      })}
    </ul>
  );
}

export default function MockSummary({ summary }: MockSummaryProps) {
  const scoreColor =
    summary.total_score >= 90 ? 'text-emerald-600' :
    summary.total_score >= 70 ? 'text-blue-600' :
    summary.total_score >= 50 ? 'text-amber-600' : 'text-rose-600';

  return (
    <div className="space-y-5">
      {/* Row 1: Score + Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Score */}
        <div className="rounded-xl border border-border bg-card p-6 flex flex-col items-center justify-center">
          <ScoreRing score={summary.total_score} />
        </div>

        {/* Stats */}
        <div className="rounded-xl border border-border bg-card p-5 space-y-3">
          <h4 className="text-sm font-semibold text-muted-foreground">答题统计</h4>
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-lg bg-muted/30 p-3 text-center">
              <div className="text-2xl font-bold text-foreground">{summary.question_count}</div>
              <div className="text-xs text-muted-foreground">总题数</div>
            </div>
            <div className="rounded-lg bg-muted/30 p-3 text-center">
              <div className="text-2xl font-bold text-emerald-600">{summary.answered_count}</div>
              <div className="text-xs text-muted-foreground">已回答</div>
            </div>
            <div className="rounded-lg bg-muted/30 p-3 text-center">
              <div className="text-2xl font-bold text-amber-600">{summary.skipped_count}</div>
              <div className="text-xs text-muted-foreground">已跳过</div>
            </div>
            <div className="rounded-lg bg-muted/30 p-3 text-center">
              <div className="text-2xl font-bold text-foreground">
                {summary.question_count > 0 ? Math.round((summary.answered_count / summary.question_count) * 100) : 0}%
              </div>
              <div className="text-xs text-muted-foreground">完成率</div>
            </div>
          </div>
        </div>

        {/* Per-question score bars */}
        <div className="rounded-xl border border-border bg-card p-5">
          <h4 className="mb-3 text-sm font-semibold text-muted-foreground">各题得分</h4>
          <div className="space-y-2">
            {summary.answers.map((a) => {
              const s = a.score ?? 0;
              const color = a.is_skipped ? '#9CA3AF' : s >= 90 ? '#22c55e' : s >= 70 ? '#3b82f6' : s >= 50 ? '#f59e0b' : '#ef4444';
              return (
                <div key={a.number} className="flex items-center gap-2">
                  <span className="w-5 text-xs text-muted-foreground">#{a.number}</span>
                  <div className="flex-1 h-2 rounded-full bg-gray-100">
                    <div className="h-2 rounded-full transition-all" style={{ width: `${a.is_skipped ? 0 : s}%`, backgroundColor: color }} />
                  </div>
                  <span className="w-8 text-right text-xs font-medium" style={{ color }}>
                    {a.is_skipped ? '跳' : s}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Row 2: Strengths + Weaknesses */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="rounded-xl border border-emerald-200 bg-emerald-50/30 p-5">
          <h4 className="mb-3 text-sm font-semibold text-emerald-700">强项</h4>
          <StructuredList text={summary.strengths} />
        </div>
        <div className="rounded-xl border border-rose-200 bg-rose-50/30 p-5">
          <h4 className="mb-3 text-sm font-semibold text-rose-700">弱项</h4>
          <StructuredList text={summary.weaknesses} />
        </div>
      </div>

      {/* Row 3: Suggestions */}
      <div className="rounded-xl border border-blue-200 bg-blue-50/30 p-5">
        <h4 className="mb-3 text-sm font-semibold text-blue-700">改进建议</h4>
        <StructuredList text={summary.suggestions} />
      </div>

      {/* Row 4: Weak skill modules */}
      {summary.weak_skill_modules.length > 0 && (
        <div className="rounded-xl border border-border bg-card p-5">
          <h4 className="mb-3 text-sm font-semibold text-muted-foreground">推荐技能提升</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {summary.weak_skill_modules.map((mod) => (
              <Link
                key={mod.module_id}
                href={`/skills/module/${mod.module_id}`}
                className="block rounded-lg border border-border p-3 transition-colors hover:border-indigo-300 hover:bg-indigo-50/30"
              >
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium text-foreground">{mod.module_name}</p>
                  <span className="text-sm text-indigo-600">去学习 →</span>
                </div>
                {mod.recommended_tasks.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-1">
                    {mod.recommended_tasks.map((task) => (
                      <span key={task.task_id} className="rounded-md bg-muted px-2 py-0.5 text-xs text-muted-foreground">
                        {task.task_name}
                      </span>
                    ))}
                  </div>
                )}
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
