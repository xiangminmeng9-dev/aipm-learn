import type { Metadata } from 'next';
import Sidebar from '@/components/layout/CodingSidebar';
import ResponsiveSidebar from '@/components/layout/ResponsiveSidebar';
import ActivityTracker from '@/components/tracking/ActivityTracker';

export const metadata: Metadata = {
  title: 'AI Coding',
  description: 'AI 辅助编程练习，Spec 实战与代码评审',
};

export default function CodingLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-screen">
      <ActivityTracker module="coding" />
      <ResponsiveSidebar><Sidebar /></ResponsiveSidebar>
      <div className="flex flex-1 flex-col overflow-hidden">
        <div className="h-1 shrink-0 bg-gradient-to-r from-cyan-500 via-teal-400 to-cyan-400" />
        <main className="flex-1 overflow-y-auto bg-background">{children}</main>
      </div>
    </div>
  );
}
