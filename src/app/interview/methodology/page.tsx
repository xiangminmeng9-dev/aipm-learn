'use client';

import { useState, useEffect } from 'react';
import MethodologyCard from '@/components/interview/MethodologyCard';

interface Methodology {
  id: string;
  type: { id: string; name: string };
  framework: string;
  key_steps: string[];
  typical_cases: string[];
  source_count: number;
  updated_at: string;
}

interface MethodologyDetail extends Methodology {
  high_frequency_questions: { id: string; text: string }[];
}

export default function MethodologyPage() {
  const [methodologies, setMethodologies] = useState<Methodology[]>([]);
  const [details, setDetails] = useState<Record<string, MethodologyDetail>>({});
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [message, setMessage] = useState('');

  useEffect(() => {
    fetchMethodologies();
  }, []);

  const fetchMethodologies = async () => {
    try {
      const res = await fetch('/api/interview/methodology');
      if (res.ok) {
        const data = await res.json();
        setMethodologies(data.methodologies ?? []);
        setMessage(data.message ?? '');
      }
    } catch {
      // 静默失败
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggle = async (methodology: Methodology) => {
    if (expandedId === methodology.id) {
      setExpandedId(null);
      return;
    }

    setExpandedId(methodology.id);

    // 如果还没有加载详情，则加载
    if (!details[methodology.id]) {
      try {
        const res = await fetch(`/api/interview/methodology/${methodology.type.id}`);
        if (res.ok) {
          const data = await res.json();
          setDetails((prev) => ({
            ...prev,
            [methodology.id]: { ...methodology, ...data },
          }));
        }
      } catch {
        // 静默失败
      }
    }
  };

  return (
    <div className="mx-auto max-w-3xl p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-neutral-50">方法论提炼</h1>
        <p className="mt-1 text-sm text-neutral-400">基于练习历史动态生成的方法论，类型不封顶</p>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-amber-600 border-t-transparent" />
        </div>
      ) : methodologies.length === 0 ? (
        <div className="py-16 text-center">
          <p className="text-neutral-500">{message || '还没有方法论'}</p>
          <p className="mt-1 text-sm text-neutral-600">多进行面试问答练习，系统会自动提炼方法论</p>
        </div>
      ) : (
        <div className="space-y-4">
          {methodologies.map((m) => (
            <MethodologyCard
              key={m.id}
              type={m.type}
              framework={m.framework}
              keySteps={details[m.id]?.key_steps ?? m.key_steps}
              typicalCases={details[m.id]?.typical_cases ?? m.typical_cases}
              sourceCount={m.source_count}
              updatedAt={m.updated_at}
              isExpanded={expandedId === m.id}
              onToggle={() => handleToggle(m)}
              highFrequencyQuestions={details[m.id]?.high_frequency_questions}
            />
          ))}
        </div>
      )}
    </div>
  );
}
