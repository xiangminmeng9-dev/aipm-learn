'use client';

import { useState, useEffect, useCallback } from 'react';
import QuestionInput from '@/components/interview/QuestionInput';
import AnalysisResult from '@/components/interview/AnalysisResult';
import TrendingQuestions from '@/components/interview/TrendingQuestions';
import type { AnalysisResult as AnalysisResultType } from '@/types';

export default function QAPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<AnalysisResultType | null>(null);
  const [trendingQuestions, setTrendingQuestions] = useState<
    { id: string; text: string; type: { id: string; name: string } | null; rank: number }[]
  >([]);
  const [error, setError] = useState('');

  // 加载热门问题
  useEffect(() => {
    fetchTrending();
  }, []);

  const fetchTrending = async () => {
    try {
      const res = await fetch('/api/interview/trending?limit=10');
      if (res.ok) {
        const data = await res.json();
        setTrendingQuestions(data.questions ?? []);
      }
    } catch {
      // 静默失败，热门问题不是核心功能
    }
  };

  const handleAnalyze = useCallback(async (question: string) => {
    setIsLoading(true);
    setError('');
    setResult(null);

    try {
      const res = await fetch('/api/interview/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? '分析失败');
        return;
      }

      setResult(data);
    } catch {
      setError('网络错误，请重试');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const handleTrendingSelect = useCallback(
    (question: string) => {
      handleAnalyze(question);
    },
    [handleAnalyze]
  );

  return (
    <div className="mx-auto max-w-3xl space-y-8 p-6">
      <div>
        <h1 className="text-2xl font-bold text-neutral-50">面试问答</h1>
        <p className="mt-1 text-sm text-neutral-400">输入面试问题，获取四部分深度分析</p>
      </div>

      <TrendingQuestions questions={trendingQuestions} onSelect={handleTrendingSelect} />

      <QuestionInput onSubmit={handleAnalyze} isLoading={isLoading} />

      {error && (
        <div className="rounded-lg border border-red-800/50 bg-red-900/20 p-4 text-sm text-red-300">
          {error}
        </div>
      )}

      {isLoading && (
        <div className="flex items-center justify-center py-12">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-amber-600 border-t-transparent" />
          <span className="ml-3 text-neutral-400">AI 正在深度分析...</span>
        </div>
      )}

      {result && !isLoading && <AnalysisResult result={result} />}
    </div>
  );
}
