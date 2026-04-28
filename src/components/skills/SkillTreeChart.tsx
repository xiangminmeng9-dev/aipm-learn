'use client';

import dynamic from 'next/dynamic';
import type { GraphData } from './SkillTreeLayout';

const ReactECharts = dynamic(() => import('echarts-for-react'), { ssr: false });

interface SkillTreeChartProps {
  data: GraphData;
  onNodeClick?: (moduleId: string, isCustom: boolean) => void;
}

interface ModuleData {
  progress_percentage: number;
  task_count: number;
  completed_count: number;
  level: number;
  level_name: string;
  icon: string;
  description: string;
  is_unlocked: boolean;
  is_custom: boolean;
}

export default function SkillTreeChart({ data, onNodeClick }: SkillTreeChartProps) {
  const { nodes, links, levels } = data;

  // Build prerequisite/dependent lookup for tooltip
  const prereqMap = new Map<string, string[]>();
  const dependentMap = new Map<string, string[]>();
  const nameMap = new Map<string, string>();
  for (const n of nodes) nameMap.set(n.id, n.name);
  for (const l of links) {
    const sName = nameMap.get(l.source) ?? '';
    const tName = nameMap.get(l.target) ?? '';
    const deps = dependentMap.get(l.source) ?? [];
    deps.push(tName);
    dependentMap.set(l.source, deps);
    const prereqs = prereqMap.get(l.target) ?? [];
    prereqs.push(sName);
    prereqMap.set(l.target, prereqs);
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const option: any = {
    tooltip: {
      trigger: 'item',
      formatter: (params: { dataType?: string; data?: { name?: string; id?: string; moduleData?: ModuleData } }) => {
        if (params.dataType !== 'node' || !params.data?.moduleData) return '';
        const v = params.data.moduleData;
        const barWidth = 100;
        const filled = Math.round((v.progress_percentage ?? 0) / 100 * barWidth);
        const badge = v.is_custom ? '<span style="color:#4F46E5;font-size:10px;margin-left:4px">✨自定义</span>' : '';
        const prereqs = prereqMap.get(params.data.id ?? '') ?? [];
        const dependents = dependentMap.get(params.data.id ?? '') ?? [];
        const prereqHtml = prereqs.length ? `<div style="font-size:10px;color:#6B7280;margin-top:4px">前置: ${prereqs.join(', ')}</div>` : '';
        const depHtml = dependents.length ? `<div style="font-size:10px;color:#6B7280">后置: ${dependents.join(', ')}</div>` : '';
        return `
          <div style="min-width:180px">
            <div style="font-size:15px;font-weight:700;margin-bottom:4px">${v.icon ?? ''} ${params.data.name ?? ''}${badge}</div>
            <div style="font-size:11px;color:#6B7280;margin-bottom:6px">${v.level_name ?? ''} · Level ${v.level}</div>
            <div style="background:#E5E7EB;border-radius:4px;height:6px;width:${barWidth}px;margin-bottom:4px">
              <div style="background:#4F46E5;border-radius:4px;height:6px;width:${filled}px"></div>
            </div>
            <div style="font-size:11px;color:#6B7280">${v.completed_count}/${v.task_count} 任务完成 · ${v.progress_percentage}%</div>
            ${prereqHtml}${depHtml}
            <div style="font-size:10px;color:#9CA3AF;margin-top:4px">点击查看详情</div>
          </div>
        `;
      },
      backgroundColor: '#FFFFFF',
      borderColor: '#E5E7EB',
      textStyle: { color: '#1F2937', fontSize: 13 },
      extraCssText: 'border-radius: 12px; box-shadow: 0 4px 12px rgba(0,0,0,0.08);',
    },
    graphic: levels.map((lv) => ({
      type: 'text',
      left: 10,
      top: `${((lv.y / ((levels.length + 1) * 180)) * 100).toFixed(1)}%`,
      style: {
        text: lv.name,
        fill: lv.color,
        fontSize: 14,
        fontWeight: 'bold',
        opacity: 0.5,
      },
      silent: true,
    })),
    series: [
      {
        type: 'graph',
        layout: 'none',
        roam: true,
        draggable: true,
        symbol: 'circle',
        data: nodes.map((n) => ({
          id: n.id,
          name: n.name,
          x: n.x,
          y: n.y,
          symbolSize: n.symbolSize,
          value: n.value.progress_percentage,
          moduleData: n.value,
          itemStyle: n.itemStyle,
          label: {
            show: true,
            color: n.label.color,
            fontSize: n.label.fontSize,
            fontWeight: n.label.fontWeight,
            position: 'bottom',
            distance: 5,
          },
          emphasis: n.emphasis,
        })),
        links: links.map((l) => ({
          source: l.source,
          target: l.target,
          lineStyle: l.lineStyle,
          ...(l.symbol ? { symbol: l.symbol } : {}),
          ...(l.symbolSize ? { symbolSize: l.symbolSize } : {}),
        })),
        emphasis: {
          focus: 'adjacency',
          label: { fontSize: 14, fontWeight: 'bold' },
        },
        animationDuration: 1000,
        animationEasingUpdate: 'quinticInOut',
      },
    ],
  };

  return (
    <div className="w-full" style={{ height: 650 }}>
      <ReactECharts
        option={option}
        style={{ height: '100%', width: '100%' }}
        onEvents={{
          click: (params: { dataType?: string; data?: { id?: string; moduleData?: ModuleData } }) => {
            if (params.dataType === 'node' && params.data?.id && onNodeClick) {
              onNodeClick(params.data.id, params.data.moduleData?.is_custom ?? false);
            }
          },
        }}
      />
    </div>
  );
}
