'use client';

import { useState, useEffect, useCallback } from 'react';
import { cacheGet, cacheSet, TTL } from '@/lib/cache';

interface TechItem {
  id?: string;
  date: string;
  title: string;
  summary: string;
  explanation: string;
  impact: string;
  tags: string[];
  source_name?: string;
  source_url?: string;
}

export default function DailyTechPage() {
  const [today, setToday] = useState<TechItem | null>(null);
  const [history, setHistory] = useState<TechItem[]>([]);
  const [bookmarks, setBookmarks] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedTech, setSelectedTech] = useState<TechItem | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const fetchData = useCallback(async (forceRefresh = false) => {
    if (!forceRefresh) {
      const cached = cacheGet<{ tech: TechItem; history: TechItem[]; bookmarks: string[] }>('daily-tech');
      if (cached) {
        setToday(cached.tech);
        setHistory(cached.history || []);
        setBookmarks(cached.bookmarks || []);
        setSelectedTech(cached.tech);
        setIsLoading(false);
      }
    }
    try {
      const res = await fetch(`/api/daily-challenge/tech${forceRefresh ? '?refresh=1' : ''}`);
      if (res.ok) {
        const data = await res.json();
        setToday(data.tech);
        setHistory(data.history || []);
        setBookmarks(data.bookmarks || []);
        setSelectedTech(data.tech);
        if (!forceRefresh) {
          cacheSet('daily-tech', { tech: data.tech, history: data.history || [], bookmarks: data.bookmarks || [] }, TTL.DAILY);
        }
      }
    } catch { /* ignore */ } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const toggleBookmark = async (date: string) => {
    const isBookmarked = bookmarks.includes(date);
    const action = isBookmarked ? 'unbookmark' : 'bookmark';
    const techItem = date === today?.date ? today : history.find(h => h.date === date);
    try {
      const res = await fetch('/api/daily-challenge/tech', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action,
          tech_date: date,
          tech_data: techItem ? {
            title: techItem.title,
            summary: techItem.summary,
            explanation: techItem.explanation,
            impact: techItem.impact,
            tags: techItem.tags,
            source_url: techItem.source_url,
          } : undefined,
        }),
      });
      if (res.ok) {
        setBookmarks(prev =>
          isBookmarked ? prev.filter(d => d !== date) : [...prev, date]
        );
      }
    } catch { /* ignore */ }
  };

  const displayTech = selectedTech || today;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-indigo-500 border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-40 border-b border-border bg-card/80 backdrop-blur">
        <div className="flex items-center justify-between px-6 py-3">
          <h1 className="text-base font-semibold text-foreground">每日 AI 技术</h1>
          <button
            onClick={async () => {
              setIsRefreshing(true);
              setIsLoading(true);
              await fetchData(true);
              setIsRefreshing(false);
            }}
            disabled={isRefreshing}
            className="rounded-lg bg-secondary px-3 py-1.5 text-xs font-medium text-foreground hover:bg-muted disabled:opacity-50 transition"
          >
            {isRefreshing ? '重新生成中...' : '换一条'}
          </button>
        </div>
      </header>

      <div className="mx-auto max-w-[2200px] px-10 py-6">
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          {/* 左列：今日技术详情 */}
          <div className="lg:col-span-1">
            {displayTech ? (
              <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h2 className="text-lg font-bold text-foreground">{displayTech.title}</h2>
                    <p className="mt-1 text-xs text-muted-foreground">{displayTech.date}</p>
                  </div>
                  <button
                    onClick={() => toggleBookmark(displayTech.date)}
                    className={`shrink-0 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
                      bookmarks.includes(displayTech.date)
                        ? 'bg-indigo-100 text-indigo-700'
                        : 'bg-secondary text-muted-foreground hover:bg-gray-200'
                    }`}
                  >
                    {bookmarks.includes(displayTech.date) ? '已收藏' : '收藏'}
                  </button>
                </div>

                <div className="mt-4 rounded-xl bg-indigo-50 p-4">
                  <p className="text-xs font-medium text-indigo-700 mb-1">摘要</p>
                  <p className="text-sm text-foreground">{displayTech.summary}</p>
                </div>

                <div className="mt-4">
                  <p className="text-xs font-medium text-foreground mb-1">白话解读</p>
                  <p className="text-sm text-foreground leading-relaxed">{displayTech.explanation}</p>
                </div>

                <div className="mt-4 rounded-xl bg-amber-50 p-4">
                  <p className="text-xs font-medium text-amber-700 mb-1">对 AI PM 的影响</p>
                  <p className="text-sm text-foreground">{displayTech.impact}</p>
                </div>

                {displayTech.tags && displayTech.tags.length > 0 && (
                  <div className="mt-4 flex flex-wrap gap-2">
                    {displayTech.tags.map((tag) => (
                      <span key={tag} className="rounded-full bg-secondary px-2.5 py-1 text-xs text-muted-foreground">
                        {tag}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <div className="rounded-2xl border border-border bg-card p-12 text-center">
                <p className="text-sm text-muted-foreground">暂无内容</p>
              </div>
            )}
          </div>

          {/* 右列：历史推送 */}
          <div className="lg:col-span-1">
            <div className="rounded-2xl border border-border bg-card p-4 shadow-sm">
              <h3 className="text-sm font-semibold text-foreground mb-3">历史推送</h3>
              {history.length > 0 ? (
                <div className="space-y-2">
                  {history.map((item) => (
                    <button
                      key={item.date}
                      onClick={() => setSelectedTech(item)}
                      className={`w-full rounded-xl border p-3 text-left transition-colors ${
                        selectedTech?.date === item.date
                          ? 'border-indigo-200 bg-indigo-50'
                          : 'border-border bg-card hover:bg-muted'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-foreground line-clamp-1">{item.title}</span>
                        <span className="text-xs text-muted-foreground shrink-0 ml-2">{item.date}</span>
                      </div>
                      <p className="mt-1 text-xs text-muted-foreground line-clamp-1">{item.summary}</p>
                    </button>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-muted-foreground">暂无历史记录</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
