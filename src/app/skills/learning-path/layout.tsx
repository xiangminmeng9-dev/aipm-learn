import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'AI 学习路径',
  description: '基于弱项分析自动生成个人学习路径',
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
