'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import AnswerEvaluation from './AnswerEvaluation';
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
  const [evaluation, setEvaluation] = useState<Evaluation | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLast, setIsLast] = useState(false);
  const [totalQ, setTotalQ] = useState(totalQuestions ?? 0);
  const [answers, setAnswers] = useState<AnswerRecord[]>([]);
  const [totalScore, setTotalScore] = useState(0);
  const [expandedHistory, setExpandedHistory] = useState<number | null>(null);

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

          const currentAnswered = answersData.answers.find(
            (a: Record<string, unknown>) =>
              a.question_number === currentQ.number && (a.user_answer || a.is_skipped || a.answered_at)
          );
          if (currentAnswered && currentAnswered.score != null) {
            setEvaluation({
              score: currentAnswered.score as number,
              gap_analysis: (currentAnswered.gap_analysis as string) || '',
              perfect_answer: (currentAnswered.perfect_answer as string) || '',
              thinking_framework: (currentAnswered.thinking_framework as string) || undefined,
              dimensions: (currentAnswered.dimensions as { name: string; score: number; comment: string }[]) || undefined,
            });
          }

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
    try {
      const supabase = createClient();
      const { data: { session } } = await supabase.auth.getSession();
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (session) headers['Authorization'] = `Bearer ${session.access_token}`;

      const res = await fetch(`/api/interview/mock/${mockId}/answer`, {
        method: 'POST',
        headers,
        body: JSON.stringify(skip ? { skip: true } : { answer: answer.trim() }),
      });

      const data = await res.json();

      if (!res.ok) {
        alert(data.error ?? '提交失败');
        return;
      }

      const newAnswer: AnswerRecord = {
        number: currentQuestion.number,
        question: currentQuestion.text,
        answer: skip ? undefined : answer.trim(),
        is_skipped: skip,
        evaluation: data.evaluation ? {
          score: data.evaluation.score,
          gap_analysis: data.evaluation.gap_analysis,
          perfect_answer: data.evaluation.perfect_answer,
          thinking_framework: data.evaluation.thinking_framework,
          dimensions: data.evaluation.dimensions,
        } : undefined,
      };
      setAnswers(prev => [...prev, newAnswer]);

      const allScored = [...answers, newAnswer].filter(a => a.evaluation);
      const sum = allScored.reduce((s, a) => s + (a.evaluation?.score ?? 0), 0);
      setTotalScore(allScored.length > 0 ? Math.round(sum / allScored.length) : 0);

      setEvaluation(data.evaluation);
      setIsLast(data.is_last);

      if (data.next_question) {
        setCurrentQuestion(data.next_question);
      }
    } catch {
      alert('网络错误');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleNext = () => {
    setAnswer('');
    setEvaluation(null);
    setExpandedHistory(null);
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
          <div
            className="h-full rounded-full bg-indigo-500 transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* History — clickable to expand */}
      {answers.length > 0 && (
        <div className="space-y-2">
          <h3 className="text-xs font-medium text-muted-foreground">历史问答（点击回顾）</h3>
          {answers.map((a) => (
            <div key={a.number} className="rounded-xl border border-border bg-card overflow-hidden">
              {/* Header — always visible */}
              <button
                className="w-full flex items-center justify-between p-3 text-left hover:bg-muted/50 transition-colors"
                onClick={() => setExpandedHistory(expandedHistory === a.number ? null : a.number)}
              >
                <div className="flex items-center gap-3">
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-indigo-100 text-xs font-bold text-indigo-600">
                    {a.number}
                  </span>
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
                    }`}>
                      {a.evaluation.score}分
                    </span>
                  ) : null}
                  <svg className={`h-4 w-4 text-muted-foreground transition-transform ${expandedHistory === a.number ? 'rotate-180' : ''}`}
                    fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </button>

              {/* Expanded content */}
              {expandedHistory === a.number && (
                <div className="border-t border-border p-4 space-y-4">
                  {/* Question */}
                  <div>
                    <h4 className="text-xs font-semibold text-muted-foreground mb-1">面试问题</h4>
                    <p className="text-sm text-foreground">{a.question}</p>
                  </div>

                  {/* User answer */}
                  {a.answer && (
                    <div>
                      <h4 className="text-xs font-semibold text-muted-foreground mb-1">你的回答</h4>
                      <div className="rounded-lg bg-muted/50 p-3 text-sm text-foreground whitespace-pre-wrap">{a.answer}</div>
                    </div>
                  )}

                  {/* Evaluation */}
                  {a.evaluation && (
                    <AnswerEvaluation
                      score={a.evaluation.score}
                      gapAnalysis={a.evaluation.gap_analysis}
                      perfectAnswer={a.evaluation.perfect_answer}
                      thinkingFramework={a.evaluation.thinking_framework}
                      dimensions={a.evaluation.dimensions}
                    />
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

      {/* Evaluation for current question */}
      {evaluation && (
        <AnswerEvaluation
          score={evaluation.score}
          gapAnalysis={evaluation.gap_analysis}
          perfectAnswer={evaluation.perfect_answer}
          thinkingFramework={evaluation.thinking_framework}
          dimensions={evaluation.dimensions}
        />
      )}

      {/* Answer input or next button */}
      {!evaluation ? (
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
              onClick={() => onComplete({ mockId, totalQuestions: totalQ || totalQuestions || 0, totalScore, answers })}
              className="flex-1 bg-indigo-600 text-white hover:bg-indigo-700"
            >
              查看总结报告
            </Button>
          ) : (
            <Button
              onClick={handleNext}
              className="flex-1 bg-indigo-600 text-white hover:bg-indigo-700"
            >
              下一题
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
