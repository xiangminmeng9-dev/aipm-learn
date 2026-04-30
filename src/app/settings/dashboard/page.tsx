'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import dynamic from 'next/dynamic';

const ReactECharts = dynamic(() => import('echarts-for-react'), { ssr: false });

/* ── Types ── */
interface ModuleDetails {
  coding: { flows: number; recentActivity: number; dailyActivity: { date: string; count: number }[]; byStage: { name: string; value: number }[]; specPracticeCount: number; specPracticeAvgScore: number; specPracticeScoreTrend: { date: string; score: number }[]; specPracticeDimensionDist: { dimension: string; avgScore: number }[] };
  skills: { coverage: number; modules: number; tasks: number; completedTasks: number; moduleBreakdown: { id: string; name: string; level: string; total: number; completed: number }[]; byLevel: { level: string; total: number; completed: number; custom: number }[]; customModules: number };
  notebook: { notes: number; tasks: number; aiAnalysis: number; dailyCreation: { date: string; notes: number; tasks: number }[]; byType: { name: string; value: number }[] };
  simulator: { sessions: number; stagesCompleted: number; avgScore: number; byScenario: { name: string; count: number; avgScore: number }[]; scoreDistribution: { range: string; count: number }[] };
  interview: { qaCount: number; mockCount: number; avgScore: number; sessions: number; scoreHistory: { date: string; score: number }[]; byCategory: { name: string; count: number; avgScore: number }[]; mockScoreDistribution: { range: string; count: number }[]; methodStats: { method: string; count: number; avgScore: number }[] };
  resume: { versions: number; matchScore: number; matchTrend: { date: string; score: number }[]; jobStats: { status: string; count: number }[] };
  resources: { count: number; articlesRead: number; byCategory: { name: string; total: number; read: number }[]; readingPace: { date: string; count: number }[] };
  dailyChallenge: { submissions: number; streak: number; avgScore: number; scoreHistory: { date: string; score: number }[]; scoreDistribution: { range: string; count: number }[]; streakCalendar: { date: string; hasSubmission: boolean }[] };
}

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
  moduleDetails?: ModuleDetails;
}

/* ── Shared ECharts theme helpers ── */
const gradient = (c1: string, c2: string) => ({ type: "linear" as const, x: 0, y: 0, x2: 0, y2: 1, colorStops: [{ offset: 0, color: c1 }, { offset: 1, color: c2 }] });

const CHART_HEIGHT = 240;
const gridBase = { left: 50, right: 16, top: 24, bottom: 36 };

const palette = {
  indigo: { main: '#6366F1', light: '#A5B4FC', bg: '#EEF2FF', grad: ['#818CF8', '#6366F1'] },
  emerald: { main: '#10B981', light: '#6EE7B7', bg: '#ECFDF5', grad: ['#34D399', '#10B981'] },
  amber: { main: '#F59E0B', light: '#FCD34D', bg: '#FFFBEB', grad: ['#FBBF24', '#F59E0B'] },
  teal: { main: '#14B8A6', light: '#5EEAD4', bg: '#F0FDFA', grad: ['#2DD4BF', '#14B8A6'] },
  purple: { main: '#8B5CF6', light: '#C4B5FD', bg: '#F5F3FF', grad: ['#A78BFA', '#8B5CF6'] },
  orange: { main: '#F97316', light: '#FDBA74', bg: '#FFF7ED', grad: ['#FB923C', '#F97316'] },
  blue: { main: '#3B82F6', light: '#93C5FD', bg: '#EFF6FF', grad: ['#60A5FA', '#3B82F6'] },
  rose: { main: '#F43F5E', light: '#FDA4AF', bg: '#FFF1F2', grad: ['#FB7185', '#F43F5E'] },
};

function formatMinutes(min: number): string {
  if (min < 60) return `${min} 分钟`;
  const h = Math.floor(min / 60);
  const m = min % 60;
  return m > 0 ? `${h}h ${m}m` : `${h}h`;
}

function StatItem({ label, value, color }: { label: string; value: string | number; color?: string }) {
  return (
    <div className="flex items-center justify-between py-2 px-3 rounded-lg bg-muted/30">
      <span className="text-sm text-muted-foreground">{label}</span>
      <span className={`text-base font-bold ${color ?? 'text-foreground'}`}>{value}</span>
    </div>
  );
}

function ModuleHeader({ icon, title, href, accent }: { icon: string; title: string; href: string; accent: string }) {
  return (
    <div className="flex items-center justify-between mb-5">
      <div className="flex items-center gap-3">
        <span className="text-2xl">{icon}</span>
        <h2 className="text-xl font-bold text-foreground">{title}</h2>
      </div>
      <Link href={href} className={`text-sm font-medium ${accent} hover:underline`}>
        详情 →
      </Link>
    </div>
  );
}

/* ── Main Page ── */
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

  if (!data || !data.moduleDetails) {
    return (
      <div className="min-h-screen p-8">
        <Link href="/settings" className="text-sm text-muted-foreground hover:text-foreground">← 返回设置</Link>
        <p className="mt-8 text-muted-foreground">暂无学习数据</p>
      </div>
    );
  }

  const d = data.moduleDetails;

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <header className="sticky top-0 z-40 border-b border-border bg-card/80 backdrop-blur">
        <div className="flex items-center gap-4 px-6 py-3">
          <Link href="/settings" className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground">
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5 8.25 12l7.5-7.5" />
            </svg>
            返回
          </Link>
          <h1 className="text-base font-bold text-foreground">学习数据看板</h1>
          <span className="text-xs text-muted-foreground">{formatMinutes(data.totalLearningMinutes)} · {data.interviewCount} 次面试 · {data.skillCoverage}% 技能覆盖</span>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto p-6 space-y-6">

        {/* ════════════════════════════════════════════
            1. AI Coding
        ════════════════════════════════════════════ */}
        <section className="rounded-2xl border border-border bg-card p-6">
          <ModuleHeader icon="</>" title="AI Coding" href="/coding/practice" accent={palette.indigo.main} />
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-5">
            <StatItem label="开发流程" value={d.coding.flows} color={palette.indigo.main} />
            <StatItem label="近7天活跃" value={d.coding.recentActivity} color={palette.indigo.main} />
            <StatItem label="实操次数" value={d.coding.specPracticeCount} color={palette.indigo.main} />
            <StatItem label="实操均分" value={d.coding.specPracticeAvgScore} color={palette.indigo.main} />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {/* 7-day bar */}
            <ReactECharts option={{
              title: { text: '7天活跃趋势', left: 'center', top: 0, textStyle: { fontSize: 13, color: '#6B7280' } },
              tooltip: { trigger: 'axis', backgroundColor: '#1F2937', borderColor: '#374151', textStyle: { color: '#F9FAFB', fontSize: 12 } },
              grid: gridBase,
              xAxis: { type: 'category', data: d.coding.dailyActivity.map((x) => x.date), axisLabel: { fontSize: 10, color: '#9CA3AF' }, axisLine: { lineStyle: { color: '#E5E7EB' } } },
              yAxis: { type: 'value', minInterval: 1, axisLabel: { fontSize: 10, color: '#9CA3AF' }, splitLine: { lineStyle: { color: '#F3F4F6', type: 'dashed' } } },
              series: [{ type: 'bar', data: d.coding.dailyActivity.map((x) => x.count), itemStyle: { color: gradient('#818CF8', '#6366F1'), borderRadius: [6, 6, 0, 0] }, barWidth: '45%' }],
            }} style={{ height: CHART_HEIGHT }} />
            {/* Stage distribution */}
            <ReactECharts option={{
              title: { text: '阶段分布', left: 'center', top: 0, textStyle: { fontSize: 13, color: '#6B7280' } },
              tooltip: { trigger: 'item', backgroundColor: '#1F2937', borderColor: '#374151', textStyle: { color: '#F9FAFB', fontSize: 12 } },
              series: [{ type: 'pie', radius: ['42%', '72%'], center: ['50%', '55%'], data: d.coding.byStage.length > 0 ? d.coding.byStage : [{ name: '暂无数据', value: 1 }],
                label: { fontSize: 11, color: '#6B7280', formatter: '{b}: {c}' },
                itemStyle: { borderColor: '#fff', borderWidth: 2, borderRadius: 6 },
                emphasis: { itemStyle: { shadowBlur: 12, shadowColor: 'rgba(0,0,0,0.15)' } },
                color: ['#818CF8', '#6366F1', '#4F46E5', '#4338CA', '#3730A3'],
              }],
            }} style={{ height: CHART_HEIGHT }} />
            {/* Flow vs Recent donut */}
            <ReactECharts option={{
              title: { text: '活跃占比', left: 'center', top: 0, textStyle: { fontSize: 13, color: '#6B7280' } },
              tooltip: { trigger: 'item', backgroundColor: '#1F2937', borderColor: '#374151', textStyle: { color: '#F9FAFB', fontSize: 12 } },
              series: [{ type: 'pie', radius: ['42%', '72%'], center: ['50%', '55%'], data: [
                { name: '近期活跃', value: d.coding.recentActivity, itemStyle: { color: { type: 'linear' as const, x: 0, y: 0, x2: 1, y2: 1, colorStops: [{ offset: 0, color: '#818CF8' }, { offset: 1, color: '#6366F1' }] } } },
                { name: '历史流程', value: Math.max(0, d.coding.flows - d.coding.recentActivity), itemStyle: { color: '#E0E7FF' } },
              ], label: { fontSize: 11, color: '#6B7280' }, itemStyle: { borderColor: '#fff', borderWidth: 2, borderRadius: 6 }, emphasis: { itemStyle: { shadowBlur: 12 } } }],
            }} style={{ height: CHART_HEIGHT }} />
          </div>
          {/* Spec Practice stats */}
          {d.coding.specPracticeCount > 0 && (
            <div className="mt-5 grid grid-cols-1 md:grid-cols-2 gap-5">
              <ReactECharts option={{
                title: { text: '实操得分趋势', left: 'center', top: 0, textStyle: { fontSize: 13, color: '#6B7280' } },
                tooltip: { trigger: 'axis', backgroundColor: '#1F2937', borderColor: '#374151', textStyle: { color: '#F9FAFB', fontSize: 12 } },
                grid: gridBase,
                xAxis: { type: 'category', data: d.coding.specPracticeScoreTrend.map((x) => x.date), axisLabel: { fontSize: 10, color: '#9CA3AF' }, axisLine: { lineStyle: { color: '#E5E7EB' } } },
                yAxis: { type: 'value', min: 0, max: 100, axisLabel: { fontSize: 10, color: '#9CA3AF' }, splitLine: { lineStyle: { color: '#F3F4F6', type: 'dashed' } } },
                series: [{ type: 'line', data: d.coding.specPracticeScoreTrend.map((x) => x.score), smooth: true, lineStyle: { color: '#6366F1', width: 2 }, areaStyle: { color: { type: 'linear' as const, x: 0, y: 0, x2: 0, y2: 1, colorStops: [{ offset: 0, color: 'rgba(99,102,241,0.3)' }, { offset: 1, color: 'rgba(99,102,241,0.02)' }] } }, itemStyle: { color: '#6366F1' }, symbol: 'circle', symbolSize: 6 }],
              }} style={{ height: CHART_HEIGHT }} />
              <ReactECharts option={{
                title: { text: '维度平均分', left: 'center', top: 0, textStyle: { fontSize: 13, color: '#6B7280' } },
                tooltip: { trigger: 'item', backgroundColor: '#1F2937', borderColor: '#374151', textStyle: { color: '#F9FAFB', fontSize: 12 } },
                radar: { indicator: d.coding.specPracticeDimensionDist.map((d) => ({ name: d.dimension, max: 100 })), radius: '65%', center: ['50%', '55%'], axisName: { color: '#6B7280', fontSize: 11 }, splitArea: { areaStyle: { color: ['rgba(99,102,241,0.02)', 'rgba(99,102,241,0.05)'] } } },
                series: [{ type: 'radar', data: [{ value: d.coding.specPracticeDimensionDist.map((d) => d.avgScore), name: '平均分', areaStyle: { color: 'rgba(99,102,241,0.15)' }, lineStyle: { color: '#6366F1', width: 2 }, itemStyle: { color: '#6366F1' } }] }],
              }} style={{ height: CHART_HEIGHT }} />
            </div>
          )}
        </section>

        {/* ════════════════════════════════════════════
            2. 技能树
        ════════════════════════════════════════════ */}
        <section className="rounded-2xl border border-border bg-card p-6">
          <ModuleHeader icon="🌳" title="技能树" href="/skills/tree" accent={palette.emerald.main} />
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-5">
            <StatItem label="技能覆盖" value={`${d.skills.coverage}%`} color={palette.emerald.main} />
            <StatItem label="模块总数" value={d.skills.modules} color={palette.emerald.main} />
            <StatItem label="任务完成" value={`${d.skills.completedTasks}/${d.skills.tasks}`} color={palette.emerald.main} />
            <StatItem label="完成率" value={`${d.skills.tasks > 0 ? Math.round((d.skills.completedTasks / d.skills.tasks) * 100) : 0}%`} color={palette.emerald.main} />
            <StatItem label="自定义模块" value={d.skills.customModules} color={palette.emerald.main} />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
            {/* Coverage gauge */}
            <ReactECharts option={{
              title: { text: '覆盖度', left: 'center', top: 0, textStyle: { fontSize: 13, color: '#6B7280' } },
              series: [{ type: 'gauge', startAngle: 200, endAngle: -20, radius: '80%', min: 0, max: 100, center: ['50%', '60%'],
                axisLine: { lineStyle: { width: 16, color: [[0.3, '#F87171'], [0.7, '#FBBF24'], [1, '#10B981']] } },
                pointer: { itemStyle: { color: '#10B981' }, width: 5, length: '55%' },
                axisTick: { show: false }, splitLine: { show: false }, axisLabel: { show: false },
                detail: { valueAnimation: true, formatter: '{value}%', fontSize: 22, fontWeight: 'bold', color: '#10B981', offsetCenter: [0, '50%'] },
                data: [{ value: d.skills.coverage }],
              }],
            }} style={{ height: CHART_HEIGHT }} />
            {/* By level stacked bar */}
            <ReactECharts option={{
              title: { text: '各阶段任务', left: 'center', top: 0, textStyle: { fontSize: 13, color: '#6B7280' } },
              tooltip: { trigger: 'axis', backgroundColor: '#1F2937', borderColor: '#374151', textStyle: { color: '#F9FAFB', fontSize: 12 } },
              legend: { data: ['已完成', '未完成', '自定义'], bottom: 0, textStyle: { fontSize: 10, color: '#9CA3AF' } },
              grid: { left: 50, right: 16, top: 30, bottom: 44 },
              xAxis: { type: 'value', axisLabel: { fontSize: 10, color: '#9CA3AF' }, splitLine: { lineStyle: { color: '#F3F4F6', type: 'dashed' } } },
              yAxis: { type: 'category', data: d.skills.byLevel.map((l) => l.level), axisLabel: { fontSize: 10, color: '#6B7280' } },
              series: [
                { name: '已完成', type: 'bar', stack: 'total', data: d.skills.byLevel.map((l) => l.completed), itemStyle: { color: '#10B981', borderRadius: [0, 0, 0, 0] } },
                { name: '未完成', type: 'bar', stack: 'total', data: d.skills.byLevel.map((l) => l.total - l.completed), itemStyle: { color: '#D1FAE5' } },
                { name: '自定义', type: 'bar', stack: 'total', data: d.skills.byLevel.map((l) => l.custom), itemStyle: { color: '#6EE7B7' } },
              ],
            }} style={{ height: CHART_HEIGHT }} />
            {/* Module completion bar chart */}
            <ReactECharts option={{
              title: { text: '模块完成度', left: 'center', top: 0, textStyle: { fontSize: 13, color: '#6B7280' } },
              tooltip: { trigger: 'axis', backgroundColor: '#1F2937', borderColor: '#374151', textStyle: { color: '#F9FAFB', fontSize: 12 } },
              grid: { left: 80, right: 16, top: 30, bottom: 20 },
              xAxis: { type: 'value', max: 100, axisLabel: { fontSize: 10, color: '#9CA3AF', formatter: '{value}%' }, splitLine: { lineStyle: { color: '#F3F4F6', type: 'dashed' } } },
              yAxis: { type: 'category', data: d.skills.moduleBreakdown.slice(0, 6).map((m) => m.name.length > 6 ? m.name.slice(0, 6) + '…' : m.name), axisLabel: { fontSize: 10, color: '#6B7280' } },
              series: [{ type: 'bar', data: d.skills.moduleBreakdown.slice(0, 6).map((m) => m.total > 0 ? Math.round((m.completed / m.total) * 100) : 0),
                itemStyle: { color: (params: { dataIndex: number }) => {
                  const v = params.dataIndex;
                  const colors = ['#34D399', '#10B981', '#059669', '#047857', '#065F46', '#064E3B'];
                  return colors[v % colors.length];
                }, borderRadius: [0, 6, 6, 0] },
                barWidth: '55%',
                label: { show: true, position: 'right', fontSize: 10, color: '#6B7280', formatter: '{c}%' },
              }],
            }} style={{ height: CHART_HEIGHT }} />
            {/* Custom vs system pie */}
            <ReactECharts option={{
              title: { text: '自定义模块占比', left: 'center', top: 0, textStyle: { fontSize: 13, color: '#6B7280' } },
              tooltip: { trigger: 'item', backgroundColor: '#1F2937', borderColor: '#374151', textStyle: { color: '#F9FAFB', fontSize: 12 } },
              series: [{ type: 'pie', radius: ['42%', '72%'], center: ['50%', '55%'], data: [
                { name: '系统模块', value: d.skills.modules - d.skills.customModules, itemStyle: { color: '#10B981' } },
                { name: '自定义模块', value: d.skills.customModules, itemStyle: { color: '#6EE7B7' } },
              ], label: { fontSize: 11, color: '#6B7280' }, itemStyle: { borderColor: '#fff', borderWidth: 2, borderRadius: 6 }, emphasis: { itemStyle: { shadowBlur: 12 } } }],
            }} style={{ height: CHART_HEIGHT }} />
          </div>
        </section>

        {/* ════════════════════════════════════════════
            3. 笔记本
        ════════════════════════════════════════════ */}
        <section className="rounded-2xl border border-border bg-card p-6">
          <ModuleHeader icon="📝" title="笔记本" href="/notebook" accent={palette.amber.main} />
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-5">
            <StatItem label="笔记数" value={d.notebook.notes} color={palette.amber.main} />
            <StatItem label="任务数" value={d.notebook.tasks} color={palette.amber.main} />
            <StatItem label="AI分析" value={d.notebook.aiAnalysis} color={palette.amber.main} />
            <StatItem label="总量" value={d.notebook.notes + d.notebook.tasks + d.notebook.aiAnalysis} color={palette.amber.main} />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {/* Content pie */}
            <ReactECharts option={{
              title: { text: '内容构成', left: 'center', top: 0, textStyle: { fontSize: 13, color: '#6B7280' } },
              tooltip: { trigger: 'item', backgroundColor: '#1F2937', borderColor: '#374151', textStyle: { color: '#F9FAFB', fontSize: 12 } },
              series: [{ type: 'pie', radius: ['42%', '72%'], center: ['50%', '55%'], data: [
                { name: '笔记', value: d.notebook.notes, itemStyle: { color: { type: 'linear' as const, x: 0, y: 0, x2: 1, y2: 1, colorStops: [{ offset: 0, color: '#FBBF24' }, { offset: 1, color: '#F59E0B' }] } } },
                { name: '任务', value: d.notebook.tasks, itemStyle: { color: '#FDE68A' } },
                { name: 'AI分析', value: d.notebook.aiAnalysis, itemStyle: { color: '#FEF3C7' } },
              ], label: { fontSize: 11, color: '#6B7280', formatter: '{b}\n{c}' }, itemStyle: { borderColor: '#fff', borderWidth: 2, borderRadius: 6 }, emphasis: { itemStyle: { shadowBlur: 12 } } }],
            }} style={{ height: CHART_HEIGHT }} />
            {/* 7-day creation */}
            <ReactECharts option={{
              title: { text: '7天创建趋势', left: 'center', top: 0, textStyle: { fontSize: 13, color: '#6B7280' } },
              tooltip: { trigger: 'axis', backgroundColor: '#1F2937', borderColor: '#374151', textStyle: { color: '#F9FAFB', fontSize: 12 } },
              legend: { data: ['笔记', '任务'], bottom: 0, textStyle: { fontSize: 10, color: '#9CA3AF' } },
              grid: { ...gridBase, bottom: 44 },
              xAxis: { type: 'category', data: d.notebook.dailyCreation.map((x) => x.date.slice(5)), axisLabel: { fontSize: 10, color: '#9CA3AF' }, axisLine: { lineStyle: { color: '#E5E7EB' } } },
              yAxis: { type: 'value', minInterval: 1, axisLabel: { fontSize: 10, color: '#9CA3AF' }, splitLine: { lineStyle: { color: '#F3F4F6', type: 'dashed' } } },
              series: [
                { name: '笔记', type: 'bar', data: d.notebook.dailyCreation.map((x) => x.notes), itemStyle: { color: '#F59E0B', borderRadius: [4, 4, 0, 0] }, barWidth: '30%', barGap: '10%' },
                { name: '任务', type: 'bar', data: d.notebook.dailyCreation.map((x) => x.tasks), itemStyle: { color: '#FDE68A', borderRadius: [4, 4, 0, 0] }, barWidth: '30%' },
              ],
            }} style={{ height: CHART_HEIGHT }} />
            {/* By type */}
            <ReactECharts option={{
              title: { text: '笔记分类', left: 'center', top: 0, textStyle: { fontSize: 13, color: '#6B7280' } },
              tooltip: { trigger: 'item', backgroundColor: '#1F2937', borderColor: '#374151', textStyle: { color: '#F9FAFB', fontSize: 12 } },
              series: [{ type: 'pie', radius: ['42%', '72%'], center: ['50%', '55%'], data: d.notebook.byType.length > 0 ? d.notebook.byType : [{ name: '暂无数据', value: 1 }],
                label: { fontSize: 11, color: '#6B7280' }, itemStyle: { borderColor: '#fff', borderWidth: 2, borderRadius: 6 }, emphasis: { itemStyle: { shadowBlur: 12 } },
                color: ['#F59E0B', '#FBBF24', '#FCD34D', '#FDE68A', '#FEF3C7'],
              }],
            }} style={{ height: CHART_HEIGHT }} />
          </div>
        </section>

        {/* ════════════════════════════════════════════
            4. 模拟器
        ════════════════════════════════════════════ */}
        <section className="rounded-2xl border border-border bg-card p-6">
          <ModuleHeader icon="🚀" title="模拟器" href="/simulator" accent={palette.teal.main} />
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-5">
            <StatItem label="会话数" value={d.simulator.sessions} color={palette.teal.main} />
            <StatItem label="完成阶段" value={d.simulator.stagesCompleted} color={palette.teal.main} />
            <StatItem label="平均分" value={d.simulator.avgScore} color={palette.teal.main} />
            <StatItem label="完成率" value={`${d.simulator.sessions > 0 ? Math.round((d.simulator.stagesCompleted / d.simulator.sessions) * 100) : 0}%`} color={palette.teal.main} />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
            {/* Radar */}
            <ReactECharts option={{
              title: { text: '综合能力', left: 'center', top: 0, textStyle: { fontSize: 13, color: '#6B7280' } },
              radar: { indicator: [{ name: '会话', max: Math.max(d.simulator.sessions, 1) }, { name: '阶段', max: Math.max(d.simulator.stagesCompleted, 1) }, { name: '分数', max: 100 }], radius: '60%', shape: 'polygon', axisName: { color: '#6B7280', fontSize: 11 }, splitArea: { areaStyle: { color: ['rgba(20,184,166,0.02)', 'rgba(20,184,166,0.05)'] } } },
              series: [{ type: 'radar', data: [{ value: [d.simulator.sessions, d.simulator.stagesCompleted, d.simulator.avgScore], areaStyle: { color: 'rgba(20,184,166,0.2)' }, lineStyle: { color: '#14B8A6', width: 2 }, itemStyle: { color: '#14B8A6' } }] }],
            }} style={{ height: CHART_HEIGHT }} />
            {/* Score gauge */}
            <ReactECharts option={{
              title: { text: '平均分', left: 'center', top: 0, textStyle: { fontSize: 13, color: '#6B7280' } },
              series: [{ type: 'gauge', startAngle: 200, endAngle: -20, radius: '80%', min: 0, max: 100, center: ['50%', '60%'],
                axisLine: { lineStyle: { width: 16, color: [[0.3, '#F87171'], [0.7, '#FBBF24'], [1, '#14B8A6']] } },
                pointer: { itemStyle: { color: '#14B8A6' }, width: 5, length: '55%' },
                axisTick: { show: false }, splitLine: { show: false }, axisLabel: { show: false },
                detail: { valueAnimation: true, formatter: '{value}', fontSize: 22, fontWeight: 'bold', color: '#14B8A6', offsetCenter: [0, '50%'] },
                data: [{ value: d.simulator.avgScore }],
              }],
            }} style={{ height: CHART_HEIGHT }} />
            {/* By scenario */}
            <ReactECharts option={{
              title: { text: '场景分布', left: 'center', top: 0, textStyle: { fontSize: 13, color: '#6B7280' } },
              tooltip: { trigger: 'axis', backgroundColor: '#1F2937', borderColor: '#374151', textStyle: { color: '#F9FAFB', fontSize: 12 } },
              grid: { left: 50, right: 16, top: 30, bottom: 20 },
              xAxis: { type: 'value', axisLabel: { fontSize: 10, color: '#9CA3AF' }, splitLine: { lineStyle: { color: '#F3F4F6', type: 'dashed' } } },
              yAxis: { type: 'category', data: d.simulator.byScenario.map((s) => s.name), axisLabel: { fontSize: 10, color: '#6B7280' } },
              series: [{ type: 'bar', data: d.simulator.byScenario.map((s) => s.count), itemStyle: { color: { type: 'linear' as const, x: 0, y: 0, x2: 1, y2: 0, colorStops: [{ offset: 0, color: '#2DD4BF' }, { offset: 1, color: '#14B8A6' }] }, borderRadius: [0, 6, 6, 0] }, barWidth: '50%' }],
            }} style={{ height: CHART_HEIGHT }} />
            {/* Score distribution */}
            <ReactECharts option={{
              title: { text: '分数分布', left: 'center', top: 0, textStyle: { fontSize: 13, color: '#6B7280' } },
              tooltip: { trigger: 'axis', backgroundColor: '#1F2937', borderColor: '#374151', textStyle: { color: '#F9FAFB', fontSize: 12 } },
              grid: gridBase,
              xAxis: { type: 'category', data: d.simulator.scoreDistribution.map((x) => x.range), axisLabel: { fontSize: 10, color: '#9CA3AF' }, axisLine: { lineStyle: { color: '#E5E7EB' } } },
              yAxis: { type: 'value', minInterval: 1, axisLabel: { fontSize: 10, color: '#9CA3AF' }, splitLine: { lineStyle: { color: '#F3F4F6', type: 'dashed' } } },
              series: [{ type: 'bar', data: d.simulator.scoreDistribution.map((x) => x.count), itemStyle: { color: (params: { dataIndex: number }) => ['#F87171', '#FB923C', '#FBBF24', '#34D399', '#14B8A6'][params.dataIndex], borderRadius: [6, 6, 0, 0] }, barWidth: '50%' }],
            }} style={{ height: CHART_HEIGHT }} />
          </div>
        </section>

        {/* ════════════════════════════════════════════
            5. 面试助手 ★ 重点模块
        ════════════════════════════════════════════ */}
        <section className="rounded-2xl border-2 border-purple-200 bg-card p-6">
          <ModuleHeader icon="🎤" title="面试助手" href="/interview/assistant" accent={palette.purple.main} />
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-5">
            <StatItem label="QA次数" value={d.interview.qaCount} color={palette.purple.main} />
            <StatItem label="模拟面试" value={d.interview.mockCount} color={palette.purple.main} />
            <StatItem label="对话Session" value={d.interview.sessions} color={palette.purple.main} />
            <StatItem label="平均分" value={d.interview.avgScore} color={palette.purple.main} />
            <StatItem label="总互动" value={d.interview.qaCount + d.interview.mockCount + d.interview.sessions} color={palette.purple.main} />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {/* QA by category */}
            <ReactECharts option={{
              title: { text: 'QA分类统计', left: 'center', top: 0, textStyle: { fontSize: 13, color: '#6B7280' } },
              tooltip: { trigger: 'item', backgroundColor: '#1F2937', borderColor: '#374151', textStyle: { color: '#F9FAFB', fontSize: 12 } },
              series: [{ type: 'pie', radius: ['42%', '72%'], center: ['50%', '55%'], data: d.interview.byCategory.length > 0 ? d.interview.byCategory.map((c) => ({ name: c.name, value: c.count })) : [{ name: '暂无数据', value: 1 }],
                label: { fontSize: 11, color: '#6B7280', formatter: '{b}: {c}' }, itemStyle: { borderColor: '#fff', borderWidth: 2, borderRadius: 6 }, emphasis: { itemStyle: { shadowBlur: 12 } },
                color: ['#8B5CF6', '#A78BFA', '#C4B5FD', '#DDD6FE', '#EDE9FE'],
              }],
            }} style={{ height: CHART_HEIGHT }} />
            {/* Category avg score bar */}
            <ReactECharts option={{
              title: { text: '分类平均分', left: 'center', top: 0, textStyle: { fontSize: 13, color: '#6B7280' } },
              tooltip: { trigger: 'axis', backgroundColor: '#1F2937', borderColor: '#374151', textStyle: { color: '#F9FAFB', fontSize: 12 } },
              grid: { left: 60, right: 16, top: 30, bottom: 20 },
              xAxis: { type: 'value', max: 100, axisLabel: { fontSize: 10, color: '#9CA3AF' }, splitLine: { lineStyle: { color: '#F3F4F6', type: 'dashed' } } },
              yAxis: { type: 'category', data: d.interview.byCategory.map((c) => c.name.length > 5 ? c.name.slice(0, 5) + '…' : c.name), axisLabel: { fontSize: 10, color: '#6B7280' } },
              series: [{ type: 'bar', data: d.interview.byCategory.map((c) => c.avgScore), itemStyle: { color: { type: 'linear' as const, x: 0, y: 0, x2: 1, y2: 0, colorStops: [{ offset: 0, color: '#A78BFA' }, { offset: 1, color: '#8B5CF6' }] }, borderRadius: [0, 6, 6, 0] }, barWidth: '50%', label: { show: true, position: 'right', fontSize: 10, color: '#8B5CF6' } }],
            }} style={{ height: CHART_HEIGHT }} />
            {/* Score trend line */}
            <ReactECharts option={{
              title: { text: '分数趋势', left: 'center', top: 0, textStyle: { fontSize: 13, color: '#6B7280' } },
              tooltip: { trigger: 'axis', backgroundColor: '#1F2937', borderColor: '#374151', textStyle: { color: '#F9FAFB', fontSize: 12 } },
              grid: gridBase,
              xAxis: { type: 'category', data: d.interview.scoreHistory.map((s) => s.date), axisLabel: { fontSize: 10, color: '#9CA3AF' }, axisLine: { lineStyle: { color: '#E5E7EB' } }, boundaryGap: false },
              yAxis: { type: 'value', min: 0, max: 100, axisLabel: { fontSize: 10, color: '#9CA3AF' }, splitLine: { lineStyle: { color: '#F3F4F6', type: 'dashed' } } },
              series: [{ type: 'line', data: d.interview.scoreHistory.map((s) => s.score), smooth: true, itemStyle: { color: '#8B5CF6' }, lineStyle: { width: 3, color: { type: 'linear' as const, x: 0, y: 0, x2: 1, y2: 0, colorStops: [{ offset: 0, color: '#A78BFA' }, { offset: 1, color: '#8B5CF6' }] } }, areaStyle: { color: gradient('rgba(139,92,246,0.25)', 'rgba(139,92,246,0.02)') }, symbol: 'circle', symbolSize: 7 }],
            }} style={{ height: CHART_HEIGHT }} />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mt-5">
            {/* Method stats radar */}
            <ReactECharts option={{
              title: { text: '方法论维度评分', left: 'center', top: 0, textStyle: { fontSize: 13, color: '#6B7280' } },
              radar: { indicator: d.interview.methodStats.length > 0 ? d.interview.methodStats.map((m) => ({ name: m.method, max: 100 })) : [{ name: '暂无', max: 100 }], radius: '60%', shape: 'polygon', axisName: { color: '#6B7280', fontSize: 11 }, splitArea: { areaStyle: { color: ['rgba(139,92,246,0.02)', 'rgba(139,92,246,0.05)'] } } },
              series: [{ type: 'radar', data: [{ value: d.interview.methodStats.length > 0 ? d.interview.methodStats.map((m) => m.avgScore) : [0], areaStyle: { color: 'rgba(139,92,246,0.2)' }, lineStyle: { color: '#8B5CF6', width: 2 }, itemStyle: { color: '#8B5CF6' } }] }],
            }} style={{ height: CHART_HEIGHT }} />
            {/* Mock score distribution */}
            <ReactECharts option={{
              title: { text: '模拟面试分数分布', left: 'center', top: 0, textStyle: { fontSize: 13, color: '#6B7280' } },
              tooltip: { trigger: 'axis', backgroundColor: '#1F2937', borderColor: '#374151', textStyle: { color: '#F9FAFB', fontSize: 12 } },
              grid: gridBase,
              xAxis: { type: 'category', data: d.interview.mockScoreDistribution.map((x) => x.range), axisLabel: { fontSize: 10, color: '#9CA3AF' }, axisLine: { lineStyle: { color: '#E5E7EB' } } },
              yAxis: { type: 'value', minInterval: 1, axisLabel: { fontSize: 10, color: '#9CA3AF' }, splitLine: { lineStyle: { color: '#F3F4F6', type: 'dashed' } } },
              series: [{ type: 'bar', data: d.interview.mockScoreDistribution.map((x) => x.count), itemStyle: { color: (params: { dataIndex: number }) => ['#F87171', '#FB923C', '#FBBF24', '#A78BFA', '#8B5CF6'][params.dataIndex], borderRadius: [6, 6, 0, 0] }, barWidth: '50%' }],
            }} style={{ height: CHART_HEIGHT }} />
          </div>
        </section>

        {/* ════════════════════════════════════════════
            6. 简历助手
        ════════════════════════════════════════════ */}
        <section className="rounded-2xl border border-border bg-card p-6">
          <ModuleHeader icon="📄" title="简历助手" href="/resume" accent={palette.orange.main} />
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-5">
            <StatItem label="简历版本" value={d.resume.versions} color={palette.orange.main} />
            <StatItem label="最佳匹配" value={`${d.resume.matchScore}%`} color={palette.orange.main} />
            <StatItem label="投递职位" value={d.resume.jobStats.reduce((s, j) => s + j.count, 0)} color={palette.orange.main} />
            <StatItem label="面试率" value={`${(() => { const total = d.resume.jobStats.reduce((s, j) => s + j.count, 0); const interviewed = d.resume.jobStats.filter((j) => j.status === 'interviewed' || j.status === '面试').reduce((s, j) => s + j.count, 0); return total > 0 ? Math.round((interviewed / total) * 100) : 0; })()}%`} color={palette.orange.main} />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {/* Match gauge */}
            <ReactECharts option={{
              title: { text: '匹配度', left: 'center', top: 0, textStyle: { fontSize: 13, color: '#6B7280' } },
              series: [{ type: 'gauge', startAngle: 200, endAngle: -20, radius: '80%', min: 0, max: 100, center: ['50%', '60%'],
                axisLine: { lineStyle: { width: 16, color: [[0.3, '#F97316'], [0.7, '#FB923C'], [1, '#FDBA74']] } },
                pointer: { itemStyle: { color: '#F97316' }, width: 5, length: '55%' },
                axisTick: { show: false }, splitLine: { show: false }, axisLabel: { show: false },
                detail: { valueAnimation: true, formatter: '{value}%', fontSize: 22, fontWeight: 'bold', color: '#F97316', offsetCenter: [0, '50%'] },
                data: [{ value: d.resume.matchScore }],
              }],
            }} style={{ height: CHART_HEIGHT }} />
            {/* Match trend */}
            <ReactECharts option={{
              title: { text: '匹配度趋势', left: 'center', top: 0, textStyle: { fontSize: 13, color: '#6B7280' } },
              tooltip: { trigger: 'axis', backgroundColor: '#1F2937', borderColor: '#374151', textStyle: { color: '#F9FAFB', fontSize: 12 } },
              grid: gridBase,
              xAxis: { type: 'category', data: d.resume.matchTrend.map((x) => x.date), axisLabel: { fontSize: 10, color: '#9CA3AF' }, boundaryGap: false },
              yAxis: { type: 'value', min: 0, max: 100, axisLabel: { fontSize: 10, color: '#9CA3AF' }, splitLine: { lineStyle: { color: '#F3F4F6', type: 'dashed' } } },
              series: [{ type: 'line', data: d.resume.matchTrend.map((x) => x.score), smooth: true, itemStyle: { color: '#F97316' }, lineStyle: { width: 3 }, areaStyle: { color: gradient('rgba(249,115,22,0.25)', 'rgba(249,115,22,0.02)') }, symbol: 'circle', symbolSize: 7 }],
            }} style={{ height: CHART_HEIGHT }} />
            {/* Job stats */}
            <ReactECharts option={{
              title: { text: '投递状态', left: 'center', top: 0, textStyle: { fontSize: 13, color: '#6B7280' } },
              tooltip: { trigger: 'item', backgroundColor: '#1F2937', borderColor: '#374151', textStyle: { color: '#F9FAFB', fontSize: 12 } },
              series: [{ type: 'pie', radius: ['42%', '72%'], center: ['50%', '55%'], data: d.resume.jobStats.length > 0 ? d.resume.jobStats.map((j) => ({ name: j.status, value: j.count })) : [{ name: '暂无数据', value: 1 }],
                label: { fontSize: 11, color: '#6B7280' }, itemStyle: { borderColor: '#fff', borderWidth: 2, borderRadius: 6 }, emphasis: { itemStyle: { shadowBlur: 12 } },
                color: ['#F97316', '#FB923C', '#FDBA74', '#FED7AA', '#FFEDD5'],
              }],
            }} style={{ height: CHART_HEIGHT }} />
          </div>
        </section>

        {/* ════════════════════════════════════════════
            7. 资源库
        ════════════════════════════════════════════ */}
        <section className="rounded-2xl border border-border bg-card p-6">
          <ModuleHeader icon="📚" title="资源库" href="/resources" accent={palette.blue.main} />
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-5">
            <StatItem label="资源总数" value={d.resources.count} color={palette.blue.main} />
            <StatItem label="已读文章" value={d.resources.articlesRead} color={palette.blue.main} />
            <StatItem label="阅读率" value={`${d.resources.count > 0 ? Math.round((d.resources.articlesRead / d.resources.count) * 100) : 0}%`} color={palette.blue.main} />
            <StatItem label="分类数" value={d.resources.byCategory.length} color={palette.blue.main} />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {/* Read/unread pie */}
            <ReactECharts option={{
              title: { text: '阅读进度', left: 'center', top: 0, textStyle: { fontSize: 13, color: '#6B7280' } },
              tooltip: { trigger: 'item', backgroundColor: '#1F2937', borderColor: '#374151', textStyle: { color: '#F9FAFB', fontSize: 12 } },
              series: [{ type: 'pie', radius: ['42%', '72%'], center: ['50%', '55%'], data: [
                { name: '已读', value: d.resources.articlesRead, itemStyle: { color: { type: 'linear' as const, x: 0, y: 0, x2: 1, y2: 1, colorStops: [{ offset: 0, color: '#60A5FA' }, { offset: 1, color: '#3B82F6' }] } } },
                { name: '未读', value: Math.max(0, d.resources.count - d.resources.articlesRead), itemStyle: { color: '#BFDBFE' } },
              ], label: { fontSize: 11, color: '#6B7280', formatter: '{b}\n{c}' }, itemStyle: { borderColor: '#fff', borderWidth: 2, borderRadius: 6 }, emphasis: { itemStyle: { shadowBlur: 12 } } }],
            }} style={{ height: CHART_HEIGHT }} />
            {/* By category */}
            <ReactECharts option={{
              title: { text: '分类阅读情况', left: 'center', top: 0, textStyle: { fontSize: 13, color: '#6B7280' } },
              tooltip: { trigger: 'axis', backgroundColor: '#1F2937', borderColor: '#374151', textStyle: { color: '#F9FAFB', fontSize: 12 } },
              legend: { data: ['总数', '已读'], bottom: 0, textStyle: { fontSize: 10, color: '#9CA3AF' } },
              grid: { left: 60, right: 16, top: 30, bottom: 44 },
              xAxis: { type: 'value', axisLabel: { fontSize: 10, color: '#9CA3AF' }, splitLine: { lineStyle: { color: '#F3F4F6', type: 'dashed' } } },
              yAxis: { type: 'category', data: d.resources.byCategory.map((c) => c.name.length > 5 ? c.name.slice(0, 5) + '…' : c.name), axisLabel: { fontSize: 10, color: '#6B7280' } },
              series: [
                { name: '总数', type: 'bar', data: d.resources.byCategory.map((c) => c.total), itemStyle: { color: '#BFDBFE', borderRadius: [0, 4, 4, 0] } },
                { name: '已读', type: 'bar', data: d.resources.byCategory.map((c) => c.read), itemStyle: { color: '#3B82F6', borderRadius: [0, 4, 4, 0] } },
              ],
            }} style={{ height: CHART_HEIGHT }} />
            {/* Reading pace */}
            <ReactECharts option={{
              title: { text: '7天阅读节奏', left: 'center', top: 0, textStyle: { fontSize: 13, color: '#6B7280' } },
              tooltip: { trigger: 'axis', backgroundColor: '#1F2937', borderColor: '#374151', textStyle: { color: '#F9FAFB', fontSize: 12 } },
              grid: gridBase,
              xAxis: { type: 'category', data: d.resources.readingPace.map((x) => x.date), axisLabel: { fontSize: 10, color: '#9CA3AF' }, axisLine: { lineStyle: { color: '#E5E7EB' } }, boundaryGap: false },
              yAxis: { type: 'value', minInterval: 1, axisLabel: { fontSize: 10, color: '#9CA3AF' }, splitLine: { lineStyle: { color: '#F3F4F6', type: 'dashed' } } },
              series: [{ type: 'line', data: d.resources.readingPace.map((x) => x.count), smooth: true, itemStyle: { color: '#3B82F6' }, lineStyle: { width: 3 }, areaStyle: { color: gradient('rgba(59,130,246,0.25)', 'rgba(59,130,246,0.02)') }, symbol: 'circle', symbolSize: 7 }],
            }} style={{ height: CHART_HEIGHT }} />
          </div>
        </section>

        {/* ════════════════════════════════════════════
            8. 每日挑战
        ════════════════════════════════════════════ */}
        <section className="rounded-2xl border border-border bg-card p-6">
          <ModuleHeader icon="🎯" title="每日挑战" href="/daily-challenge" accent={palette.rose.main} />
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-5">
            <StatItem label="提交数" value={d.dailyChallenge.submissions} color={palette.rose.main} />
            <StatItem label="连续天数" value={d.dailyChallenge.streak} color={palette.rose.main} />
            <StatItem label="平均分" value={d.dailyChallenge.avgScore} color={palette.rose.main} />
            <StatItem label="30天参与率" value={`${Math.round((d.dailyChallenge.streakCalendar.filter((d) => d.hasSubmission).length / 30) * 100)}%`} color={palette.rose.main} />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
            {/* Score gauge */}
            <ReactECharts option={{
              title: { text: '平均分', left: 'center', top: 0, textStyle: { fontSize: 13, color: '#6B7280' } },
              series: [{ type: 'gauge', startAngle: 200, endAngle: -20, radius: '80%', min: 0, max: 100, center: ['50%', '60%'],
                axisLine: { lineStyle: { width: 16, color: [[0.3, '#F87171'], [0.7, '#FBBF24'], [1, '#F43F5E']] } },
                pointer: { itemStyle: { color: '#F43F5E' }, width: 5, length: '55%' },
                axisTick: { show: false }, splitLine: { show: false }, axisLabel: { show: false },
                detail: { valueAnimation: true, formatter: '{value}', fontSize: 22, fontWeight: 'bold', color: '#F43F5E', offsetCenter: [0, '50%'] },
                data: [{ value: d.dailyChallenge.avgScore }],
              }],
            }} style={{ height: CHART_HEIGHT }} />
            {/* Score trend */}
            <ReactECharts option={{
              title: { text: '分数趋势', left: 'center', top: 0, textStyle: { fontSize: 13, color: '#6B7280' } },
              tooltip: { trigger: 'axis', backgroundColor: '#1F2937', borderColor: '#374151', textStyle: { color: '#F9FAFB', fontSize: 12 } },
              grid: gridBase,
              xAxis: { type: 'category', data: d.dailyChallenge.scoreHistory.map((s) => s.date), axisLabel: { fontSize: 10, color: '#9CA3AF' }, boundaryGap: false },
              yAxis: { type: 'value', min: 0, max: 100, axisLabel: { fontSize: 10, color: '#9CA3AF' }, splitLine: { lineStyle: { color: '#F3F4F6', type: 'dashed' } } },
              series: [{ type: 'line', data: d.dailyChallenge.scoreHistory.map((s) => s.score), smooth: true, itemStyle: { color: '#F43F5E' }, lineStyle: { width: 3 }, areaStyle: { color: gradient('rgba(244,63,94,0.25)', 'rgba(244,63,94,0.02)') }, symbol: 'circle', symbolSize: 7 }],
            }} style={{ height: CHART_HEIGHT }} />
            {/* Score distribution */}
            <ReactECharts option={{
              title: { text: '分数分布', left: 'center', top: 0, textStyle: { fontSize: 13, color: '#6B7280' } },
              tooltip: { trigger: 'axis', backgroundColor: '#1F2937', borderColor: '#374151', textStyle: { color: '#F9FAFB', fontSize: 12 } },
              grid: gridBase,
              xAxis: { type: 'category', data: d.dailyChallenge.scoreDistribution.map((x) => x.range), axisLabel: { fontSize: 10, color: '#9CA3AF' }, axisLine: { lineStyle: { color: '#E5E7EB' } } },
              yAxis: { type: 'value', minInterval: 1, axisLabel: { fontSize: 10, color: '#9CA3AF' }, splitLine: { lineStyle: { color: '#F3F4F6', type: 'dashed' } } },
              series: [{ type: 'bar', data: d.dailyChallenge.scoreDistribution.map((x) => x.count), itemStyle: { color: (params: { dataIndex: number }) => ['#F87171', '#FB923C', '#FBBF24', '#FB7185', '#F43F5E'][params.dataIndex], borderRadius: [6, 6, 0, 0] }, barWidth: '50%' }],
            }} style={{ height: CHART_HEIGHT }} />
            {/* 30-day streak heatmap-style bar */}
            <ReactECharts option={{
              title: { text: '30天打卡', left: 'center', top: 0, textStyle: { fontSize: 13, color: '#6B7280' } },
              tooltip: { trigger: 'axis', backgroundColor: '#1F2937', borderColor: '#374151', textStyle: { color: '#F9FAFB', fontSize: 12 } },
              grid: { left: 16, right: 16, top: 30, bottom: 20 },
              xAxis: { type: 'category', data: d.dailyChallenge.streakCalendar.map((x) => x.date.slice(8)), axisLabel: { show: false }, axisLine: { show: false }, axisTick: { show: false } },
              yAxis: { type: 'value', show: false },
              series: [{ type: 'bar', data: d.dailyChallenge.streakCalendar.map((x) => x.hasSubmission ? 1 : 0), itemStyle: { color: (params: { dataIndex: number }) => d.dailyChallenge.streakCalendar[params.dataIndex]?.hasSubmission ? '#F43F5E' : '#F3F4F6', borderRadius: 3 }, barWidth: '60%' }],
            }} style={{ height: CHART_HEIGHT }} />
          </div>
        </section>

        {/* ════════════════════════════════════════════
            Bottom: Activity + Score trend
        ════════════════════════════════════════════ */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          <div className="rounded-2xl border border-border bg-card p-6">
            <h3 className="mb-4 text-lg font-semibold text-foreground">近 30 天活跃度</h3>
            {data.progressCurve.length > 0 ? (
              <ReactECharts option={{
                tooltip: { trigger: 'axis', backgroundColor: '#1F2937', borderColor: '#374151', textStyle: { color: '#F9FAFB', fontSize: 12 } },
                legend: { data: ['活跃度', '平均分'], bottom: 0, textStyle: { fontSize: 11, color: '#9CA3AF' } },
                grid: { left: 50, right: 30, top: 24, bottom: 48 },
                xAxis: { type: 'category', data: data.progressCurve.map((p) => p.date.slice(5)), axisLabel: { fontSize: 10, color: '#9CA3AF', rotate: 30 }, axisLine: { lineStyle: { color: '#E5E7EB' } } },
                yAxis: [
                  { type: 'value', name: '活跃度', min: 0, axisLabel: { fontSize: 10, color: '#9CA3AF' }, splitLine: { lineStyle: { color: '#F3F4F6', type: 'dashed' } } },
                  { type: 'value', name: '分数', min: 0, max: 100, axisLabel: { fontSize: 10, color: '#9CA3AF' } },
                ],
                series: [
                  { name: '活跃度', type: 'bar', data: data.progressCurve.map((p) => p.totalActivity), itemStyle: { color: gradient('#818CF8', '#6366F1'), borderRadius: [6, 6, 0, 0] }, barWidth: '40%' },
                  { name: '平均分', type: 'line', yAxisIndex: 1, data: data.progressCurve.map((p) => p.avgScore), smooth: true, itemStyle: { color: '#F59E0B' }, lineStyle: { width: 2 }, symbol: 'circle', symbolSize: 5 },
                ],
              }} style={{ height: 280 }} />
            ) : <p className="py-12 text-center text-sm text-muted-foreground">暂无数据</p>}
          </div>
          <div className="rounded-2xl border border-border bg-card p-6">
            <h3 className="mb-4 text-lg font-semibold text-foreground">分数趋势</h3>
            {data.scoreTrend.length > 0 ? (
              <ReactECharts option={{
                tooltip: { trigger: 'axis', backgroundColor: '#1F2937', borderColor: '#374151', textStyle: { color: '#F9FAFB', fontSize: 12 } },
                grid: { left: 50, right: 20, top: 24, bottom: 36 },
                xAxis: { type: 'category', data: data.scoreTrend.map((s) => s.date), axisLabel: { fontSize: 10, color: '#9CA3AF' }, boundaryGap: false },
                yAxis: { type: 'value', min: 0, max: 100, axisLabel: { fontSize: 10, color: '#9CA3AF' }, splitLine: { lineStyle: { color: '#F3F4F6', type: 'dashed' } } },
                series: [{ type: 'line', data: data.scoreTrend.map((s) => s.score), smooth: true, itemStyle: { color: '#4F46E5' }, lineStyle: { width: 3, color: { type: 'linear' as const, x: 0, y: 0, x2: 1, y2: 0, colorStops: [{ offset: 0, color: '#818CF8' }, { offset: 1, color: '#4F46E5' }] } }, areaStyle: { color: gradient('rgba(79,70,229,0.25)', 'rgba(79,70,229,0.02)') }, symbol: 'circle', symbolSize: 7 }],
              }} style={{ height: 280 }} />
            ) : <p className="py-12 text-center text-sm text-muted-foreground">暂无数据</p>}
          </div>
        </div>
      </div>
    </div>
  );
}
