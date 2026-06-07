'use client';

import { useState, useEffect, useMemo } from 'react';
import GradientBackground from '@/components/ui/gradient-background';
import ReactECharts from '@/components/ui/EChartsWrapper';

const ChevronIcon = () => (
  <svg className="absolute right-0 top-1/2 -translate-y-1/2 h-3 w-3 text-muted-foreground pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
  </svg>
);

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
  methodology_type_distribution: { type: string; count: number; framework: string; key_steps: string[] }[];
}

const TYPE_COLORS = ['#6366F1', '#F59E0B', '#10B981', '#EF4444', '#8B5CF6', '#EC4899'];
const METHODOLOGY_COLORS = ['#6366F1', '#F59E0B', '#10B981', '#EF4444', '#8B5CF6', '#EC4899'];
const QA_COLORS = ['#6366F1', '#F59E0B', '#10B981', '#EF4444', '#8B5CF6', '#EC4899', '#14B8A6', '#F97316', '#06B6D4', '#84CC16', '#A855F7'];
const FUNNEL_COLORS = ['#6366F1', '#F59E0B', '#10B981', '#EF4444'];
const FUNNEL_LABELS: Record<string, string> = {
  viewed: '浏览', attempted: '练习', completed: '完成',
  '总练习': '总练习', '已评分': '已评分', '良好(≥70)': '良好(≥70)', '优秀(≥90)': '优秀(≥90)',
};
const WEAK_COLORS: Record<string, string> = { low: '#EF4444', mid: '#F59E0B', high: '#10B981' };

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

  // 筛选状态
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [scoreTrendType, setScoreTrendType] = useState<'daily' | 'weekly'>('daily');
  const [methodologyFilter, setMethodologyFilter] = useState<string>('all');
  const [weakFilter, setWeakFilter] = useState<'all' | 'low' | 'mid' | 'high'>('all');
  const [qaFilter, setQaFilter] = useState<string>('all');

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

  // 类型分布筛选
  const typeData = useMemo(() => {
    if (!stats?.type_distribution) return [];
    if (typeFilter === 'all') return stats.type_distribution;
    return stats.type_distribution.filter(t => t.type === typeFilter);
  }, [stats?.type_distribution, typeFilter]);

  // 得分趋势数据处理
  const scoreTrendData = useMemo(() => {
    if (!stats?.mock_score_trend) return [];
    if (scoreTrendType === 'daily') return stats.mock_score_trend;

    // 按周聚合
    const weeklyMap = new Map<string, { scores: number[] }>();
    stats.mock_score_trend.forEach(item => {
      const date = new Date(item.date);
      const weekStart = new Date(date);
      weekStart.setDate(date.getDate() - date.getDay());
      const weekKey = weekStart.toISOString().slice(0, 10);
      if (!weeklyMap.has(weekKey)) weeklyMap.set(weekKey, { scores: [] });
      weeklyMap.get(weekKey)!.scores.push(item.score);
    });

    return Array.from(weeklyMap.entries())
      .map(([date, data]) => ({
        date,
        score: Math.round(data.scores.reduce((a, b) => a + b, 0) / data.scores.length),
      }))
      .sort((a, b) => a.date.localeCompare(b.date));
  }, [stats?.mock_score_trend, scoreTrendType]);

  // 方法论类型筛选
  const methodologyData = useMemo(() => {
    if (!stats?.methodology_type_distribution) return [];
    if (methodologyFilter === 'all') return stats.methodology_type_distribution;
    return stats.methodology_type_distribution.filter(t => t.type === methodologyFilter);
  }, [stats?.methodology_type_distribution, methodologyFilter]);

  // 选中的方法论详情
  const selectedMethodology = useMemo(() => {
    if (methodologyFilter === 'all' || !stats?.methodology_type_distribution) return null;
    return stats.methodology_type_distribution.find(t => t.type === methodologyFilter) || null;
  }, [stats?.methodology_type_distribution, methodologyFilter]);

  // 弱项领域筛选
  const weakData = useMemo(() => {
    if (!stats?.weak_areas) return [];
    if (weakFilter === 'all') return stats.weak_areas;
    if (weakFilter === 'low') return stats.weak_areas.filter(w => w.avgScore < 60);
    if (weakFilter === 'mid') return stats.weak_areas.filter(w => w.avgScore >= 60 && w.avgScore < 80);
    return stats.weak_areas.filter(w => w.avgScore >= 80);
  }, [stats?.weak_areas, weakFilter]);

  // QA类型筛选
  const qaData = useMemo(() => {
    if (!stats?.qa_type_distribution) return [];
    if (qaFilter === 'all') return stats.qa_type_distribution;
    return stats.qa_type_distribution.filter(t => t.type === qaFilter);
  }, [stats?.qa_type_distribution, qaFilter]);

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
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-foreground">类型分布</h3>
              <div className="relative">
                <select
                  className="appearance-none text-xs text-muted-foreground bg-transparent pr-4 py-1 outline-none cursor-pointer hover:text-foreground transition-colors"
                  value={typeFilter}
                  onChange={(e) => setTypeFilter(e.target.value)}
                >
                  <option value="all">全部类型</option>
                  {stats.type_distribution.map(t => (
                    <option key={t.type} value={t.type}>{t.type}</option>
                  ))}
                </select>
                <ChevronIcon />
              </div>
            </div>
            {typeData.length > 0 ? (
              <div className="flex gap-3">
                <div className="flex-1">
                  <ReactECharts
                    option={{
                      tooltip: { trigger: 'item', formatter: '{b}: {c} ({d}%)' },
                      series: [{
                        type: 'pie',
                        radius: ['40%', '70%'],
                        data: typeData.map((t, i) => ({
                          name: t.type,
                          value: t.count,
                          itemStyle: { color: TYPE_COLORS[i % TYPE_COLORS.length] },
                        })),
                        label: { fontSize: 10, color: '#6B7280' },
                      }],
                    }}
                    style={{ height: 200 }}
                  />
                </div>
                <div className="w-[120px] flex flex-col gap-2 py-2">
                  {typeData.map((t, i) => (
                    <div key={t.type} className="flex items-center gap-2">
                      <span className="shrink-0 w-3 h-3 rounded-sm" style={{ backgroundColor: TYPE_COLORS[i % TYPE_COLORS.length] }} />
                      <span className="text-xs text-muted-foreground truncate">{t.type}</span>
                      <span className="text-[10px] text-muted-foreground ml-auto">{t.count}</span>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="flex h-[200px] items-center justify-center text-sm text-muted-foreground">暂无数据</div>
            )}
          </div>
          <div className="lg:col-span-2 rounded-2xl border border-border bg-card p-5 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-foreground">模拟面试得分趋势</h3>
              <div className="relative">
                <select
                  className="appearance-none text-xs text-muted-foreground bg-transparent pr-4 py-1 outline-none cursor-pointer hover:text-foreground transition-colors"
                  value={scoreTrendType}
                  onChange={(e) => setScoreTrendType(e.target.value as 'daily' | 'weekly')}
                >
                  <option value="daily">按日</option>
                  <option value="weekly">按周</option>
                </select>
                <ChevronIcon />
              </div>
            </div>
            {scoreTrendData.length > 0 ? (
              <div className="flex gap-3">
                <div className="flex-1">
                  <ReactECharts
                    option={{
                      tooltip: { trigger: 'axis' },
                      xAxis: {
                        type: 'category',
                        data: scoreTrendData.map(t => t.date.slice(5)),
                        axisLabel: { fontSize: 10, color: '#6B7280' },
                      },
                      yAxis: { type: 'value', min: 0, max: 100, axisLabel: { fontSize: 10, color: '#6B7280' } },
                      series: [{
                        type: 'line',
                        data: scoreTrendData.map(t => t.score),
                        smooth: true,
                        lineStyle: { color: '#6366F1', width: 2 },
                        itemStyle: { color: '#6366F1' },
                        areaStyle: { opacity: 0.2 },
                      }],
                      grid: { left: 40, right: 20, top: 20, bottom: 30 },
                    }}
                    style={{ height: 200 }}
                  />
                </div>
                <div className="w-[120px] flex flex-col gap-2 py-2">
                  <div className="flex items-center gap-2">
                    <span className="shrink-0 w-3 h-3 rounded-sm" style={{ backgroundColor: '#6366F1' }} />
                    <span className="text-xs text-muted-foreground">模拟得分</span>
                  </div>
                  <div className="mt-1 text-xs text-muted-foreground">
                    <div>平均: {stats.avg_mock_score}</div>
                    <div>竞品: {stats.avg_comp_score}</div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex h-[200px] items-center justify-center text-sm text-muted-foreground">暂无数据</div>
            )}
          </div>
        </div>

        {/* Row 2: Methodology Type Distribution + Weak Areas */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-foreground">方法论类型分布</h3>
              <div className="relative">
                <select
                  className="appearance-none text-xs text-muted-foreground bg-transparent pr-4 py-1 outline-none cursor-pointer hover:text-foreground transition-colors"
                  value={methodologyFilter}
                  onChange={(e) => setMethodologyFilter(e.target.value)}
                >
                  <option value="all">全部类型</option>
                  {stats.methodology_type_distribution.map(t => (
                    <option key={t.type} value={t.type}>{t.type}</option>
                  ))}
                </select>
                <ChevronIcon />
              </div>
            </div>
            {methodologyData.length > 0 ? (
              <div className="flex gap-3">
                <div className="flex-1">
                  <ReactECharts
                    option={{
                      tooltip: { trigger: 'item', formatter: '{b}: {c} ({d}%)' },
                      series: [{
                        type: 'pie',
                        radius: ['40%', '70%'],
                        data: methodologyData.map((t, i) => ({
                          name: t.type,
                          value: t.count,
                          itemStyle: { color: METHODOLOGY_COLORS[i % METHODOLOGY_COLORS.length] },
                        })),
                        label: { fontSize: 10, color: '#6B7280' },
                      }],
                    }}
                    style={{ height: 200 }}
                    onEvents={{
                      click: (params: { name: string }) => {
                        if (params.name) setMethodologyFilter(params.name);
                      },
                    }}
                  />
                </div>
                <div className="w-[120px] flex flex-col gap-2 py-2">
                  {methodologyData.map((t, i) => (
                    <div key={t.type} className="flex items-center gap-2">
                      <span className="shrink-0 w-3 h-3 rounded-sm" style={{ backgroundColor: METHODOLOGY_COLORS[i % METHODOLOGY_COLORS.length] }} />
                      <span className="text-xs text-muted-foreground truncate">{t.type}</span>
                      <span className="text-[10px] text-muted-foreground ml-auto">{t.count}</span>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="flex h-[200px] items-center justify-center text-sm text-muted-foreground">暂无方法论数据</div>
            )}
            {selectedMethodology && (selectedMethodology.framework || selectedMethodology.key_steps.length > 0) && (
              <div className="mt-4 rounded-xl bg-indigo-50 dark:bg-indigo-950/40 p-4 space-y-2">
                <p className="text-xs font-medium text-indigo-700 dark:text-indigo-300">{selectedMethodology.type} 方法论摘要</p>
                {selectedMethodology.framework && (
                  <p className="text-sm text-foreground leading-relaxed">{selectedMethodology.framework}</p>
                )}
                {selectedMethodology.key_steps.length > 0 && (
                  <div className="space-y-1">
                    {selectedMethodology.key_steps.slice(0, 4).map((step, i) => (
                      <p key={i} className="text-xs text-muted-foreground">
                        <span className="inline-block w-4 text-indigo-600 dark:text-indigo-400 font-medium">{i + 1}.</span>
                        {step}
                      </p>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
          <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-foreground">弱项领域</h3>
              <div className="relative">
                <select
                  className="appearance-none text-xs text-muted-foreground bg-transparent pr-4 py-1 outline-none cursor-pointer hover:text-foreground transition-colors"
                  value={weakFilter}
                  onChange={(e) => setWeakFilter(e.target.value as 'all' | 'low' | 'mid' | 'high')}
                >
                  <option value="all">全部</option>
                  <option value="low">薄弱(&lt;60)</option>
                  <option value="mid">中等(60-80)</option>
                  <option value="high">良好(≥80)</option>
                </select>
                <ChevronIcon />
              </div>
            </div>
            {weakData.length > 0 ? (
              <div className="flex gap-3">
                <div className="flex-1">
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
                        data: weakData.map(w => w.name.length > 6 ? w.name.slice(0, 6) + '..' : w.name).reverse(),
                        axisLabel: { fontSize: 10, color: '#6B7280' },
                      },
                      series: [{
                        type: 'bar',
                        data: weakData.map(w => ({
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
                </div>
                <div className="w-[120px] flex flex-col gap-2 py-2">
                  <div className="flex items-center gap-2">
                    <span className="shrink-0 w-3 h-3 rounded-sm" style={{ backgroundColor: '#EF4444' }} />
                    <span className="text-xs text-muted-foreground">&lt;60分</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="shrink-0 w-3 h-3 rounded-sm" style={{ backgroundColor: '#F59E0B' }} />
                    <span className="text-xs text-muted-foreground">60-80分</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="shrink-0 w-3 h-3 rounded-sm" style={{ backgroundColor: '#10B981' }} />
                    <span className="text-xs text-muted-foreground">≥80分</span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex h-[200px] items-center justify-center text-sm text-muted-foreground">暂无数据</div>
            )}
          </div>
        </div>

        {/* Row 3: QA Type Distribution + Funnel */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-foreground">面试问答类别分布</h3>
              <div className="relative">
                <select
                  className="appearance-none text-xs text-muted-foreground bg-transparent pr-4 py-1 outline-none cursor-pointer hover:text-foreground transition-colors"
                  value={qaFilter}
                  onChange={(e) => setQaFilter(e.target.value)}
                >
                  <option value="all">全部类别</option>
                  {stats.qa_type_distribution.map(t => (
                    <option key={t.type} value={t.type}>{t.type}</option>
                  ))}
                </select>
                <ChevronIcon />
              </div>
            </div>
            {qaData.length > 0 ? (
              <div className="flex gap-3">
                <div className="flex-1">
                  <ReactECharts
                    option={{
                      tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } },
                      xAxis: {
                        type: 'category',
                        data: qaData.map(t => t.type.length > 6 ? t.type.slice(0, 6) + '..' : t.type),
                        axisLabel: { fontSize: 10, color: '#6B7280' },
                      },
                      yAxis: { type: 'value', axisLabel: { fontSize: 10, color: '#6B7280' } },
                      series: [{
                        type: 'bar',
                        data: qaData.map((t, i) => ({
                          value: t.count,
                          itemStyle: {
                            color: QA_COLORS[i % QA_COLORS.length],
                            borderRadius: [4, 4, 0, 0],
                          },
                        })),
                        barWidth: 20,
                      }],
                      grid: { left: 40, right: 20, top: 20, bottom: 30 },
                    }}
                    style={{ height: 200 }}
                  />
                </div>
                <div className="w-[120px] flex flex-col gap-2 py-2">
                  {qaData.map((t, i) => (
                    <div key={t.type} className="flex items-center gap-2">
                      <span className="shrink-0 w-3 h-3 rounded-sm" style={{ backgroundColor: QA_COLORS[i % QA_COLORS.length] }} />
                      <span className="text-xs text-muted-foreground truncate">{t.type}</span>
                      <span className="text-[10px] text-muted-foreground ml-auto">{t.count}</span>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="flex h-[200px] items-center justify-center text-sm text-muted-foreground">暂无数据</div>
            )}
          </div>
          <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-foreground">学习转化漏斗</h3>
              <div className="relative">
                <select
                  className="appearance-none text-xs text-muted-foreground bg-transparent pr-4 py-1 outline-none cursor-default"
                  value="all"
                  disabled
                >
                  <option value="all">全部阶段</option>
                </select>
                <ChevronIcon />
              </div>
            </div>
            <div className="flex gap-3">
              <div className="flex-1">
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
                        itemStyle: { color: FUNNEL_COLORS[i] },
                      })),
                      label: { fontSize: 11, color: '#374151' },
                    }],
                  }}
                  style={{ height: 200 }}
                />
              </div>
              <div className="w-[120px] flex flex-col gap-2 py-2">
                {stats.funnel_stages.map((s, i) => (
                  <div key={s.stage} className="flex items-center gap-2">
                    <span className="shrink-0 w-3 h-3 rounded-sm" style={{ backgroundColor: FUNNEL_COLORS[i] }} />
                    <span className="text-xs text-muted-foreground truncate">{FUNNEL_LABELS[s.stage] || s.stage}</span>
                    <span className="text-[10px] text-muted-foreground ml-auto">{s.count}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
