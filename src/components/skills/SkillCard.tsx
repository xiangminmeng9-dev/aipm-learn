'use client';

import { cn } from '@/lib/utils';
import { type UnifiedSkill, PLATFORM_CONFIG } from '@/types/workshop';

interface SkillCardProps {
  skill: UnifiedSkill;
  onClick: () => void;
}

function formatInstalls(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1).replace(/\.0$/, '')}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1).replace(/\.0$/, '')}K`;
  return String(n);
}

export default function SkillCard({ skill, onClick }: SkillCardProps) {
  const cfg = PLATFORM_CONFIG[skill.platform];

  return (
    <button
      type="button"
      onClick={onClick}
      className="group w-full rounded-xl border border-border bg-card p-4 text-left transition-shadow hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
    >
      <div className="mb-2 flex items-center gap-2">
        <span
          className={cn(
            'inline-flex items-center rounded-md px-1.5 py-0.5 text-[10px] font-semibold leading-none',
            cfg.className,
          )}
        >
          {cfg.label}
        </span>
        <span className="text-xs text-muted-foreground">
          {formatInstalls(skill.installs)} 次安装
        </span>
      </div>

      <h3 className="mb-0.5 text-sm font-semibold text-foreground group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors line-clamp-1">
        {skill.nameZh || skill.name}
      </h3>
      {skill.nameZh && skill.nameZh !== skill.name && (
        <p className="mb-1 text-[11px] text-muted-foreground/70 line-clamp-1">
          {skill.name}
        </p>
      )}

      <p className="mb-2 text-xs text-muted-foreground line-clamp-2 leading-relaxed">
        {skill.descriptionZh || skill.description}
      </p>

      <p className="text-xs text-muted-foreground">
        by <span className="font-medium text-foreground/80">{skill.author}</span>
      </p>
    </button>
  );
}
