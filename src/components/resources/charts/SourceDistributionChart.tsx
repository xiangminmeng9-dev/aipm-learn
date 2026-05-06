'use client';

import type { EChartsOption } from 'echarts';
import { CHART_COLORS } from '../constants';
import ReactECharts from '@/components/ui/EChartsWrapper';

interface Props {
  data: { source: string; count: number }[];
}

export default function SourceDistributionChart({ data }: Props) {
  const option: EChartsOption = {
    tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } },
    grid: { left: 80, right: 24, top: 8, bottom: 8 },
    xAxis: { type: 'value', axisLabel: { fontSize: 11, color: '#9CA3AF' }, splitLine: { lineStyle: { color: '#F3F4F6' } } },
    yAxis: {
      type: 'category',
      data: data.map((d) => d.source),
      axisLabel: { fontSize: 12, color: '#6B7280' },
      axisLine: { show: false },
      axisTick: { show: false },
    },
    series: [
      {
        type: 'bar',
        data: data.map((d, i) => ({
          value: d.count,
          itemStyle: { color: CHART_COLORS[i % CHART_COLORS.length], borderRadius: [0, 4, 4, 0] },
        })),
        barWidth: 18,
      },
    ],
  };

  return <ReactECharts option={option} style={{ height: 280 }} />;
}