'use client';

import type { EChartsOption } from 'echarts';
import ReactECharts from '@/components/ui/EChartsWrapper';

interface Props {
  data: { date: string; count: number }[];
}

export default function GrowthTimelineChart({ data }: Props) {
  const option: EChartsOption = {
    tooltip: { trigger: 'axis', formatter: (params: unknown) => {
      const p = (params as { name: string; value: number }[])[0];
      return p ? `${p.name}<br/>新增 <b>${p.value}</b> 个资源` : '';
    }},
    grid: { left: 40, right: 16, top: 16, bottom: 32 },
    xAxis: {
      type: 'category',
      data: data.map((d) => d.date),
      axisLabel: { fontSize: 11, color: '#9CA3AF' },
      axisLine: { lineStyle: { color: '#E5E7EB' } },
      axisTick: { show: false },
    },
    yAxis: {
      type: 'value',
      minInterval: 1,
      axisLabel: { fontSize: 11, color: '#9CA3AF' },
      splitLine: { lineStyle: { color: '#F3F4F6' } },
    },
    series: [
      {
        type: 'line',
        data: data.map((d) => d.count),
        smooth: true,
        symbol: 'circle',
        symbolSize: 6,
        lineStyle: { width: 2.5, color: '#6366F1' },
        itemStyle: { color: '#6366F1' },
        areaStyle: {
          color: {
            type: 'linear', x: 0, y: 0, x2: 0, y2: 1,
            colorStops: [
              { offset: 0, color: 'rgba(99,102,241,0.25)' },
              { offset: 1, color: 'rgba(99,102,241,0.02)' },
            ],
          },
        },
      },
    ],
  };

  return <ReactECharts option={option} style={{ height: 280 }} />;
}