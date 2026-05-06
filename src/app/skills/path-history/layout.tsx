import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: '路径历史',
  description: '查看历史学习路径记录',
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
