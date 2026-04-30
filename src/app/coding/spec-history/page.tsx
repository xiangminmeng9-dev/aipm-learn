'use client';

import { useState, useEffect, useCallback } from 'react';
import SpecScoreCard from '@/components/coding/SpecScoreCard';
import type { SpecPractice } from '@/types';

export default function SpecHistoryPage() {
  const [records, setRecords] = useState<SpecPractice[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const fetchHistory = useCallback(async (p: number) => {
    setIsLoading(true);
    try {
      const res = await fetch(`/api/coding/spec-practice/history?page=${p}&limit=20`);
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
    <div className="p-8 space-y-6">
      <div>
        <h1 className="text-3xl font-semibold text-foreground">实操历史</h1>
        <p className="mt-2 text-muted-foreground">查看所有实操练习记录和评分详情</p>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-indigo-500 border-t-transparent" />
        </div>
      ) : records.length === 0 ? (
        <div className="py-16 text-center">
          <p className="text-muted-foreground">还没有实操记录</p>
          <a href="/coding/spec-practice" className="mt-2 inline-block text-sm text-indigo-600 hover:underline">
            去实操练习
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
                    <span className="rounded-full bg-indigo-100 px-2.5 py-0.5 text-xs font-medium text-indigo-700 dark:bg-indigo-900 dark:text-indigo-300">
                      {record.question_category}
                    </span>
                    <span
                      className={`text-sm font-bold ${
                        record.total_score >= 80
                          ? 'text-emerald-600'
                          : record.total_score >= 60
                            ? 'text-amber-600'
                            : 'text-rose-600'
                      }`}
                    >
                      {record.total_score} 分
                    </span>
                  </div>
                  <p className="mt-1 truncate text-sm text-foreground">{record.question}</p>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    {new Date(record.created_at).toLocaleString('zh-CN')}
                  </p>
                </div>
                <span className="ml-2 text-muted-foreground">
                  {expandedId === record.id ? '▲' : '▼'}
                </span>
              </button>

              {expandedId === record.id && (
                <div className="border-t p-4 space-y-4">
                  <div>
                    <h4 className="mb-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">我的 Spec</h4>
                    <div className="rounded-lg bg-muted/50 p-3 text-sm text-foreground whitespace-pre-wrap">
                      {record.user_spec}
                    </div>
                  </div>
                  <SpecScoreCard
                    totalScore={record.total_score}
                    dimensionScores={record.dimension_scores}
                    suggestions={record.suggestions}
                  />
                </div>
              )}
            </div>
          ))}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 pt-4">
              <button
                onClick={() => fetchHistory(page - 1)}
                disabled={page <= 1}
                className="rounded-lg border px-3 py-1.5 text-sm disabled:opacity-50 hover:bg-accent"
              >
                上一页
              </button>
              <span className="text-sm text-muted-foreground">
                {page} / {totalPages}
              </span>
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
