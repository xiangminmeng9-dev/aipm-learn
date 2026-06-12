'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { cacheGet, cacheSet, cacheRemove, TTL } from '@/lib/cache';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import GradientBackground from '@/components/ui/gradient-background';
import { apiFetch } from '@/lib/api/fetch';

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

interface MockRecord {
  id: string;
  type_name: string;
  total_questions: number;
  current_question: number;
  status: string;
  total_score: number | null;
  created_at: string;
}

export default function MockConfigPage() {
  const [types, setTypes] = useState<QuestionType[]>([]);
  const [selectedTypeId, setSelectedTypeId] = useState<string>('');
  const [totalQuestions, setTotalQuestions] = useState<3 | 5 | 8 | 10>(5);
  const [jdText, setJdText] = useState('');
  const [resumeText, setResumeText] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [mockRecords, setMockRecords] = useState<MockRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [inProgress, setInProgress] = useState<InProgressInterview | null>(null);

  useEffect(() => {
    fetchTypes();
    checkInProgress();
  }, []);

  const fetchTypes = async () => {
    try {
      const res = await apiFetch('/api/interview/question-types');
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

  // 获取模拟面试记录
  const fetchRecords = async () => {
    // Read from cache for instant display
    const cached = cacheGet<MockRecord[]>('mock-records');
    if (cached) setMockRecords(cached);

    try {
      const supabase = createClient();
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;
      const res = await apiFetch('/api/interview/mock', {
        headers: { Authorization: `Bearer ${session.access_token}` },
      });
      if (res.ok) {
        const data = await res.json();
        const records = data.data || [];
        setMockRecords(records);
        cacheSet('mock-records', records, TTL.USER_DATA);
      }
    } catch { /* ignore */ }
  };

  useEffect(() => { fetchRecords(); }, []);

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

  const handleDeleteRecord = async (id: string) => {
    if (!confirm('确定删除这条模拟面试记录吗？')) return;
    try {
      const supabase = createClient();
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;
      const res = await apiFetch('/api/interview/mock', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ id }),
      });
      if (res.ok) {
        setMockRecords(prev => prev.filter(r => r.id !== id));
        cacheRemove('mock-records');
      }
    } catch { /* ignore */ }
  };

  const handleStart = async () => {
    if (!selectedTypeId) {
      alert('请选择问题类型');
      return;
    }

    setIsCreating(true);
    try {
      const supabase = createClient();
      const { data: { session } } = await supabase.auth.getSession();
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (session) headers['Authorization'] = `Bearer ${session.access_token}`;

      const res = await apiFetch('/api/interview/mock', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          type_id: selectedTypeId,
          total_questions: totalQuestions,
          jd_text: jdText.trim() || undefined,
          resume_text: resumeText.trim() || undefined,
        }),
      });

      if (res.ok) {
        // Invalidate cache after creating a new mock interview
        cacheRemove('mock-records');
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
    <>
      <GradientBackground />
      <div className="relative z-10 p-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-foreground">模拟面试</h1>
        <p className="mt-1 text-base text-muted-foreground">选择类型和题数，开始模拟面试</p>
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
          <Card className="border-border bg-card">
            <CardHeader>
              <CardTitle className="text-lg text-foreground">选择问题类型</CardTitle>
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
                        : 'border-border bg-card text-muted-foreground hover:border-border'
                    }`}
                  >
                    <span className="font-medium">{t.name}</span>
                    {t.question_count > 0 && (
                      <span className="ml-1 text-sm text-muted-foreground">({t.question_count})</span>
                    )}
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* 题数选择 */}
          <Card className="border-border bg-card">
            <CardHeader>
              <CardTitle className="text-lg text-foreground">题目数量</CardTitle>
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
                        : 'border-border bg-card text-muted-foreground hover:border-border'
                    }`}
                  >
                    {count}
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* JD 和简历 */}
          <Card className="border-border bg-card">
            <CardHeader>
              <CardTitle className="text-lg text-foreground">背景信息（可选）</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <label className="mb-1 block text-sm text-muted-foreground">岗位 JD</label>
                <Textarea
                  value={jdText}
                  onChange={(e) => setJdText(e.target.value)}
                  placeholder="粘贴目标岗位的 JD..."
                  className="min-h-[80px] resize-none border-border bg-card text-base text-foreground"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm text-muted-foreground">个人简历</label>
                <Textarea
                  value={resumeText}
                  onChange={(e) => setResumeText(e.target.value)}
                  placeholder="粘贴你的简历要点..."
                  className="min-h-[80px] resize-none border-border bg-card text-base text-foreground"
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

          {/* 面试记录 */}
          {mockRecords.length > 0 && (
            <Card className="border-border bg-card">
              <CardHeader>
                <CardTitle className="text-lg text-foreground">面试记录</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {mockRecords.map((record) => (
                    <div
                      key={record.id}
                      className="rounded-lg border border-border bg-muted p-3 transition-colors hover:bg-secondary"
                    >
                      <div className="flex items-center justify-between">
                        <Link
                          href={`/interview/mock/${record.id}`}
                          className="flex-1"
                        >
                          <div className="flex items-center gap-2">
                            <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                              record.status === 'completed' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'
                            }`}>
                              {record.status === 'completed' ? '已完成' : '进行中'}
                            </span>
                            <span className="text-sm font-medium text-foreground">{record.type_name}</span>
                          </div>
                          {record.total_score !== null && (
                            <span className={`text-sm font-bold ${
                              record.total_score >= 80 ? 'text-emerald-600' :
                              record.total_score >= 60 ? 'text-amber-600' : 'text-rose-600'
                            }`}>
                              {record.total_score}分
                            </span>
                          )}
                          <div className="mt-1 flex items-center gap-3 text-xs text-muted-foreground">
                            <span>{record.total_questions} 题</span>
                            {record.status === 'in_progress' && (
                              <span>当前第 {record.current_question} 题</span>
                            )}
                            <span>{new Date(record.created_at).toLocaleString('zh-CN')}</span>
                          </div>
                        </Link>
                        <button
                          onClick={() => handleDeleteRecord(record.id)}
                          className="ml-2 rounded-lg p-1.5 text-muted-foreground hover:bg-rose-100 hover:text-rose-600 transition-colors"
                          title="删除"
                        >
                          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                          </svg>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
    </>
  );
}
