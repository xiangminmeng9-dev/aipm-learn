'use client';

import { useState } from 'react';
import Markdown from '@/components/ui/markdown';
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
        <h3 className="text-lg font-semibold text-foreground">分析结果</h3>
        <span className="rounded-full bg-amber-50 px-2.5 py-0.5 text-xs font-medium text-amber-700">
          {result.type.name}
          {result.type.is_new && ' (新类型)'}
        </span>
      </div>

      <div className="space-y-2">
        {sectionLabels.map(({ key, label, icon }) => {
          const isExpanded = expandedSections.has(key);
          const content = result[key];
          return (
            <div key={key} className="rounded-xl border border-border bg-card overflow-hidden">
              <button
                onClick={() => toggleSection(key)}
                className="flex w-full items-center justify-between px-5 py-3.5 text-left hover:bg-muted transition-colors"
              >
                <span className="flex items-center gap-2 text-foreground">
                  <span>{icon}</span>
                  <span className="font-medium">{label}</span>
                </span>
                <span className="text-muted-foreground">{isExpanded ? '▲' : '▼'}</span>
              </button>
              {isExpanded && content && (
                <div className="border-t border-border px-5 py-4">
                  <Markdown content={content} />
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
