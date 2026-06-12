'use client';

import { useState, useEffect, useCallback, memo } from 'react';
import Link from 'next/link';
import { useToast } from '@/components/ui/toast';
import { CardSkeleton } from '@/components/ui/skeleton';
import PageShell from '@/components/layout/PageShell';
import GradientBackground from '@/components/ui/gradient-background';
import { apiFetch } from '@/lib/api/fetch';

interface Bookmark {
  id: string; question_id: string; mastery_level: string; notes: string | null;
  created_at: string; updated_at: string; question_text: string; type_name: string | null;
}

const MASTERY: Record<string, { label: string; color: string }> = {
  mastered: { label: '已掌握', color: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' },
  learning: { label: '学习中', color: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' },
  review: { label: '需复习', color: 'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400' },
};

const BookmarkCard = memo(function BookmarkCard({
  b, onUpdate, onDelete,
}: {
  b: Bookmark;
  onUpdate: (id: string, updates: Record<string, unknown>) => void;
  onDelete: (id: string) => void;
}) {
  return (
    <div className="group rounded-lg border border-border bg-card p-4 transition-shadow hover:shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium text-foreground leading-relaxed">{b.question_text}</p>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            {b.type_name && <span className="rounded-full bg-indigo-50 px-2 py-0.5 text-xs text-indigo-600 dark:bg-indigo-950/30 dark:text-indigo-400">{b.type_name}</span>}
            <span className={`rounded-full px-2 py-0.5 text-xs ${MASTERY[b.mastery_level]?.color}`}>{MASTERY[b.mastery_level]?.label}</span>
          </div>
          <textarea className="mt-3 w-full rounded-lg border border-border bg-muted/30 px-3 py-2 text-xs text-muted-foreground placeholder:text-muted-foreground/50 resize-none focus:border-indigo-300 focus:outline-none"
            rows={2} placeholder="添加笔记..." defaultValue={b.notes || ''}
            onBlur={(e) => { if (e.target.value !== (b.notes || '')) onUpdate(b.id, { notes: e.target.value }); }} />
        </div>
        <div className="flex flex-col items-end gap-2 shrink-0">
          <span className="text-xs text-muted-foreground">{new Date(b.created_at).toLocaleDateString('zh-CN')}</span>
          <div className="flex items-center gap-1">
            <select className="rounded border border-border bg-muted/30 px-2 py-1 text-xs text-muted-foreground focus:outline-none"
              value={b.mastery_level} onChange={(e) => onUpdate(b.id, { mastery_level: e.target.value })}>
              <option value="mastered">已掌握</option>
              <option value="learning">学习中</option>
              <option value="review">需复习</option>
            </select>
            <Link href={`/interview/qa?q=${encodeURIComponent(b.question_text)}`}
              className="rounded bg-indigo-50 px-2 py-1 text-xs font-medium text-indigo-600 hover:bg-indigo-100 dark:bg-indigo-950/30 dark:text-indigo-400 active:scale-95 transition-transform">
              去分析
            </Link>
            <button onClick={() => onDelete(b.id)}
              className="rounded px-2 py-1 text-xs text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30 active:scale-95 transition-all">
              删除
            </button>
          </div>
        </div>
      </div>
    </div>
  );
});

export default function FavoritesPage() {
  const [bookmarks, setBookmarks] = useState<Bookmark[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [masteryFilter, setMasteryFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const toast = useToast();
  const pageSize = 20;

  const fetchBookmarks = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page), page_size: String(pageSize) });
      if (masteryFilter) params.set('mastery_level', masteryFilter);
      const res = await apiFetch(`/api/interview/bookmarks?${params}`);
      if (!res.ok) throw new Error();
      const json = await res.json();
      setBookmarks(json.data);
      setTotal(json.total);
    } catch { toast.error('加载失败'); }
    finally { setLoading(false); }
  }, [page, masteryFilter]);

  useEffect(() => { fetchBookmarks(); }, [fetchBookmarks]);

  const handleDelete = useCallback(async (id: string) => {
    // Optimistic
    setBookmarks(prev => prev.filter(b => b.id !== id));
    setTotal(prev => prev - 1);
    toast.success('已取消收藏');
    try {
      const res = await apiFetch(`/api/interview/bookmarks?id=${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error();
    } catch { fetchBookmarks(); }
  }, [fetchBookmarks]);

  const handleUpdate = useCallback(async (id: string, updates: Record<string, unknown>) => {
    setBookmarks(prev => prev.map(b => b.id === id ? { ...b, ...updates } : b));
    try {
      await apiFetch('/api/interview/bookmarks', {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, ...updates }),
      });
    } catch { fetchBookmarks(); }
  }, [fetchBookmarks]);

  const totalPages = Math.ceil(total / pageSize);

  return (
    <>
      <GradientBackground />
      <PageShell title="面试收藏" description="收藏的题目，标注掌握程度针对性复习" icon="⭐" stats={[{ label: '总收藏', value: total }]}>
      <div className="mb-4 flex flex-wrap items-center gap-2">
        {[{ value: '', label: '全部' }, { value: 'mastered', label: '已掌握' }, { value: 'learning', label: '学习中' }, { value: 'review', label: '需复习' }].map((t) => (
          <button key={t.value} onClick={() => { setMasteryFilter(t.value); setPage(1); }}
            className={`rounded-full px-4 py-1.5 text-xs font-medium transition-all active:scale-95 ${masteryFilter === t.value ? 'bg-indigo-600 text-white' : 'bg-muted text-muted-foreground hover:bg-muted/80'}`}>
            {t.label}
          </button>
        ))}
        <span className="ml-auto text-xs text-muted-foreground">共 {total} 道</span>
      </div>

      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => <CardSkeleton key={i} />)}
        </div>
      ) : bookmarks.length === 0 ? (
        <div className="flex flex-1 items-center justify-center">
          <div className="text-center">
            <p className="text-3xl mb-2">⭐</p>
            <p className="text-sm text-muted-foreground">还没有收藏面试题</p>
            <Link href="/interview/qa" className="mt-2 inline-block text-sm font-medium text-indigo-600 hover:underline">去问答页面发现题目 →</Link>
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          {bookmarks.map((b) => <BookmarkCard key={b.id} b={b} onUpdate={handleUpdate} onDelete={handleDelete} />)}
        </div>
      )}

      {totalPages > 1 && (
        <div className="mt-6 flex items-center justify-center gap-3">
          <button disabled={page <= 1} onClick={() => setPage(p => p - 1)} className="rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-muted-foreground disabled:opacity-30 hover:bg-muted">上一页</button>
          <span className="text-xs tabular-nums text-muted-foreground">{page} / {totalPages}</span>
          <button disabled={page >= totalPages} onClick={() => setPage(p => p + 1)} className="rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-muted-foreground disabled:opacity-30 hover:bg-muted">下一页</button>
        </div>
      )}
    </PageShell>
    </>
  );
}
