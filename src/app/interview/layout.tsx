import type { Metadata } from 'next';
import Sidebar from '@/components/layout/Sidebar';
import ResponsiveSidebar from '@/components/layout/ResponsiveSidebar';
import ActivityTracker from '@/components/tracking/ActivityTracker';
import LearningReminderBanner from '@/components/reminder/LearningReminderBanner';

export const metadata: Metadata = {
  title: '面试',
  description: 'AI 面试练习与模拟',
};

export default function InterviewLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-screen">
      <ActivityTracker module="interview" />
      <ResponsiveSidebar><Sidebar /></ResponsiveSidebar>
      <div className="flex flex-1 flex-col overflow-hidden">
        <LearningReminderBanner />
        <main className="flex-1 overflow-y-auto bg-background">{children}</main>
      </div>
    </div>
  );
}
