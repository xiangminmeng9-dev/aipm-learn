'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import dynamic from 'next/dynamic';

const ReactECharts = dynamic(() => import('echarts-for-react'), { ssr: false });

interface DashboardData {
  totalLearningMinutes: number;
  interviewCount: number;
  avgScore: number;
  challengeCount: number;
  skillCoverage: number;
  totalModules: number;
  completedModules: number;
  totalTasks: number;
  completedTasks: number;
  progressCurve: { date: string; interviews: number; challenges: number; totalActivity: number; avgScore: number }[];
  scoreTrend: { date: string; score: number; type: string }[];
  codingFlows?: number;
  notebookNotes?: number;
  notebookTasks?: number;
  simulatorSessions?: number;
  simulatorStagesCompleted?: number;
  resumeVersions?: number;
  resumeMatchScore?: number;
  resourcesCount?: number;
  dailyStreak?: number;
  moduleDetails?: {
    coding: { flows: number; recentActivity: number };
    skills: { coverage: number; modules: number; tasks: number; completedTasks: number };
    notebook: { notes: number; tasks: number; aiAnalysis: number };
    simulator: { sessions: number; stagesCompleted: number; avgScore: number };
    interview: { qaCount: number; mockCount: number; avgScore: number; sessions: number };
    resume: { versions: number; matchScore: number };
    resources: { count: number; articlesRead: number };
    dailyChallenge: { submissions: number; streak: number; avgScore: number };
  };
}

function formatMinutes(min: number): string {
  if (min < 60) return `${min} 分钟`;
  const h = Math.floor(min / 60);
  const m = min % 60;
  return m > 0 ? `${h} 小时 ${m} 分钟` : `${h} 小时`;
}

const MODULES = [
  { id: 'coding', name: 'AI Coding', icon: '</>', color: '#818CF8', bgColor: 'bg-indigo-50', textColor: 'text-indigo-700', href: '/coding/practice' },
  { id: 'skills', name: '技能树', icon: '🌳', color: '#16a34a', bgColor: 'bg-emerald-50', textColor: 'text-emerald-700', href: '/skills/tree' },
  { id: 'notebook', name: '笔记本', icon: '📝', color: '#f59e0b', bgColor: 'bg-amber-50', textColor: 'text-amber-700', href: '/notebook' },
  { id: 'simulator', name: '模拟器', icon: '🚀', color: '#14b8a6', bgColor: 'bg-teal-50', textColor: 'text-teal-700', href: '/simulator' },
  { id: 'interview', name: '面试助手', icon: '🎤', color: '#7c3aed', bgColor: 'bg-purple-50', textColor: 'text-purple-700', href: '/interview/assistant' },
  { id: 'resume', name: '简历助手', icon: '📄', color: '#ea580c', bgColor: 'bg-orange-50', textColor: 'text-orange-700', href: '/resume' },
  { id: 'resources', name: '资源库', icon: '📚', color: '#3b82f6', bgColor: 'bg-blue-50', textColor: 'text-blue-700', href: '/resources' },
  { id: 'dailyChallenge', name: '每日挑战', icon: '🎯', color: '#ef4444', bgColor: 'bg-rose-50', textColor: 'text-rose-700', href: '/daily-challenge' },
];

export default function LearningDashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [expandedModule, setExpandedModule] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/learning/dashboard')
      .then((r) => r.ok ? r.json() : null)
      .then((d) => setData(d))
      .catch(() => {})
      .finally(() => setIsLoading(false));
  }, []);

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-indigo-500 border-t-transparent" />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="min-h-screen p-8">
        <Link href="/settings" className="text-sm text-muted-foreground hover:text-foreground">← 返回设置</Link>
        <p className="mt-8 text-muted-foreground">暂无学习数据</p>
      </div>
    );
  }

  const details = data.moduleDetails || {
    coding: { flows: data.codingFlows ?? 0, recentActivity: 0 },
    skills: { coverage: data.skillCoverage, modules: data.totalModules, tasks: data.totalTasks, completedTasks: data.completedTasks },
    notebook: { notes: data.notebookNotes ?? 0, tasks: data.notebookTasks ?? 0, aiAnalysis: 0 },
    simulator: { sessions: data.simulatorSessions ?? 0, stagesCompleted: data.simulatorStagesCompleted ?? 0, avgScore: 0 },
    interview: { qaCount: data.interviewCount, mockCount: 0, avgScore: data.avgScore, sessions: 0 },
    resume: { versions: data.resumeVersions ?? 0, matchScore: data.resumeMatchScore ?? 0 },
    resources: { count: data.resourcesCount ?? 0, articlesRead: 0 },
    dailyChallenge: { submissions: data.challengeCount, streak: data.dailyStreak ?? 0, avgScore: 0 },
  };

  const radarOption = {
    tooltip: {},
    radar: {
      indicator: MODULES.map((m) => ({ name: m.name, max: 100 })),
      radius: '65%',
      splitArea: { areaStyle: { color: ['rgba(250,250,250,0.3)', 'rgba(200,200,200,0.3)'] } },
      axisLine: { lineStyle: { color: 'rgba(0,0,0,0.1)' } },
      splitLine: { lineStyle: { color: 'rgba(0,0,0,0.1)' } },
    },
    series: [{
      type: 'radar',
      data: [{
        value: MODULES.map((m) => {
          const d = details[m.id as keyof typeof details] as Record<string, number>;
          if (!d) return 0;
          if (m.id === 'skills') return d.coverage;
          if (m.id === 'interview') return Math.min(100, d.avgScore);
          if (m.id === 'resume') return d.matchScore;
          if (m.id === 'dailyChallenge') return Math.min(100, d.submissions * 10);
          return Math.min(100, Object.values(d).reduce((s, v) => s + (typeof v === 'number' ? v : 0), 0) * 5);
        }),
        name: '学习进度',
        areaStyle: { color: 'rgba(99,102,241,0.2)' },
        lineStyle: { color: '#6366F1', width: 2 },
        itemStyle: { color: '#6366F1' },
      }],
    }],
  };

  const progressOption = {
    tooltip: { trigger: 'axis' as const },
    legend: { data: ['活跃度', '平均分'], bottom: 0, textStyle: { fontSize: 11 } },
    grid: { left: 40, right: 20, top: 20, bottom: 40 },
    xAxis: {
      type: 'category' as const,
      data: data.progressCurve.map((d) => d.date.slice(5)),
      axisLabel: { fontSize: 10, rotate: 30 },
    },
    yAxis: [
      { type: 'value' as const, name: '活跃度', min: 0, axisLabel: { fontSize: 10 } },
      { type: 'value' as const, name: '分数', min: 0, max: 100, axisLabel: { fontSize: 10 } },
    ],
    series: [
      { name: '活跃度', type: 'bar', data: data.progressCurve.map((d) => d.totalActivity), itemStyle: { color: '#818CF8' }, barWidth: '40%' },
      { name: '平均分', type: 'line', yAxisIndex: 1, data: data.progressCurve.map((d) => d.avgScore), itemStyle: { color: '#F59E0B' }, lineStyle: { width: 2 }, symbol: 'circle', symbolSize: 6 },
    ],
  };

  const scoreOption = {
    tooltip: { trigger: 'axis' as const },
    grid: { left: 40, right: 20, top: 20, bottom: 30 },
    xAxis: { type: 'category' as const, data: data.scoreTrend.map((d) => d.date), axisLabel: { fontSize: 10 } },
    yAxis: { type: 'value' as const, min: 0, max: 100, axisLabel: { fontSize: 10 } },
    series: [{
      type: 'line', data: data.scoreTrend.map((d) => d.score),
      itemStyle: { color: '#4F46E5' }, lineStyle: { width: 2 },
      areaStyle: { color: 'rgba(79,70,229,0.1)' }, symbol: 'circle', symbolSize: 6,
    }],
  };

  function getModuleMetrics(id: string): { label: string; value: string | number; subLabel?: string }[] {
    const d = details[id as keyof typeof details];
    if (!d) return [];
    switch (id) {
      case 'coding':
        return [{ label: '开发流程', value: d.flows }, { label: '近期活跃', value: d.recentActivity }];
      case 'skills':
        return [{ label: '覆盖度', value: `${d.coverage}%` }, { label: '模块', value: `${d.completedTasks}/${d.tasks}` }];
      case 'notebook':
        return [{ label: '笔记', value: d.notes }, { label: '任务', value: d.tasks }, { label: 'AI分析', value: d.aiAnalysis }];
      case 'simulator':
        return [{ label: '会话', value: d.sessions }, { label: '完成阶段', value: d.stagesCompleted }, { label: '平均分', value: d.avgScore }];
      case 'interview':
        return [{ label: 'QA次数', value: d.qaCount }, { label: '模拟面试', value: d.mockCount }, { label: '平均分', value: d.avgScore }];
      case 'resume':
        return [{ label: '版本数', value: d.versions }, { label: '匹配度', value: `${d.matchScore}%` }];
      case 'resources':
        return [{ label: '资源数', value: d.count }, { label: '已读', value: d.articlesRead }];
      case 'dailyChallenge':
        return [{ label: '提交数', value: d.submissions }, { label: '连续天数', value: d.streak }, { label: '平均分', value: d.avgScore }];
      default: return [];
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-40 border-b border-border bg-card/80 backdrop-blur">
        <div className="flex items-center gap-4 px-6 py-4">
          <Link href="/settings" className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground">
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5 8.25 12l7.5-7.5" />
            </svg>
            返回设置
          </Link>
          <span className="text-muted-foreground">|</span>
          <h1 className="text-lg font-bold text-foreground">学习数据看板</h1>
        </div>
      </header>

      <div className="mx-auto max-w-5xl px-6 py-6 space-y-6">
        {/* Overview stats */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {[
            { label: '学习时长', value: formatMinutes(data.totalLearningMinutes), icon: '⏱️', bg: 'bg-indigo-50', text: 'text-indigo-700' },
            { label: '面试次数', value: `${data.interviewCount} 次`, icon: '🎤', bg: 'bg-purple-50', text: 'text-purple-700' },
            { label: '技能覆盖', value: `${data.skillCoverage}%`, icon: '🎯', bg: 'bg-emerald-50', text: 'text-emerald-700' },
            { label: '平均分数', value: `${data.avgScore}`, icon: '📊', bg: 'bg-amber-50', text: 'text-amber-700' },
            { label: '每日挑战', value: `${data.challengeCount} 次`, icon: '🔥', bg: 'bg-rose-50', text: 'text-rose-700' },
            { label: '任务完成', value: `${data.completedTasks}/${data.totalTasks}`, icon: '✅', bg: 'bg-sky-50', text: 'text-sky-700' },
          ].map((s) => (
            <div key={s.label} className={`rounded-xl border border-border ${s.bg} p-3 text-center`}>
              <div className="text-xl mb-0.5">{s.icon}</div>
              <div className={`text-base font-bold ${s.text}`}>{s.value}</div>
              <div className="text-xs text-muted-foreground">{s.label}</div>
            </div>
          ))}
        </div>

        {/* Radar chart - 8 modules overview */}
        <div className="rounded-xl border border-border bg-card p-5">
          <h2 className="mb-2 text-sm font-semibold text-foreground">8 模块学习雷达</h2>
          <ReactECharts option={radarOption} style={{ height: 300 }} />
        </div>

        {/* 8 Module cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {MODULES.map((m) => {
            const metrics = getModuleMetrics(m.id);
            const isExpanded = expandedModule === m.id;
            return (
              <div key={m.id} className={`rounded-xl border border-border bg-card transition-all ${isExpanded ? 'sm:col-span-2 lg:col-span-4' : ''}`}>
                <div className="p-4">
                  <div className="flex items-center justify-between">
                    <Link href={m.href} className={`flex items-center gap-2 ${m.textColor}`}>
                      <span className="text-lg font-bold">{m.icon}</span>
                      <span className="text-sm font-semibold">{m.name}</span>
                    </Link>
                    <button onClick={() => setExpandedModule(isExpanded ? null : m.id)} className="text-xs text-muted-foreground hover:text-foreground">
                      {isExpanded ? '收起' : '展开'}
                    </button>
                  </div>
                  <div className="mt-3 space-y-2">
                    {metrics.map((metric) => (
                      <div key={metric.label} className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">{metric.label}</span>
                        <span className="font-medium text-foreground">{metric.value}</span>
                      </div>
                    ))}
                  </div>
                  {/* Mini progress bar */}
                  {m.id === 'skills' && (
                    <div className="mt-3">
                      <div className="h-2 rounded-full bg-secondary">
                        <div className="h-2 rounded-full bg-emerald-500" style={{ width: `${details.skills.coverage}%` }} />
                      </div>
                    </div>
                  )}
                </div>
                {isExpanded && (
                  <div className="border-t border-border p-4">
                    <ModuleDetailChart moduleId={m.id} data={data} details={details} color={m.color} />
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Activity charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="rounded-xl border border-border bg-card p-5">
            <h2 className="mb-2 text-sm font-semibold text-foreground">近 30 天活跃度</h2>
            {data.progressCurve.length > 0 ? (
              <ReactECharts option={progressOption} style={{ height: 260 }} />
            ) : (
              <p className="py-12 text-center text-sm text-muted-foreground">暂无数据</p>
            )}
          </div>
          <div className="rounded-xl border border-border bg-card p-5">
            <h2 className="mb-2 text-sm font-semibold text-foreground">分数趋势</h2>
            {data.scoreTrend.length > 0 ? (
              <ReactECharts option={scoreOption} style={{ height: 260 }} />
            ) : (
              <p className="py-12 text-center text-sm text-muted-foreground">暂无数据</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function ModuleDetailChart({ moduleId, data, details, color }: { moduleId: string; data: DashboardData; details: NonNullable<DashboardData['moduleDetails']>; color: string }) {
  const d = details[moduleId as keyof typeof details];
  if (!d) return <p className="text-sm text-muted-foreground">暂无详细数据</p>;

  // Build a pie chart showing module breakdown
  const pieData = Object.entries(d).map(([key, val]) => ({
    name: key === 'coverage' ? '覆盖度' : key === 'flows' ? '开发流程' : key === 'notes' ? '笔记' : key === 'tasks' ? '任务' : key === 'sessions' ? '会话' : key === 'qaCount' ? 'QA次数' : key === 'mockCount' ? '模拟面试' : key === 'versions' ? '版本' : key === 'matchScore' ? '匹配度' : key === 'count' ? '资源' : key === 'articlesRead' ? '已读' : key === 'submissions' ? '提交' : key === 'streak' ? '连续天数' : key === 'avgScore' ? '平均分' : key === 'completedTasks' ? '已完成任务' : key === 'modules' ? '模块数' : key === 'stagesCompleted' ? '完成阶段' : key === 'recentActivity' ? '近期活跃' : key === 'aiAnalysis' ? 'AI分析' : key,
    value: typeof val === 'number' ? val : 0,
  })).filter((item) => item.value > 0);

  const option = {
    tooltip: { trigger: 'item' as const },
    series: [{
      type: 'pie',
      radius: ['40%', '70%'],
      data: pieData,
      emphasis: { itemStyle: { shadowBlur: 10, shadowOffsetX: 0, shadowColor: 'rgba(0,0,0,0.5)' } },
      label: { fontSize: 11 },
      itemStyle: { borderColor: '#fff', borderWidth: 2 },
    }],
  };

  return <ReactECharts option={option} style={{ height: 200 }} />;
}