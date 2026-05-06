'use client';

import { useMemo } from 'react';
import { useRouter } from 'next/navigation';
import ReactECharts from '@/components/ui/EChartsWrapper';

interface KnowledgeLink {
  source: string;
  target: string;
}

interface KnowledgeGraphProps {
  modules: { id: string; name: string; level: number; level_name: string; is_custom?: boolean; progress_percentage: number; prerequisites?: string[] }[];
  onNodeClick?: (href: string) => void;
}

const CATEGORY_COLORS: Record<string, string> = {
  '基础入门': '#34c759',
  '核心能力': '#ff9500',
  '进阶专项': '#af52de',
  '实战综合': '#ff3b30',
};

// AI PM knowledge system connections (conceptual relationships beyond prerequisites)
const KNOWLEDGE_LINKS: KnowledgeLink[] = [
  // 基础 → 核心
  { source: 'ai-basics', target: 'llm-tech' },
  { source: 'ai-basics', target: 'product-thinking' },
  { source: 'ai-basics', target: 'data-analysis' },
  // 核心 → 进阶
  { source: 'llm-tech', target: 'ai-design' },
  { source: 'llm-tech', target: 'algo-collab' },
  { source: 'product-thinking', target: 'ai-design' },
  { source: 'product-thinking', target: 'user-research' },
  { source: 'data-analysis', target: 'ai-eval' },
  { source: 'data-analysis', target: 'ab-testing' },
  // 进阶 → 实战
  { source: 'ai-design', target: 'ai-strategy' },
  { source: 'algo-collab', target: 'ai-strategy' },
  { source: 'ai-eval', target: 'ai-strategy' },
  { source: 'user-research', target: 'ai-strategy' },
  // Cross-links
  { source: 'llm-tech', target: 'ai-eval' },
  { source: 'product-thinking', target: 'ab-testing' },
  { source: 'algo-collab', target: 'ai-design' },
];

const DEFAULT_NODES = [
  { id: 'ai-basics', name: 'AI 产品基础', category: '基础入门', level: 1, href: '/skills/tree' },
  { id: 'llm-tech', name: 'LLM 技术原理', category: '核心能力', level: 2, href: '/skills/tree' },
  { id: 'product-thinking', name: '产品思维', category: '核心能力', level: 2, href: '/skills/tree' },
  { id: 'data-analysis', name: '数据分析', category: '核心能力', level: 2, href: '/skills/tree' },
  { id: 'ai-design', name: 'AI 产品设计', category: '进阶专项', level: 3, href: '/skills/tree' },
  { id: 'algo-collab', name: '算法沟通协作', category: '进阶专项', level: 3, href: '/skills/tree' },
  { id: 'ai-eval', name: 'AI 评测验收', category: '进阶专项', level: 3, href: '/skills/tree' },
  { id: 'user-research', name: '用户研究', category: '进阶专项', level: 3, href: '/skills/tree' },
  { id: 'ab-testing', name: 'A/B 测试', category: '进阶专项', level: 3, href: '/skills/tree' },
  { id: 'ai-strategy', name: 'AI 战略规划', category: '实战综合', level: 4, href: '/skills/tree' },
];

export default function KnowledgeGraph({ modules, onNodeClick }: KnowledgeGraphProps) {
  const router = useRouter();

  const option = useMemo(() => {
    const nodes = modules.length > 0
      ? modules.filter((m) => m.id !== '__jd_gaps__' && m.id !== '__bookmarked_tech__').map((m) => ({
          id: m.id,
          name: m.name,
          category: m.level_name,
          level: m.level,
          href: m.is_custom ? `/skills/custom-module/${m.id}` : `/skills/module/${m.id}`,
          progress: m.progress_percentage,
          prerequisites: m.prerequisites ?? [],
          is_custom: m.is_custom ?? false,
        }))
      : DEFAULT_NODES.map((n) => ({ ...n, progress: 0, prerequisites: [], is_custom: false }));

    const nodeMap = new Map(nodes.map((n) => [n.id, n]));

    // Build links from prerequisites (works for both system and custom modules)
    const links: { source: string; target: string }[] = [];
    const linkSet = new Set<string>();

    const addLink = (source: string, target: string) => {
      const key = `${source}->${target}`;
      if (!linkSet.has(key) && nodeMap.has(source) && nodeMap.has(target)) {
        links.push({ source, target });
        linkSet.add(key);
      }
    };

    // 1. Prerequisites from actual module data (covers custom modules too)
    for (const n of nodes) {
      for (const prereq of n.prerequisites) {
        addLink(prereq, n.id);
      }
    }

    // 2. Conceptual knowledge links (only for default node IDs)
    for (const kl of KNOWLEDGE_LINKS) {
      addLink(kl.source, kl.target);
    }

    // Layout: horizontal layers with wide spacing
    const levelGroups: Record<number, typeof nodes> = {};
    for (const n of nodes) {
      if (!levelGroups[n.level]) levelGroups[n.level] = [];
      levelGroups[n.level].push(n);
    }

    const positions = new Map<string, { x: number; y: number }>();
    const levelKeys = Object.keys(levelGroups).map(Number).sort((a, b) => a - b);
    const xStep = 650;
    const yStep = 160;
    const maxNodesInLevel = Math.max(...Object.values(levelGroups).map((g) => g.length));

    for (let li = 0; li < levelKeys.length; li++) {
      const level = levelKeys[li];
      const group = levelGroups[level];
      const x = 150 + li * xStep;
      const totalHeight = (group.length - 1) * yStep;
      const startY = ((maxNodesInLevel - 1) * yStep) / 2 - totalHeight / 2;
      group.forEach((n, i) => {
        positions.set(n.id, { x, y: startY + i * yStep });
      });
    }

    const echartsNodes = nodes.map((n) => {
      const pos = positions.get(n.id) ?? { x: 0, y: 0 };
      const color = CATEGORY_COLORS[n.category] ?? '#6B7280';
      const progress = n.progress ?? 0;
      const isCompleted = progress === 100;
      const isInProgress = progress > 0 && progress < 100;

      // Rectangular node with name inside
      const nameLen = n.name.length;
      const width = Math.max(100, nameLen * 14 + 24);
      const height = 36;

      return {
        id: n.id,
        name: n.name,
        x: pos.x,
        y: pos.y,
        symbolSize: [width, height],
        symbol: 'roundRect',
        value: progress,
        itemStyle: {
          color: isCompleted ? color : isInProgress ? color + '20' : '#F3F4F6',
          borderColor: color,
          borderWidth: isCompleted ? 2.5 : isInProgress ? 2 : 1.5,
          borderRadius: 8,
          shadowBlur: isCompleted ? 12 : 0,
          shadowColor: isCompleted ? color + '60' : undefined,
        },
        label: {
          show: true,
          fontSize: isCompleted ? 13 : 12,
          fontWeight: isCompleted ? 'bold' : 'normal',
          color: isCompleted ? '#FFFFFF' : isInProgress ? color : '#374151',
          position: 'inside',
        },
        href: n.href,
        is_custom: n.is_custom,
      };
    });

    const echartsLinks = links.map((l) => {
      const sourceNode = nodeMap.get(l.source);
      const targetNode = nodeMap.get(l.target);
      const isCustomLink = sourceNode?.is_custom || targetNode?.is_custom;

      return {
        source: l.source,
        target: l.target,
        lineStyle: {
          width: isCustomLink ? 2 : 1.5,
          color: isCustomLink ? '#6366F1' : '#9CA3AF',
          curveness: 0.2,
          opacity: isCustomLink ? 0.6 : 0.35,
          type: isCustomLink ? 'solid' : 'dashed',
        },
        symbol: ['none', 'arrow'],
        symbolSize: [0, 7],
      };
    });

    // Calculate chart dimensions based on layout
    const chartWidth = 200 + levelKeys.length * xStep + 300;
    const chartHeight = maxNodesInLevel * yStep + 300;

    return {
      tooltip: {
        trigger: 'item',
        formatter: (params: { dataType?: string; data?: { name?: string; value?: number; href?: string; is_custom?: boolean } }) => {
          if (params.dataType !== 'node') return '';
          const customTag = params.data?.is_custom ? ' (自定义)' : '';
          return `<div style="font-size:13px;font-weight:700">${params.data?.name ?? ''}${customTag}</div>
                  <div style="font-size:11px;color:#6B7280">完成度: ${params.data?.value ?? 0}%</div>
                  <div style="font-size:10px;color:#9CA3AF">点击进入学习</div>`;
        },
        backgroundColor: '#FFFFFF',
        borderColor: '#E5E7EB',
        textStyle: { color: '#1F2937', fontSize: 13 },
        extraCssText: 'border-radius: 12px; box-shadow: 0 4px 12px rgba(0,0,0,0.08);',
      },
      series: [{
        type: 'graph',
        layout: 'none',
        roam: true,
        draggable: true,
        data: echartsNodes,
        links: echartsLinks,
        emphasis: {
          focus: 'adjacency',
          label: { fontSize: 14, fontWeight: 'bold' },
          lineStyle: { width: 3, opacity: 0.8 },
        },
        animationDuration: 800,
      }],
      grid: { left: 0, right: 0, top: 0, bottom: 0 },
    };
  }, [modules]);

  const handleClick = (params: { dataType?: string; data?: { href?: string } }) => {
    if (params.dataType === 'node' && params.data?.href) {
      if (onNodeClick) onNodeClick(params.data.href);
      else router.push(params.data.href);
    }
  };

  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <h3 className="mb-3 text-sm font-semibold text-foreground">AI PM 知识图谱</h3>
      <div className="overflow-x-auto">
        <ReactECharts
          option={option}
          style={{ height: 800, minWidth: 1300, width: '100%' }}
          onEvents={{ click: handleClick }}
        />
      </div>
    </div>
  );
}
