'use client';

import dynamic from 'next/dynamic';
import type { EChartsOption } from 'echarts';
import { CHART_COLORS } from '../constants';

const ReactECharts = dynamic(() => import('echarts-for-react'), { ssr: false });

interface Props {
  data: { name: string; value: number; children?: { name: string; value: number }[] }[];
}

export default function FolderTreemapChart({ data }: Props) {
  const option: EChartsOption = {
    tooltip: { formatter: (params: unknown) => {
      const p = params as { name: string; value: number };
      return `${p.name}: ${p.value} 个资源`;
    }},
    series: [
      {
        type: 'treemap',
        width: '100%',
        height: '90%',
        roam: false,
        nodeClick: false,
        breadcrumb: { show: false },
        label: { show: true, fontSize: 12, color: '#fff', formatter: (params: unknown) => {
          const p = params as { name: string; value: number };
          return `${p.name}\n${p.value}`;
        }},
        itemStyle: { borderColor: '#fff', borderWidth: 2, gapWidth: 2 },
        levels: [
          {
            itemStyle: { borderColor: '#fff', borderWidth: 2, gapWidth: 2 },
            color: CHART_COLORS,
          },
        ],
        data,
      },
    ],
  };

  return <ReactECharts option={option} style={{ height: 280 }} />;
}