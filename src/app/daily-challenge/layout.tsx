import type { Metadata } from 'next';
import DailyChallengeLayoutClient from '@/components/layout/DailyChallengeLayoutClient';

export const metadata: Metadata = {
  title: '每日挑战',
  description: '每日 AI PM 面试挑战题',
};

export default function DailyChallengeLayout({ children }: { children: React.ReactNode }) {
  return <DailyChallengeLayoutClient>{children}</DailyChallengeLayoutClient>;
}
