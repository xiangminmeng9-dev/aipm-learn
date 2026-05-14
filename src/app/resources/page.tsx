'use client';

import { useState, useEffect } from 'react';
import GradientBackground from '@/components/ui/gradient-background';
import ReactECharts from 'echarts-for-react';

interface ResourcesStats {
  total_resources: number;
  total_rss_articles: number;
  total_daily_news: number;
  total_rss_sources: number;
  rss_read_stats: { read: number; total: number; translated: number };
  type_distribution: { type: string; count: number }[];
  source_distribution: { source: string; count: number }[];
  daily_activity: { date: string; count: number }[];
  growth_timeline: { date: string; count: number }[];
  folder_treemap: { name: string; value: number }[];
}

const statCards = [
  { key: 'total_resources', label: '收藏资源', icon: '📁' },
  { key: 'total_rss_articles', label: 'RSS 文章', icon: '📰' },
  { key: 'total_daily_news', label: '每日新闻', icon: '📡' },
  { key: 'total_rss_sources', label: 'RSS 源', icon: '🔌' },
];

export default function ResourcesDashboardPage() {
  const [stats, setStats] = useState<ResourcesStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [range, setRange] = useState<'7d' | '30d' | 'all'>('30d');

  useEffect(() => {
    setLoading(true);
    fetch(`/api/resources/stats?range=${range}`)
      .then(r => r.json())
      .then(d => {
        if (d.total_resources !== undefined) setStats(d);
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
          <p className="text-lg font-medium text-muted-foreground">暂无资源数据</p>
          <p className="mt-2 text-sm text-muted-foreground">添加资源后，看板数据将自动展示</p>
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
            <h1 className="text-2xl font-bold text-foreground">学习资源看板</h1>
            <p className="mt-1 text-sm font-medium text-muted-foreground">追踪资源收藏，发现学习热点</p>
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
            const value = stats[card.key as keyof ResourcesStats] as number;
            return (
              <div key={card.key} className="rounded-2xl border border-border bg-card p-4 shadow-sm">
                <div className="flex items-center gap-2">
                  <span className="text-lg">{card.icon}</span>
                  <span className="text-xs text-muted-foreground">{card.label}</span>
                </div>
                <div className="mt-2">
                  <span className="text-2xl font-bold text-foreground">{value}</span>
                </div>
              </div>
            );
          })}
        </div>

        {/* RSS Read Progress */}
        {stats.rss_read_stats && stats.rss_read_stats.total > 0 && (
          <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-foreground">RSS 阅读进度</h3>
              <span className="text-sm text-indigo-600 font-medium">
                {stats.rss_read_stats.read}/{stats.rss_read_stats.total} 已读
              </span>
            </div>
            <div className="h-2.5 overflow-hidden rounded-full bg-muted">
              <div
                className="h-full rounded-full bg-indigo-500 transition-all"
                style={{ width: `${Math.round((stats.rss_read_stats.read / stats.rss_read_stats.total) * 100)}%` }}
              />
            </div>
            <p className="mt-2 text-xs text-muted-foreground">
              {stats.rss_read_stats.translated} 篇已翻译
            </p>
          </div>
        )}

        {/* Row 1: Type Distribution + Source Distribution */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
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
          <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
            <h3 className="mb-4 text-sm font-semibold text-foreground">来源分布</h3>
            {stats.source_distribution.length > 0 ? (
              <ReactECharts
                option={{
                  tooltip: { trigger: 'item' },
                  series: [{
                    type: 'pie',
                    radius: ['40%', '70%'],
                    data: stats.source_distribution.map(s => ({ name: s.source, value: s.count })),
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

        {/* Row 2: Daily Activity */}
        <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
          <h3 className="mb-4 text-sm font-semibold text-foreground">近 30 天新增</h3>
          {stats.daily_activity.length > 0 ? (
            <ReactECharts
              option={{
                tooltip: { trigger: 'axis' },
                xAxis: {
                  type: 'category',
                  data: stats.daily_activity.map(d => d.date.slice(5)),
                  axisLabel: { fontSize: 10, color: '#6B7280' },
                },
                yAxis: { type: 'value', axisLabel: { fontSize: 10, color: '#6B7280' } },
                series: [{
                  type: 'bar',
                  data: stats.daily_activity.map(d => d.count),
                  itemStyle: { color: '#6366F1', borderRadius: [4, 4, 0, 0] },
                }],
                grid: { left: 40, right: 20, top: 20, bottom: 30 },
              }}
              style={{ height: 200 }}
            />
          ) : (
            <div className="flex h-[200px] items-center justify-center text-sm text-muted-foreground">暂无数据</div>
          )}
        </div>

        {/* Row 3: Growth Timeline + Folder Distribution */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
            <h3 className="mb-4 text-sm font-semibold text-foreground">累计增长</h3>
            {stats.growth_timeline.length > 0 ? (
              <ReactECharts
                option={{
                  tooltip: { trigger: 'axis' },
                  xAxis: {
                    type: 'category',
                    data: stats.growth_timeline.map(d => d.date.slice(5)),
                    axisLabel: { fontSize: 10, color: '#6B7280' },
                  },
                  yAxis: { type: 'value', axisLabel: { fontSize: 10, color: '#6B7280' } },
                  series: [{
                    type: 'line',
                    data: stats.growth_timeline.map(d => d.count),
                    smooth: true,
                    areaStyle: { opacity: 0.3 },
                    lineStyle: { color: '#10B981', width: 2 },
                    itemStyle: { color: '#10B981' },
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
            <h3 className="mb-4 text-sm font-semibold text-foreground">文件夹分布</h3>
            {stats.folder_treemap.length > 0 ? (
              <ReactECharts
                option={{
                  tooltip: { trigger: 'item' },
                  series: [{
                    type: 'treemap',
                    data: stats.folder_treemap.map(f => ({
                      name: f.name,
                      value: f.value,
                    })),
                    label: { fontSize: 10, color: '#fff' },
                    breadcrumb: { show: false },
                  }],
                }}
                style={{ height: 200 }}
              />
            ) : (
              <div className="flex h-[200px] items-center justify-center text-sm text-muted-foreground">暂无数据</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
