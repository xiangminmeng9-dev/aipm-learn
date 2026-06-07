'use client';

import { useState, useEffect, useCallback } from 'react';
import GradientBackground from '@/components/ui/gradient-background';
import ReactECharts from '@/components/ui/EChartsWrapper';

interface SimulatorStats {
  total_sessions: number;
  completed_sessions: number;
  total_projects: number;
  completed_projects: number;
  total_boss_sessions: number;
  completed_boss_sessions: number;
  avg_boss_score: number;
  sessions_change: number;
  boss_change: number;
  scenario_distribution: { scenario_id: string; title: string; count: number }[];
  boss_type_distribution: { boss_type: string; count: number }[];
  stage_completion: { scenario_id: string; title: string; completed: number; total: number }[];
  score_ranges: { range: string; count: number; color: string }[];
  activity_trend: { date: string; workflows: number; boss: number; projects: number }[];
  recent_sessions: { id: string; title: string; status: string; progress: number; updated_at: string }[];
  recent_boss_sessions: { id: string; boss_type: string; status: string; score: number | null; created_at: string }[];
}

const statCards = [
  { key: 'total_sessions', label: '工作流模拟', icon: '🔄' },
  { key: 'completed_sessions', label: '已完成', icon: '✅' },
  { key: 'total_boss_sessions', label: 'Boss 1v1', icon: '⚔️' },
  { key: 'avg_boss_score', label: '平均分数', icon: '📊' },
];

const bossTypeLabels: Record<string, string> = {
  tech: '技术Boss',
  product: '产品Boss',
  design: '设计Boss',
  hr: 'HR Boss',
  ceo: 'CEO',
};

export default function SimulatorDashboardPage() {
  const [stats, setStats] = useState<SimulatorStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [range, setRange] = useState<'7d' | '30d' | 'all'>('30d');

  const loadData = useCallback(async (r: string) => {
    try {
      const res = await fetch(`/api/simulator/dashboard?range=${r}`);
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
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-cyan-500 border-t-transparent" />
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="flex min-h-screen items-center justify-center p-6">
        <div className="text-center">
          <p className="text-lg font-medium text-muted-foreground">暂无模拟器数据</p>
          <p className="mt-2 text-sm text-muted-foreground">开始模拟练习后，看板数据将自动展示</p>
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
            <h1 className="text-2xl font-bold text-foreground">模拟器看板</h1>
            <p className="mt-1 text-sm font-medium text-muted-foreground">追踪模拟进度，提升实战能力</p>
          </div>
          <div className="flex items-center gap-1 rounded-lg bg-muted p-1">
            {(['7d', '30d', 'all'] as const).map(r => (
              <button
                key={r}
                onClick={() => setRange(r)}
                className={`rounded-md px-4 py-1.5 text-xs font-semibold transition-colors ${
                  range === r ? 'bg-cyan-600 text-white' : 'text-muted-foreground hover:text-foreground'
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
            const value = stats[card.key as keyof SimulatorStats] as number;
            const change = card.key === 'total_sessions' ? stats.sessions_change :
                          card.key === 'total_boss_sessions' ? stats.boss_change : 0;
            return (
              <div key={card.key} className="rounded-2xl border border-border bg-card p-4 shadow-sm">
                <div className="flex items-center gap-2">
                  <span className="text-lg">{card.icon}</span>
                  <span className="text-xs text-muted-foreground">{card.label}</span>
                </div>
                <div className="mt-2 flex items-end justify-between">
                  <span className="text-2xl font-bold text-foreground">{card.key === 'avg_boss_score' ? `${value}分` : value}</span>
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

        {/* Row 1: Activity Trend + Scenario Distribution */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          <div className="lg:col-span-2 rounded-2xl border border-border bg-card p-5 shadow-sm">
            <h3 className="mb-4 text-sm font-semibold text-foreground">活跃趋势</h3>
            <ReactECharts
              option={{
                tooltip: { trigger: 'axis' },
                legend: {
                  show: true,
                  top: 0,
                  left: 0,
                  orient: 'horizontal',
                  itemWidth: 10,
                  itemHeight: 10,
                  textStyle: { fontSize: 9, color: '#6B7280' },
                },
                xAxis: {
                  type: 'category',
                  data: stats.activity_trend.map(t => t.date.slice(5)),
                  axisLabel: { fontSize: 10, color: '#6B7280' },
                },
                yAxis: { type: 'value', axisLabel: { fontSize: 10, color: '#6B7280' } },
                series: [
                  {
                    name: '工作流',
                    type: 'line',
                    data: stats.activity_trend.map(t => t.workflows),
                    smooth: true,
                    areaStyle: { opacity: 0.3 },
                    lineStyle: { color: '#06B6D4', width: 2 },
                    itemStyle: { color: '#06B6D4' },
                  },
                  {
                    name: 'Boss 1v1',
                    type: 'line',
                    data: stats.activity_trend.map(t => t.boss),
                    smooth: true,
                    areaStyle: { opacity: 0.3 },
                    lineStyle: { color: '#F59E0B', width: 2 },
                    itemStyle: { color: '#F59E0B' },
                  },
                  {
                    name: '项目',
                    type: 'line',
                    data: stats.activity_trend.map(t => t.projects),
                    smooth: true,
                    areaStyle: { opacity: 0.3 },
                    lineStyle: { color: '#10B981', width: 2 },
                    itemStyle: { color: '#10B981' },
                  },
                ],
                grid: { left: 40, right: 20, top: 30, bottom: 30 },
              }}
              style={{ height: 220 }}
            />
          </div>
          <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
            <h3 className="mb-2 text-sm font-semibold text-foreground">场景分布</h3>
            {stats.scenario_distribution.length > 0 ? (
              <ReactECharts
                option={{
                  tooltip: { trigger: 'item', formatter: '{b}: {c} ({d}%)' },
                  legend: {
                    show: true,
                    top: 0,
                    left: 0,
                    orient: 'horizontal',
                    itemWidth: 10,
                    itemHeight: 10,
                    textStyle: { fontSize: 9, color: '#6B7280' },
                    formatter: (name: string) => name.length > 6 ? name.slice(0, 6) + '...' : name,
                  },
                  series: [{
                    type: 'pie',
                    radius: ['40%', '70%'],
                    center: ['50%', '60%'],
                    data: stats.scenario_distribution.map((s, i) => ({
                      name: s.title,
                      value: s.count,
                      itemStyle: { color: ['#06B6D4', '#F59E0B', '#10B981', '#8B5CF6', '#EF4444', '#EC4899'][i % 6] },
                    })),
                    label: { fontSize: 10, color: '#6B7280' },
                  }],
                }}
                style={{ height: 220 }}
              />
            ) : (
              <div className="flex h-[220px] items-center justify-center text-sm text-muted-foreground">暂无数据</div>
            )}
          </div>
        </div>

        {/* Row 2: Stage Completion + Score Distribution */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
            <h3 className="mb-4 text-sm font-semibold text-foreground">工作流阶段完成度</h3>
            {stats.stage_completion.length > 0 ? (
              <div className="space-y-4">
                {stats.stage_completion.map((s) => {
                  const pct = s.total > 0 ? Math.round((s.completed / s.total) * 100) : 0;
                  return (
                    <div key={s.scenario_id} className="space-y-1.5">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-foreground font-medium truncate max-w-[200px]">{s.title}</span>
                        <span className="text-muted-foreground">{s.completed}/{s.total} ({pct}%)</span>
                      </div>
                      <div className="h-2.5 overflow-hidden rounded-full bg-muted">
                        <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, backgroundColor: '#06B6D4' }} />
                      </div>
                    </div>
                  );
                })}
                <div className="pt-3 border-t border-border">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-foreground font-semibold">总计</span>
                    <span className="text-cyan-600 font-semibold">
                      {stats.stage_completion.reduce((sum, s) => sum + s.completed, 0)}/
                      {stats.stage_completion.reduce((sum, s) => sum + s.total, 0)}
                    </span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex h-[200px] items-center justify-center text-sm text-muted-foreground">暂无数据</div>
            )}
          </div>
          <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
            <h3 className="mb-4 text-sm font-semibold text-foreground">Boss 1v1 分数分布</h3>
            {stats.score_ranges.some(s => s.count > 0) ? (
              <div className="space-y-4">
                {stats.score_ranges.map((s) => {
                  const total = stats.score_ranges.reduce((sum, x) => sum + x.count, 0);
                  const pct = total > 0 ? Math.round((s.count / total) * 100) : 0;
                  return (
                    <div key={s.range} className="space-y-1.5">
                      <div className="flex items-center justify-between text-sm">
                        <div className="flex items-center gap-2">
                          <span className="inline-block w-3 h-3 rounded-sm" style={{ backgroundColor: s.color }} />
                          <span className="text-foreground font-medium">{s.range}分</span>
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
                    <span className="text-foreground font-semibold">平均分</span>
                    <span className="text-cyan-600 font-semibold">{stats.avg_boss_score}分</span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex h-[200px] items-center justify-center text-sm text-muted-foreground">暂无Boss 1v1数据</div>
            )}
          </div>
        </div>

        {/* Row 3: Boss Type Distribution + Recent Sessions */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
            <h3 className="mb-4 text-sm font-semibold text-foreground">Boss 1v1 类型分布</h3>
            {stats.boss_type_distribution.length > 0 ? (
              <div className="space-y-3">
                {stats.boss_type_distribution.map((b, i) => {
                  const total = stats.boss_type_distribution.reduce((sum, x) => sum + x.count, 0);
                  const pct = total > 0 ? Math.round((b.count / total) * 100) : 0;
                  return (
                    <div key={b.boss_type} className="space-y-1.5">
                      <div className="flex items-center justify-between text-sm">
                        <div className="flex items-center gap-2">
                          <span className="inline-block w-3 h-3 rounded-sm" style={{ backgroundColor: ['#06B6D4', '#F59E0B', '#10B981', '#8B5CF6', '#EF4444'][i % 5] }} />
                          <span className="text-foreground font-medium">{bossTypeLabels[b.boss_type] || b.boss_type}</span>
                        </div>
                        <span className="text-muted-foreground">{b.count} ({pct}%)</span>
                      </div>
                      <div className="h-2.5 overflow-hidden rounded-full bg-muted">
                        <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, backgroundColor: ['#06B6D4', '#F59E0B', '#10B981', '#8B5CF6', '#EF4444'][i % 5] }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="flex h-[150px] items-center justify-center text-sm text-muted-foreground">暂无Boss 1v1数据</div>
            )}
          </div>
          <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
            <h3 className="mb-4 text-sm font-semibold text-foreground">最近工作流</h3>
            {stats.recent_sessions.length > 0 ? (
              <div className="space-y-2">
                {stats.recent_sessions.map((s) => (
                  <div key={s.id} className="flex items-center justify-between rounded-xl border border-border px-3 py-2">
                    <div className="flex items-center gap-2">
                      <span className={`rounded px-1.5 py-0.5 text-[10px] font-medium ${
                        s.status === 'completed' ? 'bg-emerald-100 text-emerald-700' :
                        s.status === 'in_progress' ? 'bg-cyan-100 text-cyan-700' :
                        'bg-indigo-100 text-indigo-700'
                      }`}>
                        {s.status === 'completed' ? '已完成' : s.status === 'in_progress' ? '进行中' : '待开始'}
                      </span>
                      <span className="text-sm font-medium text-foreground truncate max-w-[180px]">{s.title}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-muted-foreground">{s.progress}%</span>
                      <span className="text-xs text-muted-foreground">{new Date(s.updated_at).toLocaleDateString()}</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex h-[150px] items-center justify-center text-sm text-muted-foreground">暂无工作流</div>
            )}
          </div>
          <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
            <h3 className="mb-4 text-sm font-semibold text-foreground">最近 Boss 1v1</h3>
            {stats.recent_boss_sessions.length > 0 ? (
              <div className="space-y-2">
                {stats.recent_boss_sessions.map((b) => (
                  <div key={b.id} className="flex items-center justify-between rounded-xl border border-border px-3 py-2">
                    <div className="flex items-center gap-2">
                      <span className={`rounded px-1.5 py-0.5 text-[10px] font-medium ${
                        b.status === 'completed' ? 'bg-emerald-100 text-emerald-700' :
                        'bg-amber-100 text-amber-700'
                      }`}>
                        {b.status === 'completed' ? '已完成' : '进行中'}
                      </span>
                      <span className="text-sm font-medium text-foreground">{bossTypeLabels[b.boss_type] || b.boss_type}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      {b.score != null && (
                        <span className={`rounded px-1.5 py-0.5 text-[10px] font-medium ${
                          b.score >= 80 ? 'bg-indigo-100 text-indigo-700' :
                          b.score >= 60 ? 'bg-emerald-100 text-emerald-700' :
                          b.score >= 40 ? 'bg-amber-100 text-amber-700' :
                          'bg-rose-100 text-rose-700'
                        }`}>
                          {b.score}分
                        </span>
                      )}
                      <span className="text-xs text-muted-foreground">{new Date(b.created_at).toLocaleDateString()}</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex h-[150px] items-center justify-center text-sm text-muted-foreground">暂无Boss 1v1记录</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
