'use client';

import ReactECharts from '@/components/ui/EChartsWrapper';
import { ChevronDown } from 'lucide-react';

interface Props {
  data: { city: string; count: number }[];
}

export default function DashboardCityChart({ data }: Props) {
  const sorted = [...data].sort((a, b) => b.count - a.count).slice(0, 10);

  // 获取实际存在的城市列表
  const cities = sorted.map(d => d.city);

  const option = {
    tooltip: {
      trigger: 'axis' as const,
      backgroundColor: '#1F2937',
      borderColor: '#374151',
      textStyle: { color: '#F9FAFB', fontSize: 12 },
      axisPointer: { type: 'shadow' as const },
    },
    grid: { left: 16, right: 24, top: 16, bottom: 40 },
    xAxis: {
      type: 'category' as const,
      data: sorted.map((d) => d.city),
      axisLabel: { color: '#9CA3AF', fontSize: 11, rotate: 30 },
      axisLine: { lineStyle: { color: '#374151' } },
      axisTick: { show: false },
    },
    yAxis: {
      type: 'value' as const,
      axisLabel: { color: '#9CA3AF', fontSize: 10 },
      splitLine: { lineStyle: { color: '#374151', type: 'dashed' as const } },
    },
    series: [{
      type: 'bar' as const,
      data: sorted.map((d) => ({
        value: d.count,
        itemStyle: {
          color: {
            type: 'linear' as const, x: 0, y: 1, x2: 0, y2: 0,
            colorStops: [
              { offset: 0, color: '#818CF8' },
              { offset: 1, color: '#6366F1' },
            ],
          },
          borderRadius: [6, 6, 0, 0],
        },
      })),
      barWidth: 24,
      label: {
        show: true,
        position: 'top' as const,
        color: '#F1F5F9',
        fontSize: 13,
        fontWeight: 'bold',
        formatter: '{c}',
      },
    }],
  };

  return (
    <div className="rounded-2xl border border-border bg-card p-5">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-foreground">城市分布</h3>
        <div className="relative">
          <select className="appearance-none text-xs text-muted-foreground bg-transparent pr-4 py-1 outline-none cursor-pointer hover:text-foreground transition-colors">
            <option>全部城市</option>
            {cities.map((city) => (
              <option key={city}>{city}</option>
            ))}
          </select>
          <ChevronDown className="absolute right-0 top-1/2 -translate-y-1/2 h-3 w-3 text-muted-foreground pointer-events-none" />
        </div>
      </div>
      {sorted.length > 0 ? (
        <ReactECharts option={option} style={{ height: 240 }} />
      ) : (
        <div className="flex items-center justify-center h-60 text-sm text-muted-foreground">暂无数据</div>
      )}
    </div>
  );
}