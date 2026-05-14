'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import Markdown from '@/components/ui/markdown';
import { useToast } from '@/components/ui/toast';
import { createClient } from '@/lib/supabase/client';
import GradientBackground from '@/components/ui/gradient-background';

interface HistoryRecord {
  id: string;
  question: string;
  analysis: string;
  created_at: string;
  category?: string;
}

interface Evaluation {
  score?: number;
  dimensions?: Record<string, { score: number; comment: string }>;
  feedback?: string;
  gap_analysis?: string;
  perfect_answer?: string;
}

export default function InterviewAssistantPage() {
  const [question, setQuestion] = useState('');
  const [category, setCategory] = useState('');
  const [answer, setAnswer] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [currentRecordId, setCurrentRecordId] = useState<string | null>(null);
  const [history, setHistory] = useState<HistoryRecord[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  const [userAnswer, setUserAnswer] = useState('');
  const [isEvaluating, setIsEvaluating] = useState(false);
  const toast = useToast();
  const [evaluation, setEvaluation] = useState<Evaluation | null>(null);
  const [isAuthed, setIsAuthed] = useState(true);

  const checkAuth = useCallback(async () => {
    const supabase = createClient();
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      setIsAuthed(false);
    } else {
      setIsAuthed(true);
    }
  }, []);

  useEffect(() => { checkAuth(); }, [checkAuth]);

  const fetchHistory = useCallback(async () => {
    try {
      const supabase = createClient();
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { setIsAuthed(false); return; }
      const res = await fetch('/api/interview/assistant/history', {
        headers: { Authorization: `Bearer ${session.access_token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setHistory(data.records || []);
      }
    } catch { /* ignore */ }
  }, []);

  useEffect(() => { fetchHistory(); }, [fetchHistory]);

  const handleSubmit = async () => {
    if (!question.trim() || isLoading) return;
    setIsLoading(true);
    setAnswer('');
    setEvaluation(null);
    setUserAnswer('');
    setCurrentRecordId(null);

    try {
      const supabase = createClient();
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        setIsAuthed(false);
        setAnswer('❌ 请先登录后再使用面试助手');
        setIsLoading(false);
        return;
      }

      const res = await fetch('/api/interview/assistant', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ question: question.trim(), category: category || undefined }),
      });

      if (!res.ok) {
        const data = await res.json();
        setAnswer(`❌ ${data.error || '请求失败'}`);
        setIsLoading(false);
        return;
      }

      const reader = res.body?.getReader();
      if (!reader) { setIsLoading(false); return; }

      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const data = JSON.parse(line.slice(6));
              if (data.type === 'chunk') {
                setAnswer(prev => prev + data.content);
              } else if (data.type === 'record_id') {
                setCurrentRecordId(data.record_id);
              } else if (data.type === 'error') {
                setAnswer(prev => prev + `\n\n❌ ${data.error}`);
              }
            } catch { /* ignore */ }
          }
        }
      }

      if (buffer.trim()) {
        const remainingLines = buffer.split('\n');
        for (const line of remainingLines) {
          if (line.startsWith('data: ')) {
            try {
              const data = JSON.parse(line.slice(6));
              if (data.type === 'record_id') setCurrentRecordId(data.record_id);
            } catch { /* ignore */ }
          }
        }
      }

      fetchHistory();
    } catch {
      setAnswer('❌ 网络错误，请重试');
    } finally {
      setIsLoading(false);
    }
  };

  const handleEvaluate = async () => {
    if (!userAnswer.trim() || isEvaluating) return;
    if (!currentRecordId) {
      toast.error('记录ID缺失，请重新提问后再试');
      return;
    }
    setIsEvaluating(true);

    try {
      const supabase = createClient();
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { setIsAuthed(false); return; }

      const res = await fetch('/api/interview/assistant', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          evaluate: true,
          record_id: currentRecordId,
          user_answer: userAnswer.trim(),
          question: question.trim(),
          category: category || undefined,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setEvaluation(data.evaluation);
      } else {
        const data = await res.json();
        toast.error(data.error || '评分失败');
      }
    } catch {
      toast.error('评分请求失败');
    } finally {
      setIsEvaluating(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('确定删除这条记录吗？')) return;
    try {
      const supabase = createClient();
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { setIsAuthed(false); return; }
      const res = await fetch('/api/interview/assistant/history', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ id }),
      });
      if (res.ok) {
        setHistory(prev => prev.filter(r => r.id !== id));
        toast.success('删除成功');
      } else {
        toast.error('删除失败');
      }
    } catch {
      toast.error('删除失败');
    }
  };

  const categories = ['AI产品思维', '需求分析', '竞品分析', '算法沟通', '数据指标', '产品设计', '项目管理', '用户研究'];

  return (
    <>
      <GradientBackground />
      <header className="sticky top-0 z-40 border-b border-border bg-card/80 backdrop-blur">
        <div className="flex items-center justify-between px-6 py-3">
          <div className="flex items-center gap-3">
            <Link href="/interview" className="text-sm text-muted-foreground hover:text-foreground">← 返回</Link>
            <span className="text-muted-foreground">|</span>
            <h1 className="text-base font-semibold text-foreground">AI 面试助手</h1>
          </div>
          <button
            onClick={() => setShowHistory(!showHistory)}
            className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
              showHistory ? 'bg-indigo-100 text-indigo-700' : 'bg-secondary text-muted-foreground hover:bg-gray-200'
            }`}
          >
            {showHistory ? '隐藏记录' : `历史记录 (${history.length})`}
          </button>
        </div>
      </header>

      <div className="relative z-10 px-6 py-6">
        {!isAuthed && (
          <div className="rounded-2xl border border-amber-200 bg-amber-50 p-6 text-center">
            <p className="text-amber-800 font-medium">请先登录后使用面试助手</p>
            <Link href="/login" className="mt-3 inline-block rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-indigo-700">
              去登录
            </Link>
          </div>
        )}

        {/* Question Input */}
        <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
          <div className="flex flex-wrap gap-2 mb-3">
            {categories.map(c => (
              <button
                key={c}
                onClick={() => setCategory(c)}
                className={`rounded-lg px-2.5 py-1 text-xs transition-colors ${
                  category === c ? 'bg-indigo-100 text-indigo-700 font-medium' : 'bg-secondary text-muted-foreground hover:bg-gray-200'
                }`}
              >
                {c}
              </button>
            ))}
          </div>
          <div className="flex gap-2">
            <input
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              placeholder="输入面试问题，AI 教练帮你深度分析..."
              className="flex-1 rounded-xl border border-border bg-muted px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:border-indigo-300 focus:outline-none focus:ring-2 focus:ring-indigo-100"
              disabled={isLoading}
              onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSubmit(); } }}
            />
            <button
              onClick={handleSubmit}
              disabled={isLoading || !question.trim() || !isAuthed}
              className="shrink-0 rounded-xl bg-indigo-600 px-6 py-2.5 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
            >
              {isLoading ? '分析中...' : '分析'}
            </button>
          </div>
        </div>

        {/* AI Analysis Result */}
        {answer && (
          <div className="mt-5 rounded-2xl border border-border bg-card p-6 shadow-sm">
            <div className="flex items-center gap-2 mb-4">
              <div className="flex h-6 w-6 items-center justify-center rounded-full bg-indigo-100">
                <svg className="h-3.5 w-3.5 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4.26 10.147a60.438 60.438 0 0 0-.491 6.347A48.62 48.62 0 0 1 12 20.904a48.62 48.62 0 0 1 8.232-4.41 60.46 60.46 0 0 0-.491-6.347m-15.482 0a50.636 50.636 0 0 0-2.658-.813A59.906 59.906 0 0 1 12 3.493a59.903 59.903 0 0 1 10.399 5.84c-.896.248-1.783.52-2.658.814m-15.482 0A50.717 50.717 0 0 1 12 13.489a50.702 50.702 0 0 1 7.74-3.342" />
                </svg>
              </div>
              <span className="text-sm font-semibold text-foreground">AI 教练分析</span>
            </div>
            <div className="prose prose-sm max-w-none
              prose-headings:mt-5 prose-headings:mb-2 prose-headings:font-bold
              prose-h2:text-base prose-h2:text-indigo-700 prose-h2:border-b prose-h2:border-indigo-100 prose-h2:pb-1
              prose-h3:text-sm prose-h3:text-foreground
              prose-p:my-2 prose-p:leading-relaxed
              prose-li:my-1 prose-ul:my-2 prose-ol:my-2
              prose-blockquote:my-3 prose-blockquote:border-l-indigo-400 prose-blockquote:bg-indigo-50 prose-blockquote:py-2 prose-blockquote:px-4 prose-blockquote:rounded-r-lg
              prose-strong:text-indigo-700
              prose-table:my-3 prose-th:bg-muted prose-th:px-3 prose-th:py-1.5 prose-td:px-3 prose-td:py-1.5 prose-td:border-border">
              <Markdown content={answer} />
            </div>
          </div>
        )}

        {/* Try Your Answer */}
        {answer && !isLoading && (
          <div className="mt-5 rounded-2xl border border-amber-200 bg-amber-50/50 p-5">
            <h3 className="text-sm font-semibold text-amber-800 mb-3">试试你的回答</h3>
            <textarea
              value={userAnswer}
              onChange={(e) => setUserAnswer(e.target.value)}
              placeholder="输入你的回答，AI 教练帮你评分..."
              className="w-full rounded-xl border border-amber-200 bg-card px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:border-indigo-300 focus:outline-none focus:ring-2 focus:ring-indigo-100"
              rows={4}
              disabled={isEvaluating}
            />
            <button
              onClick={handleEvaluate}
              disabled={isEvaluating || !userAnswer.trim()}
              className="mt-3 rounded-xl bg-amber-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-amber-700 disabled:opacity-50"
            >
              {isEvaluating ? '评分中...' : '提交评估'}
            </button>

            {/* Evaluation Result */}
            {evaluation && (
              <div className="mt-4 rounded-xl border border-border bg-card p-5">
                <h4 className="text-sm font-semibold text-foreground mb-3">评估结果</h4>
                {evaluation.score !== undefined && (
                  <div className="mb-3 flex items-center gap-3">
                    <div className={`flex h-14 w-14 items-center justify-center rounded-full text-lg font-bold ${
                      evaluation.score >= 80 ? 'bg-emerald-100 text-emerald-700' :
                      evaluation.score >= 60 ? 'bg-amber-100 text-amber-700' :
                      'bg-rose-100 text-rose-700'
                    }`}>
                      {evaluation.score}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-foreground">综合评分</p>
                      <p className="text-xs text-muted-foreground">
                        {evaluation.score >= 80 ? '优秀' : evaluation.score >= 60 ? '良好' : '需加强'}
                      </p>
                    </div>
                  </div>
                )}

                {evaluation.dimensions && (
                  <div className="mb-3 space-y-2">
                    {Object.entries(evaluation.dimensions).map(([key, val]) => (
                      <div key={key} className="flex items-center gap-3">
                        <span className="w-20 text-xs text-muted-foreground shrink-0">{key}</span>
                        <div className="flex-1 h-2 rounded-full bg-secondary">
                          <div
                            className={`h-2 rounded-full ${
                              val.score >= 80 ? 'bg-emerald-500' : val.score >= 60 ? 'bg-amber-500' : 'bg-rose-500'
                            }`}
                            style={{ width: `${val.score}%` }}
                          />
                        </div>
                        <span className="text-xs font-medium text-foreground w-8">{val.score}</span>
                      </div>
                    ))}
                  </div>
                )}

                {evaluation.feedback && (
                  <div className="mb-3 rounded-lg bg-muted p-3">
                    <p className="text-xs font-medium text-foreground mb-1">总评</p>
                    <p className="text-sm text-foreground">{evaluation.feedback}</p>
                  </div>
                )}

                {evaluation.gap_analysis && (
                  <div className="mb-3 rounded-lg bg-rose-50 p-3">
                    <p className="text-xs font-medium text-rose-700 mb-1">差距分析</p>
                    <p className="text-sm text-foreground">{evaluation.gap_analysis}</p>
                  </div>
                )}

                {evaluation.perfect_answer && (
                  <div className="rounded-lg bg-indigo-50 p-3">
                    <p className="text-xs font-medium text-indigo-700 mb-1">满分回答</p>
                    <div className="prose prose-sm max-w-none
                      prose-headings:mt-3 prose-headings:mb-1
                      prose-p:my-1 prose-p:leading-relaxed
                      prose-li:my-0.5
                      prose-blockquote:border-l-indigo-400 prose-blockquote:bg-indigo-50">
                      <Markdown content={evaluation.perfect_answer} />
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* History */}
        {showHistory && (
          <div className="mt-5 rounded-2xl border border-border bg-card p-5 shadow-sm">
            <h3 className="text-sm font-semibold text-foreground mb-3">历史记录</h3>
            {history.length === 0 ? (
              <p className="text-sm text-muted-foreground">暂无记录</p>
            ) : (
              <div className="space-y-3">
                {history.map(record => (
                  <div
                    key={record.id}
                    className="rounded-xl border border-border bg-muted p-3 transition-colors hover:bg-secondary"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <button
                        onClick={() => {
                          setQuestion(record.question);
                          setAnswer(record.analysis || '');
                          setCurrentRecordId(record.id);
                          setEvaluation(null);
                          setUserAnswer('');
                        }}
                        className="flex-1 text-left"
                      >
                        <p className="text-sm font-medium text-foreground">{record.question}</p>
                        <p className="mt-1 text-xs text-muted-foreground">{new Date(record.created_at).toLocaleString('zh-CN')}</p>
                      </button>
                      <button
                        onClick={() => handleDelete(record.id)}
                        className="shrink-0 rounded-lg p-1.5 text-muted-foreground hover:bg-rose-100 hover:text-rose-600 transition-colors"
                        title="删除"
                      >
                        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                        </svg>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </>
  );
}
