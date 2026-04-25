'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';

interface QuestionType {
  id: string;
  name: string;
  description: string | null;
  is_seed: boolean;
  question_count: number;
}

interface InProgressInterview {
  id: string;
  currentQuestion: number;
  totalQuestions: number;
}

export default function MockConfigPage() {
  const [types, setTypes] = useState<QuestionType[]>([]);
  const [selectedTypeId, setSelectedTypeId] = useState<string>('');
  const [totalQuestions, setTotalQuestions] = useState<3 | 5 | 8 | 10>(5);
  const [jdText, setJdText] = useState('');
  const [resumeText, setResumeText] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [inProgress, setInProgress] = useState<InProgressInterview | null>(null);

  useEffect(() => {
    fetchTypes();
    checkInProgress();
  }, []);

  const fetchTypes = async () => {
    try {
      const res = await fetch('/api/interview/question-types');
      if (res.ok) {
        const data = await res.json();
        setTypes(data.types ?? []);
      }
    } catch {
      // 静默失败
    } finally {
      setIsLoading(false);
    }
  };

  const checkInProgress = () => {
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key?.startsWith('mock-interview-')) {
        try {
          const data = JSON.parse(localStorage.getItem(key)!);
          if (data.questions && data.questions.length > 0) {
            const id = key.replace('mock-interview-', '');
            const nextQ = data.questions.find((q: { answer: string; is_skipped: boolean }) => !q.answer && !q.is_skipped);
            setInProgress({
              id,
              currentQuestion: nextQ ? nextQ.number : data.questions[data.questions.length - 1].number,
              totalQuestions: data.totalQuestions || data.questions.length,
            });
            return;
          }
        } catch {}
      }
    }
  };

  const handleStart = async () => {
    if (!selectedTypeId) {
      alert('请选择问题类型');
      return;
    }

    setIsCreating(true);
    try {
      const res = await fetch('/api/interview/mock', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type_id: selectedTypeId,
          total_questions: totalQuestions,
          jd_text: jdText.trim() || undefined,
          resume_text: resumeText.trim() || undefined,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        // 存储初始问题数据到 localStorage（持久化）和 sessionStorage（兼容）
        const initData = JSON.stringify({
          question: data.question,
          total_questions: data.total_questions,
        });
        localStorage.setItem(`mock-${data.id}`, initData);
        sessionStorage.setItem(`mock-${data.id}`, initData);
        window.location.href = `/interview/mock/${data.id}`;
      } else {
        const data = await res.json();
        alert(data.error ?? '创建失败');
      }
    } catch {
      alert('网络错误');
    } finally {
      setIsCreating(false);
    }
  };

  const questionCounts: (3 | 5 | 8 | 10)[] = [3, 5, 8, 10];

  return (
    <div className="p-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-[#1F2937]">模拟面试</h1>
        <p className="mt-1 text-base text-[#6B7280]">选择类型和题数，开始模拟面试</p>
      </div>

      {/* In-progress interview banner */}
      {inProgress && (
        <div className="mb-6 rounded-xl border border-indigo-200 bg-indigo-50/50 p-5">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-indigo-900">你有一场进行中的面试</h3>
              <p className="mt-1 text-sm text-indigo-700">
                当前进度：第 {inProgress.currentQuestion} / {inProgress.totalQuestions} 题
              </p>
            </div>
            <Link href={`/interview/mock/${inProgress.id}`}>
              <Button className="app-btn-primary">
                继续面试
              </Button>
            </Link>
          </div>
        </div>
      )}

      {isLoading ? (
        <div className="flex justify-center py-12">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-indigo-500 border-t-transparent" />
        </div>
      ) : (
        <div className="space-y-6">
          {/* 问题类型选择 */}
          <Card className="border-[#E5E7EB] bg-white">
            <CardHeader>
              <CardTitle className="text-lg text-[#1F2937]">选择问题类型</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                {types.map((t) => (
                  <button
                    key={t.id}
                    onClick={() => setSelectedTypeId(t.id)}
                    className={`rounded-lg border px-3 py-2 text-left text-base transition-colors ${
                      selectedTypeId === t.id
                        ? 'border-indigo-200 bg-indigo-50 text-indigo-600'
                        : 'border-[#E5E7EB] bg-white text-[#9CA3AF] hover:border-[#D1D5DB]'
                    }`}
                  >
                    <span className="font-medium">{t.name}</span>
                    {t.question_count > 0 && (
                      <span className="ml-1 text-sm text-[#6B7280]">({t.question_count})</span>
                    )}
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* 题数选择 */}
          <Card className="border-[#E5E7EB] bg-white">
            <CardHeader>
              <CardTitle className="text-lg text-[#1F2937]">题目数量</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex gap-3">
                {questionCounts.map((count) => (
                  <button
                    key={count}
                    onClick={() => setTotalQuestions(count)}
                    className={`flex h-12 w-12 items-center justify-center rounded-lg border text-base font-medium transition-colors ${
                      totalQuestions === count
                        ? 'border-indigo-200 bg-indigo-50 text-indigo-600'
                        : 'border-[#E5E7EB] bg-white text-[#9CA3AF] hover:border-[#D1D5DB]'
                    }`}
                  >
                    {count}
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* JD 和简历 */}
          <Card className="border-[#E5E7EB] bg-white">
            <CardHeader>
              <CardTitle className="text-lg text-[#1F2937]">背景信息（可选）</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <label className="mb-1 block text-sm text-[#6B7280]">岗位 JD</label>
                <Textarea
                  value={jdText}
                  onChange={(e) => setJdText(e.target.value)}
                  placeholder="粘贴目标岗位的 JD..."
                  className="min-h-[80px] resize-none border-[#E5E7EB] bg-white text-base text-[#1F2937]"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm text-[#6B7280]">个人简历</label>
                <Textarea
                  value={resumeText}
                  onChange={(e) => setResumeText(e.target.value)}
                  placeholder="粘贴你的简历要点..."
                  className="min-h-[80px] resize-none border-[#E5E7EB] bg-white text-base text-[#1F2937]"
                />
              </div>
            </CardContent>
          </Card>

          {/* 开始按钮 */}
          <Button
            onClick={handleStart}
            disabled={isCreating || !selectedTypeId}
            className="w-full app-btn-primary py-6 text-lg disabled:opacity-50"
          >
            {isCreating ? '创建中...' : '开始模拟面试'}
          </Button>
        </div>
      )}
    </div>
  );
}
