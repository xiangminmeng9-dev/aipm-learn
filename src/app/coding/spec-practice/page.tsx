'use client';

import SpecPracticeView from '@/components/coding/SpecPracticeView';

export default function SpecPracticePage() {
  return (
    <div className="p-8 space-y-8">
      <div>
        <h1 className="text-3xl font-semibold text-foreground">AI Coding 实操</h1>
        <p className="mt-2 text-muted-foreground">AI 出题，你写 Spec，AI 多维度评分并给出优化建议</p>
      </div>
      <SpecPracticeView />
    </div>
  );
}
