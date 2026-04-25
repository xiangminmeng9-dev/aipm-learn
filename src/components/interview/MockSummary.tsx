'use client';

import Link from 'next/link';
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
      ? 'text-green-600'
      : summary.total_score >= 6
        ? 'text-indigo-600'
        : 'text-[#ff3b30]';

  return (
    <div className="space-y-6">
      {/* 总分 */}
      <Card className="border-[#E5E7EB] bg-white">
        <CardContent className="flex items-center justify-center py-8">
          <div className="text-center">
            <div className={`text-5xl font-bold ${scoreColor}`}>{summary.total_score}</div>
            <div className="mt-1 text-base text-[#6B7280]">综合得分</div>
            <div className="mt-2 flex items-center justify-center gap-4 text-sm text-[#6B7280]">
              <span>{summary.answered_count} 题已答</span>
              <span>{summary.skipped_count} 题跳过</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 各题得分明细 */}
      <Card className="border-[#E5E7EB] bg-white">
        <CardHeader>
          <CardTitle className="text-lg text-[#1F2937]">各题得分</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {summary.answers.map((a) => (
              <div key={a.number} className="flex items-start gap-3">
                <span className="shrink-0 text-base text-[#6B7280]">#{a.number}</span>
                <div className="flex-1 min-w-0">
                  <p className="truncate text-base text-[#9CA3AF]">{a.question}</p>
                </div>
                {a.is_skipped ? (
                  <Badge variant="secondary" className="shrink-0 bg-[#E5E7EB] text-[#6B7280]">
                    跳过
                  </Badge>
                ) : (
                  <span
                    className={`shrink-0 text-base font-medium ${
                      (a.score ?? 0) >= 8
                        ? 'text-green-600'
                        : (a.score ?? 0) >= 6
                          ? 'text-indigo-600'
                          : 'text-[#ff3b30]'
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
        <Card className="border-[#E5E7EB] bg-white">
          <CardHeader>
            <CardTitle className="text-lg text-green-600">强项</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="whitespace-pre-wrap text-base text-[#9CA3AF]">{summary.strengths}</p>
          </CardContent>
        </Card>
        <Card className="border-[#E5E7EB] bg-white">
          <CardHeader>
            <CardTitle className="text-lg text-[#ff3b30]">弱项</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="whitespace-pre-wrap text-base text-[#9CA3AF]">{summary.weaknesses}</p>
          </CardContent>
        </Card>
      </div>

      {/* 改进建议 */}
      <Card className="border-[#E5E7EB] bg-white">
        <CardHeader>
          <CardTitle className="text-lg text-indigo-600">改进建议</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="whitespace-pre-wrap text-base text-[#9CA3AF]">{summary.suggestions}</p>
        </CardContent>
      </Card>

      {/* 弱项技能模块推荐 */}
      {summary.weak_skill_modules.length > 0 && (
        <Card className="border-[#E5E7EB] bg-white">
          <CardHeader>
            <CardTitle className="text-lg text-[#1F2937]">推荐技能提升</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {summary.weak_skill_modules.map((mod) => (
                <Link
                  key={mod.module_id}
                  href={`/skills/module/${mod.module_id}`}
                  className="block rounded-lg border border-[#E5E7EB] p-3 transition-colors hover:border-indigo-300"
                >
                  <div className="flex items-center justify-between">
                    <p className="text-base font-medium text-[#1F2937]">{mod.module_name}</p>
                    <span className="text-sm text-indigo-600">去学习 →</span>
                  </div>
                  {mod.recommended_tasks.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-1">
                      {mod.recommended_tasks.map((task) => (
                        <Badge
                          key={task.task_id}
                          variant="secondary"
                          className="bg-[#E5E7EB] text-sm text-[#6B7280]"
                        >
                          {task.task_name}
                        </Badge>
                      ))}
                    </div>
                  )}
                </Link>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
