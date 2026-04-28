'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import MockInterviewFlow, { type MockInterviewResult } from '@/components/interview/MockInterviewFlow';
import MockSummary from '@/components/interview/MockSummary';
import { Button } from '@/components/ui/button';
import { createClient } from '@/lib/supabase/client';

interface MockDetailPageProps {
  params: Promise<{ id: string }>;
}

type PageState =
  | { phase: 'loading' }
  | { phase: 'interview'; mockId: string }
  | { phase: 'summary'; summary: Record<string, unknown> };

export default function MockDetailPage({ params }: MockDetailPageProps) {
  const [pageState, setPageState] = useState<PageState>({ phase: 'loading' });

  useEffect(() => {
    params.then(async ({ id }) => {
      // 1. Check in-progress interview state (mock-interview-${id})
      try {
        const progressData = localStorage.getItem(`mock-interview-${id}`);
        if (progressData) {
          const parsed = JSON.parse(progressData);
          if (parsed.questions && parsed.questions.length > 0) {
            setPageState({ phase: 'interview', mockId: id });
            return;
          }
        }
      } catch {}

      // 2. Get session for auth headers (used for all server API calls)
      const supabase = createClient();
      const { data: { session } } = await supabase.auth.getSession();
      const authHeaders: Record<string, string> = {};
      if (session) authHeaders['Authorization'] = `Bearer ${session.access_token}`;

      // 3. Check completed interview result (mock-${id})
      try {
        const completedData = localStorage.getItem(`mock-${id}`);
        if (completedData) {
          const parsed = JSON.parse(completedData);
          if (parsed.completed) {
            // Try server summary first, fallback to local data
            fetch(`/api/interview/mock/${id}/summary`, { headers: authHeaders })
              .then((r) => r.ok ? r.json() : null)
              .then((serverSummary) => {
                if (serverSummary) {
                  setPageState({ phase: 'summary', summary: serverSummary });
                } else if (parsed.answers && parsed.answers.length > 0) {
                  setPageState({ phase: 'summary', summary: buildLocalSummary(id, parsed) });
                } else {
                  setPageState({ phase: 'summary', summary: emptySummary(id) });
                }
              })
              .catch(() => {
                if (parsed.answers && parsed.answers.length > 0) {
                  setPageState({ phase: 'summary', summary: buildLocalSummary(id, parsed) });
                } else {
                  setPageState({ phase: 'summary', summary: emptySummary(id) });
                }
              });
            return;
          }
          // Has initial question data but not completed — resume interview
          if (parsed.question) {
            setPageState({ phase: 'interview', mockId: id });
            return;
          }
        }
      } catch {}

      // 4. Try server API (for authenticated users)
      fetch(`/api/interview/mock/${id}/state`, { headers: authHeaders })
        .then((r) => {
          if (r.status === 401) throw new Error('unauth');
          return r.json();
        })
        .then((data) => {
          if (data.status === 'completed') {
            fetch(`/api/interview/mock/${id}/summary`, { headers: authHeaders })
              .then((r) => r.json())
              .then((summaryData) => setPageState({ phase: 'summary', summary: summaryData }))
              .catch(() => setPageState({ phase: 'summary', summary: emptySummary(id) }));
          } else {
            // in_progress or unknown — show interview UI (MockInterviewFlow will restore)
            setPageState({ phase: 'interview', mockId: id });
          }
        })
        .catch(() => {
          // Unauthenticated or network error — try sessionStorage fallback
          try {
            const sessionData = sessionStorage.getItem(`mock-${id}`);
            if (sessionData) {
              setPageState({ phase: 'interview', mockId: id });
              return;
            }
          } catch {}
          // No data anywhere — show interview with loading question
          setPageState({ phase: 'interview', mockId: id });
        });
    });
  }, [params]);

  const handleComplete = async (result: MockInterviewResult) => {
    // Try to get server summary first
    try {
      const supabase = createClient();
      const { data: { session } } = await supabase.auth.getSession();
      const authHeaders: Record<string, string> = {};
      if (session) authHeaders['Authorization'] = `Bearer ${session.access_token}`;

      const res = await fetch(`/api/interview/mock/${pageState.phase === 'interview' ? (pageState as { mockId: string }).mockId : ''}/summary`, { headers: authHeaders });
      if (res.ok) {
        const data = await res.json();
        setPageState({ phase: 'summary', summary: data });
        return;
      }
    } catch {}

    // Fallback: build summary from local result
    const mockId = pageState.phase === 'interview' ? (pageState as { mockId: string }).mockId : '';
    const answered = result.answers.filter((a) => a.answer && !a.is_skipped);
    const skipped = result.answers.filter((a) => a.is_skipped);
    setPageState({
      phase: 'summary',
      summary: {
        id: mockId,
        total_score: result.totalScore,
        question_count: result.answers.length,
        answered_count: answered.length,
        skipped_count: skipped.length,
        answers: result.answers.map((a) => ({
          number: a.number,
          question: a.question,
          score: a.evaluation?.score ?? null,
          gap_analysis: a.evaluation?.gap_analysis ?? '',
          is_skipped: a.is_skipped,
        })),
        strengths: answered.length > 0 ? `完成了 ${answered.length} 道题目的作答，平均得分 ${result.totalScore}` : '面试已完成',
        weaknesses: skipped.length > 0 ? `有 ${skipped.length} 道题目被跳过` : '',
        suggestions: '建议登录后获取更详细的 AI 评价和改进建议',
        weak_skill_modules: [],
      },
    });
  };

  const handleCancel = () => {
    window.location.href = '/interview/mock';
  };

  if (pageState.phase === 'loading') {
    return (
      <div className="flex justify-center py-12">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-indigo-500 border-t-transparent" />
      </div>
    );
  }

  if (pageState.phase === 'summary') {
    return (
      <div className="p-8">
        <div className="mb-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/interview/mock" className="text-sm text-muted-foreground hover:text-foreground">← 返回</Link>
            <span className="text-muted-foreground">|</span>
            <h1 className="text-3xl font-bold text-foreground">面试总结</h1>
          </div>
          <Link href="/interview/mock">
            <Button variant="outline" className="app-btn-outline">
              再来一次
            </Button>
          </Link>
        </div>
        <MockSummary summary={pageState.summary as Parameters<typeof MockSummary>[0]['summary']} />
      </div>
    );
  }

  return (
    <div className="p-8">
      <div className="mb-6">
        <Link href="/interview/mock" className="text-sm text-muted-foreground hover:text-foreground">← 返回</Link>
        <h1 className="mt-2 text-3xl font-bold text-foreground">模拟面试</h1>
        <p className="mt-1 text-base text-muted-foreground">认真作答，每题获得即时评价</p>
      </div>

      <MockInterviewFlow
        mockId={pageState.mockId}
        onComplete={handleComplete}
        onCancel={handleCancel}
      />
    </div>
  );
}

function buildLocalSummary(id: string, parsed: { totalScore?: number; answers: { number: number; question: string; answer: string; evaluation: { score: number; gap_analysis?: string } | null; is_skipped: boolean }[]; totalQuestions?: number }) {
  const answered = parsed.answers.filter((a) => a.answer && !a.is_skipped);
  const skipped = parsed.answers.filter((a) => a.is_skipped);
  return {
    id,
    total_score: parsed.totalScore ?? 0,
    question_count: parsed.answers.length,
    answered_count: answered.length,
    skipped_count: skipped.length,
    answers: parsed.answers.map((a) => ({
      number: a.number,
      question: a.question,
      score: a.evaluation?.score ?? null,
      gap_analysis: a.evaluation?.gap_analysis ?? '',
      is_skipped: a.is_skipped,
    })),
    strengths: answered.length > 0 ? `完成了 ${answered.length} 道题目的作答，平均得分 ${parsed.totalScore ?? 0}` : '面试已完成',
    weaknesses: skipped.length > 0 ? `有 ${skipped.length} 道题目被跳过` : '',
    suggestions: '建议登录后获取更详细的 AI 评价和改进建议',
    weak_skill_modules: [],
  };
}

function emptySummary(id: string) {
  return { id, total_score: 0, question_count: 0, answered_count: 0, skipped_count: 0, answers: [], strengths: '面试已完成', weaknesses: '', suggestions: '' };
}
