'use client';

import { useState, useEffect, useMemo } from 'react';
import GradientBackground from '@/components/ui/gradient-background';
import ReactECharts from 'echarts-for-react';

interface DailyChallengeStats {
  total_submissions: number;
  avg_score: number;
  max_score: number;
  high_score_count: number;
  low_score_count: number;
  streak: number;
  total_flashcards: number;
  due_flashcards: number;
  total_reviews: number;
  good_review_rate: number;
  wrong_count: number;
  tech_bookmarks: number;
  tech_push_count: number;
  submission_change: number;
  score_trend: { date: string; score: number }[];
  category_distribution: { category: string; count: number }[];
  difficulty_stats: { difficulty: string; count: number; avgScore: number }[];
  daily_activity: { date: string; count: number }[];
  funnel_stages: { stage: string; count: number }[];
  categories?: string[];
  difficulties?: string[];
}

const CATEGORY_COLORS = ['#F59E0B', '#10B981', '#0EA5E9', '#8B5CF6', '#EF4444', '#EC4899'];
const DIFFICULTY_COLORS = ['#10B981', '#F59E0B', '#EF4444'];
const FUNNEL_COLORS = ['#F59E0B', '#10B981', '#6366F1'];
const FUNNEL_LABELS: Record<string, string> = {
  viewed: '浏览', attempted: '答题', completed: '完成',
};

const statCards = [
  { key: 'total_submissions', label: '答题总数', icon: '📝' },
  { key: 'avg_score', label: '平均得分', icon: '📊' },
  { key: 'streak', label: '连续打卡', icon: '🔥' },
  { key: 'total_flashcards', label: '知识闪卡', icon: '🎴' },
  { key: 'wrong_count', label: '错题数', icon: '❌' },
  { key: 'tech_bookmarks', label: '技术收藏', icon: '⭐' },
  { key: 'tech_push_count', label: '技术推送', icon: '📡' },
];

export default function DailyChallengeDashboardPage() {
  const [stats, setStats] = useState<DailyChallengeStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [range, setRange] = useState<'7d' | '30d' | 'all'>('30d');

  // 筛选状态
  const [scoreTrendType, setScoreTrendType] = useState<'daily' | 'weekly'>('daily');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [activityView, setActivityView] = useState<'bar' | 'line'>('bar');
  const [difficultyMetric, setDifficultyMetric] = useState<'count' | 'score'>('count');

  useEffect(() => {
    setLoading(true);
    fetch(`/api/daily-challenge/dashboard?range=${range}`)
      .then(r => r.json())
      .then(d => {
        if (d.stats) setStats(d.stats);
        else setStats(null);
      })
      .catch(() => setStats(null))
      .finally(() => setLoading(false));
  }, [range]);

  // 得分趋势数据处理
  const scoreTrendData = useMemo(() => {
    if (!stats?.score_trend) return [];
    if (scoreTrendType === 'daily') return stats.score_trend;

    // 按周聚合
    const weeklyMap = new Map<string, { scores: number[] }>();
    stats.score_trend.forEach(item => {
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
  }, [stats?.score_trend, scoreTrendType]);

  // 类别分布筛选
  const categoryData = useMemo(() => {
    if (!stats?.category_distribution) return [];
    if (categoryFilter === 'all') return stats.category_distribution;
    return stats.category_distribution.filter(c => c.category === categoryFilter);
  }, [stats?.category_distribution, categoryFilter]);

  // 难度分布数据处理
  const difficultyChartData = useMemo(() => {
    if (!stats?.difficulty_stats) return { labels: [], values: [] };
    const labels = stats.difficulty_stats.map(d =>
      d.difficulty === 'easy' ? '简单' : d.difficulty === 'medium' ? '中等' : '困难'
    );
    const values = difficultyMetric === 'count'
      ? stats.difficulty_stats.map(d => d.count)
      : stats.difficulty_stats.map(d => d.avgScore);
    return { labels, values };
  }, [stats?.difficulty_stats, difficultyMetric]);

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
          <p className="text-lg font-medium text-muted-foreground">暂无挑战数据</p>
          <p className="mt-2 text-sm text-muted-foreground">开始答题后，看板数据将自动展示</p>
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
            <h1 className="text-2xl font-bold text-foreground">每日挑战看板</h1>
            <p className="mt-1 text-sm font-medium text-muted-foreground">追踪答题进度，发现知识差距</p>
          </div>
          <div className="flex items-center gap-1 rounded-lg bg-muted p-1">
            {(['7d', '30d', 'all'] as const).map(r => (
              <button
                key={r}
                onClick={() => setRange(r)}
                className={`rounded-md px-4 py-1.5 text-xs font-semibold transition-colors ${
                  range === r ? 'bg-amber-500 text-white' : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                {r === '7d' ? '近7天' : r === '30d' ? '近30天' : '全部'}
              </button>
            ))}
          </div>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
          {statCards.map(card => {
            const value = stats[card.key as keyof DailyChallengeStats] as number;
            const change = card.key === 'total_submissions' ? stats.submission_change : 0;
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

        {/* Flashcard Progress */}
        {stats.total_flashcards > 0 && (
          <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-foreground">知识闪卡复习进度</h3>
              <span className="text-sm text-amber-600 font-medium">
                {stats.due_flashcards} 待复习
              </span>
            </div>
            <div className="h-2.5 overflow-hidden rounded-full bg-muted">
              <div
                className="h-full rounded-full bg-amber-500 transition-all"
                style={{ width: `${stats.good_review_rate}%` }}
              />
            </div>
            <p className="mt-2 text-xs text-muted-foreground">
              已复习 {stats.total_reviews} 次，掌握率 {stats.good_review_rate}%
            </p>
          </div>
        )}

        {/* Row 1: Score Trend + Category Distribution */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-foreground">得分趋势</h3>
              <div className="relative">
                <select
                  className="appearance-none text-xs text-muted-foreground bg-transparent pr-4 py-1 outline-none cursor-pointer hover:text-foreground transition-colors"
                  value={scoreTrendType}
                  onChange={(e) => setScoreTrendType(e.target.value as 'daily' | 'weekly')}
                >
                  <option value="daily">按日</option>
                  <option value="weekly">按周</option>
                </select>
                <svg className="absolute right-0 top-1/2 -translate-y-1/2 h-3 w-3 text-muted-foreground pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
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
                        areaStyle: { opacity: 0.3 },
                        lineStyle: { color: '#F59E0B', width: 2 },
                        itemStyle: { color: '#F59E0B' },
                      }],
                      grid: { left: 40, right: 20, top: 20, bottom: 30 },
                    }}
                    style={{ height: 200 }}
                  />
                </div>
                <div className="w-[120px] flex flex-col gap-2 py-2">
                  <div className="flex items-center gap-2">
                    <span className="shrink-0 w-3 h-3 rounded-sm" style={{ backgroundColor: '#F59E0B' }} />
                    <span className="text-xs text-muted-foreground">得分</span>
                  </div>
                  <div className="mt-1 text-xs text-muted-foreground">
                    <div>平均: {stats.avg_score}</div>
                    <div>最高: {stats.max_score}</div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex h-[200px] items-center justify-center text-sm text-muted-foreground">暂无数据</div>
            )}
          </div>
          <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-foreground">类别分布</h3>
              <div className="relative">
                <select
                  className="appearance-none text-xs text-muted-foreground bg-transparent pr-4 py-1 outline-none cursor-pointer hover:text-foreground transition-colors"
                  value={categoryFilter}
                  onChange={(e) => setCategoryFilter(e.target.value)}
                >
                  <option value="all">全部类别</option>
                  {stats.categories?.map((cat, i) => (
                    <option key={i} value={cat}>{cat}</option>
                  ))}
                </select>
                <svg className="absolute right-0 top-1/2 -translate-y-1/2 h-3 w-3 text-muted-foreground pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </div>
            {categoryData.length > 0 ? (
              <div className="flex gap-3">
                <div className="flex-1">
                  <ReactECharts
                    option={{
                      tooltip: { trigger: 'item', formatter: '{b}: {c} ({d}%)' },
                      series: [{
                        type: 'pie',
                        radius: ['40%', '70%'],
                        data: categoryData.map((c, i) => ({
                          name: c.category,
                          value: c.count,
                          itemStyle: { color: CATEGORY_COLORS[i % CATEGORY_COLORS.length] },
                        })),
                        label: { fontSize: 10, color: '#6B7280' },
                      }],
                    }}
                    style={{ height: 200 }}
                  />
                </div>
                <div className="w-[120px] flex flex-col gap-2 py-2">
                  {categoryData.map((c, i) => (
                    <div key={c.category} className="flex items-center gap-2">
                      <span className="shrink-0 w-3 h-3 rounded-sm" style={{ backgroundColor: CATEGORY_COLORS[i % CATEGORY_COLORS.length] }} />
                      <span className="text-xs text-muted-foreground truncate">{c.category}</span>
                      <span className="text-[10px] text-muted-foreground ml-auto">{c.count}</span>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="flex h-[200px] items-center justify-center text-sm text-muted-foreground">暂无数据</div>
            )}
          </div>
        </div>

        {/* Row 2: Daily Activity + Difficulty Stats */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-foreground">每日答题活动</h3>
              <div className="relative">
                <select
                  className="appearance-none text-xs text-muted-foreground bg-transparent pr-4 py-1 outline-none cursor-pointer hover:text-foreground transition-colors"
                  value={activityView}
                  onChange={(e) => setActivityView(e.target.value as 'bar' | 'line')}
                >
                  <option value="bar">柱状图</option>
                  <option value="line">折线图</option>
                </select>
                <svg className="absolute right-0 top-1/2 -translate-y-1/2 h-3 w-3 text-muted-foreground pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </div>
            {stats.daily_activity.length > 0 ? (
              <div className="flex gap-3">
                <div className="flex-1">
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
                        type: activityView,
                        data: stats.daily_activity.map(d => d.count),
                        smooth: activityView === 'line',
                        itemStyle: { color: '#F59E0B', borderRadius: activityView === 'bar' ? [4, 4, 0, 0] : undefined },
                        areaStyle: activityView === 'line' ? { opacity: 0.3 } : undefined,
                      }],
                      grid: { left: 40, right: 20, top: 20, bottom: 30 },
                    }}
                    style={{ height: 200 }}
                  />
                </div>
                <div className="w-[120px] flex flex-col gap-2 py-2">
                  <div className="flex items-center gap-2">
                    <span className="shrink-0 w-3 h-3 rounded-sm" style={{ backgroundColor: '#F59E0B' }} />
                    <span className="text-xs text-muted-foreground">答题数</span>
                  </div>
                  <div className="mt-1 text-xs text-muted-foreground">
                    <div>总计: {stats.total_submissions}</div>
                    <div>日均: {stats.daily_activity.length > 0 ? Math.round(stats.daily_activity.reduce((s, d) => s + d.count, 0) / stats.daily_activity.length) : 0}</div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex h-[200px] items-center justify-center text-sm text-muted-foreground">暂无数据</div>
            )}
          </div>
          <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-foreground">难度分布</h3>
              <div className="relative">
                <select
                  className="appearance-none text-xs text-muted-foreground bg-transparent pr-4 py-1 outline-none cursor-pointer hover:text-foreground transition-colors"
                  value={difficultyMetric}
                  onChange={(e) => setDifficultyMetric(e.target.value as 'count' | 'score')}
                >
                  <option value="count">答题数量</option>
                  <option value="score">平均得分</option>
                </select>
                <svg className="absolute right-0 top-1/2 -translate-y-1/2 h-3 w-3 text-muted-foreground pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </div>
            {stats.difficulty_stats.length > 0 ? (
              <div className="flex gap-3">
                <div className="flex-1">
                  <ReactECharts
                    option={{
                      tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } },
                      xAxis: {
                        type: 'category',
                        data: difficultyChartData.labels,
                        axisLabel: { fontSize: 10, color: '#6B7280' },
                      },
                      yAxis: {
                        type: 'value',
                        name: difficultyMetric === 'count' ? '数量' : '得分',
                        min: difficultyMetric === 'score' ? 0 : undefined,
                        max: difficultyMetric === 'score' ? 100 : undefined,
                        axisLabel: { fontSize: 10, color: '#6B7280' },
                      },
                      series: [{
                        type: 'bar',
                        data: difficultyChartData.values,
                        itemStyle: {
                          color: (params: { dataIndex: number }) => {
                            return DIFFICULTY_COLORS[params.dataIndex] || '#F59E0B';
                          },
                          borderRadius: [4, 4, 0, 0],
                        },
                      }],
                      grid: { left: 50, right: 20, top: 30, bottom: 30 },
                    }}
                    style={{ height: 200 }}
                  />
                </div>
                <div className="w-[120px] flex flex-col gap-2 py-2">
                  {stats.difficulty_stats.map((d, i) => (
                    <div key={d.difficulty} className="flex items-center gap-2">
                      <span className="shrink-0 w-3 h-3 rounded-sm" style={{ backgroundColor: DIFFICULTY_COLORS[i] || '#F59E0B' }} />
                      <span className="text-xs text-muted-foreground">{d.difficulty === 'easy' ? '简单' : d.difficulty === 'medium' ? '中等' : '困难'}</span>
                      <span className="text-[10px] text-muted-foreground ml-auto">{d.count}</span>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="flex h-[200px] items-center justify-center text-sm text-muted-foreground">暂无数据</div>
            )}
          </div>
        </div>

        {/* Row 3: Funnel + High Scores */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
            <h3 className="mb-4 text-sm font-semibold text-foreground">学习转化漏斗</h3>
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
          <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-foreground">得分分布</h3>
            </div>
            <div className="flex gap-3">
              <div className="flex-1 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">最高得分</span>
                  <span className="text-lg font-bold text-amber-500">{stats.max_score}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">平均得分</span>
                  <span className="text-lg font-bold text-foreground">{stats.avg_score}</span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-muted">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-rose-500 via-amber-500 to-emerald-500"
                    style={{ width: `${stats.avg_score}%` }}
                  />
                </div>
              </div>
              <div className="w-[120px] flex flex-col gap-2 py-2">
                <div className="flex items-center gap-2">
                  <span className="shrink-0 w-3 h-3 rounded-sm" style={{ backgroundColor: '#10B981' }} />
                  <span className="text-xs text-muted-foreground">优秀</span>
                  <span className="text-[10px] text-muted-foreground ml-auto">{stats.high_score_count}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="shrink-0 w-3 h-3 rounded-sm" style={{ backgroundColor: '#EF4444' }} />
                  <span className="text-xs text-muted-foreground">不及格</span>
                  <span className="text-[10px] text-muted-foreground ml-auto">{stats.low_score_count}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        </div>
    </div>
  );
}