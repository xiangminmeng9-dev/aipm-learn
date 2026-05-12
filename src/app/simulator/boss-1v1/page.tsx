'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { BOSS_TYPES, BossType } from '@/lib/boss-1v1-config';
import GradientBackground from '@/components/ui/gradient-background';

interface Session {
  id: string;
  boss_type: string;
  scenario_id: string;
  status: string;
  score: number;
  feedback: Record<string, unknown>;
  created_at: string;
}

export default function Boss1v1Page() {
  const router = useRouter();
  const [sessions, setSessions] = useState<Session[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [selectedBoss, setSelectedBoss] = useState<string | null>(null);
  const [selectedScenario, setSelectedScenario] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/simulator/boss-1v1')
      .then((r) => r.ok ? r.json() : null)
      .then((data) => {
        if (data) setSessions(data.sessions ?? []);
      })
      .catch(() => {})
      .finally(() => setIsLoading(false));
  }, []);

  const handleCreate = async () => {
    if (!selectedBoss || !selectedScenario || isCreating) return;
    setIsCreating(true);
    try {
      const res = await fetch('/api/simulator/boss-1v1', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ boss_type: selectedBoss, scenario_id: selectedScenario }),
      });
      if (res.ok) {
        const data = await res.json();
        router.push(`/simulator/boss-1v1/${data.session.id}`);
      } else {
        const err = await res.json().catch(() => ({}));
        alert(err.error || '创建失败');
      }
    } catch {
      alert('网络错误');
    } finally {
      setIsCreating(false);
    }
  };

  const activeBoss = BOSS_TYPES.find((b) => b.id === selectedBoss);

  return (
    <div className="px-6 py-8">
      <GradientBackground />
      <div className="relative z-10 mb-6">
        <h1 className="text-lg font-bold text-foreground">Boss 1V1</h1>
        <p className="mt-1 text-sm text-muted-foreground">模拟向上汇报、需求评审、资源争取等软技能场景</p>
      </div>

      {/* Boss type selection */}
      <div className="relative z-10 mb-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
        {BOSS_TYPES.map((boss) => (
          <button
            key={boss.id}
            onClick={() => { setSelectedBoss(boss.id); setSelectedScenario(null); }}
            className={`rounded-2xl border p-4 text-center transition-all ${
              selectedBoss === boss.id
                ? 'border-teal-300 bg-teal-50 shadow-sm'
                : 'border-border bg-card hover:border-teal-200 hover:bg-teal-50/50'
            }`}
          >
            <div className="text-2xl mb-2">{boss.icon}</div>
            <div className="text-sm font-semibold text-foreground">{boss.name}</div>
            <div className="mt-1 text-xs text-muted-foreground">{boss.bossName} · {boss.bossRole}</div>
          </button>
        ))}
      </div>

      {/* Scenario selection */}
      {activeBoss && (
        <div className="relative z-10 mb-6">
          <h3 className="mb-3 text-sm font-semibold text-foreground">选择场景</h3>
          <div className="grid grid-cols-2 gap-3">
            {activeBoss.scenarios.map((scenario) => (
              <button
                key={scenario.id}
                onClick={() => setSelectedScenario(scenario.id)}
                className={`rounded-xl border p-3 text-left transition-all ${
                  selectedScenario === scenario.id
                    ? 'border-teal-300 bg-teal-50'
                    : 'border-border bg-card hover:border-teal-200'
                }`}
              >
                <div className="text-sm font-medium text-foreground">{scenario.title}</div>
                <div className="mt-1 text-xs text-muted-foreground line-clamp-2">{scenario.description}</div>
              </button>
            ))}
          </div>
          {selectedScenario && (
            <button
              onClick={handleCreate}
              disabled={isCreating}
              className="mt-4 w-full rounded-xl bg-teal-600 py-3 text-sm font-semibold text-white hover:bg-teal-700 disabled:opacity-50"
            >
              {isCreating ? '正在创建...' : `开始挑战 ${activeBoss.bossName}`}
            </button>
          )}
        </div>
      )}

      {/* History sessions */}
      {sessions.length > 0 && (
        <div className="relative z-10 mt-8">
          <h3 className="mb-3 text-sm font-semibold text-foreground">历史会话</h3>
          <div className="space-y-2">
            {sessions.map((s) => {
              const bossConfig = BOSS_TYPES.find((b) => b.id === s.boss_type);
              const scenario = bossConfig?.scenarios.find((sc) => sc.id === s.scenario_id);
              return (
                <button
                  key={s.id}
                  onClick={() => router.push(`/simulator/boss-1v1/${s.id}`)}
                  className="w-full rounded-xl border border-border bg-card p-3 text-left hover:bg-muted transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-base">{bossConfig?.icon ?? '👤'}</span>
                      <span className="text-sm font-medium text-foreground">{scenario?.title ?? s.scenario_id}</span>
                      <span className={`rounded-lg px-2 py-0.5 text-xs ${
                        s.status === 'completed' ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'
                      }`}>{s.status === 'completed' ? '已完成' : '进行中'}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      {s.status === 'completed' && s.score != null && (
                        <span className={`text-sm font-bold ${s.score >= 80 ? 'text-emerald-600' : s.score >= 60 ? 'text-amber-600' : 'text-rose-600'}`}>
                          {s.score}分
                        </span>
                      )}
                      <span className="text-xs text-muted-foreground">{new Date(s.created_at).toLocaleDateString('zh-CN')}</span>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}