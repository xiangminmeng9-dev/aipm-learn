'use client';

import { useState, useCallback, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { apiFetch } from '@/lib/api/fetch';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Skeleton } from '@/components/ui/skeleton';
import AnalysisResult from '@/components/skills/AnalysisResult';
import { cn } from '@/lib/utils';
import {
  type AnalysisResultData,
  type HistoryItem,
  type InputTab,
} from '@/types/workshop';

// ── Component ───────────────────────────────────────────────────────

export default function AnalyzeView() {
  const searchParams = useSearchParams();

  const [inputTab, setInputTab] = useState<InputTab>('paste');
  const [skillContent, setSkillContent] = useState('');
  const [slugInput, setSlugInput] = useState('');
  const [platformSelect, setPlatformSelect] = useState<'clawhub' | 'skillssh'>('clawhub');
  const [loadingContent, setLoadingContent] = useState(false);
  const [contentError, setContentError] = useState<string | null>(null);

  const [analyzing, setAnalyzing] = useState(false);
  const [analyzeError, setAnalyzeError] = useState<string | null>(null);
  const [analysisResult, setAnalysisResult] = useState<AnalysisResultData | null>(null);
  const [analysisId, setAnalysisId] = useState<string | null>(null);

  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  // ── Auto-load from query params ───────────────────────────────────

  useEffect(() => {
    const slug = searchParams.get('slug');
    const platform = searchParams.get('platform');
    if (slug && platform) {
      setSlugInput(slug);
      setPlatformSelect(platform as 'clawhub' | 'skillssh');
      setInputTab('browse');
      loadSkillFromBrowse(slug, platform as 'clawhub' | 'skillssh');
    }
    // Only run on mount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Load skill content from browse detail API ─────────────────────

  const loadSkillFromBrowse = useCallback(async (slug: string, platform: string) => {
    setLoadingContent(true);
    setContentError(null);
    try {
      const endpoint =
        platform === 'clawhub'
          ? `/api/skills/workshop/clawhub/${encodeURIComponent(slug)}`
          : `/api/skills/workshop/skillssh/${encodeURIComponent(slug)}`;
      const res = await apiFetch(endpoint);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();

      // Extract SKILL.md content from the detail response
      let content = '';
      if (data.files?.length) {
        const skillFile = data.files.find(
          (f: { path: string }) => f.path === 'SKILL.md' || f.path === 'skill.md'
        );
        content = skillFile?.contents || data.files[0]?.contents || '';
      }
      if (!content) {
        content = data.skillMd ?? data.readme ?? data.content ?? '';
      }
      if (!content) {
        throw new Error('未找到 SKILL.md 内容');
      }
      setSkillContent(content);
    } catch (err) {
      setContentError(err instanceof Error ? err.message : '加载技能内容失败');
    } finally {
      setLoadingContent(false);
    }
  }, []);

  // ── Handle browse tab submit ──────────────────────────────────────

  const handleBrowseLoad = useCallback(() => {
    if (!slugInput.trim()) return;
    loadSkillFromBrowse(slugInput.trim(), platformSelect);
  }, [slugInput, platformSelect, loadSkillFromBrowse]);

  // ── History ───────────────────────────────────────────────────────

  const fetchHistory = useCallback(async () => {
    setLoadingHistory(true);
    try {
      const res = await apiFetch('/api/skills/workshop/analyze/history');
      if (res.ok) {
        const data = await res.json();
        setHistory(data.analyses ?? []);
      }
    } catch {
      // Silently fail
    } finally {
      setLoadingHistory(false);
    }
  }, []);

  useEffect(() => {
    fetchHistory();
  }, [fetchHistory]);

  // ── Analyze ───────────────────────────────────────────────────────

  const handleAnalyze = useCallback(async () => {
    if (!skillContent.trim()) return;
    setAnalyzing(true);
    setAnalyzeError(null);
    setAnalysisResult(null);
    setAnalysisId(null);

    try {
      const res = await apiFetch('/api/skills/workshop/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          skill_content: skillContent.trim(),
          skill_name: undefined,
          skill_slug: inputTab === 'browse' ? slugInput.trim() || undefined : undefined,
          skill_source: inputTab === 'browse' ? platformSelect : 'manual',
        }),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || `HTTP ${res.status}`);
      }

      const data = await res.json();
      setAnalysisResult(data.analysis_result);
      setAnalysisId(data.analysis_id ?? null);
      // Refresh history
      fetchHistory();
    } catch (err) {
      setAnalyzeError(err instanceof Error ? err.message : '分析失败，请重试');
    } finally {
      setAnalyzing(false);
    }
  }, [skillContent, inputTab, slugInput, platformSelect, fetchHistory]);

  // ── Load history item ─────────────────────────────────────────────

  const handleLoadHistory = useCallback(async (item: HistoryItem) => {
    try {
      const res = await apiFetch(`/api/skills/workshop/analyze/history/${item.id}`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      if (data.analysis_result) {
        setAnalysisResult(data.analysis_result);
        setAnalysisId(item.id);
        if (data.skill_content) {
          setSkillContent(data.skill_content);
        }
      }
    } catch {
      // Silently fail
    }
  }, []);

  // ── Render ────────────────────────────────────────────────────────

  return (
    <div className="space-y-6">
      {/* Input area */}
      <div className="rounded-xl border border-border bg-card p-5">
        {/* Tab switcher */}
        <div className="mb-4 flex items-center gap-1 rounded-lg bg-muted p-1 w-fit">
          <button
            type="button"
            onClick={() => setInputTab('paste')}
            className={cn(
              'rounded-md px-3 py-1.5 text-sm font-medium transition-colors',
              inputTab === 'paste'
                ? 'bg-background text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            )}
          >
            粘贴分析
          </button>
          <button
            type="button"
            onClick={() => setInputTab('browse')}
            className={cn(
              'rounded-md px-3 py-1.5 text-sm font-medium transition-colors',
              inputTab === 'browse'
                ? 'bg-background text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            )}
          >
            从浏览选择
          </button>
        </div>

        {/* Paste tab */}
        {inputTab === 'paste' && (
          <div className="space-y-3">
            <Textarea
              placeholder="粘贴 SKILL.md 内容到这里..."
              value={skillContent}
              onChange={(e) => setSkillContent(e.target.value)}
              className="min-h-[200px] font-mono text-sm"
            />
          </div>
        )}

        {/* Browse tab */}
        {inputTab === 'browse' && (
          <div className="space-y-3">
            <div className="flex items-end gap-3">
              <div className="flex-1">
                <label className="mb-1 block text-xs font-medium text-muted-foreground">
                  技能 Slug
                </label>
                <Input
                  type="text"
                  placeholder="例如：my-skill-name"
                  value={slugInput}
                  onChange={(e) => setSlugInput(e.target.value)}
                  className="h-9 text-sm"
                />
              </div>
              <div className="w-32">
                <label className="mb-1 block text-xs font-medium text-muted-foreground">平台</label>
                <select
                  value={platformSelect}
                  onChange={(e) => setPlatformSelect(e.target.value as 'clawhub' | 'skillssh')}
                  className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <option value="clawhub">ClawHub</option>
                  <option value="skillssh">skills.sh</option>
                </select>
              </div>
              <Button
                onClick={handleBrowseLoad}
                disabled={!slugInput.trim() || loadingContent}
                size="sm"
              >
                {loadingContent ? '加载中...' : '加载'}
              </Button>
            </div>

            {contentError && (
              <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-600 dark:border-red-800 dark:bg-red-950/30 dark:text-red-400">
                {contentError}
              </div>
            )}

            {skillContent && inputTab === 'browse' && (
              <Textarea
                value={skillContent}
                onChange={(e) => setSkillContent(e.target.value)}
                className="min-h-[200px] font-mono text-sm"
              />
            )}
          </div>
        )}

        {/* Analyze button */}
        <div className="mt-4 flex items-center gap-3">
          <Button onClick={handleAnalyze} disabled={!skillContent.trim() || analyzing}>
            {analyzing ? '分析中...' : '开始分析'}
          </Button>
          {skillContent.trim() && !analyzing && (
            <span className="text-xs text-muted-foreground">{skillContent.length} 字符</span>
          )}
        </div>
      </div>

      {/* Loading state */}
      {analyzing && (
        <div className="rounded-xl border border-border bg-card p-6">
          <div className="flex flex-col items-center gap-4">
            <div className="relative h-12 w-12">
              <div className="absolute inset-0 animate-spin rounded-full border-2 border-indigo-200 border-t-indigo-500" />
              <div
                className="absolute inset-2 animate-spin rounded-full border-2 border-indigo-100 border-b-indigo-400"
                style={{ animationDirection: 'reverse', animationDuration: '1.5s' }}
              />
            </div>
            <div className="text-center">
              <p className="text-sm font-medium text-foreground">AI 正在分析技能...</p>
              <p className="mt-1 text-xs text-muted-foreground">评估结构、质量、实用性和改进空间</p>
            </div>
            <div className="w-full max-w-xs space-y-2">
              <Skeleton className="h-3 w-full" />
              <Skeleton className="h-3 w-4/5" />
              <Skeleton className="h-3 w-3/5" />
            </div>
          </div>
        </div>
      )}

      {/* Error */}
      {analyzeError && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600 dark:border-red-800 dark:bg-red-950/30 dark:text-red-400">
          {analyzeError}
        </div>
      )}

      {/* Result */}
      {analysisResult && !analyzing && (
        <AnalysisResult
          result={analysisResult}
          analysisId={analysisId}
          originalContent={skillContent}
          onImprove={(improvedContent) => setSkillContent(improvedContent)}
        />
      )}

      {/* History */}
      <div className="rounded-xl border border-border bg-card p-5">
        <h3 className="mb-3 text-sm font-semibold text-foreground">历史分析</h3>
        {loadingHistory && history.length === 0 ? (
          <div className="space-y-2">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-10 w-full" />
            ))}
          </div>
        ) : history.length === 0 ? (
          <p className="text-sm text-muted-foreground">暂无分析记录</p>
        ) : (
          <div className="space-y-2">
            {history.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => handleLoadHistory(item)}
                className="flex w-full items-center gap-3 rounded-lg border border-border bg-muted/30 px-3 py-2 text-left transition-colors hover:bg-muted/60"
              >
                <span
                  className={cn(
                    'inline-flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold',
                    item.overall_quality >= 70
                      ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400'
                      : item.overall_quality >= 40
                        ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400'
                        : 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-400'
                  )}
                >
                  {item.overall_quality}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="truncate text-sm font-medium text-foreground">
                    {item.skill_name || item.skill_slug || '手动粘贴'}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {item.skill_source === 'clawhub'
                      ? 'ClawHub'
                      : item.skill_source === 'skillssh'
                        ? 'skills.sh'
                        : '手动输入'}
                    {' · '}
                    {new Date(item.created_at).toLocaleDateString('zh-CN')}
                  </p>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
