import type { Metadata } from 'next';
import Sidebar from '@/components/layout/SkillsSidebar';
import ResponsiveSidebar from '@/components/layout/ResponsiveSidebar';
import ActivityTracker from '@/components/tracking/ActivityTracker';

export const metadata: Metadata = {
  title: 'AI 技能树',
  description: 'AI 产品经理技能体系，学习路径与进度追踪',
};

export default function SkillsLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-screen">
      <ActivityTracker module="skills" />
      <ResponsiveSidebar><Sidebar /></ResponsiveSidebar>
      <main className="flex-1 overflow-y-auto bg-background">{children}</main>
    </div>
  );
}
