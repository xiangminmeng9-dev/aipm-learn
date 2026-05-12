'use client';

import ReactECharts from '@/components/ui/EChartsWrapper';
import { ChevronDown } from 'lucide-react';

interface Props {
  data: { category: string; total: number; interviews: number; offers: number }[];
}

export default function DashboardPositionCategoryChart({ data }: Props) {
  const sorted = [...data].sort((a, b) => b.total - a.total).slice(0, 8);

  // 获取实际存在的类别列表
  const categories = sorted.map(d => d.category);

  const option = {
    tooltip: {
      trigger: 'axis' as const,
      backgroundColor: '#1F2937',
      borderColor: '#374151',
      textStyle: { color: '#F9FAFB', fontSize: 12 },
      axisPointer: { type: 'shadow' as const },
    },
    grid: { left: 70, right: 16, top: 16, bottom: 24 },
    xAxis: {
      type: 'value' as const,
      axisLabel: { color: '#9CA3AF', fontSize: 10 },
      splitLine: { lineStyle: { color: '#374151', type: 'dashed' as const } },
    },
    yAxis: {
      type: 'category' as const,
      data: sorted.map((d) => d.category),
      axisLabel: { color: '#9CA3AF', fontSize: 12 },
      inverse: true,
      axisLine: { show: false },
      axisTick: { show: false },
    },
    series: [{
      name: '投递数',
      type: 'bar' as const,
      data: sorted.map((d) => ({
        value: d.total,
        itemStyle: {
          color: {
            type: 'linear' as const, x: 0, y: 0, x2: 1, y2: 0,
            colorStops: [
              { offset: 0, color: '#818CF8' },
              { offset: 1, color: '#6366F1' },
            ],
          },
          borderRadius: [0, 6, 6, 0],
        },
      })),
      barWidth: 14,
    }],
  };

  return (
    <div className="rounded-2xl border border-border bg-card p-5">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-foreground">职位类别转化率</h3>
        <div className="relative">
          <select className="appearance-none text-xs text-muted-foreground bg-transparent pr-4 py-1 outline-none cursor-pointer hover:text-foreground transition-colors">
            <option>全部类别</option>
            {categories.map((cat) => (
              <option key={cat}>{cat}</option>
            ))}
          </select>
          <ChevronDown className="absolute right-0 top-1/2 -translate-y-1/2 h-3 w-3 text-muted-foreground pointer-events-none" />
        </div>
      </div>
      {sorted.length > 0 ? (
        <div className="flex gap-4">
          {/* 左侧：柱状图 */}
          <div className="w-[55%]">
            <ReactECharts option={option} style={{ height: 240 }} />
          </div>
          {/* 右侧：转化数据 */}
          <div className="flex-1 flex flex-col justify-center space-y-3">
            {sorted.map((item) => (
              <div key={item.category} className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">{item.category}</span>
                <span className="text-sm font-medium text-foreground">
                  {item.total} 投递 / {item.interviews} 推进
                </span>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="flex items-center justify-center h-60 text-sm text-muted-foreground">暂无数据</div>
      )}
    </div>
  );
}