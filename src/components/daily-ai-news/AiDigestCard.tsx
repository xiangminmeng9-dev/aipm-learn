'use client';

import Markdown from '@/components/ui/markdown';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface Props {
  digest: string;
  articleCount: number;
}

export default function AiDigestCard({ digest, articleCount }: Props) {
  // Handle legacy JSON-format digest
  let content = digest;
  try {
    const parsed = JSON.parse(digest);
    if (parsed && typeof parsed === 'object') {
      const parts: string[] = [];
      if (parsed.headline) parts.push(`## 📰 今日头条\n${parsed.headline}`);
      if (parsed.summary) parts.push(parsed.summary);
      if (parsed.highlights?.length) parts.push(`## 🔍 核心要点\n${parsed.highlights.map((h: string) => `- **${h}**`).join('\n')}`);
      if (parsed.trend) parts.push(`## 📈 趋势洞察\n${parsed.trend}`);
      content = parts.join('\n\n');
    }
  } catch { /* not JSON, use as-is */ }
  return (
    <Card className="border-indigo-100 bg-gradient-to-br from-indigo-50/50 to-white overflow-hidden">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-xl text-[#1F2937]">AI 每日摘要</CardTitle>
          <span className="inline-flex items-center gap-1 rounded-full bg-indigo-100 px-3 py-1.5 text-sm font-medium text-indigo-600">
            <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904 9 18.75l-.813-2.846a8.25 8.25 0 0 0-5.34-5.34L2 9.75l2.846-.813a8.25 8.25 0 0 0 5.34-5.34L9 1.5l.813 2.846a8.25 8.25 0 0 0 5.34 5.34L18.75 9l-2.846.813a8.25 8.25 0 0 0-5.34 5.34ZM18.259 8.715 18 9.75l-.259-1.035a3.75 3.75 0 0 0-2.456-2.456L14.25 6l1.035-.259a3.75 3.75 0 0 0 2.456-2.456L18 2.25l.259 1.035a3.75 3.75 0 0 0 2.456 2.456L21.75 6l-1.035.259a3.75 3.75 0 0 0-2.456 2.456ZM16.5 12.75l-1.035.259a3.75 3.75 0 0 0-2.456 2.456L12.75 16.5l-.259-1.035a3.75 3.75 0 0 0-2.456-2.456L8.25 12l1.035-.259a3.75 3.75 0 0 0 2.456-2.456L12 8.25l.259 1.035a3.75 3.75 0 0 0 2.456 2.456L15.75 12l-1.035.259Z" />
            </svg>
            AI 生成 · {articleCount} 篇
          </span>
        </div>
      </CardHeader>
      <CardContent>
        <div className="digest-content">
          <Markdown content={content} />
        </div>
      </CardContent>
      <style jsx global>{`
        .digest-content h2 {
          font-size: 1rem;
          font-weight: 600;
          color: #1F2937;
          margin-top: 1rem;
          margin-bottom: 0.5rem;
          padding-bottom: 0.25rem;
          border-bottom: 1px solid #E5E7EB;
        }
        .digest-content h2:first-child {
          margin-top: 0;
        }
        .digest-content p {
          color: #374151;
          line-height: 1.7;
          margin: 0.25rem 0;
        }
        .digest-content ul {
          list-style: none;
          padding-left: 0;
          margin: 0.5rem 0;
        }
        .digest-content li {
          position: relative;
          padding-left: 1rem;
          color: #374151;
          line-height: 1.7;
          margin-bottom: 0.25rem;
        }
        .digest-content li::before {
          content: '';
          position: absolute;
          left: 0;
          top: 0.65em;
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background: #6366F1;
        }
        .digest-content strong {
          color: #4F46E5;
          font-weight: 600;
        }
      `}</style>
    </Card>
  );
}