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
      axisLabel: { color: '#737373', fontSize: 10 },
      axisLine: { lineStyle: { color: '#404040' } },
    },
    yAxis: {
      type: 'value',
      min: 0,
      max: 10,
      axisLabel: { color: '#737373', fontSize: 10 },
      splitLine: { lineStyle: { color: '#262626' } },
    },
    series: [
      {
        type: 'line',
        data: data.map((d) => d.score),
        smooth: true,
        lineStyle: { color: '#d97706', width: 2 },
        itemStyle: { color: '#d97706' },
        areaStyle: {
          color: {
            type: 'linear',
            x: 0,
            y: 0,
            x2: 0,
            y2: 1,
            colorStops: [
              { offset: 0, color: 'rgba(217, 119, 6, 0.3)' },
              { offset: 1, color: 'rgba(217, 119, 6, 0)' },
            ],
          },
        },
      },
    ],
  };

  return <ReactECharts option={option} style={{ height: '250px' }} />;
}
