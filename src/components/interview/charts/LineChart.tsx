'use client';

import dynamic from 'next/dynamic';
import type { EChartsOption } from 'echarts';

const ReactECharts = dynamic(() => import('echarts-for-react'), { ssr: false });

interface LineChartProps {
  data: { date: string; score: number }[];
}

export default function LineChart({ data }: LineChartProps) {
  const option: EChartsOption = {
    tooltip: {
      trigger: 'axis',
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '3%',
      containLabel: true,
    },
    xAxis: {
      type: 'category',
      data: data.map((d) => d.date),
      axisLabel: { color: '#6B7280', fontSize: 12 },
      axisLine: { lineStyle: { color: '#D1D5DB' } },
    },
    yAxis: {
      type: 'value',
      min: 0,
      max: 10,
      axisLabel: { color: '#6B7280', fontSize: 12 },
      splitLine: { lineStyle: { color: '#F3F4F6' } },
    },
    series: [
      {
        type: 'line',
        data: data.map((d) => d.score),
        smooth: true,
        lineStyle: { color: '#6366F1', width: 2 },
        itemStyle: { color: '#6366F1' },
        areaStyle: {
          color: {
            type: 'linear',
            x: 0,
            y: 0,
            x2: 0,
            y2: 1,
            colorStops: [
              { offset: 0, color: 'rgba(99, 102, 241, 0.3)' },
              { offset: 1, color: 'rgba(99, 102, 241, 0)' },
            ],
          },
        },
      },
    ],
  };

  return <ReactECharts option={option} style={{ height: '250px' }} />;
}
