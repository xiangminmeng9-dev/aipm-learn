'use client';

import { useState, useEffect, useCallback } from 'react';
import GradientBackground from '@/components/ui/gradient-background';
import ReactECharts from '@/components/ui/LazyECharts';
import { apiFetch } from '@/lib/api/fetch';

interface NotebookStats {
  total_notes: number;
  total_ai_notes: number;
  total_tasks: number;
  completed_tasks: number;
  total_todos: number;
  completed_todos: number;
  notes_change: number;
  tasks_change: number;
  category_distribution: { category: string; count: number }[];
  task_status_stats: { status: string; count: number; color: string }[];
  todo_status_stats: { status: string; count: number; color: string }[];
  todo_priority_stats: { priority: string; count: number; color: string }[];
  activity_trend: { date: string; notes: number; tasks: number }[];
  todo_trend: { date: string; created: number; completed: number }[];
  recent_notes: { id: string; title: string; category: string; updated_at: string }[];
  recent_tasks: { id: string; title: string; status: string; priority: string }[];
  recent_todos: { id: string; title: string; status: string; priority: string; due_date: string | null }[];
}

const categoryLabels: Record<string, string> = {
  problem: '问题',
  insight: '洞察',
  meeting: '会议',
  general: '通用',
};

const CATEGORY_COLORS = ['#F59E0B', '#10B981', '#0EA5E9', '#8B5CF6'];

const statCards = [
  { key: 'total_notes', label: '笔记总数', icon: '📝' },
  { key: 'total_todos', label: '待办事项', icon: '📌' },
  { key: 'total_tasks', label: '每日任务', icon: '📋' },
  { key: 'total_ai_notes', label: 'AI分析', icon: '🤖' },
];

export default function NotebookDashboardPage() {
  const [stats, setStats] = useState<NotebookStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [range, setRange] = useState<'7d' | '30d' | 'all'>('30d');

  const loadData = useCallback(async (r: string) => {
    try {
      const res = await apiFetch(`/api/notebook/dashboard?range=${r}`);
      const d = await res.json();
      if (d.stats) setStats(d.stats);
    } catch (e) {
      console.error('Load error:', e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    setLoading(true);
    loadData(range);
  }, [range, loadData]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-amber-500 border-t-transparent" />
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="flex min-h-screen items-center justify-center p-6">
        <div className="text-center">
          <p className="text-lg font-medium text-muted-foreground">暂无笔记本数据</p>
          <p className="mt-2 text-sm text-muted-foreground">开始记录笔记后，看板数据将自动展示</p>
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
            <h1 className="text-2xl font-bold text-foreground">笔记本看板</h1>
            <p className="mt-1 text-sm font-medium text-muted-foreground">追踪笔记与任务，洞察学习节奏</p>
          </div>
          <div className="flex items-center gap-1 rounded-lg bg-muted p-1">
            {(['7d', '30d', 'all'] as const).map(r => (
              <button
                key={r}
                onClick={() => setRange(r)}
                className={`rounded-md px-4 py-1.5 text-xs font-semibold transition-colors ${
                  range === r ? 'bg-amber-600 text-white' : 'text-muted-foreground hover:text-foreground'
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
            const value = stats[card.key as keyof NotebookStats] as number;
            const change = card.key === 'total_notes' ? stats.notes_change :
                          card.key === 'total_tasks' ? stats.tasks_change : 0;
            return (
              <div key={card.key} className="rounded-2xl border border-border bg-card p-4 shadow-sm">
                <div className="flex items-center gap-2">
                  <span className="text-lg">{card.icon}</span>
                  <span className="text-xs text-muted-foreground">{card.label}</span>
                </div>
                <div className="mt-2 flex items-end justify-between">
                  <span className="text-2xl font-bold text-foreground">{value}</span>
                  {change !== 0 && (
                    <span className={`text-xs font-medium ${change > 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
                      {change > 0 ? '+' : ''}{change}%
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Row 1: Activity Trend + Category Distribution */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          <div className="lg:col-span-2 rounded-2xl border border-border bg-card p-5 shadow-sm">
            <h3 className="mb-4 text-sm font-semibold text-foreground">活跃趋势</h3>
            <div className="flex gap-3">
              <div className="flex-1">
                <ReactECharts
                  option={{
                    tooltip: { trigger: 'axis' },
                    xAxis: {
                      type: 'category',
                      data: stats.activity_trend.map(t => t.date.slice(5)),
                      axisLabel: { fontSize: 10, color: '#6B7280' },
                    },
                    yAxis: { type: 'value', axisLabel: { fontSize: 10, color: '#6B7280' } },
                    series: [
                      {
                        name: '新增笔记',
                        type: 'line',
                        data: stats.activity_trend.map(t => t.notes),
                        smooth: true,
                        areaStyle: { opacity: 0.3 },
                        lineStyle: { color: '#F59E0B', width: 2 },
                        itemStyle: { color: '#F59E0B' },
                      },
                      {
                        name: '完成任务',
                        type: 'line',
                        data: stats.activity_trend.map(t => t.tasks),
                        smooth: true,
                        areaStyle: { opacity: 0.3 },
                        lineStyle: { color: '#10B981', width: 2 },
                        itemStyle: { color: '#10B981' },
                      },
                    ],
                    grid: { left: 40, right: 20, top: 20, bottom: 30 },
                  }}
                  style={{ height: 220 }}
                />
              </div>
              <div className="w-[120px] flex flex-col gap-2 py-2">
                <div className="flex items-center gap-2">
                  <span className="shrink-0 w-3 h-3 rounded-sm" style={{ backgroundColor: '#F59E0B' }} />
                  <span className="text-xs text-muted-foreground">新增笔记</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="shrink-0 w-3 h-3 rounded-sm" style={{ backgroundColor: '#10B981' }} />
                  <span className="text-xs text-muted-foreground">完成任务</span>
                </div>
              </div>
            </div>
          </div>
          <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
            <h3 className="mb-2 text-sm font-semibold text-foreground">笔记分类分布</h3>
            {stats.category_distribution.length > 0 ? (
              <div className="flex gap-3">
                <div className="flex-1">
                  <ReactECharts
                    option={{
                      tooltip: { trigger: 'item', formatter: '{b}: {c} ({d}%)' },
                      series: [{
                        type: 'pie',
                        radius: ['40%', '70%'],
                        center: ['50%', '50%'],
                        data: stats.category_distribution.map((c, i) => ({
                          name: categoryLabels[c.category] || c.category,
                          value: c.count,
                          itemStyle: { color: CATEGORY_COLORS[i % CATEGORY_COLORS.length] },
                        })),
                        label: { fontSize: 10, color: '#6B7280' },
                      }],
                    }}
                    style={{ height: 220 }}
                  />
                </div>
                <div className="w-[120px] flex flex-col gap-2 py-2">
                  {stats.category_distribution.map((c, i) => (
                    <div key={c.category} className="flex items-center gap-2">
                      <span className="shrink-0 w-3 h-3 rounded-sm" style={{ backgroundColor: CATEGORY_COLORS[i % CATEGORY_COLORS.length] }} />
                      <span className="text-xs text-muted-foreground truncate">{categoryLabels[c.category] || c.category}</span>
                      <span className="text-xs text-muted-foreground ml-auto">{c.count}</span>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="flex h-[220px] items-center justify-center text-sm text-muted-foreground">暂无数据</div>
            )}
          </div>
        </div>

        {/* Row 2: Todo Status + Todo Priority */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
            <h3 className="mb-4 text-sm font-semibold text-foreground">待办事项状态</h3>
            {stats.todo_status_stats.some(s => s.count > 0) ? (
              (() => {
                const total = stats.todo_status_stats.reduce((sum, x) => sum + x.count, 0);
                return (
              <div className="flex gap-4">
                <div className="flex-1 space-y-4">
                  {stats.todo_status_stats.map((s) => {
                    const pct = total > 0 ? Math.round((s.count / total) * 100) : 0;
                    return (
                      <div key={s.status} className="space-y-1.5">
                        <div className="flex items-center justify-between text-sm">
                          <div className="flex items-center gap-2">
                            <span className="inline-block w-3 h-3 rounded-sm" style={{ backgroundColor: s.color }} />
                            <span className="text-foreground font-medium">{s.status}</span>
                          </div>
                          <span className="text-muted-foreground">{s.count} ({pct}%)</span>
                        </div>
                        <div className="h-2.5 overflow-hidden rounded-full bg-muted">
                          <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, backgroundColor: s.color }} />
                        </div>
                      </div>
                    );
                  })}
                  <div className="pt-3 border-t border-border">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-foreground font-semibold">总计</span>
                      <span className="text-indigo-600 font-semibold">{total}</span>
                    </div>
                  </div>
                </div>
                <div className="w-[120px] flex flex-col gap-2 py-2">
                  {stats.todo_status_stats.map((s) => (
                    <div key={s.status} className="flex items-center gap-2">
                      <span className="shrink-0 w-3 h-3 rounded-sm" style={{ backgroundColor: s.color }} />
                      <span className="text-xs text-muted-foreground">{s.status}</span>
                      <span className="text-xs text-muted-foreground ml-auto">{s.count}</span>
                    </div>
                  ))}
                </div>
              </div>
              );
            })()
            ) : (
              <div className="flex h-[200px] items-center justify-center text-sm text-muted-foreground">暂无待办数据</div>
            )}
          </div>
          <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
            <h3 className="mb-4 text-sm font-semibold text-foreground">待办优先级分布</h3>
            {stats.todo_priority_stats.some(s => s.count > 0) ? (
              <div className="flex gap-3">
                <div className="flex-1">
                  <ReactECharts
                    option={{
                      tooltip: { trigger: 'item', formatter: '{b}: {c} ({d}%)' },
                      series: [{
                        type: 'pie',
                        radius: ['40%', '70%'],
                        center: ['50%', '50%'],
                        data: stats.todo_priority_stats.map((p) => ({
                          name: p.priority,
                          value: p.count,
                          itemStyle: { color: p.color },
                        })),
                        label: { fontSize: 10, color: '#6B7280' },
                      }],
                    }}
                    style={{ height: 220 }}
                  />
                </div>
                <div className="w-[120px] flex flex-col gap-2 py-2">
                  {stats.todo_priority_stats.map((p) => (
                    <div key={p.priority} className="flex items-center gap-2">
                      <span className="shrink-0 w-3 h-3 rounded-sm" style={{ backgroundColor: p.color }} />
                      <span className="text-xs text-muted-foreground">{p.priority}</span>
                      <span className="text-xs text-muted-foreground ml-auto">{p.count}</span>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="flex h-[220px] items-center justify-center text-sm text-muted-foreground">暂无数据</div>
            )}
          </div>
        </div>

        {/* Row 3: Recent Notes + Recent Todos */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
            <h3 className="mb-4 text-sm font-semibold text-foreground">最近笔记</h3>
            {stats.recent_notes.length > 0 ? (
              <div className="space-y-2">
                {stats.recent_notes.map((n) => (
                  <div key={n.id} className="flex items-center justify-between rounded-xl border border-border px-3 py-2">
                    <div className="flex items-center gap-2">
                      <span className={`rounded px-1.5 py-0.5 text-xs font-medium ${
                        n.category === 'problem' ? 'bg-rose-100 text-rose-700' :
                        n.category === 'insight' ? 'bg-amber-100 text-amber-700' :
                        n.category === 'meeting' ? 'bg-sky-100 text-sky-700' :
                        'bg-violet-100 text-violet-700'
                      }`}>
                        {categoryLabels[n.category] || n.category}
                      </span>
                      <span className="text-sm font-medium text-foreground truncate max-w-[200px]">{n.title}</span>
                    </div>
                    <span className="text-xs text-muted-foreground">{new Date(n.updated_at).toLocaleDateString()}</span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex h-[150px] items-center justify-center text-sm text-muted-foreground">暂无笔记</div>
            )}
          </div>
          <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
            <h3 className="mb-4 text-sm font-semibold text-foreground">待办趋势</h3>
            <div className="flex gap-3">
              <div className="flex-1">
                <ReactECharts
                  option={{
                    tooltip: { trigger: 'axis' },
                    xAxis: {
                      type: 'category',
                      data: stats.todo_trend.map(t => t.date.slice(5)),
                      axisLabel: { fontSize: 10, color: '#6B7280' },
                    },
                    yAxis: { type: 'value', axisLabel: { fontSize: 10, color: '#6B7280' } },
                    series: [
                      {
                        name: '新增待办',
                        type: 'line',
                        data: stats.todo_trend.map(t => t.created),
                        smooth: true,
                        areaStyle: { opacity: 0.3 },
                        lineStyle: { color: '#6366F1', width: 2 },
                        itemStyle: { color: '#6366F1' },
                      },
                      {
                        name: '完成待办',
                        type: 'line',
                        data: stats.todo_trend.map(t => t.completed),
                        smooth: true,
                        areaStyle: { opacity: 0.3 },
                        lineStyle: { color: '#10B981', width: 2 },
                        itemStyle: { color: '#10B981' },
                      },
                    ],
                    grid: { left: 40, right: 20, top: 20, bottom: 30 },
                  }}
                  style={{ height: 220 }}
                />
              </div>
              <div className="w-[120px] flex flex-col gap-2 py-2">
                <div className="flex items-center gap-2">
                  <span className="shrink-0 w-3 h-3 rounded-sm" style={{ backgroundColor: '#6366F1' }} />
                  <span className="text-xs text-muted-foreground">新增待办</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="shrink-0 w-3 h-3 rounded-sm" style={{ backgroundColor: '#10B981' }} />
                  <span className="text-xs text-muted-foreground">完成待办</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
