'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import AnswerEvaluation from './AnswerEvaluation';

interface MockInterviewFlowProps {
  mockId: string;
  initialQuestion: { number: number; text: string };
  totalQuestions: number;
  onComplete: () => void;
}

interface Evaluation {
  score: number;
  gap_analysis: string;
  perfect_answer: string;
}

export default function MockInterviewFlow({
  mockId,
  initialQuestion,
  totalQuestions,
  onComplete,
}: MockInterviewFlowProps) {
  const [currentQuestion, setCurrentQuestion] = useState(initialQuestion);
  const [answer, setAnswer] = useState('');
  const [evaluation, setEvaluation] = useState<Evaluation | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLast, setIsLast] = useState(false);

  const handleSubmit = async (skip = false) => {
    if (!skip && !answer.trim()) return;

    setIsSubmitting(true);
    try {
      const res = await fetch(`/api/interview/mock/${mockId}/answer`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(skip ? { skip: true } : { answer: answer.trim() }),
      });

      const data = await res.json();

      if (!res.ok) {
        alert(data.error ?? '提交失败');
        return;
      }

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

  // 进度
  const progress = (currentQuestion.number / totalQuestions) * 100;

  return (
    <div className="space-y-6">
      {/* 进度条 */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-sm">
          <span className="text-neutral-400">
            第 {currentQuestion.number} / {totalQuestions} 题
          </span>
          <span className="text-neutral-500">{Math.round(progress)}%</span>
        </div>
        <div className="h-2 overflow-hidden rounded-full bg-neutral-800">
          <div
            className="h-full rounded-full bg-amber-600 transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* 当前问题 */}
      <div className="rounded-lg border border-neutral-700 bg-neutral-800/50 p-6">
        <h3 className="mb-2 text-xs text-neutral-500">面试问题</h3>
        <p className="text-lg text-neutral-100">{currentQuestion.text}</p>
      </div>

      {/* 评价展示 */}
      {evaluation && (
        <AnswerEvaluation
          score={evaluation.score}
          gapAnalysis={evaluation.gap_analysis}
          perfectAnswer={evaluation.perfect_answer}
        />
      )}

      {/* 回答输入或下一题按钮 */}
      {!evaluation ? (
        <div className="space-y-3">
          <Textarea
            value={answer}
            onChange={(e) => setAnswer(e.target.value)}
            placeholder="输入你的回答..."
            className="min-h-[150px] resize-none border-neutral-700 bg-neutral-800 text-neutral-100 placeholder:text-neutral-500"
            disabled={isSubmitting}
          />
          <div className="flex gap-2">
            <Button
              onClick={() => handleSubmit(false)}
              disabled={isSubmitting || !answer.trim()}
              className="flex-1 bg-amber-600 text-neutral-950 hover:bg-amber-500 disabled:opacity-50"
            >
              {isSubmitting ? '评分中...' : '提交回答'}
            </Button>
            <Button
              variant="outline"
              onClick={() => handleSubmit(true)}
              disabled={isSubmitting}
              className="border-neutral-600 text-neutral-400"
            >
              跳过
            </Button>
          </div>
        </div>
      ) : (
        <div className="flex gap-2">
          {isLast ? (
            <Button
              onClick={onComplete}
              className="flex-1 bg-amber-600 text-neutral-950 hover:bg-amber-500"
            >
              查看总结报告
            </Button>
          ) : (
            <Button
              onClick={handleNext}
              className="flex-1 bg-amber-600 text-neutral-950 hover:bg-amber-500"
            >
              下一题
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
