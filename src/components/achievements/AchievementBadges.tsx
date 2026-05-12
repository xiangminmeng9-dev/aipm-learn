'use client';

import { useState, useEffect } from 'react';

interface Achievement {
  key: string; title: string; description: string; icon: string;
  category: string; tier: string; unlocked: boolean; unlocked_at: string | null;
}

const TIER_STYLES: Record<string, string> = {
  bronze: 'border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-800 dark:bg-amber-950/20 dark:text-amber-400',
  silver: 'border-slate-300 bg-slate-50 text-slate-600 dark:border-slate-700 dark:bg-slate-950/20 dark:text-slate-400',
  gold: 'border-yellow-300 bg-yellow-50 text-yellow-700 dark:border-yellow-800 dark:bg-yellow-950/20 dark:text-yellow-400',
  platinum: 'border-indigo-200 bg-indigo-50 text-indigo-700 dark:border-indigo-800 dark:bg-indigo-950/20 dark:text-indigo-400',
};

const CATEGORIES: Record<string, string> = {
  practice: '问答练习', mock: '模拟面试', daily: '每日挑战',
  skills: '技能成长', analysis: '分析工具', tools: '工具箱', community: '社区',
};

export default function AchievementBadges() {
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [stats, setStats] = useState({ total: 0, unlocked: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/user/achievements')
      .then(r => r.ok ? r.json() : null)
      .then(d => {
        if (d) {
          setAchievements(d.all ?? []);
          setStats({ total: d.total ?? 0, unlocked: d.unlocked_count ?? 0 });
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return <div className="flex justify-center py-4"><div className="h-4 w-4 animate-spin rounded-full border-2 border-amber-500 border-t-transparent" /></div>;
  }

  if (achievements.length === 0) return null;

  return (
    <div>
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-foreground">🏆 成就</h3>
        <span className="text-xs text-muted-foreground">{stats.unlocked}/{stats.total}</span>
      </div>
      <div className="grid grid-cols-3 gap-2 sm:grid-cols-5 lg:grid-cols-8">
        {achievements.map((a) => (
          <div key={a.key}
            className={`flex flex-col items-center gap-1 rounded-lg border p-3 text-center transition-all ${
              a.unlocked ? TIER_STYLES[a.tier] || TIER_STYLES.bronze : 'border-border bg-muted/30 opacity-40 grayscale'
            }`}
            title={a.unlocked ? `${a.title} — ${a.description}\n解锁于 ${new Date(a.unlocked_at!).toLocaleDateString('zh-CN')}` : `${a.title} — ${a.description}`}
          >
            <span className="text-xl">{a.icon}</span>
            <span className="text-[10px] leading-tight font-medium">{a.title}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
