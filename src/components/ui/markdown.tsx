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
  const components: Components = {
    // Headings
    h1: ({ children }) => <h1 className="text-xl font-bold text-foreground mt-4 mb-2">{children}</h1>,
    h2: ({ children }) => <h2 className="text-lg font-bold text-indigo-700 dark:text-indigo-400 mt-4 mb-2 pb-1 border-b border-indigo-100 dark:border-indigo-800">{children}</h2>,
    h3: ({ children }) => <h3 className="text-base font-semibold text-foreground mt-3 mb-1">{children}</h3>,
    h4: ({ children }) => <h4 className="text-sm font-semibold text-foreground mt-2 mb-1">{children}</h4>,
    // Paragraphs
    p: ({ children }) => <p className="my-2 leading-relaxed text-foreground">{children}</p>,
    // Bold/strong
    strong: ({ children }) => <strong className="font-bold text-indigo-700 dark:text-indigo-400">{children}</strong>,
    // Lists
    ul: ({ children }) => <ul className="my-2 ml-4 list-disc space-y-1">{children}</ul>,
    ol: ({ children }) => <ol className="my-2 ml-4 list-decimal space-y-1">{children}</ol>,
    li: ({ children }) => <li className="text-foreground leading-relaxed">{children}</li>,
    // Blockquotes
    blockquote: ({ children }) => <blockquote className="my-3 border-l-4 border-indigo-400 bg-indigo-50 dark:bg-indigo-950/30 py-2 px-4 rounded-r-lg">{children}</blockquote>,
    // Code
    code: ({ className: codeClassName, children, ...props }) => {
      const match = /language-echarts-json/.exec(codeClassName || '');
      if (match && enableECharts) {
        return <EChartsBlock optionJson={String(children)} />;
      }
      const isInline = !codeClassName;
      if (isInline) {
        return <code className="bg-muted px-1.5 py-0.5 rounded text-sm font-mono text-foreground" {...props}>{children}</code>;
      }
      return <code className={codeClassName} {...props}>{children}</code>;
    },
    pre: ({ children }) => <pre className="my-3 rounded-lg bg-muted p-3 overflow-x-auto text-sm">{children}</pre>,
    // Links
    a: ({ href, children }) => <a href={href} className="text-indigo-600 dark:text-indigo-400 hover:underline" target="_blank" rel="noopener noreferrer">{children}</a>,
    // Tables
    table: ({ children }) => <table className="my-3 w-full border-collapse rounded-lg overflow-hidden">{children}</table>,
    th: ({ children }) => <th className="bg-muted px-3 py-2 text-left font-semibold text-foreground border-b border-border">{children}</th>,
    td: ({ children }) => <td className="px-3 py-2 text-foreground border-b border-border">{children}</td>,
    // Horizontal rule
    hr: () => <hr className="my-4 border-border" />,
  };

  return (
    <div className={`max-w-none break-words leading-relaxed ${className}`}>
      <ReactMarkdown remarkPlugins={[remarkGfm]} components={components}>{content}</ReactMarkdown>
    </div>
  );
}
