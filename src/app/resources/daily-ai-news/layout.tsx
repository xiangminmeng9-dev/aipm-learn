import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: '每日 AI 资讯',
  description: '每日 AI 行业资讯摘要与趋势分析',
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
