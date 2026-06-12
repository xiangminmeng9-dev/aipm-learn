'use client';

import { useState, useEffect, useCallback } from 'react';
import GradientBackground from '@/components/ui/gradient-background';
import { apiFetch } from '@/lib/api/fetch';

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
  source_published_at?: string;
  source_published_display?: string;
}

export default function DailyTechPage() {
  const [today, setToday] = useState<TechItem | null>(null);
  const [history, setHistory] = useState<TechItem[]>([]);
  const [bookmarks, setBookmarks] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedTech, setSelectedTech] = useState<TechItem | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const fetchData = useCallback(async (forceRefresh = false) => {
    try {
      const res = await apiFetch(`/api/daily-challenge/tech${forceRefresh ? '?refresh=1' : ''}`);
      if (res.ok) {
        const data = await res.json();
        setToday(data.tech);
        setHistory(data.history || []);
        setBookmarks(data.bookmarks || []);
        setSelectedTech(data.tech);
      } else {
        const errorData = await res.json().catch(() => ({}));
        console.error('API error:', errorData);
        setToday(prev => {
          if (prev) return prev;
          return {
            date: new Date().toISOString().split('T')[0],
            title: '获取失败',
            summary: errorData.error || '获取AI技术资讯失败，请稍后重试',
            explanation: errorData.error || '获取AI技术资讯失败，请稍后重试',
            impact: '请稍后重试或检查网络连接',
            tags: [],
          };
        });
        setSelectedTech(null);
      }
    } catch (err) {
      console.error('Fetch error:', err);
      setToday(prev => {
        if (prev) return prev;
        return {
          date: new Date().toISOString().split('T')[0],
          title: '网络错误',
          summary: '网络连接失败，请检查网络后重试',
          explanation: '网络连接失败，请检查网络后重试',
          impact: '请刷新页面重试',
          tags: [],
        };
      });
      setSelectedTech(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const toggleBookmark = async (date: string) => {
    const isBookmarked = bookmarks.includes(date);
    const action = isBookmarked ? 'unbookmark' : 'bookmark';
    const techItem = date === today?.date ? today : history.find(h => h.date === date);
    try {
      const res = await apiFetch('/api/daily-challenge/tech', {
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

  // Format published date for display
  const formatPublishedDate = (tech: TechItem) => {
    if (tech.source_published_display) return tech.source_published_display;
    if (tech.source_published_at) {
      return new Date(tech.source_published_at).toLocaleDateString('zh-CN', { year: 'numeric', month: 'long', day: 'numeric' });
    }
    return null;
  };

  if (isLoading) {
    return (
      <div className="h-full bg-background flex items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-indigo-500 border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="h-full bg-background">
      <GradientBackground />
      <header className="relative z-10 sticky top-0 z-40 border-b border-border bg-card/80 backdrop-blur">
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
                    <div className="mt-1 flex items-center gap-3 text-xs text-muted-foreground">
                      <span>{displayTech.date}</span>
                      {formatPublishedDate(displayTech) && (
                        <span className="text-indigo-600 dark:text-indigo-400 font-medium">
                          原文发布于 {formatPublishedDate(displayTech)}
                        </span>
                      )}
                    </div>
                  </div>
                  <button
                    onClick={() => toggleBookmark(displayTech.date)}
                    className={`shrink-0 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
                      bookmarks.includes(displayTech.date)
                        ? 'bg-indigo-100 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300'
                        : 'bg-secondary text-muted-foreground hover:bg-muted'
                    }`}
                  >
                    {bookmarks.includes(displayTech.date) ? '已收藏' : '收藏'}
                  </button>
                </div>

                <div className="mt-4 rounded-xl bg-indigo-50 dark:bg-indigo-950/40 p-4">
                  <p className="text-xs font-medium text-indigo-700 dark:text-indigo-300 mb-1">摘要</p>
                  <p className="text-sm text-foreground">{displayTech.summary}</p>
                </div>

                <div className="mt-4">
                  <p className="text-xs font-medium text-foreground mb-1">白话解读</p>
                  <p className="text-sm text-foreground leading-relaxed">{displayTech.explanation}</p>
                </div>

                <div className="mt-4 rounded-xl bg-amber-50 dark:bg-amber-950/40 p-4">
                  <p className="text-xs font-medium text-amber-700 dark:text-amber-300 mb-1">对 AI PM 的影响</p>
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

                {/* 来源信息 */}
                {(displayTech.source_url || displayTech.source_name) && (
                  <div className="mt-4 pt-4 border-t border-border">
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <span>来源：</span>
                      {displayTech.source_name && <span className="font-medium text-foreground">{displayTech.source_name}</span>}
                      {displayTech.source_url && (
                        <a
                          href={displayTech.source_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-indigo-600 dark:text-indigo-400 hover:underline truncate max-w-[300px]"
                        >
                          查看原文
                        </a>
                      )}
                    </div>
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
                          ? 'border-indigo-200 bg-indigo-50 dark:border-indigo-800 dark:bg-indigo-950/40'
                          : 'border-border hover:border-indigo-200 dark:hover:border-indigo-800 hover:bg-indigo-50/50 dark:hover:bg-indigo-950/30'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-foreground line-clamp-1">{item.title}</span>
                        <span className="text-xs text-muted-foreground shrink-0 ml-2">{item.date}</span>
                      </div>
                      <div className="mt-1 flex items-center gap-2">
                        <p className="text-xs text-muted-foreground line-clamp-1 flex-1">{item.summary}</p>
                        {item.source_published_at && (
                          <span className="text-xs text-indigo-500 dark:text-indigo-400 shrink-0">
                            {new Date(item.source_published_at).toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' })}
                          </span>
                        )}
                      </div>
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
