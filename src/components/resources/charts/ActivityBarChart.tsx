'use client';

import dynamic from 'next/dynamic';
import type { EChartsOption } from 'echarts';

const ReactECharts = dynamic(() => import('echarts-for-react'), { ssr: false });

interface Props {
  data: { date: string; count: number }[];
}

export default function ActivityBarChart({ data }: Props) {
  const option: EChartsOption = {
    tooltip: { trigger: 'axis', formatter: (params: unknown) => {
      const p = (params as { name: string; value: number }[])[0];
      return p ? `${p.name}<br/>新增 <b>${p.value}</b> 个` : '';
    }},
    grid: { left: 40, right: 16, top: 16, bottom: 32 },
    xAxis: {
      type: 'category',
      data: data.map((d) => d.date),
      axisLabel: { fontSize: 11, color: '#9CA3AF', rotate: data.length > 10 ? 30 : 0 },
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
        type: 'bar',
        data: data.map((d) => ({
          value: d.count,
          itemStyle: { color: d.count > 0 ? '#6366F1' : '#E5E7EB', borderRadius: [4, 4, 0, 0] },
        })),
        barWidth: data.length > 14 ? 12 : 20,
      },
    ],
  };

  return <ReactECharts option={option} style={{ height: 240 }} />;
}