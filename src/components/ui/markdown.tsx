'use client';

import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

interface MarkdownProps {
  content: string;
  className?: string;
}

export default function Markdown({ content, className = '' }: MarkdownProps) {
  return (
    <div
      className={`prose max-w-none break-words overflow-wrap-anywhere hyphens-auto prose-headings:text-[#1F2937] prose-headings:font-semibold prose-p:text-[#4B5563] prose-p:leading-relaxed prose-strong:text-[#1F2937] prose-li:text-[#4B5563] prose-li:break-words prose-code:rounded-md prose-code:bg-[#F3F4F6] prose-code:px-1.5 prose-code:py-0.5 prose-code:text-indigo-600 prose-code:text-sm prose-code:before:content-none prose-code:after:content-none prose-code:break-words prose-pre:bg-[#F9FAFB] prose-pre:border prose-pre:border-[#E5E7EB] prose-pre:rounded-xl prose-pre:text-base prose-pre:overflow-x-auto prose-a:text-indigo-600 prose-a:no-underline hover:prose-a:underline prose-ul:space-y-1 prose-ol:space-y-1 prose-h2:text-lg prose-h2:mt-6 prose-h2:mb-3 prose-h3:text-base prose-h3:mt-4 prose-h3:mb-2 ${className}`}
    >
      <ReactMarkdown remarkPlugins={[remarkGfm]}>{content}</ReactMarkdown>
    </div>
  );
}
