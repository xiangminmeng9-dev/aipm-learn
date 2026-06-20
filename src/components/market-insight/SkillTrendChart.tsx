'use client';

import { useMemo } from 'react';
import LazyECharts from '@/components/ui/LazyECharts';
import { getSkillCategory } from '@/lib/ai/skill-categories';

interface SkillTrendChartProps {
  skillFrequency: Record<string, number>;
  categoryDistribution: Record<string, number>;
}

const CATEGORY_COLORS: Record<string, string> = {
  'AI核心技术': '#6366f1',
  'AI产品': '#8b5cf6',
  '产品核心': '#06b6d4',
  '数据与评估': '#ec4899',
  '技术理解': '#3b82f6',
  '用户与商业': '#f59e0b',
  '软技能': '#10b981',
  '未分类': '#94a3b8',
};

export default function SkillTrendChart({
  skillFrequency,
  categoryDistribution,
}: SkillTrendChartProps) {
  const sorted = useMemo(
    () => Object.entries(skillFrequency).sort((a, b) => b[1] - a[1]).slice(0, 20),
    [skillFrequency]
  );

  // Build skill→category map using the actual getSkillCategory function
  const skillCategories = useMemo(
    () => Object.fromEntries(sorted.map(([skill]) => [skill, getSkillCategory(skill)])),
    [sorted]
  );

  if (sorted.length === 0) {
    return (
      <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
        <p className="text-sm text-muted-foreground">暂无技能数据</p>
      </div>
    );
  }

  const categories = Object.keys(categoryDistribution);

  const option: Record<string, unknown> = {
    tooltip: {
      trigger: 'axis' as const,
      axisPointer: { type: 'shadow' as const },
    },
    grid: {
      left: 120,
      right: 40,
      top: 10,
      bottom: 20,
    },
    xAxis: {
      type: 'value' as const,
      axisLabel: { fontSize: 11 },
      splitLine: { lineStyle: { type: 'dashed' as const } },
    },
    yAxis: {
      type: 'category' as const,
      data: sorted.map(([name]) => name).reverse(),
      axisLabel: { fontSize: 12, width: 100, overflow: 'truncate' as const },
    },
    series: [
      {
        type: 'bar' as const,
        data: sorted
          .map(([name, value]) => ({
            value,
            itemStyle: {
              color: CATEGORY_COLORS[skillCategories[name]] ?? '#94a3b8',
              borderRadius: [0, 4, 4, 0],
            },
          }))
          .reverse(),
        barMaxWidth: 24,
        label: {
          show: true,
          position: 'right' as const,
          fontSize: 11,
          color: '#71717a',
        },
      },
    ],
  };

  return (
    <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
      <h3 className="mb-4 text-base font-semibold text-foreground">
        技能频率 Top 20
      </h3>
      {/* Legend for categories */}
      {categories.length > 0 && (
        <div className="mb-3 flex flex-wrap gap-3">
          {categories.map((cat) => (
            <span key={cat} className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <span
                className="inline-block h-2.5 w-2.5 rounded-sm"
                style={{ backgroundColor: CATEGORY_COLORS[cat] ?? '#94a3b8' }}
              />
              {cat}
            </span>
          ))}
        </div>
      )}
      <LazyECharts
        option={option}
        style={{ height: Math.max(300, sorted.length * 28) }}
      />
    </div>
  );
}
