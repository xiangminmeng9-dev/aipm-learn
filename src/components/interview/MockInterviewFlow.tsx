'use client';

import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { createClient } from '@/lib/supabase/client';

interface MockInterviewFlowProps {
  mockId: string;
  initialQuestion?: { number: number; text: string };
  totalQuestions?: number;
  onComplete: (result: MockInterviewResult) => void;
  onCancel?: () => void;
}

interface Evaluation {
  score: number;
  gap_analysis: string;
  perfect_answer: string;
  thinking_framework?: string;
  dimensions?: { name: string; score: number; comment: string }[];
}

interface AnswerRecord {
  number: number;
  question: string;
  answer?: string;
  is_skipped: boolean;
  evaluation?: Evaluation;
  evaluation_text?: string;
}

export interface MockInterviewResult {
  mockId: string;
  totalQuestions: number;
  totalScore: number;
  answers: AnswerRecord[];
}

export default function MockInterviewFlow({
  mockId,
  initialQuestion,
  totalQuestions,
  onComplete,
}: MockInterviewFlowProps) {
  const [currentQuestion, setCurrentQuestion] = useState(initialQuestion ?? { number: 1, text: '加载中...' });
  const [answer, setAnswer] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLast, setIsLast] = useState(false);
  const [totalQ, setTotalQ] = useState(totalQuestions ?? 0);
  const [answers, setAnswers] = useState<AnswerRecord[]>([]);
  const [totalScore, setTotalScore] = useState(0);
  const [expandedHistory, setExpandedHistory] = useState<number | null>(null);

  // Streaming evaluation state
  const [streamingText, setStreamingText] = useState('');
  const [streamingScore, setStreamingScore] = useState<number | null>(null);
  const evaluationRef = useRef<AnswerRecord | null>(null);

  useEffect(() => {
    async function restoreHistory() {
      try {
        const supabase = createClient();
        const { data: { session } } = await supabase.auth.getSession();
        const headers: Record<string, string> = {};
        if (session) headers['Authorization'] = `Bearer ${session.access_token}`;

        const stateRes = await fetch(`/api/interview/mock/${mockId}/state`, { headers });
        if (!stateRes.ok) return;
        const stateData = await stateRes.json();

        if (stateData.status === 'completed') {
          onComplete({ mockId, totalQuestions: stateData.total_questions || 0, totalScore: 0, answers: [] });
          return;
        }

        if (stateData.total_questions) setTotalQ(stateData.total_questions);

        const answersRes = await fetch(`/api/interview/mock/${mockId}/answers`, { headers });
        if (!answersRes.ok) return;
        const answersData = await answersRes.json();

        if (answersData.answers && answersData.answers.length > 0) {
          const answered: AnswerRecord[] = [];
          let currentQ = { number: 1, text: '加载中...' };

          for (const a of answersData.answers) {
            const record: AnswerRecord = {
              number: a.question_number as number,
              question: a.question_text as string,
              answer: (a.user_answer as string) || undefined,
              is_skipped: a.is_skipped as boolean,
              evaluation: a.score != null ? {
                score: a.score as number,
                gap_analysis: (a.gap_analysis as string) || '',
                perfect_answer: (a.perfect_answer as string) || '',
                thinking_framework: (a.thinking_framework as string) || undefined,
                dimensions: (a.dimensions as { name: string; score: number; comment: string }[]) || undefined,
              } : undefined,
            };

            if (a.user_answer || a.is_skipped || a.answered_at) {
              answered.push(record);
            } else {
              currentQ = { number: a.question_number, text: a.question_text };
            }
          }

          setAnswers(answered);
          setCurrentQuestion(currentQ);

          const scored = answered.filter(a => a.evaluation);
          const sum = scored.reduce((s, a) => s + (a.evaluation?.score ?? 0), 0);
          setTotalScore(scored.length > 0 ? Math.round(sum / scored.length) : 0);

          if (stateData.total_questions && currentQ.number >= stateData.total_questions && answered.length >= stateData.total_questions) {
            setIsLast(true);
          }
        } else if (stateData.current_question) {
          setCurrentQuestion(stateData.current_question);
        }
      } catch { /* ignore */ }
    }

    restoreHistory();
  }, [mockId]);

  const handleSubmit = async (skip = false) => {
    if (!skip && !answer.trim()) return;

    setIsSubmitting(true);
    setStreamingText('');
    setStreamingScore(null);
    evaluationRef.current = null;

    try {
      const supabase = createClient();
      const { data: { session } } = await supabase.auth.getSession();
      const headers: Record<string, string> = {};
      if (session) headers['Authorization'] = `Bearer ${session.access_token}`;

      if (skip) {
        // Skip — simple JSON response
        headers['Content-Type'] = 'application/json';
        const res = await fetch(`/api/interview/mock/${mockId}/answer`, {
          method: 'POST',
          headers,
          body: JSON.stringify({ skip: true }),
        });
        const data = await res.json();
        if (!res.ok) { alert(data.error ?? '提交失败'); return; }

        const newAnswer: AnswerRecord = {
          number: currentQuestion.number,
          question: currentQuestion.text,
          is_skipped: true,
        };
        setAnswers(prev => [...prev, newAnswer]);
        setIsLast(data.is_last);
        if (data.next_question) setCurrentQuestion(data.next_question);
        setIsSubmitting(false);
        return;
      }

      // Normal answer — SSE streaming
      headers['Content-Type'] = 'application/json';
      const res = await fetch(`/api/interview/mock/${mockId}/answer`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ answer: answer.trim() }),
      });

      if (!res.ok) {
        const data = await res.json();
        alert(data.error ?? '提交失败');
        setIsSubmitting(false);
        return;
      }

      // Read SSE stream
      const reader = res.body?.getReader();
      if (!reader) { alert('网络错误'); setIsSubmitting(false); return; }

      const decoder = new TextDecoder();
      let fullText = '';
      let finalScore = 0;
      let nextQuestion: { number: number; text: string } | null = null;
      let isLastQ = false;

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split('\n');

        for (const line of lines) {
          if (!line.startsWith('data: ')) continue;
          try {
            const event = JSON.parse(line.slice(6));

            if (event.type === 'text') {
              fullText += event.content;
              setStreamingText(fullText);
            } else if (event.type === 'done') {
              finalScore = event.score ?? 0;
              isLastQ = event.is_last;
              nextQuestion = event.next_question;
            } else if (event.type === 'error') {
              alert(event.message || '评分出错');
            }
          } catch { /* skip malformed */ }
        }
      }

      setStreamingScore(finalScore);

      const newAnswer: AnswerRecord = {
        number: currentQuestion.number,
        question: currentQuestion.text,
        answer: answer.trim(),
        is_skipped: false,
        evaluation_text: fullText,
        evaluation: {
          score: finalScore,
          gap_analysis: '',
          perfect_answer: '',
        },
      };
      evaluationRef.current = newAnswer;

      const allScored = [...answers, newAnswer].filter(a => a.evaluation);
      const sum = allScored.reduce((s, a) => s + (a.evaluation?.score ?? 0), 0);
      setTotalScore(allScored.length > 0 ? Math.round(sum / allScored.length) : 0);

      setIsLast(isLastQ);
      if (nextQuestion) setCurrentQuestion(nextQuestion);
    } catch {
      alert('网络错误');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleNext = () => {
    setAnswer('');
    setStreamingText('');
    setStreamingScore(null);
    setExpandedHistory(null);

    // Commit the answer to history
    if (evaluationRef.current) {
      setAnswers(prev => [...prev, evaluationRef.current!]);
      evaluationRef.current = null;
    }
  };

  const handleComplete = () => {
    if (evaluationRef.current) {
      setAnswers(prev => [...prev, evaluationRef.current!]);
    }
    onComplete({ mockId, totalQuestions: totalQ || totalQuestions || 0, totalScore, answers: [...answers, evaluationRef.current ? evaluationRef.current : undefined].filter(Boolean) as AnswerRecord[] });
  };

  const progress = (currentQuestion.number / (totalQ || totalQuestions || 1)) * 100;

  return (
    <div className="space-y-5">
      {/* Progress bar */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">
            第 {currentQuestion.number} / {totalQ || totalQuestions || '?'} 题
          </span>
          <span className="text-muted-foreground">{Math.round(progress)}%</span>
        </div>
        <div className="h-2 overflow-hidden rounded-full bg-gray-100">
          <div className="h-full rounded-full bg-indigo-500 transition-all duration-300" style={{ width: `${progress}%` }} />
        </div>
      </div>

      {/* History — clickable to expand */}
      {answers.length > 0 && (
        <div className="space-y-2">
          <h3 className="text-xs font-medium text-muted-foreground">历史问答（点击回顾）</h3>
          {answers.map((a) => (
            <div key={a.number} className="rounded-xl border border-border bg-card overflow-hidden">
              <button
                className="w-full flex items-center justify-between p-3 text-left hover:bg-muted/50 transition-colors"
                onClick={() => setExpandedHistory(expandedHistory === a.number ? null : a.number)}
              >
                <div className="flex items-center gap-3">
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-indigo-100 text-xs font-bold text-indigo-600">{a.number}</span>
                  <span className="text-sm text-foreground line-clamp-1 max-w-[300px]">{a.question}</span>
                </div>
                <div className="flex items-center gap-2">
                  {a.is_skipped ? (
                    <span className="text-xs text-muted-foreground">已跳过</span>
                  ) : a.evaluation ? (
                    <span className={`text-sm font-bold ${
                      a.evaluation.score >= 90 ? 'text-emerald-600' :
                      a.evaluation.score >= 70 ? 'text-blue-600' :
                      a.evaluation.score >= 50 ? 'text-amber-600' : 'text-rose-600'
                    }`}>{a.evaluation.score}分</span>
                  ) : null}
                  <svg className={`h-4 w-4 text-muted-foreground transition-transform ${expandedHistory === a.number ? 'rotate-180' : ''}`}
                    fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </button>

              {expandedHistory === a.number && (
                <div className="border-t border-border p-4 space-y-4">
                  <div>
                    <h4 className="text-xs font-semibold text-muted-foreground mb-1">面试问题</h4>
                    <p className="text-sm text-foreground">{a.question}</p>
                  </div>
                  {a.answer && (
                    <div>
                      <h4 className="text-xs font-semibold text-muted-foreground mb-1">你的回答</h4>
                      <div className="rounded-lg bg-muted/50 p-3 text-sm text-foreground whitespace-pre-wrap">{a.answer}</div>
                    </div>
                  )}
                  {a.evaluation_text && (
                    <div className="rounded-xl border border-border bg-card p-4">
                      <div className="text-sm text-foreground whitespace-pre-wrap">{a.evaluation_text}</div>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Current question */}
      <div className="rounded-xl border-2 border-indigo-200 bg-indigo-50/30 p-5">
        <h3 className="mb-2 text-xs font-semibold text-indigo-600">当前问题</h3>
        <p className="text-lg font-medium text-foreground">{currentQuestion.text}</p>
      </div>

      {/* Streaming evaluation display */}
      {streamingText && (
        <div className="rounded-xl border border-border bg-card p-5">
          {/* Score badge at top */}
          {streamingScore != null && (
            <div className="mb-3 flex items-center gap-2">
              <span className={`text-xl font-bold ${
                streamingScore >= 90 ? 'text-emerald-600' :
                streamingScore >= 70 ? 'text-blue-600' :
                streamingScore >= 50 ? 'text-amber-600' : 'text-rose-600'
              }`}>{streamingScore}分</span>
              <span className={`text-xs ${
                streamingScore >= 90 ? 'text-emerald-500' :
                streamingScore >= 70 ? 'text-blue-500' :
                streamingScore >= 50 ? 'text-amber-500' : 'text-rose-500'
              }`}>{streamingScore >= 90 ? '优秀' : streamingScore >= 70 ? '良好' : streamingScore >= 50 ? '及格' : '需加强'}</span>
            </div>
          )}
          {/* Streaming text — natural language evaluation */}
          <div className="text-sm text-foreground whitespace-pre-wrap leading-relaxed">{streamingText}</div>
          {isSubmitting && !streamingScore && (
            <div className="mt-2 flex items-center gap-2 text-xs text-muted-foreground">
              <div className="h-3 w-3 animate-spin rounded-full border-2 border-indigo-500 border-t-transparent" />
              <span>AI 正在评分...</span>
            </div>
          )}
        </div>
      )}

      {/* Answer input or next button */}
      {!streamingText ? (
        <div className="space-y-3">
          <Textarea
            value={answer}
            onChange={(e) => setAnswer(e.target.value)}
            placeholder="输入你的回答..."
            className="min-h-[150px] resize-none border-border bg-muted text-foreground placeholder:text-muted-foreground"
            disabled={isSubmitting}
          />
          <div className="flex gap-2">
            <Button
              onClick={() => handleSubmit(false)}
              disabled={isSubmitting || !answer.trim()}
              className="flex-1 bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-50"
            >
              {isSubmitting ? '评分中...' : '提交回答'}
            </Button>
            <Button
              variant="outline"
              onClick={() => handleSubmit(true)}
              disabled={isSubmitting}
              className="border-border text-muted-foreground"
            >
              跳过
            </Button>
          </div>
        </div>
      ) : (
        <div className="flex gap-2">
          {isLast ? (
            <Button
              onClick={handleComplete}
              className="flex-1 bg-indigo-600 text-white hover:bg-indigo-700"
            >
              查看总结报告
            </Button>
          ) : (
            <Button
              onClick={handleNext}
              className="flex-1 bg-indigo-600 text-white hover:bg-indigo-700"
              disabled={isSubmitting}
            >
              下一题
            </Button>
          )}
        </div>
      )}
    </div>
  );
}