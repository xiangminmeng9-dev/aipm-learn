'use client';

import { useState } from 'react';

interface Article {
  id: string;
  title: string;
  link: string;
  source: string;
  publishedAt: string | null;
  summary: string | null;
  plainExplanation: string | null;
  impact: string | null;
  tags: string[];
  category: string;
}

export default function ArticleCard({ article }: { article: Article }) {
  const [expanded, setExpanded] = useState(false);

  const timeAgo = (date: string) => {
    const diff = Date.now() - new Date(date).getTime();
    const hours = Math.floor(diff / 3600000);
    if (hours < 1) return '刚刚';
    if (hours < 24) return `${hours}小时前`;
    const days = Math.floor(hours / 24);
    if (days < 30) return `${days}天前`;
    return new Date(date).toLocaleDateString('zh-CN');
  };

  return (
    <div className="group flex flex-col rounded-xl border border-border bg-card transition hover:border-indigo-200 hover:shadow-sm">
      <div className="flex flex-1 flex-col p-4">
        {/* Header */}
        <div className="flex items-start justify-between gap-2">
          <h3 className="flex-1 text-sm font-medium leading-snug text-foreground group-hover:text-indigo-600 transition line-clamp-2">
            {article.link ? (
              <a href={article.link} target="_blank" rel="noopener noreferrer">{article.title}</a>
            ) : article.title}
          </h3>
          {article.link && (
            <a href={article.link} target="_blank" rel="noopener noreferrer" className="shrink-0 rounded p-1 text-muted-foreground hover:text-indigo-600 transition">
              <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 6H5.25A2.25 2.25 0 0 0 3 8.25v10.5A2.25 2.25 0 0 0 5.25 21h10.5A2.25 2.25 0 0 0 18 18.75V10.5m-4.5-6H18m0 0v4.5m0-4.5L10.5 13.5" />
              </svg>
            </a>
          )}
        </div>

        {/* Meta */}
        <div className="mt-1.5 flex flex-wrap items-center gap-1.5 text-[11px] text-muted-foreground">
          <span className="rounded bg-secondary px-1.5 py-0.5">{article.source}</span>
          {article.publishedAt && <span>{timeAgo(article.publishedAt)}</span>}
        </div>

        {/* Tags */}
        {article.tags.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-1">
            {article.tags.slice(0, 4).map(tag => (
              <span key={tag} className="rounded-full bg-indigo-50 px-2 py-0.5 text-[10px] font-medium text-indigo-600">{tag}</span>
            ))}
          </div>
        )}

        {/* Summary */}
        {article.plainExplanation && (
          <p className="mt-2 text-xs leading-relaxed text-muted-foreground line-clamp-3">{article.plainExplanation}</p>
        )}

        {/* Impact */}
        {article.impact && expanded && (
          <div className="mt-3 rounded-lg bg-amber-50/60 p-2.5">
            <p className="text-[10px] font-medium text-amber-700">对产品经理意味着什么</p>
            <p className="mt-0.5 text-xs text-foreground">{article.impact}</p>
          </div>
        )}

        {/* Expand */}
        <button onClick={() => setExpanded(!expanded)} className="mt-2 text-[11px] font-medium text-indigo-600 hover:text-indigo-700 transition self-start">
          {expanded ? '收起' : '展开详情'}
        </button>
      </div>
    </div>
  );
}