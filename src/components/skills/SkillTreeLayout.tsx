import type { SkillModuleWithProgress } from '@/types';

/* ──────────────────────────── Level Config ──────────────────────────── */

const LEVEL_COLORS: Record<number, string> = {
  1: '#34c759',
  2: '#ff9500',
  3: '#af52de',
  4: '#ff3b30',
};

const LEVEL_NAMES: Record<number, string> = {
  1: '基础入门',
  2: '核心能力',
  3: '进阶专项',
  4: '实战综合',
};

/* ──────────────────────────── Types ──────────────────────────── */

export interface GraphNode {
  id: string;
  name: string;
  x: number;
  y: number;
  symbolSize: number;
  value: {
    progress_percentage: number;
    task_count: number;
    completed_count: number;
    level: number;
    level_name: string;
    icon: string;
    description: string;
    is_unlocked: boolean;
    is_custom: boolean;
  };
  itemStyle: {
    color: string;
    borderColor: string;
    borderWidth: number;
    shadowBlur?: number;
    shadowColor?: string;
  };
  label: {
    show: boolean;
    color: string;
    fontSize: number;
    fontWeight: string;
  };
  emphasis: {
    focus: string;
    itemStyle: { shadowBlur: number };
  };
}

export interface GraphLink {
  source: string;
  target: string;
  lineStyle: {
    width: number;
    color: string;
    type: string;
    curveness: number;
    opacity: number;
  };
}

export interface GraphData {
  nodes: GraphNode[];
  links: GraphLink[];
  levels: { level: number; name: string; color: string; y: number }[];
}

/* ──────────────────────────── Transform ──────────────────────────── */

interface ModuleWithCustom extends SkillModuleWithProgress {
  is_custom?: boolean;
}

export function buildSkillGraphData(modules: ModuleWithCustom[]): GraphData {
  if (!modules.length) return { nodes: [], links: [], levels: [] };

  const maxLevel = Math.max(...modules.map((m) => m.level));
  const levelCounts: Record<number, number> = {};
  const levelIndices: Record<number, number> = {};

  for (const m of modules) {
    levelCounts[m.level] = (levelCounts[m.level] || 0) + 1;
  }

  // Canvas dimensions
  const canvasWidth = 800;
  const canvasHeight = maxLevel * 180;
  const levelGap = canvasHeight / (maxLevel + 1);

  // Level metadata
  const levels: GraphData['levels'] = [];
  for (let lv = 1; lv <= maxLevel; lv++) {
    levels.push({
      level: lv,
      name: LEVEL_NAMES[lv] || `Level ${lv}`,
      color: LEVEL_COLORS[lv] || '#6B7280',
      y: lv * levelGap,
    });
  }

  // Build module lookup
  const moduleMap = new Map<string, ModuleWithCustom>();
  for (const m of modules) {
    moduleMap.set(m.id, m);
  }

  // Build nodes
  const nodes: GraphNode[] = modules.map((m) => {
    const levelColor = LEVEL_COLORS[m.level] || '#6B7280';
    const count = levelCounts[m.level];
    const idx = levelIndices[m.level] || 0;
    levelIndices[m.level] = idx + 1;

    // Position
    const x = (canvasWidth / (count + 1)) * (idx + 1);
    const y = m.level * levelGap;

    // Style based on progress
    const progress = m.progress_percentage;
    const isCompleted = progress === 100;
    const isInProgress = progress > 0 && progress < 100;
    const isUnlocked = m.is_unlocked;

    let symbolSize: number;
    let color: string;
    let borderColor: string;
    let borderWidth: number;
    let shadowBlur: number | undefined;
    let shadowColor: string | undefined;
    let labelColor: string;
    let fontSize: number;
    let fontWeight: string;

    if (isCompleted) {
      // Lit up / glowing
      symbolSize = 60;
      color = levelColor;
      borderColor = levelColor;
      borderWidth = 3;
      shadowBlur = 25;
      shadowColor = levelColor + '99'; // 0.6 alpha
      labelColor = '#FFFFFF';
      fontSize = 13;
      fontWeight = 'bold';
    } else if (isInProgress) {
      symbolSize = 55;
      color = levelColor + 'B3'; // 0.7 alpha
      borderColor = levelColor + '80'; // 0.5 alpha
      borderWidth = 2;
      labelColor = '#1F2937';
      fontSize = 12;
      fontWeight = '600';
    } else if (isUnlocked) {
      symbolSize = 50;
      color = levelColor + '4D'; // 0.3 alpha
      borderColor = levelColor + '33'; // 0.2 alpha
      borderWidth = 1.5;
      labelColor = '#6B7280';
      fontSize = 11;
      fontWeight = 'normal';
    } else {
      // Locked
      symbolSize = 45;
      color = '#D1D5DB';
      borderColor = '#E5E7EB';
      borderWidth = 1;
      labelColor = '#9CA3AF';
      fontSize = 10;
      fontWeight = 'normal';
    }

    return {
      id: m.id,
      name: m.name,
      x,
      y,
      symbolSize,
      value: {
        progress_percentage: progress,
        task_count: m.task_count,
        completed_count: m.completed_count,
        level: m.level,
        level_name: m.level_name,
        icon: m.icon,
        description: m.description,
        is_unlocked: isUnlocked,
        is_custom: m.is_custom ?? false,
      },
      itemStyle: {
        color,
        borderColor,
        borderWidth,
        ...(shadowBlur ? { shadowBlur, shadowColor } : {}),
      },
      label: {
        show: true,
        color: labelColor,
        fontSize,
        fontWeight,
      },
      emphasis: {
        focus: 'adjacency',
        itemStyle: { shadowBlur: 30 },
      },
    };
  });

  // Build links from prerequisites
  const links: GraphLink[] = [];
  for (const m of modules) {
    for (const prereqId of m.prerequisites) {
      const prereqModule = moduleMap.get(prereqId);
      if (!prereqModule) continue;

      const prereqCompleted = prereqModule.progress_percentage === 100;
      const prereqColor = LEVEL_COLORS[prereqModule.level] || '#6B7280';

      links.push({
        source: prereqId,
        target: m.id,
        lineStyle: {
          width: prereqCompleted ? 2.5 : 1.5,
          color: prereqCompleted ? prereqColor : '#D1D5DB',
          type: prereqCompleted ? 'solid' : 'dashed',
          curveness: 0.2,
          opacity: prereqCompleted ? 0.7 : 0.35,
        },
      });
    }
  }

  return { nodes, links, levels };
}
