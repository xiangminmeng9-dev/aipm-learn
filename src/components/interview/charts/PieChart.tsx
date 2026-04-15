'use client';

import dynamic from 'next/dynamic';
import type { EChartsOption } from 'echarts';

const ReactECharts = dynamic(() => import('echarts-for-react'), { ssr: false });

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
          borderColor: '#171717',
          borderWidth: 2,
        },
        label: {
          color: '#a3a3a3',
          fontSize: 11,
        },
        data: data.map((d) => ({
          name: d.type_name,
          value: d.count,
        })),
      },
    ],
    color: ['#d97706', '#f59e0b', '#fbbf24', '#fcd34d', '#fde68a', '#92400e', '#78350f'],
  };

  return <ReactECharts option={option} style={{ height: '250px' }} />;
}
