import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: '模拟面试',
  description: '全流程模拟面试，AI 实时评分与反馈',
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
