'use client';

import type { EChartsOption } from 'echarts';
import { CHART_COLORS, TYPE_LABELS } from '../constants';
import ReactECharts from '@/components/ui/EChartsWrapper';

interface Props {
  data: { type: string; count: number }[];
}

export default function TypeDistributionChart({ data }: Props) {
  const chartData = data
    .filter((d) => d.count > 0)
    .map((d, i) => ({
      name: TYPE_LABELS[d.type] ?? d.type,
      value: d.count,
      itemStyle: { color: CHART_COLORS[i % CHART_COLORS.length] },
    }));

  const option: EChartsOption = {
    tooltip: { trigger: 'item', formatter: '{b}: {c} ({d}%)' },
    legend: { bottom: 0, type: 'scroll', textStyle: { fontSize: 12, color: '#6B7280' } },
    series: [
      {
        type: 'pie',
        radius: ['40%', '70%'],
        center: ['50%', '45%'],
        avoidLabelOverlap: true,
        itemStyle: { borderRadius: 6, borderColor: '#fff', borderWidth: 2 },
        label: { show: false },
        emphasis: { label: { show: true, fontSize: 14, fontWeight: 'bold' } },
        data: chartData,
      },
    ],
  };

  return <ReactECharts option={option} style={{ height: 280 }} />;
}