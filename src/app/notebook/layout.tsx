import type { Metadata } from 'next';
import { Suspense } from 'react';
import NotebookSidebar from '@/components/layout/NotebookSidebar';
import ResponsiveSidebar from '@/components/layout/ResponsiveSidebar';
import ActivityTracker from '@/components/tracking/ActivityTracker';

export const metadata: Metadata = {
  title: '知识笔记本',
  description: '个人知识管理与笔记整理',
};

function PageLoader() {
  return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <div className="h-8 w-8 animate-spin rounded-full border-2 border-amber-500 border-t-transparent" />
    </div>
  );
}

export default function NotebookLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-screen">
      <ActivityTracker module="notebook" />
      <ResponsiveSidebar><NotebookSidebar /></ResponsiveSidebar>
      <div className="flex flex-1 flex-col overflow-hidden">
        <div className="h-1 shrink-0 bg-gradient-to-r from-amber-400 via-yellow-400 to-amber-300"/>
        <main className="flex-1 overflow-y-auto bg-background">
          <Suspense fallback={<PageLoader />}>{children}</Suspense>
        </main>
      </div>
    </div>
  );
}
