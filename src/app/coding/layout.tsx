import type { Metadata } from 'next';
import Sidebar from '@/components/layout/CodingSidebar';
import ResponsiveSidebar from '@/components/layout/ResponsiveSidebar';

export const metadata: Metadata = {
  title: 'AI Coding',
  description: 'AI 辅助编程练习，Spec 实战与代码评审',
};

export default function CodingLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-screen">
      <ResponsiveSidebar><Sidebar /></ResponsiveSidebar>
      <main className="flex-1 overflow-y-auto bg-background">{children}</main>
    </div>
  );
}
