'use client';

import { useState, useEffect, useCallback } from 'react';
import QuestionInput from '@/components/interview/QuestionInput';
import AnalysisResult from '@/components/interview/AnalysisResult';
import TrendingQuestions from '@/components/interview/TrendingQuestions';
import dynamic from 'next/dynamic';
const Markdown = dynamic(() => import('@/components/ui/markdown'), { ssr: false });
import type { AnalysisResult as AnalysisResultType } from '@/types';
import GradientBackground from '@/components/ui/gradient-background';
import { apiFetch } from '@/lib/api/fetch';

function frequencyStyle(freq: string) {
  switch (freq) {
    case '高频': return 'bg-rose-50 text-rose-700 border-rose-200';
    case '中频': return 'bg-amber-50 text-amber-700 border-amber-200';
    default: return 'bg-slate-50 text-slate-600 border-slate-200';
  }
}

export default function QAPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<AnalysisResultType | null>(null);
  const [streamingText, setStreamingText] = useState('');
  const [lastQuestion, setLastQuestion] = useState('');
  const [trendingQuestions, setTrendingQuestions] = useState<
    { id: string; text: string; type: { id: string; name: string } | null; rank: number }[]
  >([]);
  const [error, setError] = useState('');
  const [frequency, setFrequency] = useState<string | null>(null);
  const [showHistory, setShowHistory] = useState(false);
  const [history, setHistory] = useState<{ id: string; question_id: string; question: string; type_name: string | null; type_id: string | null; created_at: string; analysis: string; thinking_framework: string; answer_approach: string; answer_template: string }[]>([]);

  const fetchHistory = useCallback(async () => {
    try {
      const res = await apiFetch('/api/interview/analyze/history');
      if (res.ok) {
        const data = await res.json();
        setHistory(data.records || []);
      }
    } catch { /* ignore */ }
  }, []);

  useEffect(() => {
    fetchTrending();
    fetchHistory();
    apiFetch('/api/interview/analyze')
      .then((r) => r.json())
      .then((data) => {
        if (data.result) {
          setResult(data.result);
          setLastQuestion(data.question_text ?? '');
          if (data.result?.type?.id) fetchFrequency(data.result.type.id);
        }
      })
      .catch(() => {});
  }, [fetchHistory]);

  const fetchTrending = async () => {
    try {
      const res = await apiFetch('/api/interview/trending?limit=10');
      if (res.ok) { const data = await res.json(); setTrendingQuestions(data.questions ?? []); }
    } catch {}
  };

  const fetchFrequency = useCallback(async (typeId: string) => {
    try {
      const res = await apiFetch(`/api/interview/frequency?type_id=${typeId}`);
      const data = await res.json();
      setFrequency(data.frequency);
    } catch {
      setFrequency(null);
    }
  }, []);

  const handleAnalyze = useCallback(async (question: string) => {
    setIsLoading(true); setError(''); setResult(null); setStreamingText(''); setFrequency(null);
    setLastQuestion(question);

    try {
      const res = await apiFetch('/api/interview/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question }),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error ?? '分析失败');
        setIsLoading(false);
        return;
      }

      const reader = res.body?.getReader();
      if (!reader) { setIsLoading(false); return; }

      const decoder = new TextDecoder();
      let buffer = '';
      let metadata: { question_id: string; question_type: { id: string; name: string; is_new: boolean } } | null = null;

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
              if (data.type === 'metadata') {
                metadata = { question_id: data.question_id, question_type: data.question_type };
              } else if (data.type === 'chunk') {
                setStreamingText(prev => prev + data.content);
              } else if (data.type === 'sections') {
                const sections = data.sections;
                setResult({
                  question_id: metadata?.question_id || '',
                  type: metadata?.question_type || { id: '', name: '通用', is_new: false },
                  analysis: sections.analysis,
                  thinking_framework: sections.thinking_framework,
                  answer_approach: sections.answer_approach,
                  answer_template: sections.answer_template,
                });
                setStreamingText('');
                if (metadata?.question_type?.id) fetchFrequency(metadata.question_type.id);
              } else if (data.type === 'error') {
                setError(data.error || 'AI 服务异常');
              }
            } catch { /* ignore */ }
          }
        }
      }

      // Flush remaining buffer
      if (buffer.trim()) {
        const remainingLines = buffer.split('\n');
        for (const line of remainingLines) {
          if (line.startsWith('data: ')) {
            try {
              const data = JSON.parse(line.slice(6));
              if (data.type === 'sections') {
                const sections = data.sections;
                setResult({
                  question_id: metadata?.question_id || '',
                  type: metadata?.question_type || { id: '', name: '通用', is_new: false },
                  analysis: sections.analysis,
                  thinking_framework: sections.thinking_framework,
                  answer_approach: sections.answer_approach,
                  answer_template: sections.answer_template,
                });
                setStreamingText('');
              }
            } catch { /* ignore */ }
          }
        }
      }

      fetchHistory();
    } catch {
      setError('网络错误，请重试');
    } finally {
      setIsLoading(false);
    }
  }, [fetchFrequency, fetchHistory]);

  const handleTrendingSelect = useCallback((question: string) => { handleAnalyze(question); }, [handleAnalyze]);

  const handleHistorySelect = useCallback((h: typeof history[number]) => {
    setLastQuestion(h.question);
    setResult({
      question_id: h.question_id || '',
      type: { id: h.type_id || '', name: h.type_name || '通用', is_new: false },
      analysis: h.analysis,
      thinking_framework: h.thinking_framework,
      answer_approach: h.answer_approach,
      answer_template: h.answer_template,
    });
    setStreamingText('');
    setError('');
    if (h.type_id) fetchFrequency(h.type_id);
  }, [fetchFrequency]);

  const handleDeleteHistory = useCallback(async (id: string) => {
    if (!confirm('确定删除这条记录吗？')) return;
    try {
      const res = await apiFetch('/api/interview/analyze/history', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      });
      if (res.ok) {
        setHistory(prev => prev.filter(h => h.id !== id));
      }
    } catch { /* ignore */ }
  }, []);

  return (
    <>
      <GradientBackground />
      <div className="relative z-10 p-8 space-y-8">
      <div>
        <h1 className="text-4xl font-semibold text-foreground">面试问答</h1>
        <p className="mt-2 text-base text-muted-foreground">输入面试问题，获取四部分深度分析</p>
      </div>

      <TrendingQuestions questions={trendingQuestions} onSelect={handleTrendingSelect} />

      {/* History */}
      {history.length > 0 && (
        <div>
          <button
            onClick={() => setShowHistory(!showHistory)}
            className="flex items-center gap-2 text-sm font-medium text-primary hover:text-primary/80"
          >
            <svg className={`h-4 w-4 transition-transform ${showHistory ? 'rotate-90' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
            </svg>
            历史分析记录（{history.length}）
          </button>
          {showHistory && (
            <div className="mt-3 space-y-2">
              {history.map((h) => (
                <div
                  key={h.id}
                  className="rounded-xl border border-border bg-card px-4 py-3 transition-colors hover:bg-muted hover:border-indigo-200"
                >
                  <div className="flex items-center justify-between">
                    <button
                      onClick={() => handleHistorySelect(h)}
                      className="flex-1 text-left"
                    >
                      <span className="font-medium text-foreground line-clamp-1">{h.question}</span>
                      <span className="ml-2 text-xs text-muted-foreground">{new Date(h.created_at).toLocaleDateString()}</span>
                    </button>
                    <button
                      onClick={() => handleDeleteHistory(h.id)}
                      className="ml-2 rounded-lg p-1.5 text-muted-foreground hover:bg-rose-100 hover:text-rose-600 transition-colors"
                      title="删除"
                    >
                      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                      </svg>
                    </button>
                  </div>
                  {h.type_name && <span className="text-xs text-muted-foreground">{h.type_name}</span>}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      <QuestionInput onSubmit={handleAnalyze} isLoading={isLoading} />

      {error && (
        <div className="rounded-2xl border border-destructive/20 bg-destructive/5 p-4 text-base text-destructive">{error}</div>
      )}

      {/* Streaming text display */}
      {isLoading && streamingText && !result && (
        <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <div className="h-5 w-5 animate-spin rounded-full border-2 border-indigo-500 border-t-transparent" />
            <span className="text-sm font-medium text-muted-foreground">AI 正在分析...</span>
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
            <Markdown content={streamingText} />
          </div>
        </div>
      )}

      {/* Loading spinner (before streaming starts) */}
      {isLoading && !streamingText && !result && (
        <div className="flex items-center justify-center rounded-2xl bg-card border border-border py-12">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-indigo-500 border-t-transparent" />
          <span className="ml-3 text-muted-foreground">AI 正在深度分析...</span>
        </div>
      )}

      {/* Final parsed result */}
      {result && !isLoading && (
        <div className="space-y-4">
          {frequency && (
            <div className="flex items-center gap-2">
              <span className={`rounded-full border px-2.5 py-1 text-xs font-medium ${frequencyStyle(frequency)}`}>
                {frequency}
              </span>
              <span className="text-xs text-muted-foreground">该类型问题出现频率</span>
            </div>
          )}
          <AnalysisResult result={result} questionText={lastQuestion} />
        </div>
      )}

      {/* Fallback: if streaming finished but no parsed result, show raw text */}
      {!isLoading && !result && streamingText && (
        <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
          <div className="prose prose-sm max-w-none
            prose-headings:mt-5 prose-headings:mb-2 prose-headings:font-bold
            prose-h2:text-base prose-h2:text-indigo-700 prose-h2:border-b prose-h2:border-indigo-100 prose-h2:pb-1
            prose-h3:text-sm prose-h3:text-foreground
            prose-p:my-2 prose-p:leading-relaxed
            prose-li:my-1 prose-ul:my-2 prose-ol:my-2
            prose-blockquote:my-3 prose-blockquote:border-l-indigo-400 prose-blockquote:bg-indigo-50 prose-blockquote:py-2 prose-blockquote:px-4 prose-blockquote:rounded-r-lg
            prose-strong:text-indigo-700
            prose-table:my-3 prose-th:bg-muted prose-th:px-3 prose-th:py-1.5 prose-td:px-3 prose-td:py-1.5 prose-td:border-border">
            <Markdown content={streamingText} />
          </div>
        </div>
      )}
    </div>
    </>
  );
}
