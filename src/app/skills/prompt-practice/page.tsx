'use client';

import PromptPracticeView from '@/components/skills/PromptPracticeView';
import GradientBackground from '@/components/ui/gradient-background';

export default function PromptPracticePage() {
  return (
    <div className="flex h-full flex-col bg-background">
      <GradientBackground />
      <div className="relative z-10 shrink-0 border-b border-border bg-card px-6 py-4">
        <h1 className="text-lg font-semibold text-foreground">Prompt 练习</h1>
        <p className="text-xs text-muted-foreground">AI 出题，你写 Prompt，AI 多维度评分并给出差异对比、优化建议和满分答案</p>
      </div>
      <div className="relative z-10 flex-1 overflow-y-auto p-6">
        <PromptPracticeView />
      </div>
    </div>
  );
}
