'use client';

import { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import type { AnalysisResult } from '@/types';

interface AnalysisResultProps {
  result: AnalysisResult;
}

const sectionLabels: {
  key: keyof Pick<
    AnalysisResult,
    'analysis' | 'thinking_framework' | 'answer_approach' | 'answer_template'
  >;
  label: string;
  icon: string;
}[] = [
  { key: 'analysis', label: '问题分析', icon: '🔍' },
  { key: 'thinking_framework', label: '思考方式', icon: '🧠' },
  { key: 'answer_approach', label: '回答思路', icon: '💡' },
  { key: 'answer_template', label: '口语化模板', icon: '🗣️' },
];

export default function AnalysisResult({ result }: AnalysisResultProps) {
  const [expandedSections, setExpandedSections] = useState<Set<string>>(
    new Set(['analysis', 'thinking_framework', 'answer_approach', 'answer_template'])
  );

  const toggleSection = (key: string) => {
    setExpandedSections((prev) => {
      const next = new Set(prev);
      if (next.has(key)) {
        next.delete(key);
      } else {
        next.add(key);
      }
      return next;
    });
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <h3 className="text-lg font-semibold text-neutral-100">分析结果</h3>
        <Badge variant="secondary" className="bg-amber-600/20 text-amber-400">
          {result.type.name}
          {result.type.is_new && ' (新类型)'}
        </Badge>
      </div>

      <div className="space-y-2">
        {sectionLabels.map(({ key, label, icon }) => {
          const isExpanded = expandedSections.has(key);
          return (
            <div key={key} className="rounded-lg border border-neutral-700 bg-neutral-800/50">
              <button
                onClick={() => toggleSection(key)}
                className="flex w-full items-center justify-between px-4 py-3 text-left hover:bg-neutral-800/30"
              >
                <span className="flex items-center gap-2 text-neutral-200">
                  <span>{icon}</span>
                  <span className="font-medium">{label}</span>
                </span>
                <span className="text-neutral-500">{isExpanded ? '▲' : '▼'}</span>
              </button>
              {isExpanded && (
                <div className="border-t border-neutral-700 px-4 py-3">
                  <div className="whitespace-pre-wrap text-sm leading-relaxed text-neutral-300">
                    {result[key]}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
