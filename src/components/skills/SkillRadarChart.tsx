'use client';

import { useMemo } from 'react';
import ReactECharts from 'echarts-for-react';

interface ModuleData {
  id: string;
  level: number;
  progress_percentage: number;
}

interface SkillRadarChartProps {
  modules: ModuleData[];
  interviewAvgScore?: number;
}

const LEVEL_LABELS: Record<number, string> = {
  1: '基础入门',
  2: '核心能力',
  3: '进阶专项',
  4: '实战综合',
};

export default function SkillRadarChart({ modules, interviewAvgScore }: SkillRadarChartProps) {
  const option = useMemo(() => {
    const levelScores: Record<number, number[]> = { 1: [], 2: [], 3: [], 4: [] };
    for (const m of modules) {
      if (levelScores[m.level]) {
        levelScores[m.level].push(m.progress_percentage ?? 0);
      }
    }

    const avg = (arr: number[]) => (arr.length ? Math.round(arr.reduce((a, b) => a + b, 0) / arr.length) : 0);

    const indicators = [
      { name: `基础入门\n${avg(levelScores[1])}%`, max: 100 },
      { name: `核心能力\n${avg(levelScores[2])}%`, max: 100 },
      { name: `进阶专项\n${avg(levelScores[3])}%`, max: 100 },
      { name: `实战综合\n${avg(levelScores[4])}%`, max: 100 },
      { name: `面试表现\n${interviewAvgScore ?? 0}%`, max: 100 },
    ];

    const values = [
      avg(levelScores[1]),
      avg(levelScores[2]),
      avg(levelScores[3]),
      avg(levelScores[4]),
      interviewAvgScore ?? 0,
    ];

    return {
      radar: {
        indicator: indicators,
        shape: 'polygon' as const,
        radius: '70%',
        axisName: {
          color: '#6B7280',
          fontSize: 11,
          lineHeight: 16,
        },
        splitArea: {
          areaStyle: { color: ['rgba(79,70,229,0.02)', 'rgba(79,70,229,0.04)', 'rgba(79,70,229,0.06)', 'rgba(79,70,229,0.08)'] },
        },
        splitLine: { lineStyle: { color: 'rgba(79,70,229,0.15)' } },
        axisLine: { lineStyle: { color: 'rgba(79,70,229,0.2)' } },
      },
      series: [{
        type: 'radar' as const,
        data: [{
          value: values,
          name: '能力画像',
          areaStyle: { color: 'rgba(79,70,229,0.15)' },
          lineStyle: { color: '#4F46E5', width: 2 },
          itemStyle: { color: '#4F46E5' },
          symbol: 'circle',
          symbolSize: 6,
        }],
      }],
      tooltip: {
        trigger: 'item' as const,
        formatter: (params: { value?: number[] }) => {
          if (!params.value) return '';
          const labels = ['基础入门', '核心能力', '进阶专项', '实战综合', '面试表现'];
          return labels.map((l, i) => `${l}: ${params.value![i]}%`).join('<br/>');
        },
      },
    };
  }, [modules, interviewAvgScore]);

  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <h3 className="mb-3 text-sm font-semibold text-foreground">能力画像</h3>
      <ReactECharts option={option} style={{ height: 280 }} opts={{ renderer: 'svg' }} />
    </div>
  );
}
