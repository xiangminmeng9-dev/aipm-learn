'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import dynamic from 'next/dynamic';

const ReactECharts = dynamic(() => import('echarts-for-react'), { ssr: false });

interface ModuleDetails {
  coding: { flows: number; recentActivity: number };
  skills: { coverage: number; modules: number; tasks: number; completedTasks: number };
  notebook: { notes: number; tasks: number; aiAnalysis: number };
  simulator: { sessions: number; stagesCompleted: number; avgScore: number };
  interview: { qaCount: number; mockCount: number; avgScore: number; sessions: number };
  resume: { versions: number; matchScore: number };
  resources: { count: number; articlesRead: number };
  dailyChallenge: { submissions: number; streak: number; avgScore: number };
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

function formatMinutes(min: number): string {
  if (min < 60) return `${min} 分钟`;
  const h = Math.floor(min / 60);
  const m = min % 60;
  return m > 0 ? `${h} 小时 ${m} 分钟` : `${h} 小时`;
}

function MiniBar({ value, max, color }: { value: number; max: number; color: string }) {
  const pct = max > 0 ? Math.min(100, (value / max) * 100) : 0;
  return (
    <div className="h-2 w-full rounded-full bg-secondary">
      <div className="h-2 rounded-full transition-all" style={{ width: `${pct}%`, background: color }} />
    </div>
  );
}

function MetricRow({ label, value, color }: { label: string; value: string | number; color?: string }) {
  return (
    <div className="flex items-center justify-between py-1">
      <span className="text-xs text-muted-foreground">{label}</span>
      <span className={`text-sm font-bold ${color ?? 'text-foreground'}`}>{value}</span>
    </div>
  );
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

  const d = data.moduleDetails!;

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

      <div className="flex-1 overflow-y-auto p-4">
        <div className="grid grid-cols-2 xl:grid-cols-4 gap-4 h-full">
          {/* ── 1. AI Coding ── */}
          <div className="rounded-xl border border-border bg-card p-4 flex flex-col">
            <div className="flex items-center gap-2 mb-3">
              <span className="text-lg font-bold text-indigo-600">&lt;/&gt;</span>
              <Link href="/coding/practice" className="text-sm font-semibold text-foreground hover:text-indigo-600">AI Coding</Link>
            </div>
            <div className="space-y-1 flex-1">
              <MetricRow label="开发流程" value={d.coding.flows} color="text-indigo-600" />
              <MetricRow label="近7天活跃" value={d.coding.recentActivity} color="text-indigo-600" />
              <MiniBar value={d.coding.recentActivity} max={Math.max(d.coding.flows, 1)} color="#818CF8" />
            </div>
            <div className="mt-3">
              <ReactECharts option={{
                tooltip: { trigger: 'item' as const },
                series: [{ type: 'pie', radius: ['35%', '65%'], data: [
                  { name: '开发流程', value: d.coding.flows, itemStyle: { color: '#818CF8' } },
                  { name: '近期活跃', value: d.coding.recentActivity, itemStyle: { color: '#C7D2FE' } },
                ], label: { show: false }, emphasis: { itemStyle: { shadowBlur: 6 } } }],
              }} style={{ height: 120 }} />
            </div>
          </div>

          {/* ── 2. 技能树 ── */}
          <div className="rounded-xl border border-border bg-card p-4 flex flex-col">
            <div className="flex items-center gap-2 mb-3">
              <span className="text-lg">🌳</span>
              <Link href="/skills/tree" className="text-sm font-semibold text-foreground hover:text-emerald-600">技能树</Link>
            </div>
            <div className="space-y-1 flex-1">
              <MetricRow label="覆盖度" value={`${d.skills.coverage}%`} color="text-emerald-600" />
              <MetricRow label="模块" value={`${d.skills.modules}`} color="text-emerald-600" />
              <MetricRow label="任务完成" value={`${d.skills.completedTasks}/${d.skills.tasks}`} color="text-emerald-600" />
              <MiniBar value={d.skills.coverage} max={100} color="#16a34a" />
            </div>
            <div className="mt-3">
              <ReactECharts option={{
                tooltip: { trigger: 'item' as const },
                series: [{ type: 'pie', radius: ['35%', '65%'], data: [
                  { name: '已完成', value: d.skills.completedTasks, itemStyle: { color: '#16a34a' } },
                  { name: '未完成', value: Math.max(0, d.skills.tasks - d.skills.completedTasks), itemStyle: { color: '#D1FAE5' } },
                ], label: { show: false } }],
              }} style={{ height: 120 }} />
            </div>
          </div>

          {/* ── 3. 笔记本 ── */}
          <div className="rounded-xl border border-border bg-card p-4 flex flex-col">
            <div className="flex items-center gap-2 mb-3">
              <span className="text-lg">📝</span>
              <Link href="/notebook" className="text-sm font-semibold text-foreground hover:text-amber-600">笔记本</Link>
            </div>
            <div className="space-y-1 flex-1">
              <MetricRow label="笔记" value={d.notebook.notes} color="text-amber-600" />
              <MetricRow label="任务" value={d.notebook.tasks} color="text-amber-600" />
              <MetricRow label="AI分析" value={d.notebook.aiAnalysis} color="text-amber-600" />
            </div>
            <div className="mt-3">
              <ReactECharts option={{
                tooltip: { trigger: 'item' as const },
                series: [{ type: 'pie', radius: ['35%', '65%'], data: [
                  { name: '笔记', value: d.notebook.notes, itemStyle: { color: '#f59e0b' } },
                  { name: '任务', value: d.notebook.tasks, itemStyle: { color: '#FDE68A' } },
                  { name: 'AI分析', value: d.notebook.aiAnalysis, itemStyle: { color: '#FEF3C7' } },
                ], label: { show: false } }],
              }} style={{ height: 120 }} />
            </div>
          </div>

          {/* ── 4. 模拟器 ── */}
          <div className="rounded-xl border border-border bg-card p-4 flex flex-col">
            <div className="flex items-center gap-2 mb-3">
              <span className="text-lg">🚀</span>
              <Link href="/simulator" className="text-sm font-semibold text-foreground hover:text-teal-600">模拟器</Link>
            </div>
            <div className="space-y-1 flex-1">
              <MetricRow label="会话数" value={d.simulator.sessions} color="text-teal-600" />
              <MetricRow label="完成阶段" value={d.simulator.stagesCompleted} color="text-teal-600" />
              <MetricRow label="平均分" value={d.simulator.avgScore} color="text-teal-600" />
              <MiniBar value={d.simulator.avgScore} max={100} color="#14b8a6" />
            </div>
            <div className="mt-3">
              <ReactECharts option={{
                tooltip: {},
                radar: { indicator: [{ name: '会话', max: Math.max(d.simulator.sessions, 1) }, { name: '阶段', max: Math.max(d.simulator.stagesCompleted, 1) }, { name: '分数', max: 100 }], radius: '60%', shape: 'polygon' as const },
                series: [{ type: 'radar', data: [{ value: [d.simulator.sessions, d.simulator.stagesCompleted, d.simulator.avgScore], areaStyle: { color: 'rgba(20,184,166,0.2)' }, lineStyle: { color: '#14b8a6' } }] }],
              }} style={{ height: 120 }} />
            </div>
          </div>

          {/* ── 5. 面试助手 ── */}
          <div className="rounded-xl border border-border bg-card p-4 flex flex-col">
            <div className="flex items-center gap-2 mb-3">
              <span className="text-lg">🎤</span>
              <Link href="/interview/assistant" className="text-sm font-semibold text-foreground hover:text-purple-600">面试助手</Link>
            </div>
            <div className="space-y-1 flex-1">
              <MetricRow label="QA次数" value={d.interview.qaCount} color="text-purple-600" />
              <MetricRow label="模拟面试" value={d.interview.mockCount} color="text-purple-600" />
              <MetricRow label="对话Session" value={d.interview.sessions} color="text-purple-600" />
              <MetricRow label="平均分" value={d.interview.avgScore} color="text-purple-600" />
              <MiniBar value={d.interview.avgScore} max={100} color="#7c3aed" />
            </div>
            <div className="mt-3">
              <ReactECharts option={{
                tooltip: { trigger: 'item' as const },
                series: [{ type: 'pie', radius: ['35%', '65%'], data: [
                  { name: 'QA', value: d.interview.qaCount, itemStyle: { color: '#7c3aed' } },
                  { name: '模拟面试', value: d.interview.mockCount, itemStyle: { color: '#C4B5FD' } },
                  { name: 'Session', value: d.interview.sessions, itemStyle: { color: '#EDE9FE' } },
                ], label: { show: false } }],
              }} style={{ height: 120 }} />
            </div>
          </div>

          {/* ── 6. 简历助手 ── */}
          <div className="rounded-xl border border-border bg-card p-4 flex flex-col">
            <div className="flex items-center gap-2 mb-3">
              <span className="text-lg">📄</span>
              <Link href="/resume" className="text-sm font-semibold text-foreground hover:text-orange-600">简历助手</Link>
            </div>
            <div className="space-y-1 flex-1">
              <MetricRow label="简历版本" value={d.resume.versions} color="text-orange-600" />
              <MetricRow label="最佳匹配" value={`${d.resume.matchScore}%`} color="text-orange-600" />
              <MiniBar value={d.resume.matchScore} max={100} color="#ea580c" />
            </div>
            <div className="mt-3">
              <ReactECharts option={{
                series: [{ type: 'gauge', startAngle: 180, endAngle: 0, radius: '90%', min: 0, max: 100,
                  axisLine: { lineStyle: { width: 12, color: [[0.3, '#F97316'], [0.7, '#FB923C'], [1, '#FDBA74']] } },
                  pointer: { itemStyle: { color: '#ea580c' }, width: 4, length: '60%' },
                  axisTick: { show: false }, splitLine: { show: false }, axisLabel: { show: false },
                  detail: { valueAnimation: true, formatter: '{value}%', fontSize: 14, color: '#ea580c', offsetCenter: [0, '40%'] },
                  data: [{ value: d.resume.matchScore }],
                }],
              }} style={{ height: 120 }} />
            </div>
          </div>

          {/* ── 7. 资源库 ── */}
          <div className="rounded-xl border border-border bg-card p-4 flex flex-col">
            <div className="flex items-center gap-2 mb-3">
              <span className="text-lg">📚</span>
              <Link href="/resources" className="text-sm font-semibold text-foreground hover:text-blue-600">资源库</Link>
            </div>
            <div className="space-y-1 flex-1">
              <MetricRow label="资源总数" value={d.resources.count} color="text-blue-600" />
              <MetricRow label="已读文章" value={d.resources.articlesRead} color="text-blue-600" />
              <MiniBar value={d.resources.articlesRead} max={Math.max(d.resources.count, 1)} color="#3b82f6" />
            </div>
            <div className="mt-3">
              <ReactECharts option={{
                tooltip: { trigger: 'item' as const },
                series: [{ type: 'pie', radius: ['35%', '65%'], data: [
                  { name: '已读', value: d.resources.articlesRead, itemStyle: { color: '#3b82f6' } },
                  { name: '未读', value: Math.max(0, d.resources.count - d.resources.articlesRead), itemStyle: { color: '#BFDBFE' } },
                ], label: { show: false } }],
              }} style={{ height: 120 }} />
            </div>
          </div>

          {/* ── 8. 每日挑战 ── */}
          <div className="rounded-xl border border-border bg-card p-4 flex flex-col">
            <div className="flex items-center gap-2 mb-3">
              <span className="text-lg">🎯</span>
              <Link href="/daily-challenge" className="text-sm font-semibold text-foreground hover:text-rose-600">每日挑战</Link>
            </div>
            <div className="space-y-1 flex-1">
              <MetricRow label="提交数" value={d.dailyChallenge.submissions} color="text-rose-600" />
              <MetricRow label="连续天数" value={d.dailyChallenge.streak} color="text-rose-600" />
              <MetricRow label="平均分" value={d.dailyChallenge.avgScore} color="text-rose-600" />
              <MiniBar value={d.dailyChallenge.avgScore} max={100} color="#ef4444" />
            </div>
            <div className="mt-3">
              <ReactECharts option={{
                series: [{ type: 'gauge', startAngle: 180, endAngle: 0, radius: '90%', min: 0, max: 100,
                  axisLine: { lineStyle: { width: 12, color: [[0.3, '#EF4444'], [0.7, '#F87171'], [1, '#FCA5A5']] } },
                  pointer: { itemStyle: { color: '#ef4444' }, width: 4, length: '60%' },
                  axisTick: { show: false }, splitLine: { show: false }, axisLabel: { show: false },
                  detail: { valueAnimation: true, formatter: '{value}', fontSize: 14, color: '#ef4444', offsetCenter: [0, '40%'] },
                  data: [{ value: d.dailyChallenge.avgScore }],
                }],
              }} style={{ height: 120 }} />
            </div>
          </div>
        </div>

        {/* Bottom: Activity + Score trend */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mt-4">
          <div className="rounded-xl border border-border bg-card p-4">
            <h3 className="mb-2 text-sm font-semibold text-foreground">近 30 天活跃度</h3>
            {data.progressCurve.length > 0 ? (
              <ReactECharts option={{
                tooltip: { trigger: 'axis' as const },
                legend: { data: ['活跃度', '平均分'], bottom: 0, textStyle: { fontSize: 10 } },
                grid: { left: 36, right: 16, top: 16, bottom: 36 },
                xAxis: { type: 'category' as const, data: data.progressCurve.map((p) => p.date.slice(5)), axisLabel: { fontSize: 9, rotate: 30 } },
                yAxis: [
                  { type: 'value' as const, name: '活跃度', min: 0, axisLabel: { fontSize: 9 } },
                  { type: 'value' as const, name: '分数', min: 0, max: 100, axisLabel: { fontSize: 9 } },
                ],
                series: [
                  { name: '活跃度', type: 'bar', data: data.progressCurve.map((p) => p.totalActivity), itemStyle: { color: '#818CF8' }, barWidth: '40%' },
                  { name: '平均分', type: 'line', yAxisIndex: 1, data: data.progressCurve.map((p) => p.avgScore), itemStyle: { color: '#F59E0B' }, lineStyle: { width: 2 }, symbol: 'circle', symbolSize: 5 },
                ],
              }} style={{ height: 220 }} />
            ) : <p className="py-8 text-center text-xs text-muted-foreground">暂无数据</p>}
          </div>
          <div className="rounded-xl border border-border bg-card p-4">
            <h3 className="mb-2 text-sm font-semibold text-foreground">分数趋势</h3>
            {data.scoreTrend.length > 0 ? (
              <ReactECharts option={{
                tooltip: { trigger: 'axis' as const },
                grid: { left: 36, right: 16, top: 16, bottom: 28 },
                xAxis: { type: 'category' as const, data: data.scoreTrend.map((s) => s.date), axisLabel: { fontSize: 9 } },
                yAxis: { type: 'value' as const, min: 0, max: 100, axisLabel: { fontSize: 9 } },
                series: [{ type: 'line', data: data.scoreTrend.map((s) => s.score), itemStyle: { color: '#4F46E5' }, lineStyle: { width: 2 }, areaStyle: { color: 'rgba(79,70,229,0.1)' }, symbol: 'circle', symbolSize: 5 }],
              }} style={{ height: 220 }} />
            ) : <p className="py-8 text-center text-xs text-muted-foreground">暂无数据</p>}
          </div>
        </div>
      </div>
    </div>
  );
}