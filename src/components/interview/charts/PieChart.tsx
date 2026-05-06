'use client';

import type { EChartsOption } from 'echarts';
import ReactECharts from '@/components/ui/EChartsWrapper';

interface PieChartProps {
  data: { type_name: string; count: number; percentage: number }[];
}

export default function PieChart({ data }: PieChartProps) {
  const option: EChartsOption = {
    tooltip: {
      trigger: 'item',
      formatter: '{b}: {c} ({d}%)',
    },
    series: [
      {
        type: 'pie',
        radius: ['40%', '70%'],
        avoidLabelOverlap: false,
        itemStyle: {
          borderRadius: 4,
          borderColor: '#FFFFFF',
          borderWidth: 2,
        },
        label: {
          color: '#6B7280',
          fontSize: 13,
        },
        data: data.map((d) => ({
          name: d.type_name,
          value: d.count,
        })),
      },
    ],
    color: ['#6366F1', '#8B5CF6', '#06B6D4', '#10B981', '#F59E0B', '#EC4899', '#F97316'],
  };

  return <ReactECharts option={option} style={{ height: '250px' }} />;
}
