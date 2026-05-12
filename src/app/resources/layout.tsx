import type { Metadata } from 'next';
import ResourcesSidebar from '@/components/layout/ResourcesSidebar';
import ResponsiveSidebar from '@/components/layout/ResponsiveSidebar';
import ActivityTracker from '@/components/tracking/ActivityTracker';

export const metadata: Metadata = { title: '资源库', description: 'AI 学习资源聚合' };

export default function ResourcesLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-screen">
      <ActivityTracker module="resources" />
      <ResponsiveSidebar><ResourcesSidebar /></ResponsiveSidebar>
      <div className="flex flex-1 flex-col overflow-hidden">
        <div className="h-1 shrink-0 bg-gradient-to-r from-blue-500 via-sky-400 to-blue-400" />
        <main className="flex-1 overflow-y-auto bg-background">{children}</main>
      </div>
    </div>
  );
}
