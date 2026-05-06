import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: '竞品分析',
  description: 'AI 竞品分析助手，自动生成结构化竞品分析报告',
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
