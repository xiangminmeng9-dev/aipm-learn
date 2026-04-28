'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Markdown from '@/components/ui/markdown';

interface ResumeResultProps {
  modifiedResume: string;
  changesSummary: string;
}

export default function ResumeResult({ modifiedResume, changesSummary }: ResumeResultProps) {
  const [isSummaryExpanded, setIsSummaryExpanded] = useState(true);

  return (
    <div className="space-y-4">
      {/* Changes summary */}
      {changesSummary && (
        <div className="overflow-hidden rounded-xl border border-indigo-200 bg-indigo-50/30">
          <button
            onClick={() => setIsSummaryExpanded(!isSummaryExpanded)}
            className="flex w-full items-center justify-between px-5 py-3.5 text-left hover:bg-indigo-50/50 transition-colors"
          >
            <span className="flex items-center gap-2 text-sm font-semibold text-indigo-700">
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" />
              </svg>
              修改摘要
            </span>
            <span className="text-xs text-indigo-400">
              {isSummaryExpanded ? '收起' : '展开'}
            </span>
          </button>
          <AnimatePresence>
            {isSummaryExpanded && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="overflow-hidden"
              >
                <div className="border-t border-indigo-200 px-5 py-4">
                  <Markdown content={changesSummary} />
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}

      {/* Modified resume */}
      <div className="rounded-xl border border-border bg-card p-6">
        <div className="mb-4 flex items-center gap-2">
          <div className="h-1.5 w-1.5 rounded-full bg-indigo-500" />
          <h3 className="text-sm font-semibold text-foreground">修改后的简历</h3>
        </div>
        <Markdown content={modifiedResume} />
      </div>
    </div>
  );
}
