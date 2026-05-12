'use client';

import { useState, useEffect, useCallback, memo } from 'react';
import Link from 'next/link';
import { useToast } from '@/components/ui/toast';
import { CardSkeleton } from '@/components/ui/skeleton';
import PageShell from '@/components/layout/PageShell';
import GradientBackground from '@/components/ui/gradient-background';

interface CommunityQuestion {
  id: string; text: string; type_name: string | null; created_at: string;
  upvotes: number; downvotes: number; user_vote: 1 | -1 | null;
}
interface QuestionType { id: string; name: string; }

const QuestionCard = memo(function QuestionCard({ q, onVote }: { q: CommunityQuestion; onVote: (id: string, vote: 1 | -1) => void }) {
  return (
    <div className="group flex items-start gap-4 rounded-lg border border-border bg-card p-4 transition-shadow hover:shadow-sm">
      <div className="flex flex-col items-center gap-0.5 pt-0.5">
        <button onClick={() => onVote(q.id, 1)}
          className={`rounded p-0.5 transition-all active:scale-125 ${q.user_vote === 1 ? 'text-purple-500' : 'text-muted-foreground/30 hover:text-purple-400'}`}>
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M5 15l7-7 7 7" /></svg>
        </button>
        <span className="text-xs font-semibold tabular-nums text-muted-foreground">{q.upvotes - q.downvotes}</span>
        <button onClick={() => onVote(q.id, -1)}
          className={`rounded p-0.5 transition-all active:scale-125 ${q.user_vote === -1 ? 'text-rose-500' : 'text-muted-foreground/30 hover:text-rose-400'}`}>
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" /></svg>
        </button>
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-[15px] leading-relaxed text-foreground">{q.text}</p>
        <div className="mt-2 flex items-center gap-2">
          {q.type_name && <span className="rounded-md bg-accent px-2 py-0.5 text-[11px] font-medium text-accent-foreground">{q.type_name}</span>}
          <span className="text-[11px] text-muted-foreground">{new Date(q.created_at).toLocaleDateString('zh-CN')}</span>
        </div>
      </div>
      <Link href={`/interview/qa?q=${encodeURIComponent(q.text)}`}
        className="shrink-0 rounded-lg border border-border bg-background px-3 py-1.5 text-xs font-medium text-muted-foreground opacity-0 transition-all hover:border-purple-300 hover:text-purple-600 group-hover:opacity-100">
        去分析
      </Link>
    </div>
  );
});

export default function CommunityPage() {
  const [questions, setQuestions] = useState<CommunityQuestion[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [sort, setSort] = useState<'latest' | 'trending'>('latest');
  const [types, setTypes] = useState<QuestionType[]>([]);
  const [typeFilter, setTypeFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const [showSubmit, setShowSubmit] = useState(false);
  const [newText, setNewText] = useState('');
  const [newTypeId, setNewTypeId] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [fetching, setFetching] = useState(false);
  const toast = useToast();
  const pageSize = 20;

  useEffect(() => {
    fetch('/api/interview/question-types').then(r => r.ok ? r.json() : null).then(d => {
      if (d?.types) setTypes(d.types);
    }).catch(() => {});
  }, []);

  const fetchQuestions = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page), page_size: String(pageSize), sort });
      if (typeFilter) params.set('type_id', typeFilter);
      const res = await fetch(`/api/interview/community/questions?${params}`);
      if (!res.ok) throw new Error();
      const json = await res.json();
      setQuestions(json.data);
      setTotal(json.total);
    } catch { toast.error('加载失败'); }
    finally { setLoading(false); }
  }, [page, sort, typeFilter]);

  useEffect(() => { fetchQuestions(); }, [fetchQuestions]);

  const handleVote = useCallback(async (questionId: string, vote: 1 | -1) => {
    setQuestions(prev => prev.map(q => {
      if (q.id !== questionId) return q;
      const prevVote = q.user_vote;
      let { upvotes, downvotes, user_vote } = q;
      if (prevVote === 1) upvotes--;
      if (prevVote === -1) downvotes--;
      if (prevVote === vote) { user_vote = null; }
      else { user_vote = vote; if (vote === 1) upvotes++; else downvotes++; }
      return { ...q, upvotes, downvotes, user_vote };
    }));
    try { await fetch('/api/interview/community/votes', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ question_id: questionId, vote }) }); }
    catch { fetchQuestions(); }
  }, [fetchQuestions]);

  async function handleSubmit() {
    if (!newText.trim() || newText.trim().length < 5) { toast.error('问题至少需要 5 个字符'); return; }
    setSubmitting(true);
    try {
      const res = await fetch('/api/interview/community/questions', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ text: newText.trim(), type_id: newTypeId || undefined }) });
      if (res.ok) { setNewText(''); setNewTypeId(''); setShowSubmit(false); toast.success('提交成功'); fetchQuestions(); }
      else { const d = await res.json(); toast.error(d.error || '提交失败'); }
    } catch { toast.error('提交失败'); }
    finally { setSubmitting(false); }
  }

  async function handleFetchFromAI() {
    setFetching(true);
    try {
      const res = await fetch('/api/interview/community/fetch', { method: 'POST' });
      const d = await res.json();
      if (res.ok) { toast.success(`已添加 ${d.added} 道新题`); fetchQuestions(); }
      else toast.error(d.error || '扫描失败');
    } catch { toast.error('扫描失败'); }
    finally { setFetching(false); }
  }

  const totalPages = Math.ceil(total / pageSize);

  return (
    <>
      <GradientBackground />
      <PageShell
      title="题库社区"
      description="分享面试题，投票发现好题目"
      icon="🌐"
      stats={[
        { label: '总题目', value: total },
        { label: '今日新增', value: '+' },
      ]}
      actions={
        <div className="flex items-center gap-2">
          <button onClick={handleFetchFromAI} disabled={fetching}
            className="rounded-lg border border-border bg-background px-3 py-2 text-sm font-medium text-muted-foreground transition-all hover:border-purple-300 hover:text-purple-600 disabled:opacity-50">
            {fetching ? '扫描中...' : '扫描题库'}
          </button>
          <button onClick={() => setShowSubmit(!showSubmit)}
            className="rounded-lg bg-foreground px-3 py-2 text-sm font-medium text-background transition-all hover:opacity-90 active:scale-[0.98]">
            {showSubmit ? '取消' : '提交题目'}
          </button>
        </div>
      }
    >
      {/* Submit form */}
      {showSubmit && (
        <div className="mb-4 rounded-xl border-2 border-purple-200 bg-purple-50/30 p-4 dark:border-purple-800 dark:bg-purple-950/10">
          <textarea className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm resize-none focus:outline-none focus:border-purple-400" rows={3} placeholder="输入面试题目（至少 5 个字符）..." value={newText} onChange={(e) => setNewText(e.target.value)} />
          <div className="mt-3 flex items-center gap-3">
            <select className="rounded-lg border border-border bg-background px-3 py-2 text-sm" value={newTypeId} onChange={(e) => setNewTypeId(e.target.value)}>
              <option value="">选择类型（可选）</option>
              {types.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
            </select>
            <button onClick={handleSubmit} disabled={submitting} className="rounded-lg bg-foreground px-4 py-2 text-sm font-medium text-background disabled:opacity-50 hover:opacity-90">{submitting ? '提交中...' : '提交'}</button>
          </div>
        </div>
      )}

      {/* Sort + filter */}
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <div className="flex rounded-lg bg-muted p-0.5">
          <button onClick={() => { setSort('latest'); setPage(1); }}
            className={`rounded-md px-3 py-1.5 text-xs font-medium transition-all ${sort === 'latest' ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground'}`}>最新</button>
          <button onClick={() => { setSort('trending'); setPage(1); }}
            className={`rounded-md px-3 py-1.5 text-xs font-medium transition-all ${sort === 'trending' ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground'}`}>热门</button>
        </div>
        <select className="rounded-lg border border-border bg-background px-3 py-1.5 text-xs text-muted-foreground" value={typeFilter} onChange={(e) => { setTypeFilter(e.target.value); setPage(1); }}>
          <option value="">全部类型</option>
          {types.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
        </select>
      </div>

      {/* List */}
      {loading ? (
        <div className="space-y-2">
          {Array.from({ length: 5 }).map((_, i) => <CardSkeleton key={i} />)}
        </div>
      ) : questions.length === 0 ? (
        <div className="flex flex-1 items-center justify-center py-16">
          <div className="text-center">
            <p className="text-3xl mb-2">🌐</p>
            <p className="text-sm text-muted-foreground">暂无社区题目</p>
            <button onClick={() => setShowSubmit(true)} className="mt-2 text-sm font-medium text-purple-600 hover:underline">提交第一道题 →</button>
          </div>
        </div>
      ) : (
        <div className="space-y-1.5">
          {questions.map((q) => <QuestionCard key={q.id} q={q} onVote={handleVote} />)}
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
