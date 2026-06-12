'use client';

import { useState, useEffect } from 'react';
import GradientBackground from '@/components/ui/gradient-background';
import { apiFetch } from '@/lib/api/fetch';

interface WrongQuestion {
  submission_id: string;
  challenge_id: string;
  question: string;
  category: string;
  difficulty: string;
  score: number;
  answer: string;
  perfect_answer: string;
  feedback: string;
  created_at: string;
}

const DIFF_LABELS: Record<string, { label: string; color: string }> = {
  easy: { label: '简单', color: 'text-emerald-600' },
  medium: { label: '中等', color: 'text-amber-600' },
  hard: { label: '困难', color: 'text-rose-600' },
};

export default function WrongQuestionsPage() {
  const [wrongQuestions, setWrongQuestions] = useState<WrongQuestion[]>([]);
  const [byCategory, setByCategory] = useState<Record<string, WrongQuestion[]>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [redoingId, setRedoingId] = useState<string | null>(null);
  const [redoAnswer, setRedoAnswer] = useState('');
  const [redoResult, setRedoResult] = useState<{ score: number; feedback: string } | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    apiFetch('/api/daily-challenge/wrong')
      .then((r) => r.ok ? r.json() : null)
      .then((data) => {
        if (data) {
          setWrongQuestions(data.wrong || []);
          setByCategory(data.byCategory || {});
        }
      })
      .catch(() => {})
      .finally(() => setIsLoading(false));
  }, []);

  const handleRedo = async (challengeId: string) => {
    if (!redoAnswer.trim() || isSubmitting) return;
    setIsSubmitting(true);
    try {
      const res = await apiFetch('/api/daily-challenge/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ challenge_id: challengeId, answer: redoAnswer.trim() }),
      });
      if (res.ok) {
        const data = await res.json();
        setRedoResult({ score: data.evaluation?.total_score || 0, feedback: data.evaluation?.improvement || '' });
      }
    } catch { /* ignore */ } finally { setIsSubmitting(false); }
  };

  const categories = Object.keys(byCategory);

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-rose-500 border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="px-6 py-8">
      <GradientBackground />
      <div className="relative z-10 mb-6">
        <h1 className="text-lg font-bold text-foreground">错题本</h1>
        <p className="mt-1 text-sm text-muted-foreground">得分低于 60 的题目，按类别自动分类，支持重做</p>
      </div>

      {wrongQuestions.length === 0 ? (
        <div className="rounded-2xl border border-border bg-card p-12 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-50">
            <svg className="h-8 w-8 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h3 className="text-sm font-medium text-foreground">暂无错题</h3>
          <p className="mt-1 text-xs text-muted-foreground">继续保持，争取每次都拿高分！</p>
        </div>
      ) : (
        <div className="space-y-6">
          {categories.map((cat) => (
            <div key={cat} className="rounded-2xl border border-border bg-card p-5">
              <div className="mb-4 flex items-center gap-2">
                <span className="rounded-lg bg-rose-100 px-2.5 py-1 text-xs font-medium text-rose-700">{cat}</span>
                <span className="text-xs text-muted-foreground">{byCategory[cat].length} 题</span>
              </div>
              <div className="space-y-3">
                {byCategory[cat].map((q) => {
                  const diff = DIFF_LABELS[q.difficulty] || DIFF_LABELS.medium;
                  const isRedoing = redoingId === q.submission_id;

                  return (
                    <div key={q.submission_id} className="rounded-xl border border-border bg-muted p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className={`text-xs font-medium ${diff.color}`}>{diff.label}</span>
                            <span className="text-xs text-rose-500 font-medium">{q.score} 分</span>
                            <span className="text-xs text-muted-foreground">{new Date(q.created_at).toLocaleDateString('zh-CN')}</span>
                          </div>
                          <p className="text-sm font-medium text-foreground">{q.question}</p>
                        </div>
                        {!isRedoing && !redoResult && (
                          <button
                            onClick={() => { setRedoingId(q.submission_id); setRedoAnswer(''); setRedoResult(null); }}
                            className="shrink-0 rounded-lg bg-indigo-50 px-3 py-1.5 text-xs font-medium text-indigo-600 hover:bg-indigo-100"
                          >
                            重做
                          </button>
                        )}
                      </div>

                      {isRedoing && !redoResult && (
                        <div className="mt-3 space-y-2">
                          <div className="rounded-lg bg-rose-50/50 p-2 text-xs text-rose-600">
                            <span className="font-medium">上次回答：</span>{q.answer.slice(0, 200)}{q.answer.length > 200 ? '...' : ''}
                          </div>
                          <textarea
                            value={redoAnswer}
                            onChange={(e) => setRedoAnswer(e.target.value)}
                            placeholder="重新作答..."
                            rows={4}
                            className="w-full rounded-xl border border-border bg-card px-4 py-3 text-sm text-foreground placeholder-muted-foreground focus:border-indigo-500 focus:outline-none"
                          />
                          <div className="flex gap-2">
                            <button
                              onClick={() => { setRedoingId(null); setRedoAnswer(''); }}
                              className="rounded-lg border border-border px-3 py-1.5 text-xs text-muted-foreground hover:bg-muted"
                            >
                              取消
                            </button>
                            <button
                              onClick={() => handleRedo(q.challenge_id)}
                              disabled={isSubmitting || !redoAnswer.trim()}
                              className="rounded-lg bg-indigo-600 px-4 py-1.5 text-xs font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
                            >
                              {isSubmitting ? '评分中...' : '提交重做'}
                            </button>
                          </div>
                        </div>
                      )}

                      {redoResult && isRedoing && (
                        <div className={`mt-3 rounded-xl border p-3 ${redoResult.score >= 60 ? 'border-emerald-200 bg-emerald-50' : 'border-rose-200 bg-rose-50'}`}>
                          <div className="flex items-center gap-2">
                            <span className="text-lg font-bold">{redoResult.score}</span>
                            <span className="text-xs text-muted-foreground">/ 100 分</span>
                            <span className={`text-xs font-medium ${redoResult.score >= 60 ? 'text-emerald-600' : 'text-rose-600'}`}>
                              {redoResult.score >= 60 ? '进步了！' : '继续加油'}
                            </span>
                          </div>
                          {redoResult.feedback && <p className="mt-1 text-xs text-muted-foreground">{redoResult.feedback}</p>}
                          <button
                            onClick={() => { setRedoingId(null); setRedoResult(null); setRedoAnswer(''); }}
                            className="mt-2 text-xs text-indigo-600 hover:text-indigo-700"
                          >
                            关闭
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
