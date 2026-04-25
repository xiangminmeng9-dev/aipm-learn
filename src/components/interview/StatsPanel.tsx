'use client';

import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import PieChart from '@/components/interview/charts/PieChart';
import LineChart from '@/components/interview/charts/LineChart';
import type { UserStats } from '@/types';

interface StatsPanelProps {
  stats: UserStats;
}

export default function StatsPanel({ stats }: StatsPanelProps) {
  return (
    <div className="space-y-6">
      {/* 总览卡片 */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Card className="border-[#E5E7EB] bg-white">
          <CardContent className="pt-6">
            <div className="text-3xl font-bold text-indigo-600">{stats.total_questions}</div>
            <div className="mt-1 text-base text-[#6B7280]">总练习数</div>
          </CardContent>
        </Card>
        <Card className="border-[#E5E7EB] bg-white">
          <CardContent className="pt-6">
            <div className="text-3xl font-bold text-indigo-600">{stats.mock_interviews.total}</div>
            <div className="mt-1 text-base text-[#6B7280]">模拟面试</div>
          </CardContent>
        </Card>
        <Card className="border-[#E5E7EB] bg-white">
          <CardContent className="pt-6">
            <div className="text-3xl font-bold text-indigo-600">
              {stats.mock_interviews.average_score || '-'}
            </div>
            <div className="mt-1 text-base text-[#6B7280]">平均得分</div>
          </CardContent>
        </Card>
      </div>

      {/* 类型分布 */}
      {stats.type_distribution.length > 0 && (
        <Card className="border-[#E5E7EB] bg-white">
          <CardHeader>
            <CardTitle className="text-lg text-[#1F2937]">类型分布</CardTitle>
          </CardHeader>
          <CardContent>
            <PieChart data={stats.type_distribution} />
          </CardContent>
        </Card>
      )}

      {/* 得分趋势 */}
      {stats.mock_interviews.score_trend.length > 0 && (
        <Card className="border-[#E5E7EB] bg-white">
          <CardHeader>
            <CardTitle className="text-lg text-[#1F2937]">模拟面试得分趋势</CardTitle>
          </CardHeader>
          <CardContent>
            <LineChart data={stats.mock_interviews.score_trend} />
          </CardContent>
        </Card>
      )}

      {/* 弱项领域 */}
      {stats.weak_areas.length > 0 && (
        <Card className="border-[#E5E7EB] bg-white">
          <CardHeader>
            <CardTitle className="text-lg text-[#ff3b30]">弱项领域</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {stats.weak_areas.map((area) => (
                <div key={area.type_name} className="rounded-lg border border-[#E5E7EB] p-3">
                  <div className="flex items-center justify-between">
                    <span className="text-base font-medium text-[#1F2937]">{area.type_name}</span>
                    <Badge variant="secondary" className="bg-red-50 text-[#ff3b30]">
                      均分 {area.average_score}
                    </Badge>
                  </div>
                  {area.recommended_questions.length > 0 && (
                    <div className="mt-2 space-y-1">
                      <span className="text-sm text-[#6B7280]">推荐练习：</span>
                      {area.recommended_questions.map((q) => (
                        <p key={q.id} className="text-sm text-[#6B7280]">
                          • {q.text}
                        </p>
                      ))}
                    </div>
                  )}
                  {area.related_modules && area.related_modules.length > 0 && (
                    <div className="mt-2 flex items-center gap-1 flex-wrap">
                      <span className="text-sm text-[#6B7280]">相关技能：</span>
                      {area.related_modules.map((mod) => (
                        <Link
                          key={mod.id}
                          href={`/skills/module/${mod.id}`}
                          className="rounded bg-indigo-50 px-2 py-0.5 text-xs text-indigo-600 hover:bg-indigo-100"
                        >
                          {mod.name}
                        </Link>
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
