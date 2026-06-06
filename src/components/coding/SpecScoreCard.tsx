'use client';

import ScoreCard from '@/components/shared/ScoreCard';
import type { DimensionScore, SpecSuggestion } from '@/types';

interface SpecScoreCardProps {
  totalScore: number;
  dimensionScores: DimensionScore[];
  suggestions: SpecSuggestion[];
}

export default function SpecScoreCard({ totalScore, dimensionScores, suggestions }: SpecScoreCardProps) {
  return (
    <ScoreCard
      totalScore={totalScore}
      dimensionScores={dimensionScores}
      suggestions={suggestions}
    />
  );
}
