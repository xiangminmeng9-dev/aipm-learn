'use client';

import { useState, useEffect } from 'react';
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

export default function MockConfigPage() {
  const [types, setTypes] = useState<QuestionType[]>([]);
  const [selectedTypeId, setSelectedTypeId] = useState<string>('');
  const [totalQuestions, setTotalQuestions] = useState<3 | 5 | 8 | 10>(5);
  const [jdText, setJdText] = useState('');
  const [resumeText, setResumeText] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchTypes();
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
        // 存储初始问题数据到 sessionStorage
        sessionStorage.setItem(
          `mock-${data.id}`,
          JSON.stringify({
            question: data.question,
            total_questions: data.total_questions,
          })
        );
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
    <div className="mx-auto max-w-2xl p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-neutral-50">模拟面试</h1>
        <p className="mt-1 text-sm text-neutral-400">选择类型和题数，开始模拟面试</p>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-amber-600 border-t-transparent" />
        </div>
      ) : (
        <div className="space-y-6">
          {/* 问题类型选择 */}
          <Card className="border-neutral-700 bg-neutral-800/50">
            <CardHeader>
              <CardTitle className="text-base text-neutral-200">选择问题类型</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                {types.map((t) => (
                  <button
                    key={t.id}
                    onClick={() => setSelectedTypeId(t.id)}
                    className={`rounded-lg border px-3 py-2 text-left text-sm transition-colors ${
                      selectedTypeId === t.id
                        ? 'border-amber-600 bg-amber-600/10 text-amber-400'
                        : 'border-neutral-700 bg-neutral-800 text-neutral-300 hover:border-neutral-600'
                    }`}
                  >
                    <span className="font-medium">{t.name}</span>
                    {t.question_count > 0 && (
                      <span className="ml-1 text-xs text-neutral-500">({t.question_count})</span>
                    )}
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* 题数选择 */}
          <Card className="border-neutral-700 bg-neutral-800/50">
            <CardHeader>
              <CardTitle className="text-base text-neutral-200">题目数量</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex gap-3">
                {questionCounts.map((count) => (
                  <button
                    key={count}
                    onClick={() => setTotalQuestions(count)}
                    className={`flex h-12 w-12 items-center justify-center rounded-lg border text-sm font-medium transition-colors ${
                      totalQuestions === count
                        ? 'border-amber-600 bg-amber-600/10 text-amber-400'
                        : 'border-neutral-700 bg-neutral-800 text-neutral-300 hover:border-neutral-600'
                    }`}
                  >
                    {count}
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* JD 和简历 */}
          <Card className="border-neutral-700 bg-neutral-800/50">
            <CardHeader>
              <CardTitle className="text-base text-neutral-200">背景信息（可选）</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <label className="mb-1 block text-xs text-neutral-500">岗位 JD</label>
                <Textarea
                  value={jdText}
                  onChange={(e) => setJdText(e.target.value)}
                  placeholder="粘贴目标岗位的 JD..."
                  className="min-h-[80px] resize-none border-neutral-700 bg-neutral-900 text-sm text-neutral-200"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs text-neutral-500">个人简历</label>
                <Textarea
                  value={resumeText}
                  onChange={(e) => setResumeText(e.target.value)}
                  placeholder="粘贴你的简历要点..."
                  className="min-h-[80px] resize-none border-neutral-700 bg-neutral-900 text-sm text-neutral-200"
                />
              </div>
            </CardContent>
          </Card>

          {/* 开始按钮 */}
          <Button
            onClick={handleStart}
            disabled={isCreating || !selectedTypeId}
            className="w-full bg-amber-600 py-6 text-lg text-neutral-950 hover:bg-amber-500 disabled:opacity-50"
          >
            {isCreating ? '创建中...' : '开始模拟面试'}
          </Button>
        </div>
      )}
    </div>
  );
}
