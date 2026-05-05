'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import SpecScoreCard from './SpecScoreCard';
import type { DimensionScore, SpecSuggestion } from '@/types';

interface EvaluationResult {
  id: string;
  total_score: number;
  dimension_scores: DimensionScore[];
  suggestions: SpecSuggestion[];
  created_at: string;
}

export default function SpecPracticeView() {
  const [question, setQuestion] = useState('');
  const [category, setCategory] = useState('');
  const [userSpec, setUserSpec] = useState('');
  const [isLoadingQuestion, setIsLoadingQuestion] = useState(true);
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [streamingText, setStreamingText] = useState('');
  const [result, setResult] = useState<EvaluationResult | null>(null);
  const [error, setError] = useState('');
  const abortRef = useRef<AbortController | null>(null);

  const fetchQuestion = useCallback(async (refresh = false) => {
    setIsLoadingQuestion(true);
    setError('');
    try {
      const url = refresh ? '/api/coding/spec-practice?refresh=1' : '/api/coding/spec-practice';
      const res = await fetch(url);
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || '获取题目失败');
      }
      const data = await res.json();
      setQuestion(data.question);
      setCategory(data.question_category);
    } catch (err) {
      setError(err instanceof Error ? err.message : '获取题目失败');
    } finally {
      setIsLoadingQuestion(false);
    }
  }, []);

  useEffect(() => {
    fetchQuestion();
  }, [fetchQuestion]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    setResult(null);
    setUserSpec('');
    await fetchQuestion(true);
    setIsRefreshing(false);
  };

  const handleSubmit = async () => {
    if (userSpec.trim().length < 50) {
      setError('请先编写 Spec，至少 50 字');
      return;
    }
    if (userSpec.length > 5000) {
      setError('Spec 不能超过 5000 字');
      return;
    }

    setIsEvaluating(true);
    setError('');
    setResult(null);
    setStreamingText('');

    const abortController = new AbortController();
    abortRef.current = abortController;

    try {
      const res = await fetch('/api/coding/spec-practice', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question,
          question_category: category,
          user_spec: userSpec,
        }),
        signal: abortController.signal,
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({ error: '评分失败' }));
        throw new Error(data.error || '评分失败');
      }

      const reader = res.body?.getReader();
      if (!reader) throw new Error('无法读取响应流');

      const decoder = new TextDecoder();
      let buffer = '';
      let fullText = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (!line.startsWith('data: ')) continue;
          try {
            const event = JSON.parse(line.slice(6));
            if (event.text) {
              fullText += event.text;
              setStreamingText(fullText);
            }
            if (event.done && event.evaluation) {
              setResult(event.evaluation);
              setStreamingText('');
            }
            if (event.error) throw new Error(event.error);
          } catch (e) {
            if (e instanceof Error && e.message !== 'AI 评分解析失败') throw e;
          }
        }
      }
    } catch (err) {
      if (err instanceof Error && err.name !== 'AbortError') {
        setError(err instanceof Error ? err.message : '评分失败，请重试');
      }
    } finally {
      setIsEvaluating(false);
      setStreamingText('');
      abortRef.current = null;
    }
  };

  const handleRetry = () => {
    setResult(null);
    setError('');
  };

  return (
    <div className="space-y-6">
      {/* Question Display */}
      <div className="rounded-2xl border bg-gradient-to-br from-indigo-50 to-violet-50 p-6 dark:from-indigo-950/30 dark:to-violet-950/30">
        {isLoadingQuestion ? (
          <div className="flex items-center gap-3">
            <div className="h-5 w-5 animate-spin rounded-full border-2 border-indigo-500 border-t-transparent" />
            <span className="text-sm text-muted-foreground">正在生成题目...</span>
          </div>
        ) : (
          <>
            <div className="mb-2 flex items-center gap-2">
              <span className="rounded-full bg-indigo-100 px-3 py-0.5 text-xs font-medium text-indigo-700 dark:bg-indigo-900 dark:text-indigo-300">
                {category}
              </span>
            </div>
            <h2 className="text-lg font-semibold text-foreground">{question}</h2>
          </>
        )}
      </div>

      {/* Error Display */}
      {error && (
        <div className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700 dark:border-rose-900 dark:bg-rose-950/20 dark:text-rose-400">
          {error}
          {!isLoadingQuestion && (
            <button onClick={handleRefresh} className="ml-2 underline hover:text-rose-900 dark:hover:text-rose-300">
              重新出题
            </button>
          )}
        </div>
      )}

      {/* Spec Input */}
      {!result && !isLoadingQuestion && (
        <div className="space-y-3">
          <label className="text-sm font-semibold text-foreground">编写你的 Spec</label>
          <textarea
            className="min-h-[300px] w-full resize-y rounded-xl border bg-card p-4 text-sm text-foreground placeholder:text-muted-foreground focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-100 dark:focus:ring-indigo-900"
            placeholder="请根据题目编写完整的 Spec（规格说明），包括背景、目标、功能需求、非功能需求、约束条件等..."
            value={userSpec}
            onChange={(e) => setUserSpec(e.target.value)}
            disabled={isEvaluating}
          />
          <div className="flex items-center justify-between">
            <span className={`text-xs ${userSpec.length < 50 ? 'text-rose-500' : 'text-muted-foreground'}`}>
              {userSpec.length} / 5000 字 {userSpec.length < 50 && `（还需 ${50 - userSpec.length} 字）`}
            </span>
            <div className="flex gap-3">
              <button
                onClick={handleRefresh}
                disabled={isRefreshing || isEvaluating}
                className="rounded-lg border px-4 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent disabled:opacity-50"
              >
                {isRefreshing ? '生成中...' : '换一题'}
              </button>
              <button
                onClick={handleSubmit}
                disabled={isEvaluating || userSpec.trim().length < 50}
                className="rounded-lg bg-indigo-600 px-6 py-2 text-sm font-medium text-white transition-colors hover:bg-indigo-700 disabled:opacity-50"
              >
                {isEvaluating ? 'AI 评分中...' : '提交评分'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Evaluation Result */}
      {result && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-foreground">评分结果</h3>
            <div className="flex gap-3">
              <button
                onClick={handleRetry}
                className="rounded-lg border px-4 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent"
              >
                重新作答
              </button>
              <button
                onClick={() => {
                  setResult(null);
                  setUserSpec('');
                  handleRefresh();
                }}
                className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-indigo-700"
              >
                换一题
              </button>
            </div>
          </div>
          <SpecScoreCard
            totalScore={result.total_score}
            dimensionScores={result.dimension_scores}
            suggestions={result.suggestions}
          />
        </div>
      )}

      {/* Evaluating Spinner */}
      {isEvaluating && streamingText && (
        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <div className="h-5 w-5 animate-spin rounded-full border-2 border-indigo-500 border-t-transparent" />
            <span className="text-sm text-muted-foreground">AI 正在评分...</span>
          </div>
          <div className="rounded-xl border bg-card p-5">
            <div className="prose prose-sm max-w-none dark:prose-invert">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>{streamingText}</ReactMarkdown>
            </div>
          </div>
        </div>
      )}

      {isEvaluating && !streamingText && (
        <div className="flex flex-col items-center gap-3 py-8">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-indigo-500 border-t-transparent" />
          <span className="text-sm text-muted-foreground">AI 正在评分，请稍候...</span>
        </div>
      )}
    </div>
  );
}
