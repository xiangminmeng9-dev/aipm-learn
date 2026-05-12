import type { Metadata } from 'next';
import Sidebar from '@/components/layout/SkillsSidebar';
import ResponsiveSidebar from '@/components/layout/ResponsiveSidebar';
import ActivityTracker from '@/components/tracking/ActivityTracker';

export const metadata: Metadata = { title: 'AI 技能树', description: 'AI 产品经理技能体系' };

export default function SkillsLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-screen">
      <ActivityTracker module="skills" />
      <ResponsiveSidebar><Sidebar /></ResponsiveSidebar>
      <div className="flex flex-1 flex-col overflow-hidden">
        <div className="h-1 shrink-0 bg-gradient-to-r from-amber-400 via-yellow-400 to-amber-300" />
        <main className="flex-1 overflow-y-auto bg-background">{children}</main>
      </div>
    </div>
  );
}
