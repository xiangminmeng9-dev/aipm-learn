'use client';

import type { DailyAiNewsArticle } from '@/types';
import SourceBadge from './SourceBadge';

interface Props {
  articles: DailyAiNewsArticle[];
}

export default function ArticleList({ articles }: Props) {
  if (articles.length === 0) {
    return (
      <div className="rounded-2xl border border-border bg-card py-12 text-center">
        <p className="text-lg text-muted-foreground">暂无新闻数据</p>
        <p className="mt-1 text-base text-muted-foreground">数据将在首次访问时自动抓取</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {articles.map((article, i) => (
        <div
          key={article.id}
          className="group rounded-xl border border-border bg-card px-4 py-3 transition hover:border-indigo-100 hover:shadow-sm"
          style={{ animationDelay: `${i * 50}ms` }}
        >
          <div className="flex items-start gap-3">
            <SourceBadge source={article.source} />
            <div className="min-w-0 flex-1">
              <div className="text-base font-medium text-foreground">
                {article.url ? (
                  <a href={article.url} target="_blank" rel="noopener noreferrer" className="hover:text-indigo-600 transition">
                    {article.title}
                  </a>
                ) : (
                  article.title
                )}
              </div>
              {article.summary && (
                <p className="mt-1 text-base text-muted-foreground">{article.summary}</p>
              )}
              <div className="mt-1 text-sm text-muted-foreground">
                {article.published_at && new Date(article.published_at).toLocaleString('zh-CN', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
              </div>
            </div>
            {article.url && (
              <a
                href={article.url}
                target="_blank"
                rel="noopener noreferrer"
                className="shrink-0 rounded-lg p-2 text-muted-foreground opacity-0 transition group-hover:opacity-100 hover:bg-indigo-50 hover:text-indigo-600"
              >
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 6H5.25A2.25 2.25 0 0 0 3 8.25v10.5A2.25 2.25 0 0 0 5.25 21h10.5A2.25 2.25 0 0 0 18 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25" />
                </svg>
              </a>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}