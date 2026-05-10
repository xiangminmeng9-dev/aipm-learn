'use client';

import { useState, useEffect } from 'react';

interface Tip {
  id: string;
  title: string;
  content: string;
  category: string;
  tags: string[];
}

const CATEGORIES = ['回答框架', '反问技巧', '薪资谈判', '行为面试', '技术面试', '自我介绍', '项目讲述', '压力应对'];

const CATEGORY_ICONS: Record<string, string> = {
  '回答框架': '🧱', '反问技巧': '💬', '薪资谈判': '💰', '行为面试': '🎭',
  '技术面试': '⚙️', '自我介绍': '🎤', '项目讲述': '📊', '压力应对': '🧘',
};

export default function TipsPage() {
  const [tips, setTips] = useState<Tip[]>([]);
  const [categories, setCategories] = useState<Record<string, Tip[]>>({});
  const [activeCategory, setActiveCategory] = useState<string>('');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/interview/tips')
      .then((r) => r.ok ? r.json() : null)
      .then((d) => {
        if (d) { setTips(d.tips); setCategories(d.categories); }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const displayTips = activeCategory ? (categories[activeCategory] || []) : tips;

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center p-6">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-indigo-500 border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col overflow-y-auto p-6">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-foreground">面试技巧库</h2>
        <p className="mt-1 text-sm text-muted-foreground">结构化面试方法论，覆盖从准备到谈判的全流程</p>
      </div>

      {/* Category tabs */}
      <div className="mb-6 flex flex-wrap gap-2">
        <button
          onClick={() => { setActiveCategory(''); setExpandedId(null); }}
          className={`rounded-full px-4 py-1.5 text-xs font-medium transition-colors ${
            !activeCategory ? 'bg-indigo-600 text-white' : 'bg-muted text-muted-foreground hover:bg-muted/80'
          }`}
        >
          全部
        </button>
        {CATEGORIES.map((cat) => {
          const count = categories[cat]?.length || 0;
          return (
            <button
              key={cat}
              onClick={() => { setActiveCategory(activeCategory === cat ? '' : cat); setExpandedId(null); }}
              className={`rounded-full px-4 py-1.5 text-xs font-medium transition-colors ${
                activeCategory === cat ? 'bg-indigo-600 text-white' : 'bg-muted text-muted-foreground hover:bg-muted/80'
              }`}
            >
              {CATEGORY_ICONS[cat]} {cat} ({count})
            </button>
          );
        })}
      </div>

      {/* Tip cards */}
      {displayTips.length === 0 ? (
        <div className="flex flex-1 items-center justify-center">
          <p className="text-sm text-muted-foreground">该分类暂无内容</p>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {displayTips.map((tip) => {
            const isExpanded = expandedId === tip.id;
            return (
              <div
                key={tip.id}
                className={`rounded-xl border border-border bg-card transition-all ${
                  isExpanded ? 'ring-2 ring-indigo-200 dark:ring-indigo-800' : 'hover:shadow-sm'
                }`}
              >
                <button
                  onClick={() => setExpandedId(isExpanded ? null : tip.id)}
                  className="w-full p-4 text-left"
                >
                  <div className="flex items-start justify-between gap-3">
                    <h3 className="text-sm font-semibold text-foreground">{tip.title}</h3>
                    <span className="rounded-full bg-indigo-50 px-2 py-0.5 text-[10px] text-indigo-600 dark:bg-indigo-950/30 dark:text-indigo-400 shrink-0">
                      {tip.category}
                    </span>
                  </div>
                  <div className="mt-2 flex flex-wrap gap-1">
                    {tip.tags.map((t) => (
                      <span key={t} className="rounded bg-muted px-1.5 py-0.5 text-[10px] text-muted-foreground">{t}</span>
                    ))}
                  </div>
                </button>
                {isExpanded && (
                  <div className="border-t border-border px-4 pb-4">
                    <div className="prose prose-sm mt-3 max-w-none text-sm text-muted-foreground dark:prose-invert [&_h2]:text-base [&_h2]:font-semibold [&_h2]:text-foreground [&_h3]:text-sm [&_blockquote]:border-l-indigo-400 [&_blockquote]:text-muted-foreground [&_ul]:text-muted-foreground [&_ol]:text-muted-foreground [&_strong]:text-foreground [&_li]:my-1"
                      dangerouslySetInnerHTML={{ __html: tip.content.replace(/\n/g, '<br/>') }}
                    />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
