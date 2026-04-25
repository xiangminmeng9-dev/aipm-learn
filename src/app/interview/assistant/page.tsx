'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import Markdown from '@/components/ui/markdown';
import AnswerEvaluation from '@/components/interview/AnswerEvaluation';

interface HistoryRecord {
  id: string;
  question: string;
  category: string | null;
  answer: string | null;
  user_answer: string | null;
  evaluation: {
    score: number;
    gap_analysis: string;
    perfect_answer: string;
    dimensions?: Record<string, { score: number; comment: string }>;
    feedback?: string;
    key_points?: string[];
  } | null;
  created_at: string;
  frequency?: string;
}

interface MemoryRecord {
  question: string;
  answer: string;
  category: string;
  created_at: string;
}

const CATEGORIES = [
  'AI产品思维', 'AI技术理解', '用户研究', '数据分析',
  '项目管理', '沟通协作', '商业思维', '创新思维',
  'AI伦理与合规', '大模型应用设计',
];

function frequencyStyle(freq?: string) {
  if (freq === '高频') return 'bg-rose-50 text-rose-600';
  if (freq === '中频') return 'bg-amber-50 text-amber-600';
  return 'bg-gray-50 text-gray-500';
}

export default function AssistantPage() {
  const [question, setQuestion] = useState('');
  const [category, setCategory] = useState('');
  const [answer, setAnswer] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const [currentRecordId, setCurrentRecordId] = useState<string | null>(null);
  const [userAnswer, setUserAnswer] = useState('');
  const [evaluation, setEvaluation] = useState<HistoryRecord['evaluation']>(null);
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [history, setHistory] = useState<HistoryRecord[]>([]);
  const [frequency, setFrequency] = useState<string>('');
  const [memory, setMemory] = useState<MemoryRecord[]>([]);
  const abortRef = useRef<AbortController | null>(null);
  const answerEndRef = useRef<HTMLDivElement>(null);

  // Fetch memory for current category
  const fetchMemory = useCallback(async (cat: string) => {
    if (!cat) { setMemory([]); return; }
    try {
      const res = await fetch(`/api/interview/assistant/history?category=${encodeURIComponent(cat)}`);
      if (res.ok) {
        const data = await res.json();
        const records = (data.records || []) as HistoryRecord[];
        setMemory(records.filter((r: HistoryRecord) => r.answer).slice(0, 5).map((r: HistoryRecord) => ({
          question: r.question,
          answer: r.answer || '',
          category: r.category || '',
          created_at: r.created_at,
        })));
      }
    } catch { /* ignore */ }
  }, []);

  const fetchFrequency = useCallback(async (cat: string) => {
    if (!cat) { setFrequency(''); return; }
    try {
      const res = await fetch(`/api/interview/frequency?type_name=${encodeURIComponent(cat)}`);
      if (res.ok) {
        const data = await res.json();
        setFrequency(data.frequency || '');
      }
    } catch { /* ignore */ }
  }, []);

  const fetchHistory = useCallback(async () => {
    try {
      const res = await fetch('/api/interview/assistant/history');
      if (res.ok) {
        const data = await res.json();
        setHistory(data.records || []);
      }
    } catch { /* ignore */ }
  }, []);

  // Load history on mount
  useEffect(() => {
    fetchHistory();
  }, [fetchHistory]);

  // Auto-scroll answer
  useEffect(() => {
    answerEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [answer]);

  const handleSubmit = async () => {
    if (!question.trim() || isStreaming) return;

    setIsStreaming(true);
    setAnswer('');
    setEvaluation(null);
    setCurrentRecordId(null);
    setUserAnswer('');

    abortRef.current = new AbortController();

    try {
      const res = await fetch('/api/interview/assistant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question: question.trim(), category: category || undefined }),
        signal: abortRef.current.signal,
      });

      if (!res.ok) {
        const data = await res.json();
        alert(data.error || '请求失败');
        setIsStreaming(false);
        return;
      }

      const reader = res.body?.getReader();
      const decoder = new TextDecoder();

      if (reader) {
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
                  alert(data.error);
                }
              } catch { /* ignore parse errors */ }
            }
          }
        }
      }
    } catch (err) {
      if (err instanceof Error && err.name !== 'AbortError') {
        alert('网络错误');
      }
    } finally {
      setIsStreaming(false);
      // Refresh memory and history after answering
      if (category) fetchMemory(category);
      fetchHistory();
    }
  };

  const handleEvaluate = async () => {
    if (!userAnswer.trim() || !currentRecordId || isEvaluating) return;
    setIsEvaluating(true);

    try {
      const res = await fetch('/api/interview/assistant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
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
        alert(data.error || '评估失败');
      }
    } catch {
      alert('网络错误');
    } finally {
      setIsEvaluating(false);
    }
  };

  const handleCategoryChange = (cat: string) => {
    setCategory(cat);
    fetchFrequency(cat);
    fetchMemory(cat);
  };

  const handleNewQuestion = () => {
    setQuestion('');
    setAnswer('');
    setEvaluation(null);
    setCurrentRecordId(null);
    setUserAnswer('');
  };

  const loadHistoryRecord = (record: HistoryRecord) => {
    setQuestion(record.question);
    setCategory(record.category || '');
    setAnswer(record.answer || '');
    setCurrentRecordId(record.id);
    setUserAnswer(record.user_answer || '');
    setEvaluation(record.evaluation);
    setShowHistory(false);
  };

  return (
    <div className="flex h-full flex-col bg-[#F8F9FB]">
      {/* Header */}
      <div className="shrink-0 border-b border-[#E5E7EB] bg-white px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-lg font-semibold text-[#1F2937]">面试助手</h1>
            <p className="text-xs text-[#6B7280]">AI 面试教练，随时提问，深度分析</p>
          </div>
          <Button
            variant="outline"
            onClick={() => { setShowHistory(!showHistory); if (!showHistory) fetchHistory(); }}
            className="border-[#E5E7EB] text-[#6B7280] text-xs"
          >
            {showHistory ? '关闭历史' : '历史记录'}
          </Button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-6 space-y-5">

      {/* History Panel */}
      {showHistory && (
        <Card className="border-[#E5E7EB] bg-white">
          <CardHeader className="pb-2">
            <CardTitle className="text-base text-[#1F2937]">问答历史</CardTitle>
          </CardHeader>
          <CardContent className="max-h-80 space-y-2 overflow-y-auto">
            {history.length === 0 ? (
              <p className="py-4 text-center text-sm text-[#9CA3AF]">暂无记录</p>
            ) : (
              history.map((record) => (
                <button
                  key={record.id}
                  onClick={() => loadHistoryRecord(record)}
                  className="w-full rounded-lg border border-[#E5E7EB] bg-[#F9FAFB] p-3 text-left transition hover:border-indigo-200 hover:bg-indigo-50/30"
                >
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-[#1F2937] line-clamp-1">{record.question}</span>
                    {record.category && (
                      <span className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ${frequencyStyle(record.frequency)}`}>
                        {record.category}
                      </span>
                    )}
                    {record.evaluation && (
                      <span className="shrink-0 rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-600">
                        已评估
                      </span>
                    )}
                  </div>
                  <p className="mt-1 text-xs text-[#9CA3AF]">
                    {new Date(record.created_at).toLocaleString('zh-CN')}
                  </p>
                </button>
              ))
            )}
          </CardContent>
        </Card>
      )}

      {/* Memory Context */}
      {memory.length > 0 && (
        <Card className="border-indigo-100 bg-indigo-50/30">
          <CardHeader className="pb-2">
            <div className="flex items-center gap-2">
              <svg className="h-4 w-4 text-indigo-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
              </svg>
              <CardTitle className="text-sm text-indigo-700">对话记忆 · {category}</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-2">
            {memory.map((m, i) => (
              <div key={i} className="rounded-lg border border-indigo-100 bg-white/60 px-3 py-2">
                <p className="text-xs font-medium text-[#1F2937] line-clamp-1">Q: {m.question}</p>
                <p className="mt-0.5 text-[11px] text-[#6B7280] line-clamp-2">A: {m.answer.substring(0, 100)}...</p>
              </div>
            ))}
            <p className="text-[10px] text-indigo-400">AI 教练会参考这些历史记录保持对话连贯性</p>
          </CardContent>
        </Card>
      )}

      {/* Input Area */}
      <Card className="border-[#E5E7EB] bg-white">
        <CardContent className="space-y-4 pt-6">
          {/* Category Select */}
          <div className="flex flex-wrap gap-2">
            {CATEGORIES.map((cat) => (
              <button
                key={cat}
                onClick={() => handleCategoryChange(cat === category ? '' : cat)}
                className={`rounded-full px-3 py-1.5 text-xs font-medium transition ${
                  cat === category
                    ? 'bg-indigo-600 text-white'
                    : 'bg-[#F3F4F6] text-[#6B7280] hover:bg-indigo-50 hover:text-indigo-600'
                }`}
              >
                {cat}
                {cat === category && frequency && (
                  <span className={`ml-1.5 inline-flex items-center rounded-full px-1.5 py-0.5 text-[10px] ${frequencyStyle(frequency)}`}>
                    {frequency}
                  </span>
                )}
              </button>
            ))}
          </div>

          {/* Question Input */}
          <div className="flex gap-3">
            <Textarea
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              placeholder="输入面试问题，AI 教练帮你深度分析..."
              className="min-h-[80px] flex-1 resize-none border-[#E5E7EB] bg-[#F9FAFB] text-[#1F2937] placeholder:text-[#9CA3AF]"
              disabled={isStreaming}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) handleSubmit();
              }}
            />
            <Button
              onClick={handleSubmit}
              disabled={isStreaming || !question.trim()}
              className="shrink-0 bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-50"
            >
              {isStreaming ? '分析中...' : '提问'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* AI Answer */}
      {answer && (
        <Card className="border-[#E5E7EB] bg-white">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base text-[#1F2937]">AI 教练分析</CardTitle>
              {category && frequency && (
                <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${frequencyStyle(frequency)}`}>
                  {category} · {frequency}
                </span>
              )}
            </div>
          </CardHeader>
          <CardContent>
            <div className="prose prose-sm max-w-none">
              <Markdown content={answer} />
            </div>
            <div ref={answerEndRef} />
          </CardContent>
        </Card>
      )}

      {/* User Answer + Evaluate */}
      {answer && !isStreaming && (
        <Card className="border-[#E5E7EB] bg-white">
          <CardHeader className="pb-2">
            <CardTitle className="text-base text-[#1F2937]">试试你的回答</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Textarea
              value={userAnswer}
              onChange={(e) => setUserAnswer(e.target.value)}
              placeholder="输入你的回答，AI 教练帮你评分..."
              className="min-h-[120px] resize-none border-[#E5E7EB] bg-[#F9FAFB] text-[#1F2937] placeholder:text-[#9CA3AF]"
              disabled={isEvaluating}
            />
            <div className="flex gap-2">
              <Button
                onClick={handleEvaluate}
                disabled={isEvaluating || !userAnswer.trim()}
                className="bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-50"
              >
                {isEvaluating ? '评分中...' : '提交评估'}
              </Button>
              <Button
                variant="outline"
                onClick={handleNewQuestion}
                className="border-[#E5E7EB] text-[#6B7280]"
              >
                新问题
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Evaluation Result */}
      {evaluation && (
        <AnswerEvaluation
          score={evaluation.score}
          gapAnalysis={evaluation.gap_analysis}
          perfectAnswer={evaluation.perfect_answer}
          dimensions={evaluation.dimensions}
          feedback={evaluation.feedback}
          keyPoints={evaluation.key_points}
        />
      )}
      </div>
    </div>
  );
}
