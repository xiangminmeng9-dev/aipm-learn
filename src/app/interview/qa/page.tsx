'use client';

import { useState, useEffect, useCallback } from 'react';
import QuestionInput from '@/components/interview/QuestionInput';
import AnalysisResult from '@/components/interview/AnalysisResult';
import TrendingQuestions from '@/components/interview/TrendingQuestions';
import type { AnalysisResult as AnalysisResultType } from '@/types';

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
  const [lastQuestion, setLastQuestion] = useState('');
  const [trendingQuestions, setTrendingQuestions] = useState<
    { id: string; text: string; type: { id: string; name: string } | null; rank: number }[]
  >([]);
  const [error, setError] = useState('');
  const [frequency, setFrequency] = useState<string | null>(null);
  const [showHistory, setShowHistory] = useState(false);
  const [history, setHistory] = useState<{ id: string; question: string; type_name: string | null; created_at: string }[]>([]);

  const fetchHistory = useCallback(async () => {
    try {
      const res = await fetch('/api/interview/assistant/history');
      if (res.ok) {
        const data = await res.json();
        setHistory((data.records || []).map((r: { id: string; question: string; category: string | null; created_at: string }) => ({
          id: r.id,
          question: r.question,
          type_name: r.category,
          created_at: r.created_at,
        })));
      }
    } catch { /* ignore */ }
  }, []);

  useEffect(() => {
    fetchTrending();
    fetchHistory();
    fetch('/api/interview/analyze')
      .then((r) => r.json())
      .then((data) => {
        if (data.result) {
          setResult(data.result);
          setLastQuestion(data.question_text ?? '');
          // Fetch frequency for the type
          if (data.result?.type?.id) {
            fetchFrequency(data.result.type.id);
          }
        }
      })
      .catch(() => {});
  }, [fetchHistory]);

  const fetchTrending = async () => {
    try {
      const res = await fetch('/api/interview/trending?limit=10');
      if (res.ok) { const data = await res.json(); setTrendingQuestions(data.questions ?? []); }
    } catch {}
  };

  const fetchFrequency = useCallback(async (typeId: string) => {
    try {
      const res = await fetch(`/api/interview/frequency?type_id=${typeId}`);
      const data = await res.json();
      setFrequency(data.frequency);
    } catch {
      setFrequency(null);
    }
  }, []);

  const handleAnalyze = useCallback(async (question: string) => {
    setIsLoading(true); setError(''); setResult(null); setFrequency(null);
    try {
      const res = await fetch('/api/interview/analyze', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ question }) });
      const data = await res.json();
      if (!res.ok) { setError(data.error ?? '分析失败'); return; }
      setResult(data);
      setLastQuestion(question);
      // Fetch frequency for the result type
      if (data?.type?.id) {
        fetchFrequency(data.type.id);
      }
    } catch { setError('网络错误，请重试'); } finally { setIsLoading(false); fetchHistory(); }
  }, [fetchFrequency, fetchHistory]);

  const handleTrendingSelect = useCallback((question: string) => { handleAnalyze(question); }, [handleAnalyze]);

  return (
    <div className="p-8 space-y-8">
      <div>
        <h1 className="text-4xl font-semibold text-[#1F2937]">面试问答</h1>
        <p className="mt-2 text-base text-[#6B7280]">输入面试问题，获取四部分深度分析</p>
      </div>

      <TrendingQuestions questions={trendingQuestions} onSelect={handleTrendingSelect} />

      {/* History */}
      {history.length > 0 && (
        <div>
          <button
            onClick={() => setShowHistory(!showHistory)}
            className="flex items-center gap-2 text-sm font-medium text-[#4F46E5] hover:text-[#4338CA]"
          >
            <svg className={`h-4 w-4 transition-transform ${showHistory ? 'rotate-90' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
            </svg>
            历史分析记录（{history.length}）
          </button>
          {showHistory && (
            <div className="mt-3 space-y-2">
              {history.map((h) => (
                <button
                  key={h.id}
                  onClick={() => handleAnalyze(h.question)}
                  className="w-full rounded-xl border border-[#E5E7EB] bg-white px-4 py-3 text-left text-sm transition-colors hover:bg-[#F9FAFB] hover:border-indigo-200"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-[#1F2937] line-clamp-1">{h.question}</span>
                    <span className="text-xs text-[#9CA3AF]">{new Date(h.created_at).toLocaleDateString()}</span>
                  </div>
                  {h.type_name && <span className="text-xs text-[#6B7280]">{h.type_name}</span>}
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      <QuestionInput onSubmit={handleAnalyze} isLoading={isLoading} />

      {error && (
        <div className="rounded-2xl border border-[#ff3b30]/20 bg-[#ff3b30]/5 p-4 text-base text-[#ff3b30]">{error}</div>
      )}

      {isLoading && (
        <div className="flex items-center justify-center rounded-2xl bg-white border border-[#E5E7EB] py-12">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-indigo-500 border-t-transparent" />
          <span className="ml-3 text-[#6B7280]">AI 正在深度分析...</span>
        </div>
      )}

      {result && !isLoading && (
        <div className="space-y-4">
          {/* Frequency tag */}
          {frequency && (
            <div className="flex items-center gap-2">
              <span className={`rounded-full border px-2.5 py-1 text-xs font-medium ${frequencyStyle(frequency)}`}>
                {frequency}
              </span>
              <span className="text-xs text-[#6B7280]">该类型问题出现频率</span>
            </div>
          )}
          <AnalysisResult result={result} />
        </div>
      )}
    </div>
  );
}