import type { Metadata } from 'next';
import ResumeSidebar from '@/components/layout/ResumeSidebar';
import ResponsiveSidebar from '@/components/layout/ResponsiveSidebar';

export const metadata: Metadata = {
  title: '简历解析',
  description: 'AI 简历解析与优化建议',
};

export default function ResumeLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-screen">
      <ResponsiveSidebar><ResumeSidebar /></ResponsiveSidebar>
      <main className="flex-1 overflow-y-auto bg-background">{children}</main>
    </div>
  );
}
