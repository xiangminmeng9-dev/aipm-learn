'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import ScoreCard, { getScoreColor } from '@/components/shared/ScoreCard';
import type { DimensionScore } from '@/types';
import { apiFetch } from '@/lib/api/fetch';

interface PromptDimensionScore {
  name: string;
  score: number;
  maxScore: number;
  feedback: string;
}

interface PromptDifference {
  aspect: string;
  userAnswer: string;
  idealAnswer: string;
}

interface PromptOptimization {
  original: string;
  optimized: string;
  reason: string;
}

interface EvaluationResult {
  id: string;
  score: number;
  dimensions: PromptDimensionScore[];
  differences: PromptDifference[];
  optimizations: PromptOptimization[];
  idealAnswer: string;
  overallFeedback: string;
  created_at: string;
}

interface HistoryRecord {
  id: string;
  question: string;
  question_category: string;
  difficulty: string;
  total_score: number;
  created_at: string;
}

// Full record from DB (returned by detail API)
interface HistoryDetail {
  id: string;
  question: string;
  question_category: string;
  difficulty: string;
  user_prompt: string;
  total_score: number;
  dimension_scores: PromptDimensionScore[];
  differences: PromptDifference[];
  optimizations: PromptOptimization[];
  ideal_answer: string;
  overall_feedback: string;
  created_at: string;
}

const CATEGORIES = ['生成式写作', '结构化输出', '多步骤推理', '角色扮演', '数据分析', '创意发散'];
const DIFFICULTIES = ['入门', '进阶', '实战'];

const difficultyColors: Record<string, string> = {
  '入门': 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300',
  '进阶': 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300',
  '实战': 'bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-300',
};

export default function PromptPracticeView() {
  const [question, setQuestion] = useState('');
  const [category, setCategory] = useState('');
  const [difficulty, setDifficulty] = useState('进阶');
  const [userPrompt, setUserPrompt] = useState('');
  const [isLoadingQuestion, setIsLoadingQuestion] = useState(true);
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [streamingText, setStreamingText] = useState('');
  const [result, setResult] = useState<EvaluationResult | null>(null);
  const [error, setError] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedDifficulty, setSelectedDifficulty] = useState('');
  const abortRef = useRef<AbortController | null>(null);

  // History state
  const [showHistory, setShowHistory] = useState(false);
  const [historyRecords, setHistoryRecords] = useState<HistoryRecord[]>([]);
  const [historyTotal, setHistoryTotal] = useState(0);
  const [historyPage, setHistoryPage] = useState(1);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [expandedDetail, setExpandedDetail] = useState<HistoryDetail | null>(null);
  const [expandedLoading, setExpandedLoading] = useState(false);

  const fetchQuestion = useCallback(async (refresh = false) => {
    setIsLoadingQuestion(true);
    setError('');
    try {
      const params = new URLSearchParams();
      if (refresh) params.set('refresh', '1');
      if (selectedCategory) params.set('category', selectedCategory);
      if (selectedDifficulty) params.set('difficulty', selectedDifficulty);
      const res = await apiFetch(`/api/skills/prompt-practice?${params}`);
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || '获取题目失败');
      }
      const data = await res.json();
      setQuestion(data.question);
      setCategory(data.question_category);
      setDifficulty(data.difficulty || '进阶');
    } catch (err) {
      setError(err instanceof Error ? err.message : '获取题目失败');
    } finally {
      setIsLoadingQuestion(false);
    }
  }, [selectedCategory, selectedDifficulty]);

  const fetchHistory = useCallback(async (page = 1) => {
    try {
      const res = await apiFetch(`/api/skills/prompt-practice/history?page=${page}&limit=20`);
      if (res.ok) {
        const data = await res.json();
        setHistoryRecords(data.records || []);
        setHistoryTotal(data.total || 0);
        setHistoryPage(page);
      }
    } catch { /* ignore */ }
  }, []);

  useEffect(() => { fetchQuestion(); }, [fetchQuestion]);

  useEffect(() => {
    if (showHistory) fetchHistory(1);
  }, [showHistory, fetchHistory]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    setResult(null);
    setUserPrompt('');
    await fetchQuestion(true);
    setIsRefreshing(false);
  };

  const handleSubmit = async () => {
    if (userPrompt.trim().length < 20) {
      setError('请先编写 Prompt，至少 20 字');
      return;
    }

    setIsEvaluating(true);
    setError('');
    setResult(null);
    setStreamingText('');

    const abortController = new AbortController();
    abortRef.current = abortController;

    try {
      const res = await apiFetch('/api/skills/prompt-practice', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question,
          question_category: category,
          difficulty,
          user_prompt: userPrompt,
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

  const handleCopyIdeal = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  // Load detail for a history record
  const handleExpandHistory = async (id: string) => {
    if (expandedId === id) {
      setExpandedId(null);
      setExpandedDetail(null);
      return;
    }
    setExpandedId(id);
    setExpandedDetail(null);
    setExpandedLoading(true);
    try {
      const res = await apiFetch(`/api/skills/prompt-practice/history?id=${id}`);
      if (res.ok) {
        const data = await res.json();
        setExpandedDetail(data.record);
      }
    } catch { /* ignore */ }
    setExpandedLoading(false);
  };

  // Map dimensions for ScoreCard (works for both EvaluationResult and HistoryDetail)
  const mapDimensions = (dimensions: PromptDimensionScore[]): DimensionScore[] =>
    dimensions.map(d => ({
      dimension: `${d.name} (${d.score}/${d.maxScore})`,
      score: Math.round((d.score / d.maxScore) * 100),
      comment: d.feedback,
    }));

  // Shared result renderer
  const renderAnalysis = (data: {
    score: number;
    dimensions: PromptDimensionScore[];
    differences: PromptDifference[];
    optimizations: PromptOptimization[];
    idealAnswer: string;
    overallFeedback: string;
  }) => (
    <div className="space-y-6">
      <ScoreCard
        totalScore={data.score}
        dimensionScores={mapDimensions(data.dimensions)}
        gradientFrom="from-indigo-50"
        gradientTo="to-violet-50"
      />

      {data.differences.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-foreground">差异对比</h3>
          {data.differences.map((d, i) => (
            <div key={i} className="rounded-xl border border-border bg-card p-4 shadow-sm">
              <div className="mb-2 text-sm font-medium text-foreground">{d.aspect}</div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="rounded-lg bg-amber-50/50 p-3 dark:bg-amber-950/20">
                  <div className="mb-1 text-xs font-medium text-amber-600 dark:text-amber-400">你的答案</div>
                  <p className="text-sm text-foreground">{d.userAnswer}</p>
                </div>
                <div className="rounded-lg bg-emerald-50/50 p-3 dark:bg-emerald-950/20">
                  <div className="mb-1 text-xs font-medium text-emerald-600 dark:text-emerald-400">理想答案</div>
                  <p className="text-sm text-foreground">{d.idealAnswer}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {data.optimizations.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-foreground">优化建议</h3>
          {data.optimizations.map((o, i) => (
            <div key={i} className="rounded-xl border border-amber-200 bg-amber-50/50 p-4 dark:border-amber-800 dark:bg-amber-950/20">
              <div className="flex items-start gap-2">
                <span className="mt-0.5 shrink-0 text-amber-500">💡</span>
                <div className="min-w-0 flex-1">
                  <div className="mb-1 text-xs text-muted-foreground">
                    原文：<span className="text-foreground">&ldquo;{o.original}&rdquo;</span>
                  </div>
                  <div className="mb-1 text-xs font-medium text-amber-700 dark:text-amber-400">
                    优化为：<span className="text-foreground">&ldquo;{o.optimized}&rdquo;</span>
                  </div>
                  <div className="text-xs text-muted-foreground">{o.reason}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {data.idealAnswer && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-foreground">满分答案</h3>
            <button
              onClick={() => handleCopyIdeal(data.idealAnswer)}
              className="rounded-lg border px-3 py-1 text-xs font-medium text-muted-foreground hover:bg-muted transition-colors"
              title="复制满分答案"
            >
              📋 复制
            </button>
          </div>
          <div className="rounded-xl border-2 border-emerald-200 bg-emerald-50/30 p-5 dark:border-emerald-800 dark:bg-emerald-950/20">
            <pre className="whitespace-pre-wrap text-sm text-foreground leading-relaxed">{data.idealAnswer}</pre>
          </div>
        </div>
      )}

      {data.overallFeedback && (
        <div className="rounded-xl border border-indigo-200 bg-indigo-50/30 p-4 dark:border-indigo-800 dark:bg-indigo-950/20">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-sm">💬</span>
            <span className="text-xs font-semibold text-indigo-700 dark:text-indigo-400">总评</span>
          </div>
          <p className="text-sm text-foreground">{data.overallFeedback}</p>
        </div>
      )}
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Tab bar */}
      <div className="flex items-center gap-1 rounded-lg bg-muted p-1 w-fit">
        <button
          onClick={() => { setShowHistory(false); setExpandedId(null); }}
          className={`rounded-md px-4 py-1.5 text-xs font-semibold transition-colors ${
            !showHistory ? 'bg-primary text-white' : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          练习
        </button>
        <button
          onClick={() => setShowHistory(true)}
          className={`rounded-md px-4 py-1.5 text-xs font-semibold transition-colors ${
            showHistory ? 'bg-primary text-white' : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          历史记录{historyTotal > 0 ? ` (${historyTotal})` : ''}
        </button>
      </div>

      {showHistory ? (
        /* ===== History View ===== */
        <div className="space-y-3">
          {historyRecords.length === 0 ? (
            <div className="flex h-40 items-center justify-center text-sm text-muted-foreground">暂无练习记录</div>
          ) : (
            historyRecords.map((r) => (
              <div key={r.id} className="rounded-2xl border border-border bg-card shadow-sm overflow-hidden">
                {/* Summary row — always visible, clickable */}
                <div
                  className="flex items-center gap-3 p-4 cursor-pointer hover:bg-muted/30 transition-colors"
                  onClick={() => handleExpandHistory(r.id)}
                >
                  <svg
                    className={`h-4 w-4 shrink-0 text-muted-foreground transition-transform ${expandedId === r.id ? 'rotate-90' : ''}`}
                    fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                  </svg>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="rounded-full bg-indigo-100 px-2 py-0.5 text-xs font-medium text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300">{r.question_category}</span>
                      <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${difficultyColors[r.difficulty] || difficultyColors['进阶']}`}>{r.difficulty}</span>
                      <span className="text-xs text-muted-foreground">{new Date(r.created_at).toLocaleDateString('zh-CN')}</span>
                    </div>
                    <p className="text-sm text-foreground line-clamp-1">{r.question}</p>
                  </div>
                  <div className="shrink-0 flex items-center gap-1">
                    <span className={`text-xl font-bold ${getScoreColor(r.total_score)}`}>{r.total_score}</span>
                    <span className="text-xs text-muted-foreground">/ 100</span>
                  </div>
                </div>

                {/* Expanded detail */}
                {expandedId === r.id && (
                  <div className="border-t border-border p-5 bg-card/50 space-y-5">
                    {expandedLoading ? (
                      <div className="flex items-center justify-center py-8">
                        <div className="h-5 w-5 animate-spin rounded-full border-2 border-indigo-500 border-t-transparent" />
                        <span className="ml-3 text-sm text-muted-foreground">加载详情...</span>
                      </div>
                    ) : expandedDetail ? (
                      <>
                        {/* Question + User Prompt */}
                        <div className="rounded-xl border bg-gradient-to-br from-indigo-50 to-violet-50 p-4 dark:from-indigo-950/30 dark:to-violet-950/30">
                          <div className="mb-2 flex items-center gap-2">
                            <span className="rounded-full bg-indigo-100 px-2 py-0.5 text-xs font-medium text-indigo-700 dark:bg-indigo-900 dark:text-indigo-300">{expandedDetail.question_category}</span>
                            <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${difficultyColors[expandedDetail.difficulty] || difficultyColors['进阶']}`}>{expandedDetail.difficulty}</span>
                          </div>
                          <p className="text-sm font-medium text-foreground">{expandedDetail.question}</p>
                        </div>
                        <div className="rounded-xl border border-border bg-card p-4">
                          <div className="mb-2 text-xs font-medium text-muted-foreground">你的 Prompt</div>
                          <pre className="whitespace-pre-wrap text-sm text-foreground leading-relaxed">{expandedDetail.user_prompt}</pre>
                        </div>
                        {/* Full analysis (same as practice view) */}
                        {renderAnalysis({
                          score: expandedDetail.total_score,
                          dimensions: expandedDetail.dimension_scores || [],
                          differences: expandedDetail.differences || [],
                          optimizations: expandedDetail.optimizations || [],
                          idealAnswer: expandedDetail.ideal_answer || '',
                          overallFeedback: expandedDetail.overall_feedback || '',
                        })}
                      </>
                    ) : (
                      <p className="py-4 text-center text-sm text-muted-foreground">加载失败</p>
                    )}
                  </div>
                )}
              </div>
            ))
          )}
          {historyTotal > 20 && (
            <div className="flex justify-center gap-2 pt-2">
              <button
                onClick={() => fetchHistory(historyPage - 1)}
                disabled={historyPage <= 1}
                className="rounded-lg border px-3 py-1 text-xs text-muted-foreground hover:bg-muted disabled:opacity-50"
              >
                上一页
              </button>
              <span className="px-3 py-1 text-xs text-muted-foreground">第 {historyPage} 页</span>
              <button
                onClick={() => fetchHistory(historyPage + 1)}
                disabled={historyPage * 20 >= historyTotal}
                className="rounded-lg border px-3 py-1 text-xs text-muted-foreground hover:bg-muted disabled:opacity-50"
              >
                下一页
              </button>
            </div>
          )}
        </div>
      ) : (
        /* ===== Practice View ===== */
        <>
          {/* Question Card */}
          <div className="rounded-2xl border bg-gradient-to-br from-indigo-50 to-violet-50 p-6 dark:from-indigo-950/30 dark:to-violet-950/30">
            {isLoadingQuestion ? (
              <div className="flex items-center gap-3">
                <div className="h-5 w-5 animate-spin rounded-full border-2 border-indigo-500 border-t-transparent" />
                <span className="text-sm text-muted-foreground">正在生成题目...</span>
              </div>
            ) : (
              <>
                <div className="mb-3 flex items-center gap-2 flex-wrap">
                  <span className="rounded-full bg-indigo-100 px-3 py-0.5 text-xs font-medium text-indigo-700 dark:bg-indigo-900 dark:text-indigo-300">{category}</span>
                  <span className={`rounded-full px-3 py-0.5 text-xs font-medium ${difficultyColors[difficulty] || difficultyColors['进阶']}`}>{difficulty}</span>
                  <select
                    value={selectedCategory}
                    onChange={(e) => setSelectedCategory(e.target.value)}
                    className="ml-auto rounded-md border border-border bg-transparent px-2 py-0.5 text-xs text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                    aria-label="选择题目类别"
                  >
                    <option value="">随机类别</option>
                    {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                  <select
                    value={selectedDifficulty}
                    onChange={(e) => setSelectedDifficulty(e.target.value)}
                    className="rounded-md border border-border bg-transparent px-2 py-0.5 text-xs text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                    aria-label="选择难度"
                  >
                    <option value="">随机难度</option>
                    {DIFFICULTIES.map(d => <option key={d} value={d}>{d}</option>)}
                  </select>
                </div>
                <h2 className="text-lg font-semibold text-foreground leading-relaxed">{question}</h2>
              </>
            )}
          </div>

          {error && (
            <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700 dark:border-red-800 dark:bg-red-900/30 dark:text-red-300">
              {error}
              {!isLoadingQuestion && (
                <button onClick={handleRefresh} className="ml-2 underline hover:text-red-900 dark:hover:text-red-200">
                  重新出题
                </button>
              )}
            </div>
          )}

          {!result && !isLoadingQuestion && (
            <div className="space-y-3">
              <label className="text-sm font-semibold text-foreground">编写你的 Prompt</label>
              <textarea
                className="min-h-[200px] w-full resize-y rounded-xl border bg-card p-4 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                placeholder="请根据题目场景编写 Prompt，注意：&#10;- 明确角色设定和上下文&#10;- 指定输出格式和约束条件&#10;- 提供示例（few-shot）效果更佳&#10;- 使用 chain-of-thought 提升推理质量"
                value={userPrompt}
                onChange={(e) => setUserPrompt(e.target.value)}
                disabled={isEvaluating}
              />
              <div className="flex items-center justify-between">
                <span className={`text-xs ${userPrompt.length < 20 ? 'text-rose-500' : 'text-muted-foreground'}`}>
                  {userPrompt.length} 字 {userPrompt.length < 20 && `（还需 ${20 - userPrompt.length} 字）`}
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
                    disabled={isEvaluating || userPrompt.trim().length < 20}
                    className="rounded-lg bg-primary px-6 py-2 text-sm font-medium text-white transition-colors hover:bg-primary/90 disabled:opacity-50"
                  >
                    {isEvaluating ? '评分中...' : '提交评分'}
                  </button>
                </div>
              </div>
            </div>
          )}

          {isEvaluating && streamingText && (
            <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
              <div className="flex items-center gap-2 mb-3">
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-indigo-500 border-t-transparent" />
                <span className="text-sm font-medium text-muted-foreground">AI 正在评分...</span>
              </div>
              <pre className="whitespace-pre-wrap text-xs text-muted-foreground leading-relaxed max-h-[300px] overflow-y-auto">{streamingText}</pre>
            </div>
          )}

          {result && (
            <>
              {renderAnalysis({
                score: result.score,
                dimensions: result.dimensions,
                differences: result.differences,
                optimizations: result.optimizations,
                idealAnswer: result.idealAnswer,
                overallFeedback: result.overallFeedback,
              })}
              <div className="flex gap-3 pt-2">
                <button
                  onClick={handleRetry}
                  className="rounded-lg border px-5 py-2 text-sm font-medium text-muted-foreground hover:bg-accent transition-colors"
                >
                  重新作答
                </button>
                <button
                  onClick={handleRefresh}
                  disabled={isRefreshing}
                  className="rounded-lg bg-primary px-5 py-2 text-sm font-medium text-white hover:bg-primary/90 disabled:opacity-50 transition-colors"
                >
                  {isRefreshing ? '生成中...' : '换一题'}
                </button>
              </div>
            </>
          )}
        </>
      )}
    </div>
  );
}
