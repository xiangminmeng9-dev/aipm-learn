'use client';

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
  if (questions.length === 0) return null;

  return (
    <div className="space-y-3">
      <h3 className="text-base font-medium text-[#6B7280]">热门面试问题</h3>
      <div className="flex gap-3 overflow-x-auto pb-2">
        {questions.map((q) => (
          <div
            key={q.id}
            className="min-w-[240px] max-w-[280px] shrink-0 cursor-pointer rounded-2xl bg-white border border-[#E5E7EB] p-4 transition-all hover:bg-[#F3F4F6]"
            onClick={() => onSelect(q.text)}
          >
            <p className="mb-2 line-clamp-2 text-base text-[#1F2937]">{q.text}</p>
            {q.type && (
              <span className="rounded-full bg-[#E5E7EB] px-2 py-0.5 text-sm text-[#6B7280]">{q.type.name}</span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
