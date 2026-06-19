'use client';

import { useState, useCallback } from 'react';
import dynamic from 'next/dynamic';
const Markdown = dynamic(() => import('@/components/ui/markdown'), { ssr: false });
import ChangesSummaryCard from '@/components/resume/ChangesSummaryCard';

/** Convert Markdown source to clean plain text for clipboard copy */
function markdownToPlainText(md: string): string {
  return md
    // Remove horizontal rules (---, ***, ___)
    .replace(/^[-*_]{3,}\s*$/gm, '')
    // Remove bold markers (**text** or __text__)
    .replace(/\*\*(.+?)\*\*/g, '$1')
    .replace(/__(.+?)__/g, '$1')
    // Remove italic markers — only match when underscores wrap a standalone word
    .replace(/\*(.+?)\*/g, '$1')
    .replace(/(?<=^|\s)_(.+?)_(?=$|\s)/gm, '$1')
    // Remove strikethrough (~~text~~)
    .replace(/~~(.+?)~~/g, '$1')
    // Remove inline code markers (`code`)
    .replace(/`(.+?)`/g, '$1')
    // Remove heading markers (## ### etc.)
    .replace(/^#{1,6}\s+/gm, '')
    // Remove blockquote markers (> text)
    .replace(/^>\s*/gm, '')
    // Remove link syntax [text](url) → text
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    // Remove image syntax ![alt](url)
    .replace(/!\[([^\]]*)\]\([^)]+\)/g, '$1')
    // Remove fenced code blocks (```...```)
    .replace(/```\w*\n?/g, '')
    // Convert unordered list markers (- or * or +) to bullet character
    .replace(/^[\s]*[-*+]\s+/gm, '• ')
    // Remove HTML tags
    .replace(/<[^>]+>/g, '')
    // Collapse multiple blank lines to max 2
    .replace(/\n{3,}/g, '\n\n')
    // Trim trailing whitespace on each line
    .replace(/[ \t]+$/gm, '')
    .trim();
}

interface ResumeResultProps {
  modifiedResume: string;
  changesSummary: string;
}

export default function ResumeResult({ modifiedResume, changesSummary }: ResumeResultProps) {
  const [copyState, setCopyState] = useState<'idle' | 'copied'>('idle');

  const handleCopy = useCallback(async () => {
    const plainText = markdownToPlainText(modifiedResume);
    try {
      await navigator.clipboard.writeText(plainText);
      setCopyState('copied');
      setTimeout(() => setCopyState('idle'), 2000);
    } catch {
      const textarea = document.createElement('textarea');
      textarea.value = plainText;
      textarea.style.position = 'fixed';
      textarea.style.opacity = '0';
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
      setCopyState('copied');
      setTimeout(() => setCopyState('idle'), 2000);
    }
  }, [modifiedResume]);

  return (
    <div className="space-y-4">
      {/* Changes summary — grouped by dimension */}
      {changesSummary && (
        <ChangesSummaryCard summary={changesSummary} />
      )}

      {/* Modified resume — this is the exact element that gets captured for PDF */}
      <div id="resume-pdf-content" className="bg-white dark:bg-slate-800 p-8 rounded-xl border border-border dark:border-slate-600 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="h-1.5 w-1.5 rounded-full bg-indigo-500" />
            <h3 className="text-sm font-semibold text-foreground">修改后的简历</h3>
          </div>
          <button
            onClick={handleCopy}
            className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors border border-border hover:bg-muted text-muted-foreground hover:text-foreground"
          >
            {copyState === 'copied' ? (
              <>
                <svg className="h-3.5 w-3.5 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
                <span className="text-emerald-600">已复制</span>
              </>
            ) : (
              <>
                <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
                <span>复制纯文本</span>
              </>
            )}
          </button>
        </div>
        <Markdown content={modifiedResume} />
      </div>
    </div>
  );
}
