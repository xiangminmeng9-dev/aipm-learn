'use client';

import CompetitiveAnalysisView from '@/components/interview/CompetitiveAnalysisView';

export default function CompetitiveAnalysisPage() {
  return (
    <div className="space-y-8 p-8">
      <div>
        <h1 className="text-3xl font-semibold text-foreground">竞品分析助手</h1>
        <p className="mt-2 text-muted-foreground">输入产品名，AI 自动生成结构化竞品分析报告并评分</p>
      </div>
      <CompetitiveAnalysisView />
    </div>
  );
}
