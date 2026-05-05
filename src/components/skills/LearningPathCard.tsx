'use client';

import type { RecommendedModule } from '@/types';

interface LearningPathCardProps {
  module: RecommendedModule;
}

const priorityConfig = {
  high: { label: '高优先', bg: 'bg-rose-100 dark:bg-rose-900/30', text: 'text-rose-700 dark:text-rose-400', border: 'border-rose-200 dark:border-rose-800' },
  medium: { label: '中优先', bg: 'bg-amber-100 dark:bg-amber-900/30', text: 'text-amber-700 dark:text-amber-400', border: 'border-amber-200 dark:border-amber-800' },
  low: { label: '低优先', bg: 'bg-slate-100 dark:bg-slate-800/30', text: 'text-slate-600 dark:text-slate-400', border: 'border-slate-200 dark:border-slate-700' },
};

export default function LearningPathCard({ module }: LearningPathCardProps) {
  const config = priorityConfig[module.priority] || priorityConfig.low;

  return (
    <div className={`rounded-xl border bg-card p-4 transition-colors hover:border-indigo-200 dark:hover:border-indigo-800`}>
      <div className="flex items-center gap-2 mb-2">
        <h4 className="text-sm font-semibold text-foreground">{module.name}</h4>
        <span className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${config.bg} ${config.text}`}>
          {config.label}
        </span>
      </div>
      <div className="flex items-center gap-3 mb-2">
        <span className="text-xs text-muted-foreground">
          预估 {module.estimatedHours} 小时
        </span>
      </div>
      <p className="text-xs text-muted-foreground leading-relaxed">{module.reason}</p>
    </div>
  );
}
