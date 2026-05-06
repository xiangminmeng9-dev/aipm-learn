import type { Metadata } from 'next';
import SimulatorLayoutClient from '@/components/layout/SimulatorLayoutClient';

export const metadata: Metadata = {
  title: 'AI PM 模拟器',
  description: '模拟 AI 产品经理工作流，实战演练',
};

export default function SimulatorLayout({ children }: { children: React.ReactNode }) {
  return <SimulatorLayoutClient>{children}</SimulatorLayoutClient>;
}
