'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface AnswerEvaluationProps {
  score: number;
  gapAnalysis: string;
  perfectAnswer: string;
}

export default function AnswerEvaluation({
  score,
  gapAnalysis,
  perfectAnswer,
}: AnswerEvaluationProps) {
  const scoreColor = score >= 8 ? 'text-green-400' : score >= 6 ? 'text-amber-400' : 'text-red-400';
  const scoreBg = score >= 8 ? 'bg-green-600/20' : score >= 6 ? 'bg-amber-600/20' : 'bg-red-600/20';

  return (
    <Card className="border-neutral-700 bg-neutral-800/50">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base text-neutral-200">答题评价</CardTitle>
          <div className={`flex items-center gap-2 rounded-full px-3 py-1 ${scoreBg}`}>
            <span className={`text-2xl font-bold ${scoreColor}`}>{score}</span>
            <span className="text-xs text-neutral-400">/10</span>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <Badge variant="secondary" className="mb-2 bg-neutral-700 text-neutral-300">
            差距分析
          </Badge>
          <p className="whitespace-pre-wrap text-sm text-neutral-300">{gapAnalysis}</p>
        </div>
        <div>
          <Badge variant="secondary" className="mb-2 bg-amber-600/20 text-amber-400">
            满分回答
          </Badge>
          <p className="whitespace-pre-wrap text-sm text-neutral-300">{perfectAnswer}</p>
        </div>
      </CardContent>
    </Card>
  );
}
