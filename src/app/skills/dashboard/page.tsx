'use client';

import { useState, useEffect, useCallback } from 'react';
import GradientBackground from '@/components/ui/gradient-background';
import ReactECharts from 'echarts-for-react';

interface SkillsStats {
  system_modules: number;
  pending_tasks: number;
  jd_analysis_count: number;
  jd_gaps_count: number;
  learning_plan_count: number;
  ai_path_count: number;
  tasks_change: number;
  jd_change: number;
  skill_completion_trend: { date: string; count: number }[];
  company_distribution: { company: string; count: number }[];
  plan_progress: { id: string; title: string; status: string; progress: number }[];
  common_skills: { skill: string; count: number; category?: string; companies?: string[] }[];
  skills_by_category: Record<string, { skill: string; count: number; category?: string; companies?: string[] }[]>;
  category_distribution: { category: string; count: number }[];
  funnel_stages: { stage: string; count: number }[];
  coverage_rate: number;
  covered_skills: { skill: string; count: number; covered: boolean }[];
  level_stats: { level: number; name: string; total: number; completed: number; color: string }[];
}

const statCards = [
  { key: 'system_modules', label: '系统模块', icon: '🏛️' },
  { key: 'pending_tasks', label: '待学习技能', icon: '📚' },
  { key: 'jd_analysis_count', label: '岗位分析', icon: '📋' },
  { key: 'jd_gaps_count', label: 'JD差距分析', icon: '🔍' },
  { key: 'learning_plan_count', label: '学习计划', icon: '📅' },
  { key: 'ai_path_count', label: 'AI学习路径', icon: '🤖' },
];

export default function SkillsDashboardPage() {
  const [stats, setStats] = useState<SkillsStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [range, setRange] = useState<'7d' | '30d' | 'all'>('30d');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [commonSkillsData, setCommonSkillsData] = useState<{ skill: string; count: number; category?: string; companies?: string[] }[]>([]);

  // 加载数据
  const loadData = useCallback(async (r: string) => {
    try {
      const res = await fetch(`/api/skills/dashboard?range=${r}`);
      const d = await res.json();
      if (d.stats) {
        setStats(d.stats);
        setCommonSkillsData(d.stats.common_skills || []);
      }
    } catch (e) {
      console.error('Load error:', e);
    } finally {
      setLoading(false);
    }
  }, []);

  // 初始加载
  useEffect(() => {
    setLoading(true);
    loadData(range);
  }, [range, loadData]);

  // 前端筛选职位类型（从已加载的数据中筛选，无需请求API）
  const handleSelectCategory = useCallback((cat: string) => {
    setSelectedCategory(cat);
    if (stats?.skills_by_category && stats.skills_by_category[cat]) {
      setCommonSkillsData(stats.skills_by_category[cat]);
    } else {
      setCommonSkillsData(stats?.common_skills || []);
    }
  }, [stats]);

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
          <p className="text-lg font-medium text-muted-foreground">暂无技能学习数据</p>
          <p className="mt-2 text-sm text-muted-foreground">开始学习后，看板数据将自动展示</p>
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
            <h1 className="text-2xl font-bold text-foreground">技能树看板</h1>
            <p className="mt-1 text-sm font-medium text-muted-foreground">追踪学习进度，发现技能差距</p>
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
            const value = stats[card.key as keyof SkillsStats] as number;
            const change = card.key === 'pending_tasks' ? stats.tasks_change :
                          card.key === 'jd_analysis_count' ? stats.jd_change : 0;
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

        {/* Row 1: Trend + Company Distribution */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          <div className="lg:col-span-2 rounded-2xl border border-border bg-card p-5 shadow-sm">
            <h3 className="mb-4 text-sm font-semibold text-foreground">技能完成趋势</h3>
            <ReactECharts
              option={{
                tooltip: { trigger: 'axis' },
                xAxis: {
                  type: 'category',
                  data: stats.skill_completion_trend.map(t => t.date.slice(5)),
                  axisLabel: { fontSize: 10, color: '#6B7280' },
                },
                yAxis: { type: 'value', axisLabel: { fontSize: 10, color: '#6B7280' } },
                series: [{
                  type: 'line',
                  data: stats.skill_completion_trend.map(t => t.count),
                  smooth: true,
                  areaStyle: { opacity: 0.3 },
                  lineStyle: { color: '#6366F1', width: 2 },
                  itemStyle: { color: '#6366F1' },
                }],
                grid: { left: 40, right: 20, top: 20, bottom: 30 },
              }}
              style={{ height: 200 }}
            />
          </div>
          <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
            <h3 className="mb-4 text-sm font-semibold text-foreground">JD来源公司分布</h3>
            {stats.company_distribution.length > 0 ? (
              <ReactECharts
                option={{
                  tooltip: { trigger: 'item' },
                  series: [{
                    type: 'pie',
                    radius: ['40%', '70%'],
                    data: stats.company_distribution.map(c => ({ name: c.company, value: c.count })),
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

        {/* Row 2: Skill Learning Progress (left) + Common Skills Bar Chart (right) */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {/* 左侧：技能学习进度（按四个大板块） */}
          <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
            <h3 className="mb-4 text-sm font-semibold text-foreground">技能学习进度</h3>
            {stats.level_stats && stats.level_stats.length > 0 ? (
              <div className="space-y-4">
                {stats.level_stats.map((level) => {
                  const pct = level.total > 0 ? Math.round((level.completed / level.total) * 100) : 0;
                  return (
                    <div key={level.level} className="space-y-1.5">
                      <div className="flex items-center justify-between text-sm">
                        <div className="flex items-center gap-2">
                          <span
                            className="inline-block w-3 h-3 rounded-sm"
                            style={{ backgroundColor: level.color }}
                          />
                          <span className="text-foreground font-medium">{level.name}</span>
                        </div>
                        <span className="text-muted-foreground">
                          {level.completed}/{level.total} ({pct}%)
                        </span>
                      </div>
                      <div className="h-2.5 overflow-hidden rounded-full bg-muted">
                        <div
                          className="h-full rounded-full transition-all"
                          style={{
                            width: `${pct}%`,
                            backgroundColor: level.color,
                          }}
                        />
                      </div>
                    </div>
                  );
                })}
                {/* 总计 */}
                <div className="pt-3 border-t border-border">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-foreground font-semibold">总计</span>
                    <span className="text-indigo-600 font-semibold">
                      {stats.level_stats.reduce((sum, l) => sum + l.completed, 0)}/
                      {stats.level_stats.reduce((sum, l) => sum + l.total, 0)}
                    </span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex h-[200px] items-center justify-center text-sm text-muted-foreground">暂无学习进度</div>
            )}
          </div>
          {/* 右侧：JD共性要求排名（竖向柱状图） */}
          <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-semibold text-foreground">JD共性要求排名</h3>
              {/* 职位类型筛选 - 和简历助手漏斗一样的样式 */}
              <div className="relative">
                <select
                  className="appearance-none text-xs text-muted-foreground bg-transparent pr-4 py-1 outline-none cursor-pointer hover:text-foreground transition-colors"
                  value={selectedCategory}
                  onChange={(e) => handleSelectCategory(e.target.value)}
                >
                  <option value="all">全部职位</option>
                  {stats.category_distribution.map((c, i) => (
                    <option key={i} value={c.category}>{c.category} ({c.count})</option>
                  ))}
                </select>
                <svg className="absolute right-0 top-1/2 -translate-y-1/2 h-3 w-3 text-muted-foreground pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </div>
            {/* 图例在左上方 */}
            {commonSkillsData.length > 0 && (
              <div className="flex flex-wrap gap-x-3 gap-y-1 mb-2 text-xs text-muted-foreground">
                {commonSkillsData.slice(0, 8).map((s, i) => (
                  <span key={i} className="flex items-center gap-1">
                    <span
                      className="inline-block w-2.5 h-2.5 rounded-sm"
                      style={{ backgroundColor: ['#6366F1', '#F59E0B', '#10B981', '#EF4444', '#8B5CF6', '#EC4899', '#14B8A6', '#F97316'][i] }}
                    />
                    <span className="truncate max-w-[80px]" title={s.skill}>{s.skill}</span>
                  </span>
                ))}
              </div>
            )}
            {commonSkillsData.length > 0 ? (
              <ReactECharts
                option={{
                  tooltip: {
                    trigger: 'axis',
                    axisPointer: { type: 'shadow' },
                    formatter: (params: any) => {
                      const i = params[0].dataIndex;
                      const skillInfo = commonSkillsData[i];
                      return `<strong>${skillInfo?.skill || ''}</strong><br/>出现次数: ${params[0].value}`;
                    }
                  },
                  legend: {
                    show: true,
                    top: 0,
                    left: 0,
                    orient: 'horizontal',
                    itemWidth: 10,
                    itemHeight: 10,
                    textStyle: { fontSize: 9, color: '#6B7280' },
                    formatter: (name: string) => name.length > 8 ? name.slice(0, 8) + '...' : name,
                  },
                  xAxis: {
                    type: 'category',
                    data: commonSkillsData.slice(0, 8).map(s => s.skill.length > 5 ? s.skill.slice(0, 5) + '..' : s.skill),
                    axisLabel: { fontSize: 10, color: '#6B7280' },
                  },
                  yAxis: {
                    type: 'value',
                    axisLabel: { fontSize: 10, color: '#6B7280' },
                  },
                  series: [{
                    type: 'bar',
                    data: commonSkillsData.slice(0, 8).map((s, i) => ({
                      value: s.count,
                      name: s.skill,
                      itemStyle: {
                        color: ['#6366F1', '#F59E0B', '#10B981', '#EF4444', '#8B5CF6', '#EC4899', '#14B8A6', '#F97316'][i],
                        borderRadius: [4, 4, 0, 0],
                      },
                    })),
                    barWidth: 28,
                  }],
                  grid: { left: 30, right: 20, top: 45, bottom: 30 },
                }}
                style={{ height: 220 }}
              />
            ) : (
              <div className="flex h-[200px] items-center justify-center text-sm text-muted-foreground">暂无数据</div>
            )}
          </div>
        </div>

        {/* Row 3: Funnel + Coverage */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
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
          <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-foreground">高频技能覆盖度</h3>
              <span className="text-2xl font-bold text-indigo-600">{stats.coverage_rate}%</span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-muted mb-4">
              <div
                className="h-full rounded-full bg-indigo-500 transition-all"
                style={{ width: `${stats.coverage_rate}%` }}
              />
            </div>
            <div className="space-y-2 max-h-[150px] overflow-y-auto">
              {stats.covered_skills.slice(0, 6).map((s, i) => (
                <div key={i} className="flex items-center justify-between text-sm">
                  <span className="text-foreground truncate max-w-[150px]">{s.skill}</span>
                  <span className={`px-2 py-0.5 rounded text-xs ${s.covered ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}`}>
                    {s.covered ? '已覆盖' : '未覆盖'}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}