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
  evaluation?: {
    score: number;
    gap_analysis: string;
  };
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

  // Restore previous answers from server on mount
  useEffect(() => {
    async function restoreHistory() {
      try {
        const supabase = createClient();
        const { data: { session } } = await supabase.auth.getSession();
        const headers: Record<string, string> = {};
        if (session) headers['Authorization'] = `Bearer ${session.access_token}`;

        // 1. Get mock interview state (status, current_question, total_questions)
        const stateRes = await fetch(`/api/interview/mock/${mockId}/state`, { headers });
        if (!stateRes.ok) return;
        const stateData = await stateRes.json();

        if (stateData.status === 'completed') {
          // Interview already completed — trigger onComplete
          onComplete({ mockId, totalQuestions: stateData.total_questions || 0, totalScore: 0, answers: [] });
          return;
        }

        if (stateData.total_questions) setTotalQ(stateData.total_questions);

        // 2. Get all existing answers
        const answersRes = await fetch(`/api/interview/mock/${mockId}/answers`, { headers });
        if (!answersRes.ok) return;
        const answersData = await answersRes.json();

        if (answersData.answers && answersData.answers.length > 0) {
          // Separate answered and unanswered
          const answered: AnswerRecord[] = [];
          let currentQ = { number: 1, text: '加载中...' };
          let currentEval: Evaluation | null = null;

          for (const a of answersData.answers) {
            const record: AnswerRecord = {
              number: a.question_number as number,
              question: a.question_text as string,
              answer: (a.user_answer as string) || undefined,
              is_skipped: a.is_skipped as boolean,
              evaluation: a.score != null ? {
                score: a.score as number,
                gap_analysis: (a.gap_analysis as string) || '',
              } : undefined,
            };

            // If this answer has been answered or skipped, add to history
            if (a.user_answer || a.is_skipped || a.answered_at) {
              answered.push(record);
            } else {
              // This is the current unanswered question
              currentQ = { number: a.question_number, text: a.question_text };
            }
          }

          setAnswers(answered);
          setCurrentQuestion(currentQ);

          // Restore evaluation for the current question if it was already answered
          // (e.g., user answered but hasn't clicked "next" yet)
          const currentAnswered = answersData.answers.find(
            (a: Record<string, unknown>) =>
              a.question_number === currentQ.number && (a.user_answer || a.is_skipped || a.answered_at)
          );
          if (currentAnswered && currentAnswered.score != null) {
            currentEval = {
              score: currentAnswered.score as number,
              gap_analysis: (currentAnswered.gap_analysis as string) || '',
              perfect_answer: (currentAnswered.perfect_answer as string) || '',
            };
            setEvaluation(currentEval);
          }

          // Calculate total score
          const scored = answered.filter(a => a.evaluation);
          const sum = scored.reduce((s, a) => s + (a.evaluation?.score ?? 0), 0);
          setTotalScore(scored.length > 0 ? Math.round(sum / scored.length) : 0);

          // If we're on the last question and it's been answered, mark as last
          if (stateData.total_questions && currentQ.number >= stateData.total_questions && answered.length >= stateData.total_questions) {
            setIsLast(true);
          }
        } else if (stateData.current_question) {
          // No answers in DB but state says we have a current question
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

      // Accumulate the answer
      const newAnswer: AnswerRecord = {
        number: currentQuestion.number,
        question: currentQuestion.text,
        answer: skip ? undefined : answer.trim(),
        is_skipped: skip,
        evaluation: data.evaluation ? {
          score: data.evaluation.score,
          gap_analysis: data.evaluation.gap_analysis,
        } : undefined,
      };
      setAnswers(prev => [...prev, newAnswer]);

      // Update total score
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
  };

  const progress = (currentQuestion.number / (totalQ || totalQuestions || 1)) * 100;

  return (
    <div className="space-y-6">
      {/* 进度条 */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">
            第 {currentQuestion.number} / {totalQ || totalQuestions || '?'} 题
          </span>
          <span className="text-muted-foreground">{Math.round(progress)}%</span>
        </div>
        <div className="h-2 overflow-hidden rounded-full bg-[#E5E7EB]">
          <div
            className="h-full rounded-full bg-indigo-500 transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Previous answers history */}
      {answers.length > 0 && (
        <div className="space-y-2">
          <h3 className="text-xs font-medium text-muted-foreground">已完成的问答</h3>
          {answers.map((a) => (
            <div key={a.number} className={`rounded-lg border p-3 text-sm ${
              a.is_skipped ? 'border-border bg-muted' : 'border-indigo-100 bg-indigo-50/50'
            }`}>
              <div className="flex items-center justify-between">
                <span className="font-medium text-foreground">第{a.number}题</span>
                {a.evaluation && (
                  <span className={`text-xs font-medium ${
                    a.evaluation.score >= 80 ? 'text-emerald-600' :
                    a.evaluation.score >= 60 ? 'text-amber-600' : 'text-rose-600'
                  }`}>
                    {a.evaluation.score}分
                  </span>
                )}
                {a.is_skipped && <span className="text-xs text-muted-foreground">已跳过</span>}
              </div>
              <p className="mt-1 text-muted-foreground line-clamp-1">{a.question}</p>
            </div>
          ))}
        </div>
      )}

      {/* 当前问题 */}
      <div className="rounded-xl border border-border bg-card p-6">
        <h3 className="mb-2 text-xs text-muted-foreground">面试问题</h3>
        <p className="text-lg text-foreground">{currentQuestion.text}</p>
      </div>

      {/* 评价展示 */}
      {evaluation && (
        <AnswerEvaluation
          score={evaluation.score}
          gapAnalysis={evaluation.gap_analysis}
          perfectAnswer={evaluation.perfect_answer}
          thinkingFramework={evaluation.thinking_framework}
          dimensions={evaluation.dimensions}
        />
      )}

      {/* 回答输入或下一题按钮 */}
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