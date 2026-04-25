'use client';

import ReactMarkdown, { type Components } from 'react-markdown';
import remarkGfm from 'remark-gfm';
import dynamic from 'next/dynamic';

const ReactECharts = dynamic(() => import('echarts-for-react'), { ssr: false });

interface MarkdownProps {
  content: string;
  className?: string;
  enableECharts?: boolean;
}

function EChartsBlock({ optionJson }: { optionJson: string }) {
  try {
    const option = JSON.parse(optionJson);
    return (
      <div className="my-3 rounded-xl border border-gray-200 bg-white p-2">
        <ReactECharts option={option} style={{ height: 280, width: '100%' }} />
      </div>
    );
  } catch {
    return (
      <pre className="rounded-xl bg-gray-50 p-3 text-xs text-red-600">
        ECharts JSON 解析失败：{optionJson.slice(0, 200)}
      </pre>
    );
  }
}

export default function Markdown({ content, className = '', enableECharts = false }: MarkdownProps) {
  const components: Components | undefined = enableECharts
    ? {
        code({ className: codeClassName, children, ...props }) {
          const match = /language-echarts-json/.exec(codeClassName || '');
          if (match) {
            return <EChartsBlock optionJson={String(children)} />;
          }
          return <code className={codeClassName} {...props}>{children}</code>;
        },
      }
    : undefined;

  return (
    <div
      className={`max-w-none break-words overflow-wrap-anywhere hyphens-auto text-[#4B5563] leading-relaxed [&_h1]:text-[#1F2937] [&_h1]:font-semibold [&_h2]:text-[#1F2937] [&_h2]:font-semibold [&_h3]:text-[#1F2937] [&_h3]:font-semibold [&_strong]:text-[#1F2937] [&_a]:text-indigo-600 [&_a]:no-underline [&_a:hover]:underline [&_code]:rounded-md [&_code]:bg-[#F3F4F6] [&_code]:px-1.5 [&_code]:py-0.5 [&_code]:text-indigo-600 [&_code]:text-sm [&_code]:before:content-none [&_code]:after:content-none [&_pre]:bg-[#F9FAFB] [&_pre]:border [&_pre]:border-[#E5E7EB] [&_pre]:rounded-xl [&_pre]:text-base [&_pre]:overflow-x-auto ${className}`}
    >
      <ReactMarkdown remarkPlugins={[remarkGfm]} components={components}>{content}</ReactMarkdown>
    </div>
  );
}
