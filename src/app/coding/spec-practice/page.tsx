'use client';

import SpecPracticeView from '@/components/coding/SpecPracticeView';
import PageShell from '@/components/layout/PageShell';
import GradientBackground from '@/components/ui/gradient-background';

export default function SpecPracticePage() {
  return (
    <div className="flex h-full flex-col bg-background">
      <GradientBackground />
      <div className="relative z-10 flex-1 flex flex-col">
        <PageShell title="AI Coding 实操" description="AI 出题，你写 Spec，AI 多维度评分并给出优化建议" icon="✏️">
          <SpecPracticeView />
        </PageShell>
      </div>
    </div>
  );
}
