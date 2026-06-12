'use client';

import { useState, useEffect, useCallback } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import CompetitiveScoreCard from '@/components/interview/CompetitiveScoreCard';
import type { CompetitiveAnalysis, DimensionScore } from '@/types';
import GradientBackground from '@/components/ui/gradient-background';
import { apiFetch } from '@/lib/api/fetch';

interface HistoryRecord {
  id: string;
  productName: string;
  marketPosition: string;
  featureComparison: string;
  strengthsWeaknesses: string;
  differentiationStrategy: string;
  totalScore: number;
  dimensionScores: DimensionScore[];
  createdAt: string;
}

export default function CompHistoryPage() {
  const [records, setRecords] = useState<HistoryRecord[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fetchHistory = useCallback(async (p: number) => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await apiFetch(`/api/interview/competitive/history?page=${p}&page_size=20`);
      if (res.ok) {
        const data = await res.json();
        setRecords(data.records ?? []);
        setTotal(data.total ?? 0);
        setPage(p);
      } else {
        setError('加载竞品分析历史失败');
      }
    } catch {
      setError('加载竞品分析历史失败');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const handleDelete = useCallback(async (id: string) => {
    if (!confirm('确定删除这条记录吗？')) return;
    try {
      const res = await apiFetch('/api/interview/competitive/history', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      });
      if (res.ok) {
        setRecords(prev => prev.filter(r => r.id !== id));
        setTotal(prev => prev - 1);
      }
    } catch { /* ignore */ }
  }, []);

  useEffect(() => {
    fetchHistory(1);
  }, [fetchHistory]);

  const totalPages = Math.ceil(total / 20);

  return (
    <>
      <GradientBackground />
      <div className="relative z-10 space-y-6 p-8">
      <div>
        <h1 className="text-3xl font-semibold text-foreground">竞品分析历史</h1>
        <p className="mt-2 text-muted-foreground">查看所有竞品分析记录和评分详情</p>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-purple-500 border-t-transparent" />
        </div>
      ) : error ? (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-800 dark:bg-red-900/30 dark:text-red-300">
          <p>{error}</p>
          <button onClick={() => fetchHistory(page)} className="mt-1 text-xs font-medium text-red-600 hover:text-red-800 dark:text-red-400">重试</button>
        </div>
      ) : records.length === 0 ? (
        <div className="py-16 text-center">
          <p className="text-muted-foreground">还没有竞品分析记录</p>
          <a href="/interview/competitive" className="mt-2 inline-block text-sm text-purple-600 hover:underline dark:text-purple-400">
            去竞品分析
          </a>
        </div>
      ) : (
        <div className="space-y-3">
          {records.map((record) => (
            <div
              key={record.id}
              className="overflow-hidden rounded-xl border bg-card transition-colors hover:border-purple-200 dark:hover:border-purple-800"
            >
              <div
                onClick={() => setExpandedId(expandedId === record.id ? null : record.id)}
                onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setExpandedId(expandedId === record.id ? null : record.id); } }}
                role="button"
                tabIndex={0}
                className="flex w-full items-center justify-between p-4 text-left"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-foreground">{record.productName}</span>
                    <span
                      className={`text-sm font-bold ${
                        record.totalScore >= 80
                          ? 'text-emerald-600 dark:text-emerald-400'
                          : record.totalScore >= 60
                            ? 'text-amber-600 dark:text-amber-400'
                            : 'text-rose-600 dark:text-rose-400'
                      }`}
                    >
                      {record.totalScore} 分
                    </span>
                  </div>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    {new Date(record.createdAt).toLocaleString('zh-CN')}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={(e) => { e.stopPropagation(); handleDelete(record.id); }}
                    className="rounded-lg p-1.5 text-muted-foreground hover:bg-rose-100 hover:text-rose-600 transition-colors"
                    title="删除"
                  >
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                    </svg>
                  </button>
                  <span className="text-muted-foreground">
                    {expandedId === record.id ? '▲' : '▼'}
                  </span>
                </div>
              </div>

              {expandedId === record.id && (
                <div className="border-t p-4 space-y-4">
                  {[record.marketPosition, record.featureComparison, record.strengthsWeaknesses, record.differentiationStrategy].filter(Boolean).map((section, i) => (
                    <div key={i} className="rounded-lg border bg-muted/30 p-4">
                      <div className="prose prose-sm max-w-none dark:prose-invert">
                        <ReactMarkdown remarkPlugins={[remarkGfm]}>{section}</ReactMarkdown>
                      </div>
                    </div>
                  ))}
                  <CompetitiveScoreCard totalScore={record.totalScore} dimensionScores={record.dimensionScores} />
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
    </>
  );
}
