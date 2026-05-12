'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, CheckCircle2, Circle, Loader2, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import type { LearningResource, UserTaskResource } from '@/types';
import AddResourceDialog from '@/components/skills/AddResourceDialog';
import GradientBackground from '@/components/ui/gradient-background';

const RESOURCE_ICONS: Record<string, string> = { article: '📄', video: '🎬', book: '📚', note: '📝' };
const RESOURCE_COLORS: Record<string, string> = {
  article: 'bg-indigo-50 text-indigo-600',
  video: 'bg-[#ff3b30]/10 text-[#ff3b30]',
  book: 'bg-[#34c759]/10 text-[#34c759]',
  note: 'bg-amber-50 text-amber-600',
};

interface JdGapTask {
  id: string;
  title: string;
  objective: string | null;
  resources: LearningResource[];
  status: string;
  completed_at: string | null;
  created_at: string;
  source_jd_id: string | null;
  user_resources?: UserTaskResource[];
}

export default function JdGapsPage() {
  const router = useRouter();
  const [tasks, setTasks] = useState<JdGapTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedTask, setExpandedTask] = useState<string | null>(null);
  const [addResourceFor, setAddResourceFor] = useState<string | null>(null);

  const fetchTasks = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/skills/jd-gaps');
      if (res.ok) {
        const data = await res.json();
        setTasks(data.tasks ?? []);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  const toggleStatus = async (task: JdGapTask) => {
    const next = task.status === 'completed' ? 'not_started' : 'completed';
    const res = await fetch(`/api/skills/tasks/${task.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: next }),
    });
    if (res.ok) {
      setTasks((prev) =>
        prev.map((t) =>
          t.id === task.id
            ? { ...t, status: next, completed_at: next === 'completed' ? new Date().toISOString() : null }
            : t,
        ),
      );
    }
  };

  const handleDelete = async (taskId: string) => {
    if (!confirm('确定删除此技能差距？')) return;
    const res = await fetch(`/api/skills/tasks/${taskId}`, { method: 'DELETE' });
    if (res.ok) {
      setTasks((prev) => prev.filter((t) => t.id !== taskId));
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
            </div>
            <button onClick={() => handleResourceDeleted(taskId, r.id)} className="shrink-0 text-muted-foreground hover:text-[#ff3b30]">
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

  return (
    <div className="h-full bg-muted">
      <GradientBackground />
      <div className="relative z-10 px-4 py-8">
        <div className="mb-6 flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => router.push('/skills/tree')}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-foreground">🎯 岗位差距</h1>
            <p className="text-base text-muted-foreground">
              JD 分析发现的技能差距 · {completedCount}/{tasks.length} 已完成
            </p>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-6 w-6 animate-spin text-indigo-500" />
          </div>
        ) : tasks.length === 0 ? (
          <Card className="border-border">
            <CardContent className="py-12 text-center">
              <p className="text-muted-foreground">暂无岗位差距任务</p>
              <p className="mt-1 text-sm text-muted-foreground">分析 JD 后，发现的技能差距会自动出现在这里</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {tasks.map((task) => {
              const resources = task.resources ?? [];
              const userResources = task.user_resources ?? [];
              const totalResources = resources.length + userResources.length;
              const isExpanded = expandedTask === task.id;
              return (
                <Card
                  key={task.id}
                  className={`border-border transition-colors ${
                    task.status === 'completed' ? 'bg-emerald-50/50 border-emerald-200' : 'bg-card'
                  }`}
                >
                  <CardHeader className="pb-2">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-start gap-3 min-w-0">
                        <button onClick={() => toggleStatus(task)} className="mt-0.5 flex-shrink-0">
                          {task.status === 'completed' ? (
                            <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                          ) : (
                            <Circle className="h-5 w-5 text-[#D1D5DB] hover:text-indigo-400" />
                          )}
                        </button>
                        <div className="min-w-0 flex-1">
                          <button className="text-left w-full" onClick={() => setExpandedTask(isExpanded ? null : task.id)}>
                            <CardTitle className={`text-base break-words ${task.status === 'completed' ? 'text-emerald-700 line-through' : 'text-foreground'}`}>
                              {task.title}
                            </CardTitle>
                          </button>
                          {task.objective && (
                            <p className="mt-1 text-sm text-muted-foreground break-words">{task.objective}</p>
                          )}
                          {!isExpanded && totalResources > 0 && (
                            <button onClick={() => setExpandedTask(task.id)} className="mt-1 text-xs text-indigo-600 hover:underline">
                              查看 {totalResources} 个学习资源 ▾
                            </button>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <Badge variant="secondary" className={task.status === 'completed' ? 'bg-emerald-100 text-emerald-600' : 'bg-amber-100 text-amber-600'}>
                          {task.status === 'completed' ? '已完成' : '待提升'}
                        </Badge>
                        <button onClick={() => handleDelete(task.id)} className="text-muted-foreground hover:text-[#ff3b30] transition-colors" title="删除">
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  </CardHeader>

                  {isExpanded && (
                    <CardContent className="pt-2">
                      {resources.length > 0 && (
                        <div className="space-y-2 mb-3">
                          <p className="text-xs font-medium text-foreground">学习资源</p>
                          {resources.map((r, i) => (
                            <div key={i} className="flex items-center gap-2 rounded-xl bg-card px-3 py-2 border border-border">
                              <span className={`rounded-md px-1.5 py-0.5 text-xs font-medium ${RESOURCE_COLORS[r.type] ?? ''}`}>
                                {RESOURCE_ICONS[r.type]} {r.type === 'article' ? '文章' : r.type === 'video' ? '视频' : '书籍'}
                              </span>
                              {r.url ? (
                                <a href={r.url} target="_blank" rel="noopener noreferrer" className="text-xs text-indigo-600 hover:underline">{r.title}</a>
                              ) : (
                                <span className="text-xs text-muted-foreground">{r.title}</span>
                              )}
                              {r.source && <span className="text-xs text-muted-foreground">— {r.source}</span>}
                            </div>
                          ))}
                        </div>
                      )}
                      {renderUserResources(task.id, userResources)}
                      <button
                        onClick={() => setAddResourceFor(task.id)}
                        className="mt-2 text-xs text-indigo-600 hover:underline"
                      >
                        + 添加资源
                      </button>
                    </CardContent>
                  )}
                </Card>
              );
            })}
          </div>
        )}
      </div>

      {addResourceFor && (
        <AddResourceDialog
          taskId={addResourceFor}
          taskType="jd_gap"
          open={true}
          onClose={() => setAddResourceFor(null)}
          onAdded={(r) => handleResourceAdded(addResourceFor, r as UserTaskResource)}
        />
      )}
    </div>
  );
}
