'use client';

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
        <Card className="border-neutral-700 bg-neutral-800/50">
          <CardContent className="pt-6">
            <div className="text-3xl font-bold text-amber-400">{stats.total_questions}</div>
            <div className="mt-1 text-sm text-neutral-400">总练习数</div>
          </CardContent>
        </Card>
        <Card className="border-neutral-700 bg-neutral-800/50">
          <CardContent className="pt-6">
            <div className="text-3xl font-bold text-amber-400">{stats.mock_interviews.total}</div>
            <div className="mt-1 text-sm text-neutral-400">模拟面试</div>
          </CardContent>
        </Card>
        <Card className="border-neutral-700 bg-neutral-800/50">
          <CardContent className="pt-6">
            <div className="text-3xl font-bold text-amber-400">
              {stats.mock_interviews.average_score || '-'}
            </div>
            <div className="mt-1 text-sm text-neutral-400">平均得分</div>
          </CardContent>
        </Card>
      </div>

      {/* 类型分布 */}
      {stats.type_distribution.length > 0 && (
        <Card className="border-neutral-700 bg-neutral-800/50">
          <CardHeader>
            <CardTitle className="text-base text-neutral-200">类型分布</CardTitle>
          </CardHeader>
          <CardContent>
            <PieChart data={stats.type_distribution} />
          </CardContent>
        </Card>
      )}

      {/* 得分趋势 */}
      {stats.mock_interviews.score_trend.length > 0 && (
        <Card className="border-neutral-700 bg-neutral-800/50">
          <CardHeader>
            <CardTitle className="text-base text-neutral-200">模拟面试得分趋势</CardTitle>
          </CardHeader>
          <CardContent>
            <LineChart data={stats.mock_interviews.score_trend} />
          </CardContent>
        </Card>
      )}

      {/* 弱项领域 */}
      {stats.weak_areas.length > 0 && (
        <Card className="border-neutral-700 bg-neutral-800/50">
          <CardHeader>
            <CardTitle className="text-base text-red-400">弱项领域</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {stats.weak_areas.map((area) => (
                <div key={area.type_name} className="rounded-lg border border-neutral-700 p-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-neutral-200">{area.type_name}</span>
                    <Badge variant="secondary" className="bg-red-600/20 text-red-400">
                      均分 {area.average_score}
                    </Badge>
                  </div>
                  {area.recommended_questions.length > 0 && (
                    <div className="mt-2 space-y-1">
                      <span className="text-xs text-neutral-500">推荐练习：</span>
                      {area.recommended_questions.map((q) => (
                        <p key={q.id} className="text-xs text-neutral-400">
                          • {q.text}
                        </p>
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
