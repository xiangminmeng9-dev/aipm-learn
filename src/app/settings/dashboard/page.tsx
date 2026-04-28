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
}

function formatMinutes(min: number): string {
  if (min < 60) return `${min} 分钟`;
  const h = Math.floor(min / 60);
  const m = min % 60;
  return m > 0 ? `${h} 小时 ${m} 分钟` : `${h} 小时`;
}

export default function LearningDashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

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

  const statsCards = [
    { label: '学习时长', value: formatMinutes(data.totalLearningMinutes), icon: '⏱️', color: 'bg-indigo-50 text-indigo-700' },
    { label: '面试次数', value: `${data.interviewCount} 次`, icon: '🎤', color: 'bg-purple-50 text-purple-700' },
    { label: '技能覆盖度', value: `${data.skillCoverage}%`, icon: '🎯', color: 'bg-emerald-50 text-emerald-700' },
    { label: '平均分数', value: `${data.avgScore}`, icon: '📊', color: 'bg-amber-50 text-amber-700' },
    { label: '每日挑战', value: `${data.challengeCount} 次`, icon: '🔥', color: 'bg-rose-50 text-rose-700' },
    { label: '任务完成', value: `${data.completedTasks}/${data.totalTasks}`, icon: '✅', color: 'bg-sky-50 text-sky-700' },
  ];

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
      {
        name: '活跃度',
        type: 'bar',
        data: data.progressCurve.map((d) => d.totalActivity),
        itemStyle: { color: '#818CF8' },
        barWidth: '40%',
      },
      {
        name: '平均分',
        type: 'line',
        yAxisIndex: 1,
        data: data.progressCurve.map((d) => d.avgScore),
        itemStyle: { color: '#F59E0B' },
        lineStyle: { width: 2 },
        symbol: 'circle',
        symbolSize: 6,
      },
    ],
  };

  const scoreOption = {
    tooltip: { trigger: 'axis' as const },
    grid: { left: 40, right: 20, top: 20, bottom: 30 },
    xAxis: {
      type: 'category' as const,
      data: data.scoreTrend.map((d) => d.date),
      axisLabel: { fontSize: 10 },
    },
    yAxis: { type: 'value' as const, min: 0, max: 100, axisLabel: { fontSize: 10 } },
    series: [{
      type: 'line',
      data: data.scoreTrend.map((d) => d.score),
      itemStyle: { color: '#4F46E5' },
      lineStyle: { width: 2 },
      areaStyle: { color: 'rgba(79,70,229,0.1)' },
      symbol: 'circle',
      symbolSize: 6,
    }],
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-40 border-b border-border bg-card/80 backdrop-blur">
        <div className="flex items-center gap-4 px-8 py-4">
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

      <div className="mx-auto max-w-5xl px-8 py-8">
        {/* Stats cards */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
          {statsCards.map((s) => (
            <div key={s.label} className="rounded-2xl border border-border bg-card p-4 text-center">
              <div className="text-2xl mb-1">{s.icon}</div>
              <div className={`text-lg font-bold ${s.color.split(' ')[1]}`}>{s.value}</div>
              <div className="text-xs text-muted-foreground mt-1">{s.label}</div>
            </div>
          ))}
        </div>

        {/* Skill coverage bar */}
        <div className="mb-8 rounded-2xl border border-border bg-card p-6">
          <h2 className="mb-3 text-sm font-semibold text-foreground">技能覆盖度</h2>
          <div className="flex items-center gap-3">
            <div className="flex-1">
              <div className="h-4 overflow-hidden rounded-full bg-secondary">
                <div className="h-full rounded-full bg-indigo-500 transition-all" style={{ width: `${data.skillCoverage}%` }} />
              </div>
            </div>
            <span className="text-sm font-bold text-indigo-600">{data.skillCoverage}%</span>
          </div>
          <p className="mt-2 text-xs text-muted-foreground">
            已覆盖 {data.completedModules}/{data.totalModules} 个技能模块，完成 {data.completedTasks}/{data.totalTasks} 个学习任务
          </p>
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="rounded-2xl border border-border bg-card p-6">
            <h2 className="mb-3 text-sm font-semibold text-foreground">近 30 天活跃度</h2>
            {data.progressCurve.length > 0 ? (
              <ReactECharts option={progressOption} style={{ height: 280 }} />
            ) : (
              <p className="py-12 text-center text-sm text-muted-foreground">暂无数据</p>
            )}
          </div>
          <div className="rounded-2xl border border-border bg-card p-6">
            <h2 className="mb-3 text-sm font-semibold text-foreground">分数趋势</h2>
            {data.scoreTrend.length > 0 ? (
              <ReactECharts option={scoreOption} style={{ height: 280 }} />
            ) : (
              <p className="py-12 text-center text-sm text-muted-foreground">暂无数据</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
