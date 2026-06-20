'use client';

import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import WorkshopTabs from '@/components/skills/WorkshopTabs';
import GradientBackground from '@/components/ui/gradient-background';
import WritePageContent from './WritePageContent';

export default function WritePage() {
  const searchParams = useSearchParams();
  const draftId = searchParams.get('draftId');

  return (
    <div className="flex h-full flex-col bg-background">
      <GradientBackground />
      <div className="relative z-10 shrink-0 border-b border-border bg-card px-6 py-4">
        <h1 className="text-lg font-semibold text-foreground">技能工坊</h1>
        <p className="text-xs text-muted-foreground">浏览社区热门 Skill，AI 分析质量，编写自己的 Skill，发布到平台</p>
        <WorkshopTabs />
      </div>
      <div className="relative z-10 flex-1 overflow-y-auto p-6">
        <Suspense fallback={<div className="flex items-center justify-center py-12"><div className="h-8 w-8 animate-spin rounded-full border-2 border-indigo-500 border-t-transparent" /></div>}>
          <WritePageContent draftId={draftId} />
        </Suspense>
      </div>
    </div>
  );
}
