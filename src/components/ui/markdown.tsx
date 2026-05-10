'use client';

import ReactMarkdown, { type Components } from 'react-markdown';
import remarkGfm from 'remark-gfm';
import ReactECharts from '@/components/ui/EChartsWrapper';

interface MarkdownProps {
  content: string;
  className?: string;
  enableECharts?: boolean;
}

function EChartsBlock({ optionJson }: { optionJson: string }) {
  try {
    const option = JSON.parse(optionJson);
    return (
      <div className="my-3 rounded-xl border border-border bg-card p-2">
        <ReactECharts option={option} style={{ height: 280, width: '100%' }} />
      </div>
    );
  } catch {
    return (
      <pre className="rounded-xl bg-muted p-3 text-xs text-red-600">
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
      className={`prose prose-sm max-w-none dark:prose-invert break-words overflow-wrap-anywhere hyphens-auto leading-relaxed ${className}`}
    >
      <ReactMarkdown remarkPlugins={[remarkGfm]} components={components}>{content}</ReactMarkdown>
    </div>
  );
}
