'use client';

import { useState } from 'react';
import LearningPathCard from './LearningPathCard';
import type { RecommendedModule } from '@/types';
import { apiFetch } from '@/lib/api/fetch';

interface PathResult {
  id: string;
  weaknessSummary: string;
  recommendedModules: RecommendedModule[];
  totalEstimatedHours: number;
  createdAt: string;
}

export default function LearningPathView() {
  const [isGenerating, setIsGenerating] = useState(false);
  const [result, setResult] = useState<PathResult | null>(null);
  const [error, setError] = useState('');

  const handleGenerate = async () => {
    setIsGenerating(true);
    setError('');
    setResult(null);

    try {
      const res = await apiFetch('/api/skills/ai-learning-path', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });

      const data = await res.json().catch(() => ({ error: '服务器响应异常' }));

      if (!res.ok || data.error) {
        throw new Error(data.error || `请求失败 (${res.status})`);
      }

      setResult(data.path);
    } catch (err) {
      setError(err instanceof Error ? err.message : '生成失败，请重试');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleRetry = () => {
    setResult(null);
    setError('');
  };

  const sortedModules = result
    ? [...result.recommendedModules].sort((a, b) => {
        const order = { high: 0, medium: 1, low: 2 };
        return (order[a.priority] ?? 2) - (order[b.priority] ?? 2);
      })
    : [];

  return (
    <div className="space-y-6">
      {!result && (
        <div className="flex flex-col items-center gap-4 py-4">
          <p className="text-sm text-muted-foreground text-center">
            基于你的技能树完成度和面试弱项数据，AI 自动生成个性化学习路径
          </p>
          <button
            onClick={handleGenerate}
            disabled={isGenerating}
            className="rounded-lg bg-indigo-600 px-8 py-2.5 text-sm font-medium text-white transition-colors hover:bg-indigo-700 disabled:opacity-50"
          >
            {isGenerating ? 'AI 生成中...' : '生成学习路径'}
          </button>
        </div>
      )}

      {error && (
        <div className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700 dark:border-rose-900 dark:bg-rose-950/20 dark:text-rose-400">
          {error}
          <button onClick={handleRetry} className="ml-2 underline hover:text-rose-900 dark:hover:text-rose-300">
            重试
          </button>
        </div>
      )}

      {isGenerating && (
        <div className="flex flex-col items-center gap-3 py-8">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-indigo-500 border-t-transparent" />
          <span className="text-sm text-muted-foreground">AI 正在分析弱项数据并生成学习路径...</span>
        </div>
      )}

      {result && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-bold text-foreground">个性化学习路径</h3>
            <button
              onClick={handleRetry}
              className="rounded-lg border px-4 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent"
            >
              重新生成
            </button>
          </div>

          <div className="rounded-xl border bg-indigo-50 p-4 dark:bg-indigo-950/20">
            <h4 className="text-sm font-semibold text-indigo-800 dark:text-indigo-300 mb-1">弱项摘要</h4>
            <p className="text-sm text-indigo-700 dark:text-indigo-400">{result.weaknessSummary}</p>
            <div className="mt-2 flex items-center gap-2 text-xs text-indigo-600 dark:text-indigo-400">
              <span>总预估学习时长</span>
              <span className="font-bold">{result.totalEstimatedHours} 小时</span>
            </div>
          </div>

          <div className="space-y-3">
            <h4 className="text-sm font-semibold text-foreground">推荐学习模块</h4>
            {sortedModules.map((mod, i) => (
              <LearningPathCard key={i} module={mod} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}