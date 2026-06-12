'use client';

import { useState, useRef } from 'react';
import dynamic from 'next/dynamic';
const Markdown = dynamic(() => import('@/components/ui/markdown'), { ssr: false });
import CompetitiveScoreCard from './CompetitiveScoreCard';
import type { DimensionScore } from '@/types';
import { apiFetch } from '@/lib/api/fetch';

interface AnalysisResult {
  id: string;
  productName: string;
  marketPosition: string;
  featureComparison: string;
  strengthsWeaknesses: string;
  differentiationStrategy: string;
  totalScore: number;
  dimensionScores: DimensionScore[];
  createdAt: string;
}

export default function CompetitiveAnalysisView() {
  const [productName, setProductName] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [streamingText, setStreamingText] = useState('');
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [saved, setSaved] = useState<boolean | null>(null);
  const [error, setError] = useState('');
  const abortRef = useRef<AbortController | null>(null);

  const handleGenerate = async () => {
    if (productName.trim().length < 2) {
      setError('请输入产品名称（至少2个字符）');
      return;
    }
    setIsGenerating(true);
    setError('');
    setResult(null);
    setSaved(null);
    setStreamingText('');

    const abortController = new AbortController();
    abortRef.current = abortController;

    try {
      const res = await apiFetch('/api/interview/competitive', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productName: productName.trim() }),
        signal: abortController.signal,
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({ error: '服务器响应异常' }));
        throw new Error(data.error || `请求失败 (${res.status})`);
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

            if (event.done) {
              setSaved(event.saved !== false);
              const markdownContent = fullText.replace(/\{[\s\S]*"dimensionScores"[\s\S]*\}/, '').trim();
              const marketPosition = markdownContent.match(/##\s*[🏢📊📈🎯].*?市场定位[\s\S]*?(?=##\s*[⚡💪🆚🔧].*?(?:功能对比|核心功能|优劣势|差异化)|$)/i)?.[0]?.trim()
                || markdownContent.match(/##\s*.*?市场定位[\s\S]*?(?=##|$)/i)?.[0]?.trim() || '';
              const featureComparison = markdownContent.match(/##\s*[⚡🆚🔧📊].*?(?:功能对比|核心功能|功能分析)[\s\S]*?(?=##\s*[💪🏢🎯].*?(?:优劣势|市场定位|差异化)|$)/i)?.[0]?.trim()
                || markdownContent.match(/##\s*.*?(?:功能对比|核心功能)[\s\S]*?(?=##|$)/i)?.[0]?.trim() || '';
              const strengthsWeaknesses = markdownContent.match(/##\s*[💪⚖️].*?(?:优劣势|优势劣势|SWOT)[\s\S]*?(?=##\s*[🏢⚡🎯].*?(?:市场定位|功能对比|差异化)|$)/i)?.[0]?.trim()
                || markdownContent.match(/##\s*.*?(?:优劣势|优势劣势|SWOT)[\s\S]*?(?=##|$)/i)?.[0]?.trim() || '';
              const differentiationStrategy = markdownContent.match(/##\s*[🎯🚀💡].*?(?:差异化|策略|竞争策略)[\s\S]*?(?=##\s*[🏢⚡💪].*?(?:市场定位|功能对比|优劣势)|$)/i)?.[0]?.trim()
                || markdownContent.match(/##\s*.*?(?:差异化|策略建议|竞争策略)[\s\S]*?(?=##|$)/i)?.[0]?.trim() || '';
              const fallbackContent = (!marketPosition && !featureComparison && !strengthsWeaknesses && !differentiationStrategy) ? markdownContent : '';

              setResult({
                id: event.recordId || '',
                productName: productName.trim(),
                marketPosition: marketPosition || fallbackContent,
                featureComparison,
                strengthsWeaknesses,
                differentiationStrategy,
                totalScore: event.scoring?.totalScore ?? 0,
                dimensionScores: event.scoring?.dimensionScores ?? [],
                createdAt: new Date().toISOString(),
              });
              setStreamingText('');
            }

            if (event.error) {
              throw new Error(event.error);
            }
          } catch (e) {
            if (e instanceof Error && e.message !== '生成失败') throw e;
          }
        }
      }
    } catch (err) {
      if (err instanceof Error && err.name !== 'AbortError') {
        setError(err instanceof Error ? err.message : '生成失败，请重试');
      }
    } finally {
      setIsGenerating(false);
      setStreamingText('');
      abortRef.current = null;
    }
  };

  const handleRetry = () => {
    if (abortRef.current) abortRef.current.abort();
    setResult(null);
    setSaved(null);
    setError('');
    setStreamingText('');
  };

  return (
    <div className="space-y-6">
      {!result && !streamingText && (
        <div className="space-y-3">
          <label className="text-sm font-semibold text-foreground">输入产品名称</label>
          <div className="flex gap-3">
            <input
              className="flex-1 rounded-xl border bg-card px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:border-purple-400 focus:outline-none focus:ring-2 focus:ring-purple-100 dark:focus:ring-purple-900"
              placeholder="例如：飞书、Notion、Figma..."
              value={productName}
              onChange={(e) => setProductName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && !isGenerating && handleGenerate()}
              disabled={isGenerating}
              autoFocus
            />
            <button
              onClick={handleGenerate}
              disabled={isGenerating || productName.trim().length < 2}
              className="rounded-lg bg-purple-600 px-6 py-2.5 text-sm font-medium text-white transition-colors hover:bg-purple-700 disabled:opacity-50"
            >
              {isGenerating ? 'AI 分析中...' : '生成分析'}
            </button>
          </div>
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

      {streamingText && !result && (
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <div className="h-5 w-5 animate-spin rounded-full border-2 border-purple-500 border-t-transparent" />
            <span className="text-sm text-muted-foreground">AI 正在生成竞品分析...</span>
          </div>
          <div className="rounded-xl border bg-card p-5">
            <div>
              <Markdown content={streamingText} />
            </div>
          </div>
        </div>
      )}

      {result && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-bold text-foreground">「{result.productName}」竞品分析</h3>
            <div className="flex items-center gap-3">
              {saved === false && (
                <span className="text-xs text-rose-500">⚠️ 保存失败，结果未记录到历史</span>
              )}
              {saved && (
                <a href="/interview/comp-history" className="text-xs text-purple-600 hover:underline dark:text-purple-400">
                  查看历史记录 →
                </a>
              )}
              <button
                onClick={handleRetry}
                className="rounded-lg border px-4 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent"
              >
                重新分析
              </button>
            </div>
          </div>

          <div className="space-y-4">
            {[result.marketPosition, result.featureComparison, result.strengthsWeaknesses, result.differentiationStrategy].filter(Boolean).map((section, i) => (
              <div key={i} className="rounded-xl border bg-card p-5">
                <div>
                  <Markdown content={section} />
                </div>
              </div>
            ))}
          </div>

          <CompetitiveScoreCard totalScore={result.totalScore} dimensionScores={result.dimensionScores} />
        </div>
      )}
    </div>
  );
}