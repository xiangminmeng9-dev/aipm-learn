'use client';

import type { SkillModuleWithProgress } from '@/types';

interface SkillModuleCardProps {
  module: SkillModuleWithProgress & { is_custom?: boolean };
  onClick: () => void;
  onDelete?: () => void;
}

export default function SkillModuleCard({ module, onClick, onDelete }: SkillModuleCardProps) {
  const isCustom = module.is_custom ?? false;

  return (
    <div
      className={`cursor-pointer rounded-2xl bg-card border p-5 transition-all hover:bg-secondary hover:border-border ${
        isCustom ? 'border-indigo-200' : 'border-border'
      }`}
      onClick={onClick}
    >
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-2xl">{module.icon}</span>
          {isCustom && (
            <span className="rounded-full bg-indigo-500/20 px-2 py-0.5 text-xs font-medium text-indigo-600">
              自定义
            </span>
          )}
        </div>
        <div className="flex items-center gap-1">
          <span className="rounded-full bg-indigo-50 px-2.5 py-0.5 text-xs font-medium text-indigo-600">
            {module.progress_percentage}%
          </span>
          {isCustom && onDelete && (
            <button
              onClick={(e) => { e.stopPropagation(); onDelete(); }}
              className="rounded-full p-1 text-muted-foreground hover:bg-secondary hover:text-[#ff3b30] transition-colors"
              title="删除模块"
            >
              <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>
      </div>
      <h3 className="mb-1 text-base font-semibold text-foreground">{module.name}</h3>
      <p className="mb-3 line-clamp-2 text-sm text-muted-foreground">{module.description}</p>
      <div className="mb-2 h-1.5 overflow-hidden rounded-full bg-[#E5E7EB]">
        <div
          className="h-full rounded-full progress-gradient transition-all"
          style={{ width: `${module.progress_percentage}%` }}
        />
      </div>
      <span className="text-sm text-muted-foreground">
        {module.completed_count}/{module.task_count} 任务
      </span>
      {!isCustom && module.interview_weak_types && module.interview_weak_types.length > 0 && (
        <div className="mt-2 flex items-center gap-1 flex-wrap">
          <span className="text-sm text-[#ff9500]">面试弱项</span>
          {module.interview_weak_types.map((type) => (
            <span key={type} className="rounded bg-[#ff9500]/10 px-1.5 py-0.5 text-sm text-[#ff9500]">
              {type}
            </span>
          ))}
        </div>
      )}
      {!isCustom && module.interview_methodology_count && module.interview_methodology_count > 0 && (
        <span className="mt-1 block text-sm text-muted-foreground">
          {module.interview_methodology_count} 条方法论
        </span>
      )}
    </div>
  );
}
