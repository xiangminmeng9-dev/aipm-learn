'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import MockInterviewFlow from '@/components/interview/MockInterviewFlow';
import MockSummary from '@/components/interview/MockSummary';
import { Button } from '@/components/ui/button';

interface MockDetailPageProps {
  params: Promise<{ id: string }>;
}

export default function MockDetailPage({ params }: MockDetailPageProps) {
  const [mockId, setMockId] = useState('');
  const [summary, setSummary] = useState<Record<string, unknown> | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    params.then(({ id }) => {
      setMockId(id);
      setIsLoading(false);
    });
  }, [params]);

  // 当面试完成时，获取总结
  const handleComplete = async () => {
    try {
      const res = await fetch(`/api/interview/mock/${mockId}/summary`);
      if (res.ok) {
        const data = await res.json();
        setSummary(data);
      }
    } catch {
      // 静默失败
    }
  };

  if (isLoading || !mockId) {
    return (
      <div className="flex justify-center py-12">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-amber-600 border-t-transparent" />
      </div>
    );
  }

  if (summary) {
    return (
      <div className="mx-auto max-w-3xl p-6">
        <div className="mb-6 flex items-center justify-between">
          <h1 className="text-2xl font-bold text-neutral-50">面试总结</h1>
          <Link href="/interview/mock">
            <Button variant="outline" className="border-neutral-600 text-neutral-300">
              再来一次
            </Button>
          </Link>
        </div>
        <MockSummary summary={summary as Parameters<typeof MockSummary>[0]['summary']} />
      </div>
    );
  }

  // 从 sessionStorage 获取初始问题数据
  const storedData =
    typeof window !== 'undefined' ? sessionStorage.getItem(`mock-${mockId}`) : null;

  const initialQuestion = storedData
    ? JSON.parse(storedData).question
    : { number: 1, text: '加载中...' };

  const totalQuestions = storedData ? JSON.parse(storedData).total_questions : 5;

  return (
    <div className="mx-auto max-w-3xl p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-neutral-50">模拟面试</h1>
        <p className="mt-1 text-sm text-neutral-400">认真作答，每题获得即时评价</p>
      </div>

      <MockInterviewFlow
        mockId={mockId}
        initialQuestion={initialQuestion}
        totalQuestions={totalQuestions}
        onComplete={handleComplete}
      />
    </div>
  );
}
