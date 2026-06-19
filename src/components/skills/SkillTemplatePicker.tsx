'use client';

import { SKILL_TEMPLATES, type SkillTemplateKey } from '@/lib/skills/skill-templates';
import { cn } from '@/lib/utils';
import { FileText, Bot, GitBranch, Briefcase } from 'lucide-react';

const TEMPLATE_ICONS: Record<SkillTemplateKey, React.ReactNode> = {
  basic: <FileText className="h-5 w-5" />,
  agent: <Bot className="h-5 w-5" />,
  workflow: <GitBranch className="h-5 w-5" />,
  'pm-specialist': <Briefcase className="h-5 w-5" />,
};

const TEMPLATE_COLORS: Record<SkillTemplateKey, string> = {
  basic: 'bg-blue-100 text-blue-600 dark:bg-blue-900/40 dark:text-blue-400',
  agent: 'bg-purple-100 text-purple-600 dark:bg-purple-900/40 dark:text-purple-400',
  workflow: 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/40 dark:text-emerald-400',
  'pm-specialist': 'bg-amber-100 text-amber-600 dark:bg-amber-900/40 dark:text-amber-400',
};

interface SkillTemplatePickerProps {
  selected: SkillTemplateKey | null;
  onSelect: (key: SkillTemplateKey) => void;
}

export default function SkillTemplatePicker({ selected, onSelect }: SkillTemplatePickerProps) {
  const entries = Object.entries(SKILL_TEMPLATES) as [SkillTemplateKey, typeof SKILL_TEMPLATES[SkillTemplateKey]][];

  return (
    <div className="grid grid-cols-2 gap-3">
      {entries.map(([key, template]) => {
        const isSelected = selected === key;
        const isPM = key === 'pm-specialist';

        return (
          <button
            key={key}
            type="button"
            onClick={() => onSelect(key)}
            className={cn(
              'relative flex flex-col items-start gap-2 rounded-xl border-2 p-4 text-left transition-all hover:shadow-md',
              isSelected
                ? 'border-indigo-500 bg-indigo-50 dark:border-indigo-400 dark:bg-indigo-950/30'
                : 'border-border bg-card hover:border-indigo-300 dark:hover:border-indigo-700',
            )}
          >
            {isPM && (
              <span className="absolute top-2 right-2 rounded-full bg-amber-500 px-2 py-0.5 text-[10px] font-bold text-white">
                推荐
              </span>
            )}

            <div className={cn(
              'flex h-10 w-10 items-center justify-center rounded-lg',
              TEMPLATE_COLORS[key],
            )}>
              {TEMPLATE_ICONS[key]}
            </div>

            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-foreground">{template.name}</p>
              <p className="mt-0.5 text-xs text-muted-foreground line-clamp-2">{template.description}</p>
            </div>
          </button>
        );
      })}
    </div>
  );
}
