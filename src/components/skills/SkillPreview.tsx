'use client';

import dynamic from 'next/dynamic';
import YAML from 'yaml';
import { cn } from '@/lib/utils';

const Markdown = dynamic(() => import('@/components/ui/markdown'), { ssr: false });

interface SkillPreviewProps {
  content: string;
  className?: string;
}

export default function SkillPreview({ content, className }: SkillPreviewProps) {
  const parsed = parseSkillContent(content);

  return (
    <div className={cn('space-y-4', className)}>
      {/* Frontmatter metadata card */}
      {parsed.frontmatter && (
        <div className="rounded-lg border border-border bg-muted/30 p-4 space-y-2">
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold text-foreground">{parsed.frontmatter.name || '未命名技能'}</span>
            {parsed.frontmatter.effort && (
              <span className={cn(
                'rounded-full px-2 py-0.5 text-[10px] font-bold',
                parsed.frontmatter.effort === 'high'
                  ? 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-400'
                  : parsed.frontmatter.effort === 'medium'
                    ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400'
                    : 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-400',
              )}>
                {parsed.frontmatter.effort}
              </span>
            )}
          </div>

          {parsed.frontmatter.description && (
            <p className="text-xs text-muted-foreground">{parsed.frontmatter.description}</p>
          )}

          {/* Metadata fields */}
          {parsed.frontmatter.metadata && Object.keys(parsed.frontmatter.metadata).length > 0 && (
            <div className="flex flex-wrap gap-2">
              {Object.entries(parsed.frontmatter.metadata).map(([key, val]) => (
                val ? (
                  <span key={key} className="rounded-md bg-background px-2 py-0.5 text-[10px] text-muted-foreground border border-border">
                    {key}: {String(val)}
                  </span>
                ) : null
              ))}
            </div>
          )}

          {/* Allowed tools */}
          {parsed.frontmatter['allowed-tools'] && (
            <div className="flex flex-wrap gap-1">
              <span className="text-[10px] text-muted-foreground mr-1">tools:</span>
              {parsed.frontmatter['allowed-tools'].split(/\s+/).filter(Boolean).map(tool => (
                <span key={tool} className="rounded-md bg-indigo-100 px-1.5 py-0.5 text-[10px] font-mono text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-400">
                  {tool}
                </span>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Body content as Markdown */}
      {parsed.body ? (
        <Markdown content={parsed.body} />
      ) : (
        <div className="flex items-center justify-center rounded-lg border border-dashed border-border p-8 text-sm text-muted-foreground">
          在左侧编写内容，这里会实时预览
        </div>
      )}
    </div>
  );
}

function parseSkillContent(content: string): {
  frontmatter: {
    name: string;
    description: string;
    metadata?: Record<string, string>;
    'allowed-tools'?: string;
    effort?: string;
  } | null;
  body: string;
} {
  const match = content.match(/^---\n([\s\S]*?)\n---\n?([\s\S]*)$/);
  if (!match) {
    return { frontmatter: null, body: content };
  }

  try {
    const parsed = YAML.parse(match[1]) as Record<string, unknown>;
    return {
      frontmatter: {
        name: String(parsed.name || ''),
        description: String(parsed.description || ''),
        metadata: parsed.metadata as Record<string, string> | undefined,
        'allowed-tools': parsed['allowed-tools'] ? String(parsed['allowed-tools']) : undefined,
        effort: parsed.effort ? String(parsed.effort) : undefined,
      },
      body: match[2] || '',
    };
  } catch {
    return { frontmatter: null, body: content };
  }
}
