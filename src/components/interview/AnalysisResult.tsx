'use client';

import { useState, useEffect, useCallback } from 'react';
import Markdown from '@/components/ui/markdown';
import type { AnalysisResult } from '@/types';

interface AnalysisResultProps {
  result: AnalysisResult;
  questionText?: string;
}

const sectionLabels: {
  key: keyof Pick<
    AnalysisResult,
    'analysis' | 'thinking_framework' | 'answer_approach' | 'answer_template'
  >;
  label: string;
  icon: string;
}[] = [
  { key: 'analysis', label: '问题分析', icon: '🔍' },
  { key: 'thinking_framework', label: '思考方式', icon: '🧠' },
  { key: 'answer_approach', label: '回答思路', icon: '💡' },
  { key: 'answer_template', label: '口语化模板', icon: '🗣️' },
];

export default function AnalysisResult({ result, questionText }: AnalysisResultProps) {
  const [expandedSections, setExpandedSections] = useState<Set<string>>(
    new Set(['analysis', 'thinking_framework', 'answer_approach', 'answer_template'])
  );
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [bookmarkId, setBookmarkId] = useState<string | null>(null);
  const [bookmarkLoading, setBookmarkLoading] = useState(false);

  useEffect(() => {
    if (!result.question_id) return;
    fetch(`/api/interview/bookmarks?question_id=${result.question_id}`)
      .then(r => r.json())
      .then(data => {
        if (data.bookmark) {
          setIsBookmarked(true);
          setBookmarkId(data.bookmark.id);
        } else {
          setIsBookmarked(false);
          setBookmarkId(null);
        }
      })
      .catch(() => {});
  }, [result.question_id]);

  const toggleSection = (key: string) => {
    setExpandedSections((prev) => {
      const next = new Set(prev);
      if (next.has(key)) {
        next.delete(key);
      } else {
        next.add(key);
      }
      return next;
    });
  };

  const handleBookmark = useCallback(async () => {
    if (bookmarkLoading) return;
    setBookmarkLoading(true);
    try {
      if (isBookmarked && bookmarkId) {
        const res = await fetch(`/api/interview/bookmarks?id=${bookmarkId}`, { method: 'DELETE' });
        if (res.ok) {
          setIsBookmarked(false);
          setBookmarkId(null);
        }
      } else {
        const res = await fetch('/api/interview/bookmarks', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ question_id: result.question_id, mastery_level: 'learning' }),
        });
        const data = await res.json();
        if (res.ok || data.already_exists) {
          setIsBookmarked(true);
          setBookmarkId(data.bookmark?.id || bookmarkId);
        }
      }
    } catch { /* ignore */ }
    finally { setBookmarkLoading(false); }
  }, [isBookmarked, bookmarkId, bookmarkLoading, result.question_id]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h3 className="text-lg font-semibold text-foreground">分析结果</h3>
          <span className="rounded-full bg-amber-50 px-2.5 py-0.5 text-xs font-medium text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">
            {result.type.name}
            {result.type.is_new && ' (新类型)'}
          </span>
        </div>
        <button
          onClick={handleBookmark}
          disabled={bookmarkLoading || !result.question_id}
          className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-all active:scale-95 ${
            isBookmarked
              ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300'
              : 'bg-secondary text-muted-foreground hover:bg-muted hover:text-foreground'
          } disabled:opacity-40`}
        >
          <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill={isBookmarked ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.082 20.43a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z" />
          </svg>
          {isBookmarked ? '已收藏' : '收藏'}
        </button>
      </div>

      <div className="space-y-2">
        {sectionLabels.map(({ key, label, icon }) => {
          const isExpanded = expandedSections.has(key);
          const content = result[key];
          return (
            <div key={key} className="rounded-xl border border-border bg-card overflow-hidden">
              <button
                onClick={() => toggleSection(key)}
                className="flex w-full items-center justify-between px-5 py-3.5 text-left hover:bg-muted transition-colors"
              >
                <span className="flex items-center gap-2 text-foreground">
                  <span>{icon}</span>
                  <span className="font-medium">{label}</span>
                </span>
                <span className="text-muted-foreground">{isExpanded ? '▲' : '▼'}</span>
              </button>
              {isExpanded && content && (
                <div className="border-t border-border px-5 py-4">
                  <Markdown content={content} />
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
