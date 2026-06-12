'use client';

import { useState, useEffect } from 'react';
import StatsPanel from '@/components/interview/StatsPanel';
import type { UserStats } from '@/types';
import GradientBackground from '@/components/ui/gradient-background';
import { apiFetch } from '@/lib/api/fetch';

export default function StatsPage() {
  const [stats, setStats] = useState<UserStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await apiFetch('/api/interview/stats');
      if (res.ok) {
        const data = await res.json();
        setStats(data);
      } else {
        setError('加载练习统计失败');
      }
    } catch {
      setError('加载练习统计失败');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <GradientBackground />
      <div className="relative z-10 p-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-foreground">练习统计</h1>
        <p className="mt-1 text-base text-muted-foreground">练习量、类型分布、得分趋势、弱项推荐</p>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-indigo-500 border-t-transparent" />
        </div>
      ) : error ? (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-800 dark:bg-red-900/30 dark:text-red-300">
          <p>{error}</p>
          <button onClick={fetchStats} className="mt-1 text-xs font-medium text-red-600 hover:text-red-800 dark:text-red-400">重试</button>
        </div>
      ) : stats && (stats.total_questions > 0 || stats.mock_interviews.total > 0) ? (
        <StatsPanel stats={stats} />
      ) : (
        <div className="py-16 text-center">
          <p className="text-muted-foreground">还没有练习数据</p>
          <p className="mt-1 text-base text-muted-foreground">开始面试问答或模拟面试，数据会自动统计</p>
        </div>
      )}
    </div>
    </>
  );
}
