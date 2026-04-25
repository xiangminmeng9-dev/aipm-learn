'use client';

import { useState, useEffect, useCallback } from 'react';
import type { DailyAiNewsArticle, DailyAiNewsDigest } from '@/types';

function getTodayShanghai(): string {
  return new Date().toLocaleDateString('sv-SE', { timeZone: 'Asia/Shanghai' });
}

function timeAgo(date: string): string {
  const diff = Date.now() - new Date(date).getTime();
  const hours = Math.floor(diff / 3600000);
  if (hours < 1) return '刚刚';
  if (hours < 24) return `${hours}小时前`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}天前`;
  return new Date(date).toLocaleDateString('zh-CN');
}

export default function DailyAiNewsPage() {
  const [date, setDate] = useState(getTodayShanghai);
  const [articles, setArticles] = useState<DailyAiNewsArticle[]>([]);
  const [digest, setDigest] = useState<DailyAiNewsDigest | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchData = useCallback(async (d: string) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/daily-ai-news?date=${d}`);
      if (res.ok) {
        const data = await res.json();
        setArticles(data.articles ?? []);
        setDigest(data.digest ?? null);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(date); }, [date, fetchData]);

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await fetch('/api/daily-ai-news/refresh', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ date }),
      });
      await fetchData(date);
    } finally {
      setRefreshing(false);
    }
  };

  // Parse digest content — handle JSON format
  let digestContent = '';
  if (digest?.digest) {
    try {
      const parsed = JSON.parse(digest.digest);
      if (parsed && typeof parsed === 'object') {
        const parts: string[] = [];
        if (parsed.headline) parts.push(`## 📰 今日头条\n${parsed.headline}`);
        if (parsed.summary) parts.push(parsed.summary);
        if (parsed.highlights?.length) parts.push(`## 🔍 核心要点\n${parsed.highlights.map((h: string) => `- **${h}**`).join('\n')}`);
        if (parsed.trend) parts.push(`## 📈 趋势洞察\n${parsed.trend}`);
        digestContent = parts.join('\n\n');
      } else {
        digestContent = digest.digest;
      }
    } catch {
      digestContent = digest.digest;
    }
  }

  return (
    <div className="flex h-full flex-col bg-[#F8F9FB]">
      {/* Header */}
      <div className="shrink-0 border-b border-[#E5E7EB] bg-white px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-lg font-semibold text-[#1F2937]">每日 AI 大事</h1>
            <p className="text-xs text-[#6B7280]">全网 AI 动态，AI 自动生成摘要与趋势洞察</p>
          </div>
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="rounded-lg bg-[#4F46E5] px-4 py-2 text-xs font-medium text-white hover:bg-[#4338CA] disabled:opacity-50 transition"
          >
            {refreshing ? '刷新中...' : '刷新数据'}
          </button>
        </div>
        {/* Date selector */}
        <div className="mt-3 flex items-center gap-2">
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="rounded-lg border border-[#D1D5DB] bg-[#F9FAFB] px-3 py-1.5 text-xs text-[#1F2937] focus:border-[#4F46E5] focus:outline-none"
          />
          <span className="text-xs text-[#9CA3AF]">{articles.length} 篇文章</span>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-6">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-indigo-500 border-t-transparent" />
          </div>
        ) : (
          <div className="space-y-6">
            {/* Digest */}
            {digestContent && (
              <div className="rounded-2xl border border-indigo-100 bg-gradient-to-br from-indigo-50/50 to-white p-5">
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-base">🤖</span>
                  <h2 className="text-sm font-semibold text-[#1F2937]">AI 每日摘要</h2>
                  <span className="rounded-full bg-indigo-100 px-2 py-0.5 text-[10px] font-medium text-indigo-600">
                    {digest?.article_count ?? 0} 篇
                  </span>
                </div>
                <div className="text-sm leading-relaxed text-[#374151] whitespace-pre-wrap">{digestContent}</div>
              </div>
            )}

            {/* Articles Grid */}
            {articles.length > 0 ? (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {articles.map(article => {
                  // Try to parse translation from summary
                  let explanation = article.summary || '';
                  let impact = '';
                  let tags: string[] = [];
                  try {
                    const parsed = JSON.parse(article.summary || '');
                    if (parsed && typeof parsed === 'object') {
                      explanation = parsed.summary || parsed.explanation || '';
                      impact = parsed.impact || '';
                      tags = parsed.tags || [];
                    }
                  } catch { /* plain text */ }

                  return (
                    <div key={article.id} className="group flex flex-col rounded-xl border border-[#E5E7EB] bg-white transition hover:border-indigo-200 hover:shadow-sm">
                      <div className="flex flex-1 flex-col p-4">
                        <h3 className="text-sm font-medium leading-snug text-[#1F2937] group-hover:text-indigo-600 transition line-clamp-2">
                          {article.url ? (
                            <a href={article.url} target="_blank" rel="noopener noreferrer">{article.title}</a>
                          ) : article.title}
                        </h3>
                        <div className="mt-1.5 flex flex-wrap items-center gap-1.5 text-[11px] text-[#9CA3AF]">
                          <span className="rounded bg-[#F3F4F6] px-1.5 py-0.5">{article.source}</span>
                          {article.published_at && <span>{timeAgo(article.published_at)}</span>}
                        </div>
                        {tags.length > 0 && (
                          <div className="mt-2 flex flex-wrap gap-1">
                            {tags.slice(0, 4).map(tag => (
                              <span key={tag} className="rounded-full bg-indigo-50 px-2 py-0.5 text-[10px] font-medium text-indigo-600">{tag}</span>
                            ))}
                          </div>
                        )}
                        {explanation && (
                          <p className="mt-2 text-xs leading-relaxed text-[#6B7280] line-clamp-3">{explanation}</p>
                        )}
                        {impact && (
                          <div className="mt-2 rounded-lg bg-amber-50/60 p-2">
                            <p className="text-[10px] font-medium text-amber-700">对 PM 的意义</p>
                            <p className="mt-0.5 text-xs text-[#374151] line-clamp-2">{impact}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-20 text-sm text-[#9CA3AF]">
                <p>暂无新闻数据</p>
                <button onClick={handleRefresh} className="mt-2 text-xs text-[#4F46E5] hover:underline">点击刷新</button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}