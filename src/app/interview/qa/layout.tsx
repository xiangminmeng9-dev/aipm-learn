import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: '面试问答',
  description: 'AI 驱动的面试问答练习，智能分析答题思路',
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
