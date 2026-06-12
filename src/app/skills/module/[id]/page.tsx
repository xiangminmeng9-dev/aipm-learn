'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import type { LearningTaskWithProgress, SkillModule, LearningResource, UserTaskResource } from '@/types';
import { Badge } from '@/components/ui/badge';
import AddResourceDialog from '@/components/skills/AddResourceDialog';
import { apiFetch } from '@/lib/api/fetch';

const RESOURCE_ICONS: Record<string, string> = { article: '📄', video: '🎬', book: '📚', note: '📝' };
const RESOURCE_COLORS: Record<string, string> = {
  article: 'bg-indigo-50 text-indigo-600',
  video: 'bg-[#ff3b30]/10 text-[#ff3b30]',
  book: 'bg-[#34c759]/10 text-[#34c759]',
  note: 'bg-amber-50 text-amber-600',
};

interface ModuleDetailPageProps {
  params: Promise<{ id: string }>;
}

export default function ModuleDetailPage({ params }: ModuleDetailPageProps) {
  const [module, setModule] = useState<(SkillModule & { level_name?: string }) | null>(null);
  const [tasks, setTasks] = useState<LearningTaskWithProgress[]>([]);
  const [customTasks, setCustomTasks] = useState<{ id: string; title: string; objective: string; status: string; is_custom: boolean; user_resources?: UserTaskResource[] }[]>([]);
  const [linkedResources, setLinkedResources] = useState<{ id: string; title: string; url: string; resource_type: string | null; subcategory: string | null; thumbnail_url: string | null; author: string | null; description: string | null; source: string; notes: string | null }[]>([]);
  const [interviewInsights, setInterviewInsights] = useState<{
    mapped_types: { id: string; name: string }[];
    methodologies: { id: string; type: { id: string; name: string }; framework: string; key_steps: string[]; source_count: number }[];
  } | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [expandedTask, setExpandedTask] = useState<string | null>(null);
  const [addResourceFor, setAddResourceFor] = useState<{ taskId: string; taskType: 'seed' | 'jd_gap' | 'custom_module' } | null>(null);
  const [showAddTask, setShowAddTask] = useState(false);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskObjective, setNewTaskObjective] = useState('');
  const [isAddingTask, setIsAddingTask] = useState(false);

  useEffect(() => {
    params.then(({ id }) => {
      apiFetch(`/api/skills/modules/${id}`)
        .then((r) => r.json())
        .then((data) => { setModule(data.module ?? null); setTasks(data.tasks ?? []); setCustomTasks(data.custom_tasks ?? []); setLinkedResources(data.linked_resources ?? []); setInterviewInsights(data.interview_insights ?? null); })
        .catch(() => {})
        .finally(() => setIsLoading(false));
    });
  }, [params]);

  const handleToggle = useCallback(async (taskId: string, currentStatus: string) => {
    const newStatus = currentStatus === 'completed' ? 'not_started' : 'completed';
    setTasks((prev) => prev.map((t) => t.id === taskId ? { ...t, status: newStatus as 'not_started' | 'completed', completed_at: newStatus === 'completed' ? new Date().toISOString() : null } : t));
    await apiFetch('/api/skills/progress', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ task_id: taskId, status: newStatus }) });
  }, []);

  const handleResourceAdded = useCallback((taskId: string, resource: UserTaskResource) => {
    setTasks((prev) => prev.map((t) => t.id === taskId ? { ...t, user_resources: [...(t.user_resources ?? []), resource] } : t));
    setCustomTasks((prev) => prev.map((t) => t.id === taskId ? { ...t, user_resources: [...(t.user_resources ?? []), resource] } : t));
  }, []);

  const handleResourceDeleted = useCallback(async (taskId: string, resourceId: string) => {
    const res = await apiFetch(`/api/skills/resources/${resourceId}`, { method: 'DELETE' });
    if (res.ok) {
      setTasks((prev) => prev.map((t) => t.id === taskId ? { ...t, user_resources: (t.user_resources ?? []).filter((r) => r.id !== resourceId) } : t));
      setCustomTasks((prev) => prev.map((t) => t.id === taskId ? { ...t, user_resources: (t.user_resources ?? []).filter((r) => r.id !== resourceId) } : t));
    }
  }, []);

  const handleAddCustomTask = useCallback(async () => {
    if (!newTaskTitle.trim() || !module) return;
    setIsAddingTask(true);
    try {
      const res = await apiFetch('/api/skills/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ module_id: module.id, title: newTaskTitle.trim(), objective: newTaskObjective.trim() || newTaskTitle.trim() }),
      });
      if (res.ok) {
        const data = await res.json();
        setCustomTasks((prev) => [...prev, { id: data.id, title: newTaskTitle.trim(), objective: newTaskObjective.trim() || newTaskTitle.trim(), status: 'not_started', is_custom: true, user_resources: [] }]);
        setNewTaskTitle('');
        setNewTaskObjective('');
        setShowAddTask(false);
      }
    } catch { /* ignore */ } finally { setIsAddingTask(false); }
  }, [newTaskTitle, newTaskObjective, module]);

  const completedCount = tasks.filter((t) => t.status === 'completed').length;
  const progressPct = tasks.length ? Math.round((completedCount / tasks.length) * 100) : 0;

  const renderUserResources = (taskId: string, userResources: UserTaskResource[] | undefined) => {
    if (!userResources || userResources.length === 0) return null;
    return (
      <div className="mt-3 space-y-2">
        <p className="text-xs font-medium text-amber-600">我添加的资源</p>
        {userResources.map((r) => (
          <div key={r.id} className="flex items-start gap-2 rounded-xl bg-amber-50/50 px-3 py-2 border border-amber-100">
            <span className={`shrink-0 rounded-md px-1.5 py-0.5 text-xs font-medium ${RESOURCE_COLORS[r.type] ?? ''}`}>
              {RESOURCE_ICONS[r.type]} {r.type === 'article' ? '文章' : r.type === 'video' ? '视频' : r.type === 'book' ? '书籍' : '笔记'}
            </span>
            <div className="min-w-0 flex-1">
              {r.type === 'note' ? (
                <p className="text-xs text-muted-foreground break-words">{r.title}{r.notes ? `：${r.notes}` : ''}</p>
              ) : (
                <div className="flex items-center gap-1 min-w-0">
                  {r.url ? (
                    <a href={r.url} target="_blank" rel="noopener noreferrer" className="truncate text-xs text-indigo-600 hover:underline">{r.title}</a>
                  ) : (
                    <span className="truncate text-xs text-muted-foreground">{r.title}</span>
                  )}
                  {r.source && <span className="shrink-0 text-xs text-muted-foreground">— {r.source}</span>}
                </div>
              )}
              {r.type !== 'note' && r.notes && <p className="mt-0.5 text-xs text-muted-foreground break-words">{r.notes}</p>}
            </div>
            <button
              onClick={() => handleResourceDeleted(taskId, r.id)}
              className="shrink-0 text-muted-foreground hover:text-[#ff3b30] transition-colors"
              title="删除"
            >
              <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="p-8">
      <Link href="/skills/tree" className="mb-6 inline-flex items-center gap-1 text-base text-indigo-600 hover:underline">
        ← 返回技能树
      </Link>

      {isLoading ? (
        <div className="flex justify-center py-16">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-indigo-500 border-t-transparent" />
        </div>
      ) : (
        <>
          {module && (
            <div className="mb-8">
              <div className="flex items-center gap-4">
                <span className="text-4xl">{module.icon}</span>
                <div>
                  <div className="flex items-center gap-2">
                    <h1 className="text-2xl font-semibold text-foreground">{module.name}</h1>
                    {module.level_name && (
                      <span className="rounded-full bg-indigo-50 px-2.5 py-0.5 text-xs font-medium text-indigo-600">{module.level_name}</span>
                    )}
                  </div>
                  <p className="mt-1 text-base text-muted-foreground">{module.description}</p>
                </div>
              </div>
              <div className="mt-5 rounded-2xl border-border bg-card p-4">
                <div className="flex items-center justify-between text-base">
                  <span className="text-muted-foreground">{completedCount}/{tasks.length} 完成</span>
                  <span className="font-semibold text-indigo-600">{progressPct}%</span>
                </div>
                <div className="mt-2 h-2 overflow-hidden rounded-full bg-muted">
                  <div className="h-full rounded-full progress-gradient transition-all" style={{ width: `${progressPct}%` }} />
                </div>
              </div>
            </div>
          )}

          {/* 面试关联区 */}
          {interviewInsights && interviewInsights.mapped_types.length > 0 && (
            <div className="mb-8 rounded-2xl border-border bg-card p-6">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-lg font-semibold text-foreground">面试关联</h2>
                <Link href="/interview/stats" className="text-base text-indigo-600 hover:underline">
                  查看面试统计 →
                </Link>
              </div>
              <div className="mb-4">
                <p className="mb-2 text-sm text-muted-foreground">关联面试题型</p>
                <div className="flex flex-wrap gap-2">
                  {interviewInsights.mapped_types.map((t) => (
                    <Link key={t.id} href={`/interview/qa`} className="rounded-full bg-indigo-50 px-3 py-1 text-sm text-indigo-600 hover:bg-indigo-100">
                      {t.name}
                    </Link>
                  ))}
                </div>
              </div>
              {interviewInsights.methodologies.length > 0 && (
                <div className="space-y-3">
                  <p className="text-sm text-muted-foreground">你的方法论</p>
                  {interviewInsights.methodologies.map((m) => (
                    <div key={m.id} className="rounded-lg border border-border p-3">
                      <div className="mb-1 flex items-center gap-2">
                        <span className="text-base font-medium text-foreground">{m.type.name}</span>
                        <Badge variant="secondary" className="bg-indigo-50 text-sm text-indigo-600">{m.source_count} 次练习</Badge>
                      </div>
                      <p className="line-clamp-2 text-sm text-muted-foreground">{m.framework}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* 关联资源区 */}
          {linkedResources.length > 0 && (
            <div className="mb-8 rounded-2xl border-border bg-card p-6">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-lg font-semibold text-foreground">关联资源</h2>
                <Link href={`/resources/manage?module=${module?.id}`} className="text-base text-indigo-600 hover:underline">
                  管理资源 →
                </Link>
              </div>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {linkedResources.map((r) => (
                  <div key={r.id} className="flex items-start gap-3 rounded-xl border border-border p-3 hover:bg-muted/50 transition">
                    {r.thumbnail_url ? (
                      <img src={r.thumbnail_url} alt="" className="h-10 w-10 shrink-0 rounded-lg object-cover" />
                    ) : (
                      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-indigo-50 text-lg">
                        {r.resource_type === 'video' ? '🎬' : r.resource_type === 'book' ? '📚' : r.resource_type === 'paper' ? '📄' : '🔗'}
                      </span>
                    )}
                    <div className="min-w-0 flex-1">
                      {r.url ? (
                        <a href={r.url} target="_blank" rel="noopener noreferrer" className="text-sm font-medium text-foreground hover:text-indigo-600 hover:underline line-clamp-1">{r.title}</a>
                      ) : (
                        <span className="text-sm font-medium text-foreground line-clamp-1">{r.title}</span>
                      )}
                      {r.description && <p className="mt-0.5 text-xs text-muted-foreground line-clamp-2">{r.description}</p>}
                      <div className="mt-1 flex items-center gap-2">
                        {r.resource_type && <span className="text-xs text-muted-foreground">{r.resource_type}</span>}
                        {r.author && <span className="text-xs text-muted-foreground">· {r.author}</span>}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="space-y-3">
            {tasks.map((task, idx) => {
              const resources = (task.resources ?? []) as LearningResource[];
              const userResources = task.user_resources ?? [];
              const totalResources = resources.length + userResources.length;
              const isExpanded = expandedTask === task.id;
              return (
                <div key={task.id} className="rounded-2xl border-border bg-card p-5">
                  <div className="flex items-start justify-between">
                    <button className="flex-1 text-left" onClick={() => setExpandedTask(isExpanded ? null : task.id)}>
                      <div className="flex items-center gap-3">
                        <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-muted text-sm font-medium text-muted-foreground">{idx + 1}</span>
                        <div>
                          <h3 className="text-base font-semibold text-foreground">{task.title}</h3>
                          <p className="mt-0.5 text-sm text-muted-foreground">{task.objective}</p>
                        </div>
                      </div>
                    </button>
                    <div className="flex items-center gap-2 shrink-0 ml-4">
                      <span className="rounded-full bg-muted px-2 py-0.5 text-sm text-muted-foreground">{task.estimated_days}天</span>
                      {totalResources > 0 && <span className="rounded-full bg-muted px-2 py-0.5 text-sm text-muted-foreground">{totalResources}资源</span>}
                      <button
                        onClick={() => handleToggle(task.id, task.status)}
                        className={`rounded-full px-3 py-1 text-sm font-medium transition-colors ${task.status === 'completed' ? 'bg-[#34c759] text-white' : 'bg-muted text-muted-foreground hover:bg-secondary'}`}
                      >
                        {task.status === 'completed' ? '✓ 已完成' : '标记完成'}
                      </button>
                    </div>
                  </div>

                  {isExpanded && (
                    <div className="mt-4 border-t border-border pt-4">
                      <p className="mb-3 text-sm text-muted-foreground">{task.content_summary}</p>
                      {resources.length > 0 && (
                        <div className="space-y-2">
                          <p className="text-sm font-medium text-foreground">学习资源</p>
                          {resources.map((r, i) => (
                            <div key={i} className="flex items-center gap-2 rounded-xl bg-card px-3 py-2 border border-border">
                              <span className={`rounded-md px-1.5 py-0.5 text-sm font-medium ${RESOURCE_COLORS[r.type] ?? ''}`}>
                                {RESOURCE_ICONS[r.type]} {r.type === 'article' ? '文章' : r.type === 'video' ? '视频' : '书籍'}
                              </span>
                              {r.url ? (
                                <a href={r.url} target="_blank" rel="noopener noreferrer" className="text-sm text-indigo-600 hover:underline">{r.title}</a>
                              ) : (
                                <span className="text-sm text-muted-foreground">{r.title}</span>
                              )}
                              {r.source && <span className="text-sm text-muted-foreground">— {r.source}</span>}
                            </div>
                          ))}
                        </div>
                      )}
                      {renderUserResources(task.id, userResources)}
                      <button
                        onClick={() => setAddResourceFor({ taskId: task.id, taskType: 'seed' })}
                        className="mt-3 text-sm text-indigo-600 hover:underline"
                      >
                        + 添加资源
                      </button>
                    </div>
                  )}

                  {!isExpanded && totalResources > 0 && (
                    <button onClick={() => setExpandedTask(task.id)} className="mt-2 text-xs text-indigo-600 hover:underline">
                      查看 {totalResources} 个学习资源 ▾
                    </button>
                  )}
                </div>
              );
            })}
          </div>

          {/* JD 分析补充的自定义任务 */}
          {customTasks.length > 0 && (
            <div className="mt-6">
              <div className="mb-3 flex items-center gap-2">
                <h2 className="text-base font-semibold text-foreground">自定义技能</h2>
                <span className="rounded-full bg-[#ff9500]/10 px-2 py-0.5 text-sm text-[#ff9500]">自定义/JD分析</span>
              </div>
              <div className="space-y-3">
                {customTasks.map((ct, idx) => (
                  <div key={ct.id} className="rounded-2xl border-border bg-card p-5">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#ff9500]/10 text-sm font-medium text-[#ff9500]">{idx + 1}</span>
                        <div>
                          <h3 className="text-base font-semibold text-foreground">{ct.title}</h3>
                          <p className="mt-0.5 text-sm text-muted-foreground">{ct.objective}</p>
                        </div>
                      </div>
                      <button
                        onClick={async () => {
                          const newStatus = ct.status === 'completed' ? 'not_started' : 'completed';
                          setCustomTasks((prev) => prev.map((t) => t.id === ct.id ? { ...t, status: newStatus } : t));
                          await apiFetch(`/api/skills/tasks/${ct.id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ status: newStatus }) });
                        }}
                        className={`shrink-0 rounded-full px-3 py-1 text-sm font-medium transition-colors ${ct.status === 'completed' ? 'bg-[#34c759] text-white' : 'bg-muted text-muted-foreground hover:bg-secondary'}`}
                      >
                        {ct.status === 'completed' ? '✓ 已完成' : '标记完成'}
                      </button>
                    </div>
                    {renderUserResources(ct.id, ct.user_resources)}
                    <button
                      onClick={() => setAddResourceFor({ taskId: ct.id, taskType: 'jd_gap' })}
                      className="mt-2 text-xs text-indigo-600 hover:underline"
                    >
                      + 添加资源
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 添加自定义技能 */}
          <div className="mt-6">
            {showAddTask ? (
              <div className="rounded-2xl border border-indigo-200 bg-indigo-50/30 p-5">
                <h3 className="mb-3 text-sm font-semibold text-foreground">添加自定义技能/任务</h3>
                <div className="space-y-3">
                  <input
                    value={newTaskTitle}
                    onChange={(e) => setNewTaskTitle(e.target.value)}
                    placeholder="技能/任务名称，如：学习 Kubernetes 基础"
                    className="w-full rounded-xl border border-border bg-card px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                  <input
                    value={newTaskObjective}
                    onChange={(e) => setNewTaskObjective(e.target.value)}
                    placeholder="学习目标（可选），如：掌握 K8s 核心概念和部署流程"
                    className="w-full rounded-xl border border-border bg-card px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                  <div className="flex gap-2">
                    <button
                      onClick={handleAddCustomTask}
                      disabled={isAddingTask || !newTaskTitle.trim()}
                      className="rounded-xl bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
                    >
                      {isAddingTask ? '添加中...' : '确认添加'}
                    </button>
                    <button
                      onClick={() => { setShowAddTask(false); setNewTaskTitle(''); setNewTaskObjective(''); }}
                      className="rounded-xl border border-border px-4 py-2 text-sm text-muted-foreground hover:bg-secondary"
                    >
                      取消
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <button
                onClick={() => setShowAddTask(true)}
                className="flex w-full items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-border bg-card py-4 text-sm font-medium text-muted-foreground transition-colors hover:border-indigo-300 hover:bg-indigo-50/30 hover:text-indigo-600"
              >
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                </svg>
                添加自定义技能/任务
              </button>
            )}
          </div>
        </>
      )}

      {/* Add Resource Dialog */}
      {addResourceFor && (
        <AddResourceDialog
          taskId={addResourceFor.taskId}
          taskType={addResourceFor.taskType}
          open={true}
          onClose={() => setAddResourceFor(null)}
          onAdded={(r) => handleResourceAdded(addResourceFor.taskId, r as UserTaskResource)}
        />
      )}
    </div>
  );
}
