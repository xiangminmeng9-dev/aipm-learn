'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import type { LearningResource, UserTaskResource } from '@/types';
import { Badge } from '@/components/ui/badge';
import Markdown from '@/components/ui/markdown';
import AddResourceDialog from '@/components/skills/AddResourceDialog';

const RESOURCE_ICONS: Record<string, string> = { article: '📄', video: '🎬', book: '📚', note: '📝' };
const RESOURCE_COLORS: Record<string, string> = {
  article: 'bg-indigo-50 text-indigo-600',
  video: 'bg-[#ff3b30]/10 text-[#ff3b30]',
  book: 'bg-[#34c759]/10 text-[#34c759]',
  note: 'bg-amber-50 text-amber-600',
};

interface UserModule {
  id: string;
  name: string;
  description: string;
  icon: string;
  level: number;
  level_name: string;
  source_description: string;
}

interface UserTask {
  id: string;
  module_id: string;
  title: string;
  objective: string;
  estimated_days: number;
  content_summary: string;
  resources: LearningResource[];
  sort_order: number;
  status: 'not_started' | 'in_progress' | 'completed';
  completed_at: string | null;
  user_resources?: UserTaskResource[];
}

interface CustomModuleDetailPageProps {
  params: Promise<{ id: string }>;
}

export default function CustomModuleDetailPage({ params }: CustomModuleDetailPageProps) {
  const [module, setModule] = useState<UserModule | null>(null);
  const [tasks, setTasks] = useState<UserTask[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [expandedTask, setExpandedTask] = useState<string | null>(null);
  const [addResourceFor, setAddResourceFor] = useState<{ taskId: string; taskType: 'custom_module' } | null>(null);
  const [showAddTask, setShowAddTask] = useState(false);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskObjective, setNewTaskObjective] = useState('');
  const [isAddingTask, setIsAddingTask] = useState(false);
  const router = useRouter();

  useEffect(() => {
    params.then(({ id }) => {
      fetch(`/api/skills/custom-modules/${id}`)
        .then((r) => r.json())
        .then((data) => {
          if (data.module) setModule(data.module);
          setTasks(data.tasks ?? []);
        })
        .catch(() => {})
        .finally(() => setIsLoading(false));
    });
  }, [params]);

  const handleToggle = useCallback(async (taskId: string, currentStatus: string) => {
    const newStatus = currentStatus === 'completed' ? 'not_started' : 'completed';
    setTasks((prev) =>
      prev.map((t) =>
        t.id === taskId
          ? { ...t, status: newStatus as 'not_started' | 'in_progress' | 'completed', completed_at: newStatus === 'completed' ? new Date().toISOString() : null }
          : t
      )
    );
    if (module) {
      await fetch(`/api/skills/custom-modules/${module.id}/tasks/${taskId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
    }
  }, [module]);

  const handleDelete = async () => {
    if (!module || !confirm('确定删除此自定义模块？所有学习任务将一并删除。')) return;
    const res = await fetch(`/api/skills/custom-modules/${module.id}`, { method: 'DELETE' });
    if (res.ok) {
      router.push('/skills/tree');
    }
  };

  const handleResourceAdded = useCallback((taskId: string, resource: UserTaskResource) => {
    setTasks((prev) => prev.map((t) => t.id === taskId ? { ...t, user_resources: [...(t.user_resources ?? []), resource] } : t));
  }, []);

  const handleResourceDeleted = useCallback(async (taskId: string, resourceId: string) => {
    const res = await fetch(`/api/skills/resources/${resourceId}`, { method: 'DELETE' });
    if (res.ok) {
      setTasks((prev) => prev.map((t) => t.id === taskId ? { ...t, user_resources: (t.user_resources ?? []).filter((r) => r.id !== resourceId) } : t));
    }
  }, []);

  const handleAddTask = useCallback(async () => {
    if (!newTaskTitle.trim() || !module) return;
    setIsAddingTask(true);
    try {
      const res = await fetch(`/api/skills/custom-modules/${module.id}/tasks`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: newTaskTitle.trim(), objective: newTaskObjective.trim() || newTaskTitle.trim() }),
      });
      if (res.ok) {
        const data = await res.json();
        setTasks((prev) => [...prev, { ...data, resources: data.resources ?? [], user_resources: [] }]);
        setNewTaskTitle('');
        setNewTaskObjective('');
        setShowAddTask(false);
      }
    } catch { /* ignore */ } finally { setIsAddingTask(false); }
  }, [newTaskTitle, newTaskObjective, module]);

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
                <p className="text-xs text-[#4B5563] break-words">{r.title}{r.notes ? `：${r.notes}` : ''}</p>
              ) : (
                <div className="flex items-center gap-1 min-w-0">
                  {r.url ? (
                    <a href={r.url} target="_blank" rel="noopener noreferrer" className="truncate text-xs text-indigo-600 hover:underline">{r.title}</a>
                  ) : (
                    <span className="truncate text-xs text-[#9CA3AF]">{r.title}</span>
                  )}
                  {r.source && <span className="shrink-0 text-xs text-[#6B7280]">— {r.source}</span>}
                </div>
              )}
            </div>
            <button onClick={() => handleResourceDeleted(taskId, r.id)} className="shrink-0 text-[#9CA3AF] hover:text-[#ff3b30]">
              <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        ))}
      </div>
    );
  };

  const completedCount = tasks.filter((t) => t.status === 'completed').length;
  const progressPct = tasks.length ? Math.round((completedCount / tasks.length) * 100) : 0;

  return (
    <div className="p-8">
      <Link href="/skills/tree" className="mb-6 inline-flex items-center gap-1 text-base text-indigo-600 hover:underline">
        ← 返回技能树
      </Link>

      {isLoading ? (
        <div className="flex justify-center py-16">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-indigo-500 border-t-transparent" />
        </div>
      ) : !module ? (
        <div className="py-16 text-center">
          <p className="text-base text-[#6B7280]">模块不存在</p>
        </div>
      ) : (
        <>
          <div className="mb-8">
            <div className="flex items-center gap-4">
              <span className="text-4xl">{module.icon}</span>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-2xl font-semibold text-[#1F2937]">{module.name}</h1>
                  <Badge className="bg-indigo-50 text-sm text-indigo-600">{module.level_name}</Badge>
                  <Badge className="bg-indigo-500/20 text-sm text-indigo-600">自定义</Badge>
                </div>
                <p className="mt-1 text-base text-[#6B7280]">{module.description}</p>
              </div>
            </div>
            <div className="mt-5 rounded-2xl border-[#E5E7EB] bg-white p-4">
              <div className="flex items-center justify-between text-base">
                <span className="text-[#6B7280]">{completedCount}/{tasks.length} 完成</span>
                <span className="font-semibold text-indigo-600">{progressPct}%</span>
              </div>
              <div className="mt-2 h-2 overflow-hidden rounded-full bg-[#E5E7EB]">
                <div className="h-full rounded-full progress-gradient transition-all" style={{ width: `${progressPct}%` }} />
              </div>
            </div>
          </div>

          <div className="space-y-3">
            {tasks.map((task, idx) => {
              const resources = task.resources ?? [];
              const userResources = task.user_resources ?? [];
              const totalResources = resources.length + userResources.length;
              const isExpanded = expandedTask === task.id;
              return (
                <div key={task.id} className="rounded-2xl border-[#E5E7EB] bg-white p-5">
                  <div className="flex items-start justify-between">
                    <button className="flex-1 text-left" onClick={() => setExpandedTask(isExpanded ? null : task.id)}>
                      <div className="flex items-center gap-3">
                        <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-indigo-500/10 text-sm font-medium text-indigo-600">{idx + 1}</span>
                        <div>
                          <h3 className="text-base font-semibold text-[#1F2937]">{task.title}</h3>
                          <p className="mt-0.5 text-sm text-[#6B7280]">{task.objective}</p>
                        </div>
                      </div>
                    </button>
                    <div className="flex items-center gap-2 shrink-0 ml-4">
                      <span className="rounded-full bg-[#E5E7EB] px-2 py-0.5 text-sm text-[#6B7280]">{task.estimated_days}天</span>
                      {resources.length > 0 && <span className="rounded-full bg-[#E5E7EB] px-2 py-0.5 text-sm text-[#6B7280]">{totalResources}资源</span>}
                      <button
                        onClick={() => handleToggle(task.id, task.status)}
                        className={`rounded-full px-3 py-1 text-sm font-medium transition-colors ${
                          task.status === 'completed'
                            ? 'bg-[#34c759] text-white'
                            : 'bg-[#E5E7EB] text-[#6B7280] hover:bg-[#F3F4F6]'
                        }`}
                      >
                        {task.status === 'completed' ? '✓ 已完成' : '标记完成'}
                      </button>
                    </div>
                  </div>

                  {isExpanded && (
                    <div className="mt-4 border-t border-[#E5E7EB] pt-4">
                      {task.content_summary && (
                        <div className="mb-3">
                          <Markdown content={task.content_summary} />
                        </div>
                      )}
                      {resources.length > 0 && (
                        <div className="space-y-2">
                          <p className="text-sm font-medium text-[#1F2937]">学习资源</p>
                          {resources.map((r, i) => (
                            <div key={i} className="flex items-center gap-2 rounded-xl bg-white px-3 py-2 border border-[#E5E7EB]">
                              <span className={`rounded-md px-1.5 py-0.5 text-sm font-medium ${RESOURCE_COLORS[r.type] ?? ''}`}>
                                {RESOURCE_ICONS[r.type]} {r.type === 'article' ? '文章' : r.type === 'video' ? '视频' : '书籍'}
                              </span>
                              {r.url ? (
                                <a href={r.url} target="_blank" rel="noopener noreferrer" className="text-sm text-indigo-600 hover:underline">{r.title}</a>
                              ) : (
                                <span className="text-sm text-[#9CA3AF]">{r.title}</span>
                              )}
                              {r.source && <span className="text-sm text-[#6B7280]">— {r.source}</span>}
                            </div>
                          ))}
                        </div>
                      )}
                      {renderUserResources(task.id, userResources)}
                      <button
                        onClick={() => setAddResourceFor({ taskId: task.id, taskType: 'custom_module' })}
                        className="mt-3 text-xs text-indigo-600 hover:underline"
                      >
                        + 添加资源
                      </button>
                    </div>
                  )}

                  {!isExpanded && totalResources > 0 && (
                    <button onClick={() => setExpandedTask(task.id)} className="mt-2 text-sm text-indigo-600 hover:underline">
                      查看 {totalResources} 个学习资源 ▾
                    </button>
                  )}
                </div>
              );
            })}
          </div>

          {tasks.length === 0 && (
            <div className="py-12 text-center">
              <p className="text-base text-[#6B7280]">暂无学习任务，点击下方添加</p>
            </div>
          )}

          {/* 添加自定义任务 */}
          <div className="mt-6">
            {showAddTask ? (
              <div className="rounded-2xl border border-indigo-200 bg-indigo-50/30 p-5">
                <h3 className="mb-3 text-sm font-semibold text-[#1F2937]">添加学习任务</h3>
                <div className="space-y-3">
                  <input
                    value={newTaskTitle}
                    onChange={(e) => setNewTaskTitle(e.target.value)}
                    placeholder="任务名称，如：学习 RAG 检索优化"
                    className="w-full rounded-xl border border-[#D1D5DB] bg-white px-4 py-2.5 text-sm text-[#1F2937] placeholder-[#9CA3AF] focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                  <input
                    value={newTaskObjective}
                    onChange={(e) => setNewTaskObjective(e.target.value)}
                    placeholder="学习目标（可选），如：掌握混合检索和重排序技术"
                    className="w-full rounded-xl border border-[#D1D5DB] bg-white px-4 py-2.5 text-sm text-[#1F2937] placeholder-[#9CA3AF] focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                  <div className="flex gap-2">
                    <button
                      onClick={handleAddTask}
                      disabled={isAddingTask || !newTaskTitle.trim()}
                      className="rounded-xl bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
                    >
                      {isAddingTask ? '添加中...' : '确认添加'}
                    </button>
                    <button
                      onClick={() => { setShowAddTask(false); setNewTaskTitle(''); setNewTaskObjective(''); }}
                      className="rounded-xl border border-[#E5E7EB] px-4 py-2 text-sm text-[#6B7280] hover:bg-[#F3F4F6]"
                    >
                      取消
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <button
                onClick={() => setShowAddTask(true)}
                className="flex w-full items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-[#D1D5DB] bg-white py-4 text-sm font-medium text-[#6B7280] transition-colors hover:border-indigo-300 hover:bg-indigo-50/30 hover:text-indigo-600"
              >
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                </svg>
                添加学习任务
              </button>
            )}
          </div>

          <div className="mt-8 flex justify-end">
            <button
              onClick={handleDelete}
              className="rounded-lg border border-[#ff3b30]/20 px-4 py-2 text-sm text-[#ff3b30] hover:bg-[#ff3b30]/5 transition-colors"
            >
              删除此模块
            </button>
          </div>
        </>
      )}

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
