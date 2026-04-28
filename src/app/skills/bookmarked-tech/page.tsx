'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';

interface BookmarkedTech {
  tech_date: string;
  title: string;
  summary: string | null;
  explanation: string | null;
  impact: string | null;
  tags: string[] | null;
}

export default function BookmarkedTechPage() {
  const router = useRouter();
  const [items, setItems] = useState<BookmarkedTech[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [expandedItem, setExpandedItem] = useState<string | null>(null);

  const fetchBookmarks = useCallback(async () => {
    try {
      const res = await fetch('/api/skills/modules');
      if (res.ok) {
        const data = await res.json();
        const techModule = (data.modules || []).find(
          (m: { id: string; bookmarked_tech?: BookmarkedTech[] }) => m.id === '__bookmarked_tech__'
        );
        setItems(techModule?.bookmarked_tech || []);
      }
    } catch { /* ignore */ } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => { fetchBookmarks(); }, [fetchBookmarks]);

  const handleUnbookmark = async (techDate: string) => {
    try {
      const res = await fetch('/api/daily-challenge/tech', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'unbookmark', tech_date: techDate }),
      });
      if (res.ok) {
        setItems(prev => prev.filter(i => i.tech_date !== techDate));
        if (expandedItem === techDate) setExpandedItem(null);
      }
    } catch { /* ignore */ }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-muted flex items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-indigo-500 border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-muted">
      <div className="mx-auto max-w-3xl px-4 py-8">
        <div className="mb-6 flex items-center gap-3">
          <button
            onClick={() => router.push('/skills/tree')}
            className="rounded-lg p-2 text-muted-foreground hover:bg-secondary hover:text-foreground"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <div>
            <h1 className="text-2xl font-bold text-foreground">🔖 收藏技术</h1>
            <p className="text-base text-muted-foreground">
              每日AI技术收藏 · {items.length} 项
            </p>
          </div>
        </div>

        {items.length === 0 ? (
          <div className="rounded-2xl border border-border bg-card p-12 text-center">
            <p className="text-muted-foreground">暂无收藏</p>
            <p className="mt-1 text-sm text-muted-foreground">在每日AI技术中收藏的内容会出现在这里</p>
            <button
              onClick={() => router.push('/daily-challenge/tech')}
              className="mt-4 rounded-xl bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
            >
              去看看今日技术
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {items.map((item) => {
              const isExpanded = expandedItem === item.tech_date;
              return (
                <div
                  key={item.tech_date}
                  className={`rounded-2xl border bg-card p-5 transition-colors ${
                    isExpanded ? 'border-indigo-200 shadow-sm' : 'border-border'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <button
                        onClick={() => setExpandedItem(isExpanded ? null : item.tech_date)}
                        className="text-left w-full"
                      >
                        <h3 className="text-base font-semibold text-foreground">{item.title}</h3>
                        <p className="mt-1 text-xs text-muted-foreground">{item.tech_date}</p>
                      </button>
                      {!isExpanded && item.summary && (
                        <p className="mt-2 text-sm text-muted-foreground line-clamp-2">{item.summary}</p>
                      )}
                    </div>
                    <button
                      onClick={() => handleUnbookmark(item.tech_date)}
                      className="shrink-0 rounded-lg px-3 py-1.5 text-xs font-medium bg-indigo-100 text-indigo-700 hover:bg-indigo-200 transition-colors"
                    >
                      取消收藏
                    </button>
                  </div>

                  {isExpanded && (
                    <div className="mt-4 space-y-3">
                      {item.summary && (
                        <div className="rounded-xl bg-indigo-50 p-3">
                          <p className="text-xs font-medium text-indigo-700 mb-1">摘要</p>
                          <p className="text-sm text-foreground">{item.summary}</p>
                        </div>
                      )}
                      {item.explanation && (
                        <div>
                          <p className="text-xs font-medium text-foreground mb-1">白话解读</p>
                          <p className="text-sm text-foreground leading-relaxed">{item.explanation}</p>
                        </div>
                      )}
                      {item.impact && (
                        <div className="rounded-xl bg-amber-50 p-3">
                          <p className="text-xs font-medium text-amber-700 mb-1">对 AI PM 的影响</p>
                          <p className="text-sm text-foreground">{item.impact}</p>
                        </div>
                      )}
                      {item.tags && item.tags.length > 0 && (
                        <div className="flex flex-wrap gap-2">
                          {item.tags.map((tag) => (
                            <span key={tag} className="rounded-full bg-secondary px-2.5 py-1 text-xs text-muted-foreground">
                              {tag}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
