'use client';

import { useState, useEffect, useCallback } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import CompetitiveScoreCard from '@/components/interview/CompetitiveScoreCard';
import type { CompetitiveAnalysis, DimensionScore } from '@/types';

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

  const fetchHistory = useCallback(async (p: number) => {
    setIsLoading(true);
    try {
      const res = await fetch(`/api/interview/competitive/history?page=${p}&limit=20`);
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
        <h1 className="text-3xl font-semibold text-foreground">竞品分析历史</h1>
        <p className="mt-2 text-muted-foreground">查看所有竞品分析记录和评分详情</p>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-purple-500 border-t-transparent" />
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
              <button
                onClick={() => setExpandedId(expandedId === record.id ? null : record.id)}
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
                <span className="ml-2 text-muted-foreground">
                  {expandedId === record.id ? '▲' : '▼'}
                </span>
              </button>

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
  );
}
