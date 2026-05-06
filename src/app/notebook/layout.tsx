import type { Metadata } from 'next';
import NotebookSidebar from '@/components/layout/NotebookSidebar';
import ResponsiveSidebar from '@/components/layout/ResponsiveSidebar';

export const metadata: Metadata = {
  title: '知识笔记本',
  description: '个人知识管理与笔记整理',
};

export default function NotebookLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-screen">
      <ResponsiveSidebar><NotebookSidebar /></ResponsiveSidebar>
      <main className="flex-1 overflow-y-auto bg-gradient-to-br from-slate-50 via-gray-50 to-zinc-100 dark:from-slate-950 dark:via-gray-950 dark:to-zinc-900">{children}</main>
    </div>
  );
}
