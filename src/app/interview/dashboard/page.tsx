'use client';

import { useState, useEffect } from 'react';
import GradientBackground from '@/components/ui/gradient-background';
import ReactECharts from 'echarts-for-react';

interface InterviewStats {
  assistant_count: number;
  qa_count: number;
  mock_count: number;
  total_count: number;
  methodology_count: number;
  competitive_count: number;
  avg_mock_score: number;
  avg_comp_score: number;
  session_count: number;
  mock_change: number;
  comp_change: number;
  type_distribution: { type: string; count: number }[];
  mock_score_trend: { date: string; score: number }[];
  score_ranges: { range: string; count: number }[];
  weak_areas: { name: string; avgScore: number }[];
  qa_type_distribution: { type: string; count: number }[];
  funnel_stages: { stage: string; count: number }[];
  methodology_type_distribution: { type: string; count: number }[];
  channel_stats: { channel: string; count: number }[];
}

const statCards: Array<{ key: string; label: string; icon: string; changeKey?: string; suffix?: string }> = [
  { key: 'assistant_count', label: '面试助手次数', icon: '🤖' },
  { key: 'qa_count', label: '面试问答次数', icon: '💬' },
  { key: 'mock_count', label: '模拟面试次数', icon: '🎭', changeKey: 'mock_change' },
  { key: 'total_count', label: '总练习统计', icon: '📊' },
  { key: 'methodology_count', label: '方法论次数', icon: '📚' },
  { key: 'competitive_count', label: '竞品分析次数', icon: '🔍', changeKey: 'comp_change' },
];

export default function InterviewDashboardPage() {
  const [stats, setStats] = useState<InterviewStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [range, setRange] = useState<'7d' | '30d' | 'all'>('30d');

  useEffect(() => {
    setLoading(true);
    fetch(`/api/interview/dashboard?range=${range}`)
      .then(r => r.json())
      .then(d => {
        if (d.stats) setStats(d.stats);
        else setStats(null);
      })
      .catch(() => setStats(null))
      .finally(() => setLoading(false));
  }, [range]);

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
          <p className="text-lg font-medium text-muted-foreground">暂无面试练习数据</p>
          <p className="mt-2 text-sm text-muted-foreground">开始练习后，看板数据将自动展示</p>
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
            <h1 className="text-2xl font-bold text-foreground">面试助手看板</h1>
            <p className="mt-1 text-sm font-medium text-muted-foreground">追踪面试准备进度，发现提升空间</p>
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
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {statCards.map(card => {
            const value = stats[card.key as keyof InterviewStats] as number;
            const change = card.changeKey ? stats[card.changeKey as keyof InterviewStats] as number : 0;
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
                  {card.changeKey && change !== 0 && (
                    <span className={`text-xs font-medium ${change > 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
                      {change > 0 ? '+' : ''}{change}%
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Row 1: Type Distribution + Mock Score Trend */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
            <h3 className="mb-4 text-sm font-semibold text-foreground">类型分布</h3>
            {stats.type_distribution.length > 0 ? (
              <ReactECharts
                option={{
                  tooltip: { trigger: 'item' },
                  series: [{
                    type: 'pie',
                    radius: ['40%', '70%'],
                    data: stats.type_distribution.map(t => ({ name: t.type, value: t.count })),
                    label: { fontSize: 10, color: '#6B7280' },
                  }],
                }}
                style={{ height: 200 }}
              />
            ) : (
              <div className="flex h-[200px] items-center justify-center text-sm text-muted-foreground">暂无数据</div>
            )}
          </div>
          <div className="lg:col-span-2 rounded-2xl border border-border bg-card p-5 shadow-sm">
            <h3 className="mb-4 text-sm font-semibold text-foreground">模拟面试得分趋势</h3>
            {stats.mock_score_trend.length > 0 ? (
              <ReactECharts
                option={{
                  tooltip: { trigger: 'axis' },
                  xAxis: {
                    type: 'category',
                    data: stats.mock_score_trend.map(t => t.date.slice(5)),
                    axisLabel: { fontSize: 10, color: '#6B7280' },
                  },
                  yAxis: { type: 'value', min: 0, max: 100, axisLabel: { fontSize: 10, color: '#6B7280' } },
                  series: [{
                    type: 'line',
                    data: stats.mock_score_trend.map(t => t.score),
                    smooth: true,
                    lineStyle: { color: '#6366F1', width: 2 },
                    itemStyle: { color: '#6366F1' },
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
        </div>

        {/* Row 2: Methodology Type Distribution + Weak Areas */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
            <h3 className="mb-4 text-sm font-semibold text-foreground">方法论类型分布</h3>
            {stats.methodology_type_distribution.length > 0 ? (
              <ReactECharts
                option={{
                  tooltip: {
                    trigger: 'item',
                    formatter: '{b}: {c} ({d}%)'
                  },
                  legend: {
                    orient: 'vertical',
                    right: 10,
                    top: 'center',
                    textStyle: { fontSize: 11, color: '#6B7280' },
                    formatter: (name: string) => {
                      const item = stats.methodology_type_distribution.find(t => t.type === name);
                      return `${name}: ${item?.count || 0}次`;
                    },
                  },
                  series: [{
                    type: 'pie',
                    radius: ['40%', '70%'],
                    center: ['35%', '50%'],
                    data: stats.methodology_type_distribution.map((t, i) => ({
                      name: t.type,
                      value: t.count,
                      itemStyle: { color: ['#6366F1', '#F59E0B', '#10B981', '#EF4444', '#8B5CF6', '#EC4899'][i % 6] }
                    })),
                    label: {
                      show: true,
                      formatter: '{d}%',
                      fontSize: 10,
                      color: '#6B7280'
                    },
                  }],
                }}
                style={{ height: 200 }}
              />
            ) : (
              <div className="flex h-[200px] items-center justify-center text-sm text-muted-foreground">暂无方法论数据</div>
            )}
          </div>
          <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
            <h3 className="mb-4 text-sm font-semibold text-foreground">弱项领域</h3>
            {stats.weak_areas.length > 0 ? (
              <ReactECharts
                option={{
                  tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } },
                  xAxis: {
                    type: 'value',
                    min: 0,
                    max: 100,
                    axisLabel: { fontSize: 10, color: '#6B7280' },
                  },
                  yAxis: {
                    type: 'category',
                    data: stats.weak_areas.map(w => w.name.length > 6 ? w.name.slice(0, 6) + '..' : w.name).reverse(),
                    axisLabel: { fontSize: 10, color: '#6B7280' },
                  },
                  series: [{
                    type: 'bar',
                    data: stats.weak_areas.map(w => ({
                      value: w.avgScore,
                      itemStyle: {
                        color: w.avgScore < 60 ? '#EF4444' : w.avgScore < 80 ? '#F59E0B' : '#10B981',
                        borderRadius: [0, 4, 4, 0],
                      },
                    })).reverse(),
                    barWidth: 20,
                    label: {
                      show: true,
                      position: 'right',
                      formatter: '{c}分',
                      fontSize: 10,
                      color: '#6B7280',
                    },
                  }],
                  grid: { left: 80, right: 50, top: 10, bottom: 10 },
                }}
                style={{ height: 200 }}
              />
            ) : (
              <div className="flex h-[200px] items-center justify-center text-sm text-muted-foreground">暂无数据</div>
            )}
          </div>
        </div>

        {/* Row 3: QA Type Distribution + Funnel */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
            <h3 className="mb-4 text-sm font-semibold text-foreground">面试问答类别分布</h3>
            {stats.qa_type_distribution.length > 0 ? (
              <ReactECharts
                option={{
                  tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } },
                  xAxis: {
                    type: 'category',
                    data: stats.qa_type_distribution.map(t => t.type.length > 6 ? t.type.slice(0, 6) + '..' : t.type),
                    axisLabel: { fontSize: 10, color: '#6B7280' },
                  },
                  yAxis: { type: 'value', axisLabel: { fontSize: 10, color: '#6B7280' } },
                  series: [{
                    type: 'bar',
                    data: stats.qa_type_distribution.map((t, i) => ({
                      value: t.count,
                      itemStyle: {
                        color: ['#6366F1', '#F59E0B', '#10B981', '#EF4444', '#8B5CF6', '#EC4899', '#14B8A6', '#F97316', '#06B6D4', '#84CC16', '#A855F7'][i % 11],
                        borderRadius: [4, 4, 0, 0],
                      },
                    })),
                    barWidth: 20,
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
