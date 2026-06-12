'use client';

import { useState } from 'react';
import dynamic from 'next/dynamic';
const Markdown = dynamic(() => import('@/components/ui/markdown'), { ssr: false });

interface DevFlowResultProps {
  result: { clarification: string; breakdown: string; steps: string; notes: string; mode: { name: string } };
}

const sections = [
  { key: 'clarification' as const, label: '澄清问题', icon: '❓' },
  { key: 'breakdown' as const, label: '需求拆解', icon: '🧩' },
  { key: 'steps' as const, label: '开发步骤', icon: '💻' },
  { key: 'notes' as const, label: '重点关注', icon: '⚠️' },
];

export default function DevFlowResult({ result }: DevFlowResultProps) {
  const [expanded, setExpanded] = useState<Set<string>>(new Set(sections.map((s) => s.key)));

  const toggle = (key: string) => {
    setExpanded((prev) => { const next = new Set(prev); if (next.has(key)) next.delete(key); else next.add(key); return next; });
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <h3 className="text-lg font-semibold text-foreground">开发流程</h3>
        <span className="rounded-full bg-indigo-50 px-2.5 py-0.5 text-xs font-medium text-indigo-600">{result.mode.name}</span>
      </div>
      <div className="space-y-3">
        {sections.map(({ key, label, icon }) => (
          <div key={key} className="rounded-2xl bg-card border border-border overflow-hidden">
            <button onClick={() => toggle(key)} className="flex w-full items-center justify-between px-5 py-4 text-left hover:bg-muted">
              <span className="flex items-center gap-2 text-foreground">
                <span>{icon}</span>
                <span className="font-semibold text-sm">{label}</span>
              </span>
              <span className="text-muted-foreground text-xs">{expanded.has(key) ? '收起 ▴' : '展开 ▾'}</span>
            </button>
            {expanded.has(key) && (
              <div className="border-t border-border px-5 py-4">
                <Markdown content={result[key]} />
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
