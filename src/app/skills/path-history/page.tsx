'use client';

import { useState, useEffect, useCallback } from 'react';
import LearningPathCard from '@/components/skills/LearningPathCard';
import type { RecommendedModule } from '@/types';

interface HistoryRecord {
  id: string;
  weaknessSummary: string;
  recommendedModules: RecommendedModule[];
  totalEstimatedHours: number;
  createdAt: string;
}

export default function PathHistoryPage() {
  const [records, setRecords] = useState<HistoryRecord[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const fetchHistory = useCallback(async (p: number) => {
    setIsLoading(true);
    try {
      const res = await fetch(`/api/skills/ai-learning-path/history?page=${p}&page_size=20`);
      if (res.ok) {
        const data = await res.json();
        setRecords(data.records ?? []);
        setTotal(data.total ?? 0);
        setPage(p);
      }
    } catch {
      // silent
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchHistory(1);
  }, [fetchHistory]);

  const totalPages = Math.ceil(total / 20);

  return (
    <div className="space-y-6 p-8">
      <div>
        <h1 className="text-3xl font-semibold text-foreground">路径历史</h1>
        <p className="mt-2 text-muted-foreground">查看所有 AI 生成的学习路径记录</p>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-indigo-500 border-t-transparent" />
        </div>
      ) : records.length === 0 ? (
        <div className="py-16 text-center">
          <p className="text-muted-foreground">还没有学习路径记录</p>
          <a href="/skills/ai-learning-path" className="mt-2 inline-block text-sm text-indigo-600 hover:underline dark:text-indigo-400">
            去生成学习路径
          </a>
        </div>
      ) : (
        <div className="space-y-3">
          {records.map((record) => (
            <div
              key={record.id}
              className="overflow-hidden rounded-xl border bg-card transition-colors hover:border-indigo-200 dark:hover:border-indigo-800"
            >
              <button
                onClick={() => setExpandedId(expandedId === record.id ? null : record.id)}
                className="flex w-full items-center justify-between p-4 text-left"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-foreground">
                      {record.recommendedModules.length} 个推荐模块
                    </span>
                    <span className="text-xs text-muted-foreground">
                      预估 {record.totalEstimatedHours} 小时
                    </span>
                  </div>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    {new Date(record.createdAt).toLocaleString('zh-CN')}
                  </p>
                </div>
                <span className="ml-2 text-muted-foreground">
                  {expandedId === record.id ? '▲' : '▼'}
                </span>
              </button>

              {expandedId === record.id && (
                <div className="border-t p-4 space-y-4">
                  <div className="rounded-lg border bg-indigo-50 p-3 dark:bg-indigo-950/20">
                    <p className="text-sm text-indigo-700 dark:text-indigo-400">{record.weaknessSummary}</p>
                  </div>
                  <div className="space-y-2">
                    {record.recommendedModules
                      .sort((a, b) => {
                        const order = { high: 0, medium: 1, low: 2 };
                        return (order[a.priority] ?? 2) - (order[b.priority] ?? 2);
                      })
                      .map((mod, i) => (
                        <LearningPathCard key={i} module={mod} />
                      ))}
                  </div>
                </div>
              )}
            </div>
          ))}

          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 pt-4">
              <button
                onClick={() => fetchHistory(page - 1)}
                disabled={page <= 1}
                className="rounded-lg border px-3 py-1.5 text-sm disabled:opacity-50 hover:bg-accent"
              >
                上一页
              </button>
              <span className="text-sm text-muted-foreground">{page} / {totalPages}</span>
              <button
                onClick={() => fetchHistory(page + 1)}
                disabled={page >= totalPages}
                className="rounded-lg border px-3 py-1.5 text-sm disabled:opacity-50 hover:bg-accent"
              >
                下一页
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
