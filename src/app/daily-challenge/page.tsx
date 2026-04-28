'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import Link from 'next/link';
import { cacheGet, cacheSet, TTL } from '@/lib/cache';

export default function DailyChallengePage() {
  const [challenge, setChallenge] = useState<{ id: string; question: string; category: string; difficulty: string; hint: string; perfect_answer: string } | null>(null);
  const [submission, setSubmission] = useState<{ score: number; feedback: string } | null>(null);
  const [answer, setAnswer] = useState('');
  const [streak, setStreak] = useState(0);
  const [history, setHistory] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [evaluation, setEvaluation] = useState<{ total_score: number; overall_comment: string; improvement: string; scores: { dimension: string; score: number; comment: string }[] } | null>(null);
  const [isUpgrading, setIsUpgrading] = useState(false);
  const [startTime] = useState(Date.now());
  const lastQuestionRef = useRef('');

  const parseFeedback = (fb: unknown) => {
    if (!fb) return;
    try {
      const obj = typeof fb === 'string' ? JSON.parse(fb) : fb;
      if (obj && typeof obj === 'object') setEvaluation(obj);
    } catch { /* ignore */ }
  };

  const fetchData = useCallback(async (poll = false) => {
    // Show cached data first for instant display
    if (!poll) {
      const cached = cacheGet<{ challenge: any; submission: any }>('daily-challenge-today');
      if (cached?.challenge) {
        setChallenge(cached.challenge);
        if (cached.submission) {
          setSubmission(cached.submission);
          try { setEvaluation(JSON.parse(cached.submission.feedback)); } catch { /* ignore */ }
        }
      }
      const cachedStreak = cacheGet<{ streak: number; history: string[] }>('daily-challenge-streak');
      if (cachedStreak) {
        setStreak(cachedStreak.streak);
        setHistory(cachedStreak.history);
      }
    }
    try {
      const [todayRes, streakRes] = await Promise.all([
        fetch('/api/daily-challenge/today'),
        fetch('/api/daily-challenge/streak'),
      ]);
      if (todayRes.ok) {
        const data = await todayRes.json();
        if (poll && data.challenge?.question === lastQuestionRef.current) return;
        lastQuestionRef.current = data.challenge?.question || '';
        setChallenge(data.challenge);
        setIsUpgrading(false);
        if (data.submission) {
          setSubmission(data.submission);
          try { setEvaluation(JSON.parse(data.submission.feedback)); } catch { /* ignore */ }
        }
        cacheSet('daily-challenge-today', { challenge: data.challenge, submission: data.submission }, TTL.DAILY);
      }
      if (streakRes.ok) {
        const data = await streakRes.json();
        setStreak(data.streak);
        setHistory(data.history);
        cacheSet('daily-challenge-streak', { streak: data.streak, history: data.history }, TTL.DAILY);
      }
    } catch { /* ignore */ }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  // Poll for AI-upgraded content
  useEffect(() => {
    if (!isUpgrading) return;
    const interval = setInterval(() => fetchData(true), 5000);
    return () => clearInterval(interval);
  }, [isUpgrading, fetchData]);

  const handleSubmit = async () => {
    if (!challenge?.id || !answer.trim() || isSubmitting) return;
    setIsSubmitting(true);
    try {
      const res = await fetch('/api/daily-challenge/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ challenge_id: challenge.id, answer: answer.trim(), time_spent: Math.round((Date.now() - startTime) / 1000) }),
      });
      if (res.ok) {
        const data = await res.json();
        setEvaluation(data.evaluation);
        setSubmission({ score: data.evaluation?.total_score || 0, feedback: '' });
      } else {
        const errData = await res.json().catch(() => ({}));
        console.error('Submit failed:', res.status, errData);
        alert(`评分失败: ${errData.error || '请稍后重试'}`);
      }
    } catch (err) {
      console.error('Submit error:', err);
      alert('网络错误，请重试');
    } finally { setIsSubmitting(false); }
  };

  const diffColor = challenge?.difficulty === 'easy' ? 'text-emerald-600' : challenge?.difficulty === 'hard' ? 'text-rose-600' : 'text-amber-600';
  const diffLabel = challenge?.difficulty === 'easy' ? '简单' : challenge?.difficulty === 'hard' ? '困难' : '中等';

  return (
    <div className="mx-auto max-w-3xl px-6 py-8">
      {/* Streak banner */}
      <div className="mb-6 flex items-center gap-4">
        <div className="flex items-center gap-2 rounded-xl bg-amber-50 px-4 py-2">
          <span className="text-lg">🔥</span>
          <span className="text-sm font-bold text-amber-700">{streak} 天连续打卡</span>
        </div>
        <Link href="/daily-challenge/flashcards" className="rounded-xl bg-indigo-50 px-4 py-2 text-sm font-medium text-indigo-600 hover:bg-indigo-100">
          🃏 知识闪卡
        </Link>
      </div>

      {!challenge ? (
        <div className="rounded-2xl border border-border bg-card p-12 text-center">
          <div className="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-amber-500 border-t-transparent" />
          <p className="mt-4 text-sm text-muted-foreground">正在加载今日挑战...</p>
        </div>
      ) : (
        <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
          {isUpgrading && (
            <div className="mb-3 flex items-center gap-2 rounded-lg bg-indigo-50 px-3 py-2">
              <div className="h-3 w-3 animate-spin rounded-full border border-indigo-500 border-t-transparent" />
              <span className="text-xs text-indigo-600">AI 正在生成更精准的题目，刷新后可见...</span>
            </div>
          )}
          <div className="mb-4 flex items-center gap-3">
            <span className="rounded-lg bg-amber-100 px-2.5 py-1 text-xs font-medium text-amber-700">{challenge.category}</span>
            <span className={`text-xs font-medium ${diffColor}`}>{diffLabel}</span>
          </div>
          <h2 className="text-lg font-bold text-foreground">{challenge.question}</h2>
          {challenge.hint && (
            <p className="mt-2 text-sm text-muted-foreground">💡 提示：{challenge.hint}</p>
          )}

          {submission ? (
            <div className="mt-6 space-y-4">
              <div className={`rounded-xl border p-4 ${(evaluation?.total_score ?? 0) >= 80 ? 'border-emerald-200 bg-emerald-50' : (evaluation?.total_score ?? 0) >= 60 ? 'border-amber-200 bg-amber-50' : 'border-rose-200 bg-rose-50'}`}>
                <div className="flex items-center gap-3">
                  <span className="text-3xl font-bold">{evaluation?.total_score || 0}</span>
                  <span className="text-sm text-muted-foreground">/ 100 分</span>
                </div>
                {evaluation?.overall_comment && <p className="mt-2 text-sm">{evaluation.overall_comment}</p>}
              </div>
              {evaluation?.scores && evaluation.scores.length > 0 && (
                <div className="space-y-2">
                  {evaluation.scores.map((s, i) => (
                    <div key={i} className="flex items-center gap-3">
                      <span className="w-20 text-xs font-medium text-muted-foreground">{s.dimension}</span>
                      <div className="flex-1 rounded-full bg-secondary h-2">
                        <div className="rounded-full bg-amber-500 h-2" style={{ width: `${s.score}%` }} />
                      </div>
                      <span className="text-xs font-medium text-foreground">{s.score}</span>
                    </div>
                  ))}
                </div>
              )}
              {evaluation?.improvement && (
                <div className="rounded-xl bg-muted p-3 text-sm text-muted-foreground">
                  <span className="font-medium">改进建议：</span>{evaluation.improvement}
                </div>
              )}
              {challenge.perfect_answer && (
                <div className="rounded-xl border border-amber-200 bg-amber-50/50 p-4">
                  <h3 className="text-sm font-semibold text-amber-800">满分回答要点</h3>
                  <p className="mt-1 text-sm text-amber-700 whitespace-pre-line">{challenge.perfect_answer}</p>
                </div>
              )}
              <p className="text-center text-sm text-muted-foreground">✅ 今日挑战已完成，明天再来！</p>
            </div>
          ) : (
            <div className="mt-6 space-y-3">
              <textarea
                value={answer}
                onChange={(e) => setAnswer(e.target.value)}
                placeholder="输入你的回答..."
                rows={8}
                className="w-full rounded-xl border border-border bg-card px-4 py-3 text-sm text-foreground placeholder-muted-foreground focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
              />
              <button
                onClick={handleSubmit}
                disabled={isSubmitting || !answer.trim()}
                className="w-full rounded-xl bg-amber-600 py-3 text-sm font-semibold text-white hover:bg-amber-700 disabled:opacity-50"
              >
                {isSubmitting ? 'AI 评分中...' : '提交回答'}
              </button>
            </div>
          )}
        </div>
      )}

      {/* Mini calendar */}
      {history.length > 0 && (
        <div className="mt-6 rounded-2xl border border-border bg-card p-4">
          <div className="mb-2 flex items-center justify-between">
            <h3 className="text-sm font-semibold text-foreground">打卡记录</h3>
            <Link href="/daily-challenge/history" className="text-xs text-amber-600 hover:text-amber-700">查看全部记录 →</Link>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {Array.from({ length: 30 }).map((_, i) => {
              const d = new Date();
              d.setDate(d.getDate() - (29 - i));
              const ds = d.toISOString().split('T')[0];
              const done = history.includes(ds);
              return (
                <div
                  key={i}
                  className={`h-5 w-5 rounded-sm text-[8px] flex items-center justify-center ${
                    done ? 'bg-amber-400 text-white' : 'bg-secondary text-muted-foreground'
                  }`}
                  title={ds}
                >
                  {d.getDate()}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
