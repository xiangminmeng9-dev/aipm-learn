'use client';

import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface TrendingQuestion {
  id: string;
  text: string;
  type: { id: string; name: string } | null;
  rank: number;
}

interface TrendingQuestionsProps {
  questions: TrendingQuestion[];
  onSelect: (question: string) => void;
}

export default function TrendingQuestions({ questions, onSelect }: TrendingQuestionsProps) {
  if (questions.length === 0) {
    return null;
  }

  return (
    <div className="space-y-3">
      <h3 className="text-sm font-medium text-neutral-400">热门面试问题</h3>
      <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-thin">
        {questions.map((q) => (
          <Card
            key={q.id}
            className="min-w-[240px] max-w-[280px] shrink-0 cursor-pointer border-neutral-700 bg-neutral-800/50 transition-colors hover:border-amber-600/50"
            onClick={() => onSelect(q.text)}
          >
            <CardContent className="p-4">
              <p className="mb-2 line-clamp-2 text-sm text-neutral-200">{q.text}</p>
              {q.type && (
                <Badge variant="secondary" className="bg-neutral-700 text-neutral-400 text-xs">
                  {q.type.name}
                </Badge>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
