import type { Metadata } from 'next';
import ResumeSidebar from '@/components/layout/ResumeSidebar';
import ResponsiveSidebar from '@/components/layout/ResponsiveSidebar';
import ActivityTracker from '@/components/tracking/ActivityTracker';

export const metadata: Metadata = { title: '简历解析', description: 'AI 简历解析与优化建议' };

export default function ResumeLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-screen">
      <ActivityTracker module="resume" />
      <ResponsiveSidebar><ResumeSidebar /></ResponsiveSidebar>
      <div className="flex flex-1 flex-col overflow-hidden">
        <div className="h-1 shrink-0 bg-gradient-to-r from-orange-500 via-amber-400 to-orange-400" />
        <main className="flex-1 overflow-y-auto bg-background">{children}</main>
      </div>
    </div>
  );
}
