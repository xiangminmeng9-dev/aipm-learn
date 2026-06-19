'use client';

import { useState, useCallback, useEffect } from 'react';
import Link from 'next/link';
import { apiFetch } from '@/lib/api/fetch';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog';
import { cn } from '@/lib/utils';
import {
  ChevronDown,
  ChevronRight,
  Key,
  Upload,
  ExternalLink,
  FileText,
  Trash2,
  Loader2,
  Terminal,
  Copy,
  Check,
} from 'lucide-react';

import {
  type Draft,
  type TokenInfo,
  type Platform,
  type PublishResult,
} from '@/types/workshop';

// Re-export for backward compatibility
export type { Draft, TokenInfo, Platform } from '@/types/workshop';

// ── Component ───────────────────────────────────────────────────────

export default function PublishView() {
  // Token state
  const [tokens, setTokens] = useState<TokenInfo[]>([]);
  const [, setLoadingTokens] = useState(false);
  const [tokenConfigOpen, setTokenConfigOpen] = useState(false);
  const [clawhubTokenInput, setClawhubTokenInput] = useState('');
  const [savingToken, setSavingToken] = useState(false);
  const [tokenMessage, setTokenMessage] = useState<{
    type: 'success' | 'error';
    text: string;
  } | null>(null);

  // Drafts state
  const [drafts, setDrafts] = useState<Draft[]>([]);
  const [loadingDrafts, setLoadingDrafts] = useState(false);
  const [expandedDraft, setExpandedDraft] = useState<string | null>(null);

  // Publish dialog state
  const [publishDialogOpen, setPublishDialogOpen] = useState(false);
  const [publishDraft, setPublishDraft] = useState<Draft | null>(null);
  const [publishPlatform, setPublishPlatform] = useState<Platform>('clawhub');
  const [publishing, setPublishing] = useState(false);
  const [publishResult, setPublishResult] = useState<PublishResult | null>(null);

  // CLI fallback dialog
  const [cliDialogOpen, setCliDialogOpen] = useState(false);
  const [cliContent, setCliContent] = useState('');
  const [cliInstructions, setCliInstructions] = useState<string[]>([]);
  const [copiedContent, setCopiedContent] = useState(false);

  // ── Fetch tokens ──────────────────────────────────────────────────

  const fetchTokens = useCallback(async () => {
    setLoadingTokens(true);
    try {
      const res = await apiFetch('/api/skills/workshop/tokens');
      if (res.ok) {
        const data = await res.json();
        setTokens(data.tokens || []);
      }
    } catch {
      // Silently fail
    } finally {
      setLoadingTokens(false);
    }
  }, []);

  // ── Fetch drafts ──────────────────────────────────────────────────

  const fetchDrafts = useCallback(async () => {
    setLoadingDrafts(true);
    try {
      const res = await apiFetch('/api/skills/workshop/drafts');
      if (res.ok) {
        const data = await res.json();
        // The drafts API doesn't return status/clawhub fields yet,
        // so we provide defaults
        const draftsWithStatus: Draft[] = (data.drafts || []).map((d: Record<string, unknown>) => ({
          id: d.id as string,
          name: d.name as string,
          description: d.description as string | null,
          content: d.content as string,
          status: (d.status as string) || 'draft',
          clawhub_slug: (d.clawhub_slug as string) || null,
          clawhub_url: (d.clawhub_url as string) || null,
          skillssh_slug: (d.skillssh_slug as string) || null,
          skillssh_url: (d.skillssh_url as string) || null,
          created_at: d.created_at as string,
          updated_at: d.updated_at as string,
        }));
        setDrafts(draftsWithStatus);
      }
    } catch {
      // Silently fail
    } finally {
      setLoadingDrafts(false);
    }
  }, []);

  useEffect(() => {
    fetchTokens();
    fetchDrafts();
  }, [fetchTokens, fetchDrafts]);

  // ── Token helpers ─────────────────────────────────────────────────

  const hasToken = useCallback(
    (provider: string) => {
      return tokens.some((t) => t.provider === provider);
    },
    [tokens]
  );

  const handleSaveToken = useCallback(async () => {
    if (!clawhubTokenInput.trim()) return;
    setSavingToken(true);
    setTokenMessage(null);
    try {
      const res = await apiFetch('/api/skills/workshop/tokens', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ provider: 'clawhub', token: clawhubTokenInput.trim() }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setTokenMessage({ type: 'success', text: 'Token 保存成功' });
        setClawhubTokenInput('');
        fetchTokens();
      } else {
        setTokenMessage({ type: 'error', text: data.error || '保存失败' });
      }
    } catch {
      setTokenMessage({ type: 'error', text: '保存失败' });
    } finally {
      setSavingToken(false);
    }
  }, [clawhubTokenInput, fetchTokens]);

  const handleDeleteToken = useCallback(
    async (provider: string) => {
      try {
        const res = await apiFetch('/api/skills/workshop/tokens', {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ provider }),
        });
        if (res.ok) {
          fetchTokens();
        }
      } catch {
        // Silently fail
      }
    },
    [fetchTokens]
  );

  // ── Publish ───────────────────────────────────────────────────────

  const handlePublishClick = useCallback((draft: Draft) => {
    setPublishDraft(draft);
    setPublishPlatform('clawhub');
    setPublishResult(null);
    setPublishDialogOpen(true);
  }, []);

  const handlePublishConfirm = useCallback(async () => {
    if (!publishDraft) return;
    setPublishing(true);
    setPublishResult(null);

    try {
      const res = await apiFetch('/api/skills/workshop/publish', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          draft_id: publishDraft.id,
          platform: publishPlatform,
        }),
      });

      const data = await res.json();

      if (res.ok && data.success) {
        setPublishResult({
          success: true,
          platform: data.platform,
          url: data.url,
          slug: data.slug,
        });
        fetchDrafts();
      } else if (data.mode === 'cli_fallback') {
        // No token configured — show CLI instructions
        setPublishDialogOpen(false);
        setCliContent(data.content || publishDraft.content);
        setCliInstructions(data.instructions || []);
        setCliDialogOpen(true);
      } else {
        setPublishResult({
          success: false,
          error: data.error || '发布失败',
        });
      }
    } catch {
      setPublishResult({
        success: false,
        error: '网络错误，请重试',
      });
    } finally {
      setPublishing(false);
    }
  }, [publishDraft, publishPlatform, fetchDrafts]);

  // ── Copy content ──────────────────────────────────────────────────

  const handleCopyContent = useCallback(async (content: string) => {
    try {
      await navigator.clipboard.writeText(content);
      setCopiedContent(true);
      setTimeout(() => setCopiedContent(false), 2000);
    } catch {
      // Fallback
    }
  }, []);

  // ── Format time ───────────────────────────────────────────────────

  const formatTime = (iso: string) => {
    try {
      return new Date(iso).toLocaleString('zh-CN', {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return iso;
    }
  };

  // ── Separate drafts ───────────────────────────────────────────────

  const draftItems = drafts.filter((d) => d.status === 'draft');
  const publishedItems = drafts.filter((d) => d.status === 'published');

  // ── Render ────────────────────────────────────────────────────────

  return (
    <div className="space-y-6">
      {/* Token configuration section */}
      <div className="rounded-xl border border-border bg-card">
        <button
          type="button"
          onClick={() => setTokenConfigOpen(!tokenConfigOpen)}
          className="flex w-full items-center gap-2 px-5 py-4 text-left"
        >
          <Key className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm font-semibold text-foreground">平台 Token 配置</span>
          {tokenConfigOpen ? (
            <ChevronDown className="ml-auto h-4 w-4 text-muted-foreground" />
          ) : (
            <ChevronRight className="ml-auto h-4 w-4 text-muted-foreground" />
          )}
        </button>

        {tokenConfigOpen && (
          <div className="border-t border-border px-5 py-4 space-y-4">
            {/* ClawHub Token */}
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <label className="text-sm font-medium text-foreground">ClawHub API Token</label>
                {hasToken('clawhub') ? (
                  <Badge
                    variant="secondary"
                    className="bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400"
                  >
                    已配置
                  </Badge>
                ) : (
                  <Badge variant="outline" className="text-muted-foreground">
                    未配置
                  </Badge>
                )}
              </div>
              {hasToken('clawhub') ? (
                <div className="flex items-center gap-2">
                  <code className="flex-1 rounded-md bg-muted px-3 py-2 text-xs font-mono text-muted-foreground">
                    {tokens.find((t) => t.provider === 'clawhub')?.token_masked || '****'}
                  </code>
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    onClick={() => handleDeleteToken('clawhub')}
                    title="删除 Token"
                  >
                    <Trash2 className="h-4 w-4 text-muted-foreground" />
                  </Button>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <Input
                    type="password"
                    placeholder="输入 ClawHub API Token"
                    value={clawhubTokenInput}
                    onChange={(e) => setClawhubTokenInput(e.target.value)}
                    className="h-9 text-sm"
                  />
                  <Button
                    size="sm"
                    onClick={handleSaveToken}
                    disabled={!clawhubTokenInput.trim() || savingToken}
                  >
                    {savingToken ? <Loader2 className="h-4 w-4 animate-spin" /> : '保存'}
                  </Button>
                </div>
              )}
              {tokenMessage && (
                <p
                  className={cn(
                    'text-xs',
                    tokenMessage.type === 'success'
                      ? 'text-emerald-600 dark:text-emerald-400'
                      : 'text-red-600 dark:text-red-400'
                  )}
                >
                  {tokenMessage.text}
                </p>
              )}
            </div>

            {/* skills.sh Token */}
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <label className="text-sm font-medium text-foreground">skills.sh Token</label>
                <Badge
                  variant="outline"
                  className="text-amber-600 dark:text-amber-400 border-amber-300 dark:border-amber-700"
                >
                  暂不支持在线配置
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground">
                skills.sh 使用 Vercel OIDC 认证，需要在 Vercel 项目环境中操作，暂不支持在线配置
                Token。 发布时将提供 CLI 指引。
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Draft list */}
      <div className="rounded-xl border border-border bg-card p-5">
        <h3 className="mb-3 text-sm font-semibold text-foreground">草稿列表</h3>

        {loadingDrafts ? (
          <div className="space-y-2">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-16 w-full" />
            ))}
          </div>
        ) : draftItems.length === 0 && publishedItems.length === 0 ? (
          <div className="flex flex-col items-center gap-3 py-8">
            <FileText className="h-10 w-10 text-muted-foreground/40" />
            <p className="text-sm text-muted-foreground">暂无草稿</p>
            <Link
              href="/skills/workshop/write"
              className="text-sm font-medium text-indigo-600 hover:text-indigo-500 dark:text-indigo-400"
            >
              前往编写技能 &rarr;
            </Link>
          </div>
        ) : (
          <div className="space-y-2">
            {draftItems.map((draft) => (
              <div
                key={draft.id}
                className="rounded-lg border border-border bg-muted/30 transition-colors"
              >
                {/* Draft header */}
                <div className="flex items-center gap-3 px-3 py-2.5">
                  <button
                    type="button"
                    onClick={() => setExpandedDraft(expandedDraft === draft.id ? null : draft.id)}
                    className="text-muted-foreground hover:text-foreground"
                  >
                    {expandedDraft === draft.id ? (
                      <ChevronDown className="h-4 w-4" />
                    ) : (
                      <ChevronRight className="h-4 w-4" />
                    )}
                  </button>
                  <div className="flex-1 min-w-0">
                    <p className="truncate text-sm font-medium text-foreground">{draft.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {formatTime(draft.updated_at)}
                      {' · '}
                      {draft.content.length} 字符
                    </p>
                  </div>
                  <Badge variant="outline" className="text-muted-foreground">
                    草稿
                  </Badge>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      (window.location.href = `/skills/workshop/write?draftId=${draft.id}`)
                    }
                    className="shrink-0 gap-1"
                  >
                    编辑
                  </Button>
                  <Button size="sm" onClick={() => handlePublishClick(draft)} className="shrink-0">
                    <Upload className="mr-1 h-3.5 w-3.5" />
                    发布
                  </Button>
                </div>

                {/* Expanded content preview */}
                {expandedDraft === draft.id && (
                  <div className="border-t border-border px-3 py-3">
                    <pre className="max-h-48 overflow-y-auto whitespace-pre-wrap break-words rounded-md bg-muted p-3 text-xs font-mono text-muted-foreground">
                      {draft.content.length > 500
                        ? draft.content.slice(0, 500) + '\n\n... (内容已截断)'
                        : draft.content}
                    </pre>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Published list */}
      {publishedItems.length > 0 && (
        <div className="rounded-xl border border-border bg-card p-5">
          <h3 className="mb-3 text-sm font-semibold text-foreground">已发布</h3>
          <div className="space-y-2">
            {publishedItems.map((draft) => (
              <div
                key={draft.id}
                className="flex items-center gap-3 rounded-lg border border-border bg-muted/30 px-3 py-2.5"
              >
                <div className="flex-1 min-w-0">
                  <p className="truncate text-sm font-medium text-foreground">{draft.name}</p>
                  <p className="text-xs text-muted-foreground">{formatTime(draft.updated_at)}</p>
                </div>
                <Badge
                  variant="secondary"
                  className="bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400"
                >
                  已发布
                </Badge>
                {/* Platform badges and URLs */}
                <div className="flex items-center gap-2">
                  {draft.clawhub_url && (
                    <a
                      href={draft.clawhub_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 rounded-md bg-indigo-100 px-2 py-0.5 text-xs font-medium text-indigo-700 hover:bg-indigo-200 dark:bg-indigo-900/40 dark:text-indigo-400 dark:hover:bg-indigo-900/60"
                    >
                      ClawHub
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  )}
                  {draft.skillssh_url && (
                    <a
                      href={draft.skillssh_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 rounded-md bg-violet-100 px-2 py-0.5 text-xs font-medium text-violet-700 hover:bg-violet-200 dark:bg-violet-900/40 dark:text-violet-400 dark:hover:bg-violet-900/60"
                    >
                      skills.sh
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Publish dialog */}
      <Dialog open={publishDialogOpen} onOpenChange={setPublishDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>发布技能</DialogTitle>
            <DialogDescription>
              选择发布平台，将「{publishDraft?.name}」发布到社区
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 py-2">
            {/* Platform selection */}
            <div className="space-y-2">
              <label className="text-xs font-medium text-muted-foreground">选择平台</label>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setPublishPlatform('clawhub')}
                  className={cn(
                    'flex-1 rounded-lg border-2 px-4 py-3 text-center transition-colors',
                    publishPlatform === 'clawhub'
                      ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-950/30'
                      : 'border-border hover:border-muted-foreground/30'
                  )}
                >
                  <p className="text-sm font-medium text-foreground">ClawHub</p>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    {hasToken('clawhub') ? 'Token 已配置' : 'Token 未配置'}
                  </p>
                </button>
                <button
                  type="button"
                  onClick={() => setPublishPlatform('skillssh')}
                  className={cn(
                    'flex-1 rounded-lg border-2 px-4 py-3 text-center transition-colors',
                    publishPlatform === 'skillssh'
                      ? 'border-violet-500 bg-violet-50 dark:bg-violet-950/30'
                      : 'border-border hover:border-muted-foreground/30'
                  )}
                >
                  <p className="text-sm font-medium text-foreground">skills.sh</p>
                  <p className="mt-0.5 text-xs text-muted-foreground">CLI 发布</p>
                </button>
              </div>
            </div>

            {/* Warning if no token */}
            {publishPlatform === 'clawhub' && !hasToken('clawhub') && (
              <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-700 dark:border-amber-800 dark:bg-amber-950/30 dark:text-amber-400">
                未配置 ClawHub API Token，发布后将显示 CLI 指引。请先在上方配置 Token。
              </div>
            )}

            {/* Result */}
            {publishResult &&
              (publishResult.success ? (
                <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950/30 dark:text-emerald-400">
                  <p className="font-medium">发布成功！</p>
                  {publishResult.url && (
                    <a
                      href={publishResult.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-1 inline-flex items-center gap-1 underline"
                    >
                      查看技能: {publishResult.slug}
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  )}
                </div>
              ) : (
                <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-600 dark:border-red-800 dark:bg-red-950/30 dark:text-red-400">
                  {publishResult.error}
                </div>
              ))}
          </div>

          <DialogFooter>
            <DialogClose render={<Button variant="outline" />}>
              {publishResult?.success ? '完成' : '取消'}
            </DialogClose>
            {!publishResult?.success && (
              <Button onClick={handlePublishConfirm} disabled={publishing}>
                {publishing ? (
                  <>
                    <Loader2 className="mr-1 h-4 w-4 animate-spin" />
                    发布中...
                  </>
                ) : (
                  <>
                    <Upload className="mr-1 h-4 w-4" />
                    确认发布
                  </>
                )}
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* CLI fallback dialog */}
      <Dialog open={cliDialogOpen} onOpenChange={setCliDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>
              <Terminal className="mr-2 inline h-5 w-5 text-muted-foreground" />
              CLI 发布指引
            </DialogTitle>
            <DialogDescription>未配置 API Token，请使用以下 CLI 命令手动发布</DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            {/* Instructions */}
            {cliInstructions.length > 0 && (
              <div className="space-y-1.5">
                {cliInstructions.map((step, i) => (
                  <p key={i} className="text-xs text-muted-foreground">
                    {step}
                  </p>
                ))}
              </div>
            )}

            {/* Content to copy */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-medium text-muted-foreground">SKILL.md 内容</label>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleCopyContent(cliContent)}
                  className="h-7 text-xs"
                >
                  {copiedContent ? (
                    <>
                      <Check className="mr-1 h-3 w-3 text-emerald-500" />
                      已复制
                    </>
                  ) : (
                    <>
                      <Copy className="mr-1 h-3 w-3" />
                      复制内容
                    </>
                  )}
                </Button>
              </div>
              <pre className="max-h-48 overflow-y-auto whitespace-pre-wrap break-words rounded-md bg-muted p-3 text-xs font-mono text-muted-foreground">
                {cliContent.length > 1000
                  ? cliContent.slice(0, 1000) + '\n\n... (内容已截断，请复制完整内容)'
                  : cliContent}
              </pre>
            </div>
          </div>

          <DialogFooter>
            <DialogClose render={<Button variant="outline" />}>关闭</DialogClose>
            <Button onClick={() => handleCopyContent(cliContent)}>
              {copiedContent ? (
                <>
                  <Check className="mr-1 h-4 w-4" />
                  已复制
                </>
              ) : (
                <>
                  <Copy className="mr-1 h-4 w-4" />
                  复制全部内容
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
