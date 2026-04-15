'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

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

export default function MockSummary({ summary }: MockSummaryProps) {
  const scoreColor =
    summary.total_score >= 8
      ? 'text-green-400'
      : summary.total_score >= 6
        ? 'text-amber-400'
        : 'text-red-400';

  return (
    <div className="space-y-6">
      {/* 总分 */}
      <Card className="border-neutral-700 bg-neutral-800/50">
        <CardContent className="flex items-center justify-center py-8">
          <div className="text-center">
            <div className={`text-5xl font-bold ${scoreColor}`}>{summary.total_score}</div>
            <div className="mt-1 text-sm text-neutral-400">综合得分</div>
            <div className="mt-2 flex items-center justify-center gap-4 text-xs text-neutral-500">
              <span>{summary.answered_count} 题已答</span>
              <span>{summary.skipped_count} 题跳过</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 各题得分明细 */}
      <Card className="border-neutral-700 bg-neutral-800/50">
        <CardHeader>
          <CardTitle className="text-base text-neutral-200">各题得分</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {summary.answers.map((a) => (
              <div key={a.number} className="flex items-start gap-3">
                <span className="shrink-0 text-sm text-neutral-500">#{a.number}</span>
                <div className="flex-1 min-w-0">
                  <p className="truncate text-sm text-neutral-300">{a.question}</p>
                </div>
                {a.is_skipped ? (
                  <Badge variant="secondary" className="shrink-0 bg-neutral-700 text-neutral-400">
                    跳过
                  </Badge>
                ) : (
                  <span
                    className={`shrink-0 text-sm font-medium ${
                      (a.score ?? 0) >= 8
                        ? 'text-green-400'
                        : (a.score ?? 0) >= 6
                          ? 'text-amber-400'
                          : 'text-red-400'
                    }`}
                  >
                    {a.score}
                  </span>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* 强项和弱项 */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card className="border-neutral-700 bg-neutral-800/50">
          <CardHeader>
            <CardTitle className="text-base text-green-400">强项</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="whitespace-pre-wrap text-sm text-neutral-300">{summary.strengths}</p>
          </CardContent>
        </Card>
        <Card className="border-neutral-700 bg-neutral-800/50">
          <CardHeader>
            <CardTitle className="text-base text-red-400">弱项</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="whitespace-pre-wrap text-sm text-neutral-300">{summary.weaknesses}</p>
          </CardContent>
        </Card>
      </div>

      {/* 改进建议 */}
      <Card className="border-neutral-700 bg-neutral-800/50">
        <CardHeader>
          <CardTitle className="text-base text-amber-400">改进建议</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="whitespace-pre-wrap text-sm text-neutral-300">{summary.suggestions}</p>
        </CardContent>
      </Card>

      {/* 弱项技能模块推荐 */}
      {summary.weak_skill_modules.length > 0 && (
        <Card className="border-neutral-700 bg-neutral-800/50">
          <CardHeader>
            <CardTitle className="text-base text-neutral-200">推荐技能提升</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {summary.weak_skill_modules.map((mod) => (
                <div key={mod.module_id} className="rounded-lg border border-neutral-700 p-3">
                  <p className="text-sm font-medium text-neutral-200">{mod.module_name}</p>
                  {mod.recommended_tasks.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-1">
                      {mod.recommended_tasks.map((task) => (
                        <Badge
                          key={task.task_id}
                          variant="secondary"
                          className="bg-neutral-700 text-xs text-neutral-400"
                        >
                          {task.task_name}
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
