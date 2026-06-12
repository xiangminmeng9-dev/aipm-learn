'use client';

import { useState, useEffect, useCallback } from 'react';
import GradientBackground from '@/components/ui/gradient-background';
import ReactECharts from '@/components/ui/LazyECharts';
import { apiFetch } from '@/lib/api/fetch';

interface CodingStats {
  flows_count: number;
  flows_week_count: number;
  spec_count: number;
  avg_score: number;
  methodology_count: number;
  flows_change: number;
  activity_trend: { date: string; count: number }[];
  mode_distribution: { mode: string; count: number }[];
  score_trend: { date: string; score: number }[];
  dimension_scores: { name: string; avgScore: number }[];
  methodology_status: { status: string; count: number }[];
  funnel_stages: { stage: string; count: number }[];
}

const statCards = [
  { key: 'flows_count', label: '开发流程总数', icon: '🔄', subKey: 'flows_week_count', subLabel: '近7天新增' },
  { key: 'spec_count', label: 'Spec练习总数', icon: '📝' },
  { key: 'avg_score', label: '平均得分', icon: '⭐', suffix: '分' },
  { key: 'methodology_count', label: '方法论生成', icon: '📚' },
];

export default function CodingDashboardPage() {
  const [stats, setStats] = useState<CodingStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [range, setRange] = useState<'7d' | '30d' | 'all'>('30d');
  const [error, setError] = useState<string | null>(null);

  const fetchDashboard = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const r = await apiFetch(`/api/coding/dashboard?range=${range}`);
      if (r.ok) {
        const d = await r.json();
        if (d.stats) setStats(d.stats);
        else setStats(null);
      } else {
        setError('加载看板数据失败');
        setStats(null);
      }
    } catch {
      setError('加载看板数据失败');
      setStats(null);
    } finally {
      setLoading(false);
    }
  }, [range]);

  useEffect(() => { fetchDashboard(); }, [fetchDashboard]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-indigo-500 border-t-transparent" />
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="flex min-h-screen items-center justify-center p-6">
        <div className="text-center">
          {error ? (
            <>
              <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-800 dark:bg-red-900/30 dark:text-red-300">
                <p>{error}</p>
                <button onClick={fetchDashboard} className="mt-1 text-xs font-medium text-red-600 hover:text-red-800 dark:text-red-400">重试</button>
              </div>
            </>
          ) : (
            <>
              <p className="text-lg font-medium text-muted-foreground">暂无Coding练习数据</p>
              <p className="mt-2 text-sm text-muted-foreground">开始练习后，看板数据将自动展示</p>
            </>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col overflow-hidden bg-background">
      <GradientBackground />
      <div className="relative z-10 flex-1 overflow-y-auto p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Coding看板</h1>
            <p className="mt-1 text-sm font-medium text-muted-foreground">追踪编程练习进度，提升开发能力</p>
          </div>
          <div className="flex items-center gap-1 rounded-lg bg-muted p-1">
            {(['7d', '30d', 'all'] as const).map(r => (
              <button
                key={r}
                onClick={() => setRange(r)}
                className={`rounded-md px-4 py-1.5 text-xs font-semibold transition-colors ${
                  range === r ? 'bg-indigo-600 text-white' : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                {r === '7d' ? '近7天' : r === '30d' ? '近30天' : '全部'}
              </button>
            ))}
          </div>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {statCards.map(card => {
            const value = stats[card.key as keyof CodingStats] as number;
            return (
              <div key={card.key} className="rounded-2xl border border-border bg-card p-4 shadow-sm">
                <div className="flex items-center gap-2">
                  <span className="text-lg">{card.icon}</span>
                  <span className="text-xs text-muted-foreground">{card.label}</span>
                </div>
                <div className="mt-2 flex items-end justify-between">
                  <span className="text-2xl font-bold text-foreground">
                    {value}{card.suffix || ''}
                  </span>
                  {card.subKey && (
                    <span className="text-xs text-muted-foreground">
                      近7天 +{stats[card.subKey as keyof CodingStats] as number}
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Row 1: Activity Trend + Mode Distribution */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          <div className="lg:col-span-2 rounded-2xl border border-border bg-card p-5 shadow-sm">
            <h3 className="mb-4 text-sm font-semibold text-foreground">每日活动趋势</h3>
            <ReactECharts
              option={{
                tooltip: { trigger: 'axis' },
                xAxis: {
                  type: 'category',
                  data: stats.activity_trend.map(t => t.date.slice(5)),
                  axisLabel: { fontSize: 10, color: '#6B7280' },
                },
                yAxis: { type: 'value', axisLabel: { fontSize: 10, color: '#6B7280' } },
                series: [{
                  type: 'bar',
                  data: stats.activity_trend.map(t => t.count),
                  itemStyle: { color: '#6366F1', borderRadius: [4, 4, 0, 0] },
                }],
                grid: { left: 40, right: 20, top: 20, bottom: 30 },
              }}
              style={{ height: 200 }}
            />
          </div>
          <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
            <h3 className="mb-4 text-sm font-semibold text-foreground">模式分布</h3>
            {stats.mode_distribution.length > 0 ? (
              <ReactECharts
                option={{
                  tooltip: { trigger: 'item' },
                  series: [{
                    type: 'pie',
                    radius: ['40%', '70%'],
                    data: stats.mode_distribution.map(m => ({ name: m.mode, value: m.count })),
                    label: { fontSize: 10, color: '#6B7280' },
                  }],
                }}
                style={{ height: 200 }}
              />
            ) : (
              <div className="flex h-[200px] items-center justify-center text-sm text-muted-foreground">暂无数据</div>
            )}
          </div>
        </div>

        {/* Row 2: Score Trend + Dimension Scores */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
            <h3 className="mb-4 text-sm font-semibold text-foreground">Spec得分趋势</h3>
            {stats.score_trend.length > 0 ? (
              <ReactECharts
                option={{
                  tooltip: { trigger: 'axis' },
                  xAxis: {
                    type: 'category',
                    data: stats.score_trend.map(t => t.date.slice(5)),
                    axisLabel: { fontSize: 10, color: '#6B7280' },
                  },
                  yAxis: { type: 'value', min: 0, max: 100, axisLabel: { fontSize: 10, color: '#6B7280' } },
                  series: [{
                    type: 'line',
                    data: stats.score_trend.map(t => t.score),
                    smooth: true,
                    lineStyle: { color: '#10B981', width: 2 },
                    itemStyle: { color: '#10B981' },
                    areaStyle: { opacity: 0.2 },
                  }],
                  grid: { left: 40, right: 20, top: 20, bottom: 30 },
                }}
                style={{ height: 200 }}
              />
            ) : (
              <div className="flex h-[200px] items-center justify-center text-sm text-muted-foreground">暂无数据</div>
            )}
          </div>
          <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
            <h3 className="mb-4 text-sm font-semibold text-foreground">维度得分分布</h3>
            {stats.dimension_scores.length > 0 ? (
              <ReactECharts
                option={{
                  tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } },
                  radar: {
                    indicator: stats.dimension_scores.slice(0, 6).map(d => ({ name: d.name, max: 100 })),
                    axisName: { color: '#6B7280', fontSize: 10 },
                  },
                  series: [{
                    type: 'radar',
                    data: [{
                      value: stats.dimension_scores.slice(0, 6).map(d => d.avgScore),
                      name: '平均得分',
                      areaStyle: { opacity: 0.3 },
                      lineStyle: { color: '#6366F1' },
                      itemStyle: { color: '#6366F1' },
                    }],
                  }],
                }}
                style={{ height: 200 }}
              />
            ) : (
              <div className="flex h-[200px] items-center justify-center text-sm text-muted-foreground">暂无数据</div>
            )}
          </div>
        </div>

        {/* Row 3: Methodology Status + Funnel */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
            <h3 className="mb-4 text-sm font-semibold text-foreground">方法论状态</h3>
            {stats.methodology_status.length > 0 ? (
              <div className="space-y-3">
                {stats.methodology_status.map((s, i) => (
                  <div key={i} className="flex items-center justify-between rounded-lg bg-muted/50 px-4 py-3">
                    <span className="text-sm text-foreground capitalize">{s.status === 'draft' ? '草稿' : s.status === 'published' ? '已发布' : s.status}</span>
                    <span className="text-sm font-medium text-indigo-600">{s.count}</span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex h-[150px] items-center justify-center text-sm text-muted-foreground">暂无方法论</div>
            )}
          </div>
          <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
            <h3 className="mb-4 text-sm font-semibold text-foreground">学习转化漏斗</h3>
            <ReactECharts
              option={{
                tooltip: { trigger: 'item' },
                series: [{
                  type: 'funnel',
                  left: '10%',
                  top: 20,
                  bottom: 20,
                  width: '80%',
                  min: 0,
                  max: Math.max(...stats.funnel_stages.map(s => s.count), 1),
                  data: stats.funnel_stages.map((s, i) => ({
                    name: s.stage,
                    value: s.count,
                    itemStyle: { color: ['#6366F1', '#F59E0B', '#10B981'][i] },
                  })),
                  label: { fontSize: 11, color: '#374151' },
                }],
              }}
              style={{ height: 200 }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
