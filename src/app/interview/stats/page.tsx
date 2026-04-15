'use client';

import { useState, useEffect } from 'react';
import StatsPanel from '@/components/interview/StatsPanel';
import type { UserStats } from '@/types';

export default function StatsPage() {
  const [stats, setStats] = useState<UserStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const res = await fetch('/api/interview/stats');
      if (res.ok) {
        const data = await res.json();
        setStats(data);
      }
    } catch {
      // 静默失败
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-4xl p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-neutral-50">练习统计</h1>
        <p className="mt-1 text-sm text-neutral-400">练习量、类型分布、得分趋势、弱项推荐</p>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-amber-600 border-t-transparent" />
        </div>
      ) : stats && (stats.total_questions > 0 || stats.mock_interviews.total > 0) ? (
        <StatsPanel stats={stats} />
      ) : (
        <div className="py-16 text-center">
          <p className="text-neutral-500">还没有练习数据</p>
          <p className="mt-1 text-sm text-neutral-600">开始面试问答或模拟面试，数据会自动统计</p>
        </div>
      )}
    </div>
  );
}
