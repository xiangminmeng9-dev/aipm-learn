'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { STAGES_CONFIG } from '@/lib/simulator-config';
import StageDetail from '@/components/simulator/StageDetail';
import InteractiveChat from '@/components/simulator/InteractiveChat';

interface StagePageProps {
  params: Promise<{ stageId: string }>;
}

export default function StagePage({ params }: StagePageProps) {
  const [stageId, setStageId] = useState<string | null>(null);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [initialMessages, setInitialMessages] = useState<{ role: 'user' | 'assistant'; content: string }[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showDetail, setShowDetail] = useState(true);
  const [evaluation, setEvaluation] = useState<{ passed: boolean; score: number; feedback: string } | null>(null);
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    params.then(({ stageId: id }) => {
      setStageId(id);
      const sid = searchParams.get('sid');
      setSessionId(sid);

      if (sid && id) {
        fetch(`/api/simulator/chat?session_id=${sid}&stage_id=${id}`)
          .catch(() => {});
        setIsLoading(false);
      } else {
        setIsLoading(false);
      }
    });
  }, [params, searchParams]);

  const stage = STAGES_CONFIG.find(s => s.id === stageId);

  const handleEvaluation = useCallback(async (evalResult: { passed: boolean; score: number; feedback: string }) => {
    setEvaluation(evalResult);

    if (evalResult.passed && sessionId && stageId) {
      await fetch('/api/simulator/progress', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'next_stage',
          stage_id: stageId,
          score_data: { score: evalResult.score, feedback: evalResult.feedback },
        }),
      });
    }
  }, [sessionId, stageId]);

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#F8F9FB]">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-teal-500 border-t-transparent" />
      </div>
    );
  }

  if (!stage || !sessionId) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-[#F8F9FB]">
        <p className="text-gray-500">阶段不存在</p>
        <Link href="/simulator" className="mt-4 text-teal-600 hover:underline">返回路线图</Link>
      </div>
    );
  }

  return (
    <div className="flex h-screen flex-col bg-[#F8F9FB]">
      <header className="shrink-0 border-b border-gray-200 bg-white px-6 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/simulator" className="text-sm text-teal-600 hover:underline">← 返回路线图</Link>
            <span className="text-gray-300">|</span>
            <span className="text-sm font-semibold text-gray-800">{stage.title}</span>
            <span className="text-sm text-gray-400">{stage.npcAvatar} {stage.npcName}</span>
          </div>
          <button
            onClick={() => setShowDetail(!showDetail)}
            className="rounded-lg bg-gray-100 px-3 py-1.5 text-xs text-gray-600 hover:bg-gray-200"
          >
            {showDetail ? '收起说明' : '查看说明'}
          </button>
        </div>
      </header>

      {evaluation && (
        <div className={`shrink-0 border-b px-6 py-4 ${evaluation.passed ? 'border-emerald-200 bg-emerald-50' : 'border-rose-200 bg-rose-50'}`}>
          <div className="flex items-center gap-3">
            <span className="text-2xl">{evaluation.passed ? '🎉' : '💪'}</span>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <span className={`text-sm font-bold ${evaluation.passed ? 'text-emerald-700' : 'text-rose-700'}`}>
                  {evaluation.passed ? '通关成功！' : '未通过，再试试'}
                </span>
                <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                  evaluation.score >= 80 ? 'bg-emerald-100 text-emerald-700' : evaluation.score >= 60 ? 'bg-amber-100 text-amber-700' : 'bg-rose-100 text-rose-700'
                }`}>
                  {evaluation.score} 分
                </span>
              </div>
              <p className="mt-1 text-xs text-gray-600">{evaluation.feedback}</p>
            </div>
            {evaluation.passed && (
              <Link
                href="/simulator"
                className="shrink-0 rounded-xl bg-emerald-600 px-4 py-2 text-xs font-medium text-white hover:bg-emerald-700"
              >
                继续下一阶段
              </Link>
            )}
          </div>
        </div>
      )}

      <div className="flex flex-1 overflow-hidden">
        {showDetail && (
          <div className="w-80 shrink-0 overflow-y-auto border-r border-gray-200 bg-white p-4">
            <StageDetail stage={stage} />
          </div>
        )}
        <div className="flex-1">
          <InteractiveChat
            npcName={stage.npcName}
            npcAvatar={stage.npcAvatar}
            sessionId={sessionId}
            stageId={stage.id}
            initialMessages={initialMessages}
            onEvaluation={handleEvaluation}
          />
        </div>
      </div>
    </div>
  );
}
