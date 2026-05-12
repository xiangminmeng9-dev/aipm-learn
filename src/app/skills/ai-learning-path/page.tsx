'use client';

import GradientBackground from '@/components/ui/gradient-background';
import LearningPathView from '@/components/skills/LearningPathView';

export default function AiLearningPathPage() {
  return (
    <div className="space-y-8 p-8">
      <GradientBackground />
      <div className="relative z-10">
        <h1 className="text-3xl font-semibold text-foreground">AI 学习路径</h1>
        <p className="mt-2 text-muted-foreground">基于弱项分析，AI 自动生成个性化学习路径和推荐模块</p>
      </div>
      <div className="relative z-10">
        <LearningPathView />
      </div>
    </div>
  );
}
