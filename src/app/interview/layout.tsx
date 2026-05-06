import type { Metadata } from 'next';
import Sidebar from '@/components/layout/Sidebar';
import ResponsiveSidebar from '@/components/layout/ResponsiveSidebar';

export const metadata: Metadata = {
  title: '面试',
  description: 'AI 面试练习与模拟',
};

export default function InterviewLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-screen">
      <ResponsiveSidebar><Sidebar /></ResponsiveSidebar>
      <main className="flex-1 overflow-y-auto bg-background">{children}</main>
    </div>
  );
}
