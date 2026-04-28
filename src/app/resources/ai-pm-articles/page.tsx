'use client';

import { useState, useEffect, useCallback } from 'react';

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

export default function AiPmArticlesPage() {
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState('');

  const fetchArticles = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/rss/articles?category=ai_pm');
      if (res.ok) {
        const data = await res.json();
        setArticles(data.articles || []);
      }
    } catch { /* ignore */ }
    setLoading(false);
  }, []);

  useEffect(() => { fetchArticles(); }, [fetchArticles]);

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await fetch('/api/rss/refresh?category=ai_pm', { method: 'POST' });
      await fetchArticles();
    } catch { /* ignore */ }
    setRefreshing(false);
  };

  const filtered = search
    ? articles.filter(a => a.title.toLowerCase().includes(search.toLowerCase()) || (a.plainExplanation || '').toLowerCase().includes(search.toLowerCase()) || a.tags.some(t => t.toLowerCase().includes(search.toLowerCase())))
    : articles;

  return (
    <div className="flex h-full flex-col bg-background">
      {/* Header */}
      <div className="shrink-0 border-b border-border bg-card px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-lg font-semibold text-foreground">AI PM 文章</h1>
            <p className="text-xs text-muted-foreground">AI 产品经理必读文章与深度分析</p>
          </div>
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="rounded-lg bg-[#4F46E5] px-4 py-2 text-xs font-medium text-white hover:bg-[#4338CA] disabled:opacity-50 transition"
          >
            {refreshing ? '采集中...' : '采集最新'}
          </button>
        </div>
        <div className="mt-3">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="搜索 PM 文章..."
            className="w-full rounded-lg border border-border bg-muted px-3 py-2 text-xs text-foreground placeholder-[#9CA3AF] focus:border-[#4F46E5] focus:outline-none focus:ring-1 focus:ring-[#4F46E5]/20"
          />
        </div>
      </div>

      {/* Grid */}
      <div className="flex-1 overflow-y-auto p-6">
        {loading ? (
          <div className="flex items-center justify-center py-20 text-sm text-muted-foreground">加载中...</div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-sm text-muted-foreground">
            <p>暂无文章</p>
            <button onClick={handleRefresh} className="mt-2 text-xs text-primary hover:underline">点击采集</button>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {filtered.map(article => (
              <ArticleCard key={article.id} article={article} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function ArticleCard({ article }: { article: Article }) {
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
        <div className="mt-1.5 flex flex-wrap items-center gap-1.5 text-[11px] text-muted-foreground">
          <span className="rounded bg-secondary px-1.5 py-0.5">{article.source}</span>
          {article.publishedAt && <span>{timeAgo(article.publishedAt)}</span>}
        </div>
        {article.tags.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-1">
            {article.tags.slice(0, 4).map(tag => (
              <span key={tag} className="rounded-full bg-indigo-50 px-2 py-0.5 text-[10px] font-medium text-indigo-600">{tag}</span>
            ))}
          </div>
        )}
        {article.plainExplanation && (
          <p className="mt-2 text-xs leading-relaxed text-muted-foreground line-clamp-3">{article.plainExplanation}</p>
        )}
        {article.impact && expanded && (
          <div className="mt-3 rounded-lg bg-amber-50/60 p-2.5">
            <p className="text-[10px] font-medium text-amber-700">对产品经理意味着什么</p>
            <p className="mt-0.5 text-xs text-foreground">{article.impact}</p>
          </div>
        )}
        <button onClick={() => setExpanded(!expanded)} className="mt-2 text-[11px] font-medium text-indigo-600 hover:text-indigo-700 transition self-start">
          {expanded ? '收起' : '展开详情'}
        </button>
      </div>
    </div>
  );
}
