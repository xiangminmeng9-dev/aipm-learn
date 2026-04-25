'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';

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
  const [isUpgrading, setIsUpgrading] = useState(false);

  const fetchData = useCallback(async (poll = false) => {
    try {
      const res = await fetch('/api/daily-challenge/tech');
      if (res.ok) {
        const data = await res.json();
        const newTech = data.tech;
        if (poll && today && newTech?.title === today.title) return;
        setToday(newTech);
        setIsUpgrading(data.source === 'default');
        setHistory(data.history || []);
        setBookmarks(data.bookmarks || []);
        if (!selectedTech || !poll) setSelectedTech(newTech);
      }
    } catch { /* ignore */ } finally {
      if (!poll) setIsLoading(false);
    }
  }, [today, selectedTech]);

  useEffect(() => { fetchData(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!isUpgrading) return;
    const interval = setInterval(() => fetchData(true), 6000);
    return () => clearInterval(interval);
  }, [isUpgrading, fetchData]);

  const toggleBookmark = async (date: string) => {
    const isBookmarked = bookmarks.includes(date);
    const action = isBookmarked ? 'unbookmark' : 'bookmark';
    try {
      const res = await fetch('/api/daily-challenge/tech', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, tech_date: date }),
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
      <div className="min-h-screen bg-[#F8F9FB] flex items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-indigo-500 border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8F9FB]">
      <header className="sticky top-0 z-40 border-b border-gray-200 bg-white/80 backdrop-blur">
        <div className="flex items-center justify-between px-6 py-3">
          <div className="flex items-center gap-3">
            <Link href="/daily-challenge" className="text-sm text-gray-500 hover:text-gray-900">← 返回</Link>
            <span className="text-gray-300">|</span>
            <h1 className="text-base font-semibold text-gray-900">每日 AI 技术</h1>
          </div>
          {isUpgrading && (
            <div className="flex items-center gap-2 text-xs text-indigo-600">
              <div className="h-3 w-3 animate-spin rounded-full border border-indigo-500 border-t-transparent" />
              AI 正在生成更精准内容...
            </div>
          )}
        </div>
      </header>

      <div className="mx-auto max-w-4xl px-6 py-6">
        {displayTech ? (
          <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <h2 className="text-lg font-bold text-gray-900">{displayTech.title}</h2>
                <p className="mt-1 text-xs text-gray-500">{displayTech.date}</p>
              </div>
              <button
                onClick={() => toggleBookmark(displayTech.date)}
                className={`shrink-0 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
                  bookmarks.includes(displayTech.date)
                    ? 'bg-indigo-100 text-indigo-700'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {bookmarks.includes(displayTech.date) ? '已收藏' : '收藏'}
              </button>
            </div>

            <div className="mt-4 rounded-xl bg-indigo-50 p-4">
              <p className="text-xs font-medium text-indigo-700 mb-1">摘要</p>
              <p className="text-sm text-gray-800">{displayTech.summary}</p>
            </div>

            <div className="mt-4">
              <p className="text-xs font-medium text-gray-700 mb-1">白话解读</p>
              <p className="text-sm text-gray-800 leading-relaxed">{displayTech.explanation}</p>
            </div>

            <div className="mt-4 rounded-xl bg-amber-50 p-4">
              <p className="text-xs font-medium text-amber-700 mb-1">对 AI PM 的影响</p>
              <p className="text-sm text-gray-800">{displayTech.impact}</p>
            </div>

            {displayTech.tags && displayTech.tags.length > 0 && (
              <div className="mt-4 flex flex-wrap gap-2">
                {displayTech.tags.map((tag) => (
                  <span key={tag} className="rounded-full bg-gray-100 px-2.5 py-1 text-xs text-gray-600">
                    {tag}
                  </span>
                ))}
              </div>
            )}
          </div>
        ) : (
          <div className="rounded-2xl border border-gray-200 bg-white p-12 text-center">
            <p className="text-sm text-gray-500">暂无内容</p>
          </div>
        )}

        {/* History */}
        {history.length > 0 && (
          <div className="mt-6">
            <h3 className="text-sm font-semibold text-gray-900 mb-3">历史推送</h3>
            <div className="space-y-2">
              {history.map((item) => (
                <button
                  key={item.date}
                  onClick={() => setSelectedTech(item)}
                  className={`w-full rounded-xl border p-3 text-left transition-colors ${
                    selectedTech?.date === item.date
                      ? 'border-indigo-200 bg-indigo-50'
                      : 'border-gray-100 bg-white hover:bg-gray-50'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-900 line-clamp-1">{item.title}</span>
                    <span className="text-xs text-gray-500 shrink-0 ml-2">{item.date}</span>
                  </div>
                  <p className="mt-1 text-xs text-gray-500 line-clamp-1">{item.summary}</p>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
