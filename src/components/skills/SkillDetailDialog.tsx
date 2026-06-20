'use client';

import { useState, useCallback } from 'react';
import dynamic from 'next/dynamic';
import { useRouter } from 'next/navigation';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { apiFetch } from '@/lib/api/fetch';
import { cn } from '@/lib/utils';
import { type UnifiedSkill, PLATFORM_CONFIG } from '@/types/workshop';

const Markdown = dynamic(() => import('@/components/ui/markdown'), { ssr: false });

type DisplayMode = 'original' | 'translated' | 'bilingual';

interface SkillDetailDialogProps {
  skill: UnifiedSkill | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

function formatInstalls(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1).replace(/\.0$/, '')}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1).replace(/\.0$/, '')}K`;
  return String(n);
}

export default function SkillDetailDialog({ skill, open, onOpenChange }: SkillDetailDialogProps) {
  const router = useRouter();
  const [skillMd, setSkillMd] = useState<string | null>(null);
  const [loadingMd, setLoadingMd] = useState(false);
  const [mdError, setMdError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  // Translation state
  const [translatedMd, setTranslatedMd] = useState<string | null>(null);
  const [translating, setTranslating] = useState(false);
  const [translateError, setTranslateError] = useState<string | null>(null);
  const [displayMode, setDisplayMode] = useState<DisplayMode>('original');

  const fetchSkillMd = useCallback(async () => {
    if (!skill) return;
    setLoadingMd(true);
    setMdError(null);
    setSkillMd(null);
    setTranslatedMd(null);
    setTranslateError(null);
    setDisplayMode('original');
    try {
      const endpoint =
        skill.platform === 'clawhub'
          ? `/api/skills/workshop/clawhub/${encodeURIComponent(skill.slug)}`
          : `/api/skills/workshop/skillssh/${encodeURIComponent(skill.id)}`;
      const res = await apiFetch(endpoint);
      if (!res.ok) throw new Error(`Failed to fetch skill detail: ${res.status}`);
      const data = await res.json();
      // Extract SKILL.md content from detail response
      const content = data.content ?? data.skillMd ?? data.readme ?? '';
      setSkillMd(content);
    } catch (err) {
      setMdError(err instanceof Error ? err.message : '加载失败');
    } finally {
      setLoadingMd(false);
    }
  }, [skill]);

  // Fetch detail when dialog opens
  const handleOpenChange = useCallback(
    (nextOpen: boolean) => {
      if (nextOpen && skill) {
        fetchSkillMd();
      }
      if (!nextOpen) {
        setSkillMd(null);
        setMdError(null);
        setCopied(false);
        setTranslatedMd(null);
        setTranslateError(null);
        setDisplayMode('original');
      }
      onOpenChange(nextOpen);
    },
    [skill, fetchSkillMd, onOpenChange]
  );

  // Translate skill content
  const handleTranslate = useCallback(async () => {
    if (!skillMd) return;
    setTranslating(true);
    setTranslateError(null);
    try {
      const res = await apiFetch('/api/skills/workshop/translate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: skillMd,
          skill_name: skill?.name,
        }),
      });
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || `翻译失败: HTTP ${res.status}`);
      }
      const data = await res.json();
      setTranslatedMd(data.translated_content);
      setDisplayMode('bilingual');
    } catch (err) {
      setTranslateError(err instanceof Error ? err.message : '翻译失败');
    } finally {
      setTranslating(false);
    }
  }, [skillMd, skill]);

  const installCommand = skill
    ? skill.platform === 'clawhub'
      ? `claude skill install ${skill.slug}`
      : `npx skills add ${skill.id}`
    : '';

  const handleCopy = useCallback(async () => {
    if (!installCommand) return;
    try {
      await navigator.clipboard.writeText(installCommand);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // fallback
    }
  }, [installCommand]);

  const handleAnalyze = useCallback(() => {
    if (!skill) return;
    onOpenChange(false);
    router.push(
      `/skills/workshop/analyze?slug=${encodeURIComponent(skill.slug)}&platform=${skill.platform}`
    );
  }, [skill, onOpenChange, router]);

  if (!skill) return null;

  const cfg = PLATFORM_CONFIG[skill.platform];
  const hasTranslation = translatedMd !== null;

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-3xl max-h-[85vh] flex flex-col">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <DialogTitle className="text-lg">{skill.nameZh || skill.name}</DialogTitle>
            {skill.nameZh && skill.nameZh !== skill.name && (
              <span className="text-xs text-muted-foreground">({skill.name})</span>
            )}
            <span
              className={cn(
                'inline-flex items-center rounded-md px-1.5 py-0.5 text-[10px] font-semibold leading-none',
                cfg.className
              )}
            >
              {cfg.label}
            </span>
          </div>
          <DialogDescription>
            by {skill.author} &middot; {formatInstalls(skill.installs)} 次安装
          </DialogDescription>
        </DialogHeader>

        {/* Display mode tabs + Translate button */}
        {skillMd !== null && !loadingMd && !mdError && (
          <div className="flex items-center justify-between border-b border-border pb-2">
            <div className="flex items-center gap-1 rounded-lg bg-muted p-0.5">
              <button
                type="button"
                onClick={() => setDisplayMode('original')}
                className={cn(
                  'rounded-md px-2.5 py-1 text-xs font-medium transition-colors',
                  displayMode === 'original'
                    ? 'bg-background text-foreground shadow-sm'
                    : 'text-muted-foreground hover:text-foreground'
                )}
              >
                English
              </button>
              <button
                type="button"
                onClick={() => setDisplayMode('translated')}
                disabled={!hasTranslation}
                className={cn(
                  'rounded-md px-2.5 py-1 text-xs font-medium transition-colors',
                  displayMode === 'translated'
                    ? 'bg-background text-foreground shadow-sm'
                    : 'text-muted-foreground hover:text-foreground',
                  !hasTranslation && 'opacity-40 cursor-not-allowed'
                )}
              >
                中文
              </button>
              <button
                type="button"
                onClick={() => setDisplayMode('bilingual')}
                disabled={!hasTranslation}
                className={cn(
                  'rounded-md px-2.5 py-1 text-xs font-medium transition-colors',
                  displayMode === 'bilingual'
                    ? 'bg-background text-foreground shadow-sm'
                    : 'text-muted-foreground hover:text-foreground',
                  !hasTranslation && 'opacity-40 cursor-not-allowed'
                )}
              >
                中英对照
              </button>
            </div>

            <Button
              variant="outline"
              size="xs"
              onClick={handleTranslate}
              disabled={translating}
              className="gap-1"
            >
              {translating ? (
                <>
                  <span className="inline-block h-3 w-3 animate-spin rounded-full border-2 border-current border-t-transparent" />
                  翻译中...
                </>
              ) : hasTranslation ? (
                '重新翻译'
              ) : (
                '翻译为中文'
              )}
            </Button>
          </div>
        )}

        {/* Translate error */}
        {translateError && (
          <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-600 dark:border-red-800 dark:bg-red-950/30 dark:text-red-400">
            {translateError}
          </div>
        )}

        <div className="flex-1 overflow-y-auto min-h-0 pr-1">
          {loadingMd && (
            <div className="space-y-3 py-4">
              <Skeleton className="h-5 w-3/4" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-5/6" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-2/3" />
            </div>
          )}
          {mdError && (
            <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-600 dark:border-red-800 dark:bg-red-950/30 dark:text-red-400">
              {mdError}
            </div>
          )}
          {skillMd !== null && !loadingMd && !mdError && (
            <div className="py-2">
              {displayMode === 'original' && (
                <Markdown content={skillMd} />
              )}
              {displayMode === 'translated' && translatedMd && (
                <Markdown content={translatedMd} />
              )}
              {displayMode === 'bilingual' && translatedMd && (
                <BilingualView original={skillMd} translated={translatedMd} />
              )}
            </div>
          )}
        </div>

        <div className="mt-3 space-y-3">
          {/* Install command */}
          <div className="flex items-center gap-2 rounded-lg bg-muted px-3 py-2">
            <code className="flex-1 text-xs font-mono text-foreground">{installCommand}</code>
            <Button variant="ghost" size="xs" onClick={handleCopy}>
              {copied ? '已复制' : '复制'}
            </Button>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              关闭
            </Button>
            <Button onClick={handleAnalyze}>AI 分析</Button>
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ── Bilingual comparison view ────────────────────────────────────────

function BilingualView({ original, translated }: { original: string; translated: string }) {
  // Split content into sections by headings for side-by-side comparison
  const originalSections = splitByHeadings(original);
  const translatedSections = splitByHeadings(translated);

  // Pair sections by heading
  const maxLen = Math.max(originalSections.length, translatedSections.length);
  const pairs: Array<{ heading: string; original: string; translated: string }> = [];
  for (let i = 0; i < maxLen; i++) {
    const o = originalSections[i] || { heading: '', content: '' };
    const t = translatedSections[i] || { heading: '', content: '' };
    pairs.push({
      heading: t.heading || o.heading,
      original: o.content,
      translated: t.content,
    });
  }

  return (
    <div className="space-y-4">
      {pairs.map((pair, i) => (
        <div key={i} className="rounded-lg border border-border overflow-hidden">
          {pair.heading && (
            <div className="bg-muted/50 px-3 py-1.5 text-xs font-semibold text-foreground border-b border-border">
              {pair.heading}
            </div>
          )}
          <div className="grid grid-cols-2 divide-x divide-border">
            <div className="p-3 text-sm text-muted-foreground overflow-x-auto">
              <Markdown content={pair.original} />
            </div>
            <div className="p-3 text-sm text-foreground overflow-x-auto">
              <Markdown content={pair.translated} />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

function splitByHeadings(content: string): Array<{ heading: string; content: string }> {
  const lines = content.split('\n');
  const sections: Array<{ heading: string; content: string }> = [];
  let currentHeading = '';
  let currentLines: string[] = [];

  for (const line of lines) {
    if (/^#{1,3}\s/.test(line)) {
      if (currentLines.length > 0 || currentHeading) {
        sections.push({ heading: currentHeading, content: currentLines.join('\n') });
      }
      currentHeading = line.replace(/^#+\s*/, '');
      currentLines = [line];
    } else {
      currentLines.push(line);
    }
  }

  if (currentLines.length > 0 || currentHeading) {
    sections.push({ heading: currentHeading, content: currentLines.join('\n') });
  }

  // If no sections were found (no headings), return the whole content as one section
  if (sections.length === 0) {
    sections.push({ heading: '', content });
  }

  return sections;
}
