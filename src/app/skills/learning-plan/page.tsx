'use client';

import { useState, useEffect } from 'react';
import PageShell from '@/components/layout/PageShell';
import { useToast } from '@/components/ui/toast';
import { apiFetch } from '@/lib/api/fetch';

interface PlanTask { day: number; title: string; description: string; module: string; estimated_minutes: number; }
interface PlanWeek { week: number; theme: string; tasks: PlanTask[]; }
interface Plan { weeks: PlanWeek[]; summary: string; direction?: string; directionDescription?: string; alignedCompanies?: string[]; }

export default function LearningPlanPage() {
  const [plan, setPlan] = useState<Plan | null>(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [targetRole, setTargetRole] = useState('AI产品经理');
  const DIRECTION_OPTIONS = [
    { value: 'AI产品经理', label: '通用AI产品经理' },
    { value: 'Agent/智能体产品经理', label: 'Agent/智能体产品经理' },
    { value: '大模型产品经理', label: '大模型产品经理' },
    { value: '对话/客服产品经理', label: '对话/客服产品经理' },
    { value: 'AIGC/创作产品经理', label: 'AIGC/创作产品经理' },
    { value: '搜索/推荐产品经理', label: '搜索/推荐产品经理' },
    { value: 'AI平台产品经理', label: 'AI平台产品经理' },
  ];
  const [targetDate, setTargetDate] = useState('');
  const [weeklyHours, setWeeklyHours] = useState(10);
  const toast = useToast();

  useEffect(() => {
    apiFetch('/api/skills/learning-plan')
      .then(r => r.ok ? r.json() : null)
      .then(d => { if (d?.plan?.plan_data?.weeks) setPlan(d.plan.plan_data); setTargetRole(d?.plan?.target_role || 'AI产品经理'); if (d?.plan?.target_date) setTargetDate(d.plan.target_date); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  async function handleGenerate() {
    setGenerating(true);
    try {
      const res = await apiFetch('/api/skills/learning-plan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ target_role: targetRole, target_date: targetDate || null, weekly_hours: weeklyHours }),
      });
      const d = await res.json();
      if (d.plan?.weeks?.length) { setPlan(d.plan); setShowForm(false); toast.success('学习计划已生成！'); }
      else toast.error(d.error || '生成失败，请重试');
    } catch { toast.error('生成失败'); }
    finally { setGenerating(false); }
  }

  const totalMinutes = plan?.weeks.reduce((s, w) => s + w.tasks.reduce((a, t) => a + t.estimated_minutes, 0), 0) ?? 0;

  return (
    <PageShell title="AI 学习计划" description="设定目标岗位和时间，AI 为你制定周计划" icon="📅"
      stats={plan ? [
        { label: '共', value: `${plan.weeks.length} 周` },
        { label: '任务', value: plan.weeks.reduce((s, w) => s + w.tasks.length, 0) },
        { label: '预计', value: `${Math.round(totalMinutes / 60)}h` },
      ] : []}
      actions={
        <button onClick={() => setShowForm(true)}
          className="rounded-lg bg-foreground px-3 py-2 text-sm font-medium text-background hover:opacity-90">
          {plan ? '重新生成' : '创建计划'}
        </button>
      }
    >
      {showForm && (
        <div className="mb-6 rounded-xl border-2 border-amber-200 bg-amber-50/30 p-5 dark:border-amber-800 dark:bg-amber-950/10">
          <div className="grid gap-4 sm:grid-cols-3">
            <div>
              <label className="mb-1 block text-xs font-medium text-muted-foreground">目标岗位</label>
              <select value={targetRole} onChange={e => setTargetRole(e.target.value)}
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm">
                {DIRECTION_OPTIONS.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-muted-foreground">目标日期</label>
              <input type="date" value={targetDate} onChange={e => setTargetDate(e.target.value)}
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm" />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-muted-foreground">每周小时</label>
              <select value={weeklyHours} onChange={e => setWeeklyHours(Number(e.target.value))}
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm">
                {[5, 10, 15, 20, 30].map(h => <option key={h} value={h}>{h}h</option>)}
              </select>
            </div>
          </div>
          <div className="mt-4 flex gap-2">
            <button onClick={handleGenerate} disabled={generating}
              className="rounded-lg bg-foreground px-4 py-2 text-sm font-medium text-background disabled:opacity-50">
              {generating ? 'AI 生成中...' : '生成计划'}
            </button>
            <button onClick={() => setShowForm(false)} className="rounded-lg border border-border px-4 py-2 text-sm text-muted-foreground">取消</button>
          </div>
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-12"><div className="h-6 w-6 animate-spin rounded-full border-2 border-amber-500 border-t-transparent" /></div>
      ) : !plan ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <p className="text-3xl mb-2">📅</p>
          <p className="text-sm text-muted-foreground">还没有学习计划</p>
          <button onClick={() => setShowForm(true)} className="mt-2 text-sm font-medium text-amber-600 hover:underline">创建你的第一个学习计划 →</button>
        </div>
      ) : (
        <div className="space-y-6">
          {plan.directionDescription && (
            <div className="rounded-lg border-2 border-amber-200 bg-amber-50/50 p-4 dark:border-amber-800 dark:bg-amber-950/20">
              <div className="flex items-start gap-3">
                <span className="text-2xl">🎯</span>
                <div>
                  <p className="text-sm font-medium text-amber-800 dark:text-amber-300">{plan.direction}</p>
                  <p className="mt-1 text-sm text-amber-700 dark:text-amber-400">{plan.directionDescription}</p>
                  {plan.alignedCompanies && plan.alignedCompanies.length > 0 && (
                    <p className="mt-2 text-xs text-amber-600 dark:text-amber-500">对齐公司：{plan.alignedCompanies.join('、')}</p>
                  )}
                </div>
              </div>
            </div>
          )}
          {plan.summary && !plan.directionDescription && (
            <div className="rounded-lg border border-amber-100 bg-amber-50/50 p-4 text-sm text-amber-800 dark:border-amber-800 dark:bg-amber-950/20 dark:text-amber-300">
              {plan.summary}
            </div>
          )}
          {plan.weeks.map((week) => (
            <div key={week.week} className="rounded-lg border border-border bg-card overflow-hidden">
              <div className="border-b border-border bg-muted/30 px-4 py-3">
                <h3 className="text-sm font-semibold text-foreground">第 {week.week} 周 · {week.theme}</h3>
              </div>
              <div className="divide-y divide-border">
                {week.tasks.map((task, i) => (
                  <div key={i} className="flex items-start gap-3 px-4 py-3">
                    <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-amber-100 text-xs font-bold text-amber-700">
                      {task.day}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-foreground">{task.title}</p>
                      <p className="mt-0.5 text-xs text-muted-foreground">{task.description}</p>
                      <div className="mt-1 flex items-center gap-2">
                        <span className="rounded bg-accent px-1.5 py-0.5 text-xs text-accent-foreground">{task.module}</span>
                        <span className="text-xs text-muted-foreground">{task.estimated_minutes} 分钟</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </PageShell>
  );
}
