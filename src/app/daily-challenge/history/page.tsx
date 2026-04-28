'use client';

import { useState, useEffect } from 'react';

interface HistoryRecord {
  submission_id: string;
  challenge_id: string;
  question: string;
  category: string;
  difficulty: string;
  score: number;
  answer: string;
  feedback: string;
  perfect_answer: string;
  time_spent: number;
  submitted_at: string;
}

interface Evaluation {
  scores: { dimension: string; score: number; comment: string }[];
  total_score: number;
  overall_comment: string;
  improvement: string;
}

const DIFF_LABELS: Record<string, { label: string; color: string }> = {
  easy: { label: '简单', color: 'text-emerald-600' },
  medium: { label: '中等', color: 'text-amber-600' },
  hard: { label: '困难', color: 'text-rose-600' },
};

function parseEvaluation(fb: string): Evaluation | null {
  if (!fb) return null;
  try {
    const obj = JSON.parse(fb);
    if (obj && typeof obj === 'object' && obj.scores) return obj;
  } catch { /* ignore */ }
  return null;
}

function formatDate(iso: string) {
  const d = new Date(iso);
  return d.toLocaleDateString('zh-CN', { month: 'long', day: 'numeric', weekday: 'short' });
}

function formatTime(seconds: number) {
  if (!seconds) return '';
  if (seconds < 60) return `${seconds}秒`;
  return `${Math.floor(seconds / 60)}分${seconds % 60}秒`;
}

export default function HistoryPage() {
  const [records, setRecords] = useState<HistoryRecord[]>([]);
  const [stats, setStats] = useState({ totalCount: 0, avgScore: 0, maxScore: 0 });
  const [isLoading, setIsLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);

  useEffect(() => {
    setIsLoading(true);
    fetch(`/api/daily-challenge/history?page=${page}&limit=20`)
      .then((r) => r.ok ? r.json() : null)
      .then((data) => {
        if (data) {
          setRecords(data.records || []);
          setStats(data.stats || { totalCount: 0, avgScore: 0, maxScore: 0 });
          setTotal(data.pagination?.total ?? 0);
        }
      })
      .catch(() => {})
      .finally(() => setIsLoading(false));
  }, [page]);

  // Group by date
  const grouped: Record<string, HistoryRecord[]> = {};
  for (const r of records) {
    const date = r.submitted_at.split('T')[0];
    if (!grouped[date]) grouped[date] = [];
    grouped[date].push(r);
  }

  const totalPages = Math.ceil(total / 20);

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-amber-500 border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl px-6 py-8">
      <div className="mb-6">
        <h1 className="text-lg font-bold text-foreground">答题记录</h1>
        <p className="mt-1 text-sm text-muted-foreground">回顾每次挑战的题目、回答和评分</p>
      </div>

      {/* Stats */}
      <div className="mb-6 grid grid-cols-3 gap-3">
        <div className="rounded-xl border border-border bg-card p-4 text-center">
          <div className="text-2xl font-bold text-foreground">{stats.totalCount}</div>
          <div className="text-xs text-muted-foreground">总答题数</div>
        </div>
        <div className="rounded-xl border border-border bg-card p-4 text-center">
          <div className="text-2xl font-bold text-amber-600">{stats.avgScore}</div>
          <div className="text-xs text-muted-foreground">平均分</div>
        </div>
        <div className="rounded-xl border border-border bg-card p-4 text-center">
          <div className="text-2xl font-bold text-emerald-600">{stats.maxScore}</div>
          <div className="text-xs text-muted-foreground">最高分</div>
        </div>
      </div>

      {records.length === 0 ? (
        <div className="rounded-2xl border border-border bg-card p-12 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-amber-50">
            <svg className="h-8 w-8 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h3 className="text-sm font-medium text-foreground">暂无答题记录</h3>
          <p className="mt-1 text-xs text-muted-foreground">完成每日挑战后，记录会出现在这里</p>
        </div>
      ) : (
        <div className="space-y-6">
          {Object.entries(grouped).sort(([a], [b]) => b.localeCompare(a)).map(([date, items]) => (
            <div key={date}>
              <div className="mb-2 text-xs font-medium text-muted-foreground">{formatDate(date)}</div>
              <div className="space-y-3">
                {items.map((r) => {
                  const diff = DIFF_LABELS[r.difficulty] || DIFF_LABELS.medium;
                  const ev = parseEvaluation(r.feedback);
                  const isExpanded = expandedId === r.submission_id;

                  return (
                    <div key={r.submission_id} className="rounded-2xl border border-border bg-card p-5">
                      <button
                        onClick={() => setExpandedId(isExpanded ? null : r.submission_id)}
                        className="w-full text-left"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex-1">
                            <div className="mb-1 flex items-center gap-2">
                              <span className="rounded-lg bg-amber-100 px-2 py-0.5 text-[10px] font-medium text-amber-700">{r.category}</span>
                              <span className={`text-[10px] font-medium ${diff.color}`}>{diff.label}</span>
                              <span className="text-[10px] text-muted-foreground">{formatTime(r.time_spent)}</span>
                            </div>
                            <p className="text-sm font-medium text-foreground line-clamp-2">{r.question}</p>
                          </div>
                          <div className="flex shrink-0 items-center gap-2">
                            <div className={`rounded-lg px-2.5 py-1 text-center ${
                              r.score >= 80 ? 'bg-emerald-50' : r.score >= 60 ? 'bg-amber-50' : 'bg-rose-50'
                            }`}>
                              <div className={`text-lg font-bold ${
                                r.score >= 80 ? 'text-emerald-600' : r.score >= 60 ? 'text-amber-600' : 'text-rose-600'
                              }`}>{r.score}</div>
                            </div>
                            <svg className={`h-4 w-4 text-muted-foreground transition-transform ${isExpanded ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
                            </svg>
                          </div>
                        </div>
                      </button>

                      {isExpanded && (
                        <div className="mt-4 space-y-3 border-t border-border pt-4">
                          {/* My answer */}
                          <div>
                            <h4 className="mb-1 text-xs font-medium text-muted-foreground">我的回答</h4>
                            <p className="rounded-xl bg-muted p-3 text-sm text-foreground whitespace-pre-line">{r.answer}</p>
                          </div>

                          {/* Score breakdown */}
                          {ev?.scores && ev.scores.length > 0 && (
                            <div>
                              <h4 className="mb-2 text-xs font-medium text-muted-foreground">评分详情</h4>
                              <div className="space-y-2">
                                {ev.scores.map((s, i) => (
                                  <div key={i} className="flex items-center gap-3">
                                    <span className="w-20 text-xs font-medium text-muted-foreground">{s.dimension}</span>
                                    <div className="flex-1 rounded-full bg-secondary h-2">
                                      <div className={`rounded-full h-2 ${
                                        s.score >= 80 ? 'bg-emerald-500' : s.score >= 60 ? 'bg-amber-500' : 'bg-rose-500'
                                      }`} style={{ width: `${s.score}%` }} />
                                    </div>
                                    <span className="text-xs font-medium text-foreground">{s.score}</span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Overall comment */}
                          {ev?.overall_comment && (
                            <div className="rounded-xl bg-muted p-3 text-sm text-foreground">
                              <span className="font-medium">总评：</span>{ev.overall_comment}
                            </div>
                          )}

                          {/* Improvement */}
                          {ev?.improvement && (
                            <div className="rounded-xl bg-indigo-50 p-3 text-sm text-indigo-700">
                              <span className="font-medium">改进建议：</span>{ev.improvement}
                            </div>
                          )}

                          {/* Perfect answer */}
                          {r.perfect_answer && (
                            <div className="rounded-xl border border-amber-200 bg-amber-50/50 p-3">
                              <h4 className="text-xs font-semibold text-amber-800">满分回答要点</h4>
                              <p className="mt-1 text-xs text-amber-700 whitespace-pre-line">{r.perfect_answer}</p>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ))}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 pt-4">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="rounded-lg border border-border px-3 py-1.5 text-xs text-muted-foreground hover:bg-muted disabled:opacity-30"
              >
                上一页
              </button>
              <span className="text-xs text-muted-foreground">{page} / {totalPages}</span>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="rounded-lg border border-border px-3 py-1.5 text-xs text-muted-foreground hover:bg-muted disabled:opacity-30"
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
