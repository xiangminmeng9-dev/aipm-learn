import type { Metadata } from 'next';
import ResourcesSidebar from '@/components/layout/ResourcesSidebar';
import ResponsiveSidebar from '@/components/layout/ResponsiveSidebar';

export const metadata: Metadata = {
  title: '资源库',
  description: 'AI 学习资源聚合，RSS 订阅与每日资讯',
};

export default function ResourcesLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-screen">
      <ResponsiveSidebar><ResourcesSidebar /></ResponsiveSidebar>
      <main className="flex-1 overflow-y-auto bg-background">{children}</main>
    </div>
  );
}
