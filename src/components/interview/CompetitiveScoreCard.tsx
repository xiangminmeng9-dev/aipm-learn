'use client';

import ScoreCard from '@/components/shared/ScoreCard';
import type { DimensionScore } from '@/types';

interface CompetitiveScoreCardProps {
  totalScore: number;
  dimensionScores: DimensionScore[];
}

export default function CompetitiveScoreCard({ totalScore, dimensionScores }: CompetitiveScoreCardProps) {
  return (
    <ScoreCard
      totalScore={totalScore}
      dimensionScores={dimensionScores}
      gradientFrom="from-purple-50"
      gradientTo="to-violet-50"
    />
  );
}
