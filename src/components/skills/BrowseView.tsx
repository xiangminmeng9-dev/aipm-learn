'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import { apiFetch } from '@/lib/api/fetch';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { MotionDiv, AnimatePresence } from '@/components/ui/lazy-motion';
import SkillCard from '@/components/skills/SkillCard';
import SkillDetailDialog from '@/components/skills/SkillDetailDialog';
import {
  type UnifiedSkill,
  type PlatformPage,
  type PlatformTab,
  type ViewTab,
  PLATFORM_TABS,
  VIEW_TABS,
  VIEW_TAB_TO_CLAWHUB_SORT,
} from '@/types/workshop';
import { cn } from '@/lib/utils';

// ── Constants ───────────────────────────────────────────────────────

const PER_PAGE = 12;

// ── Component ───────────────────────────────────────────────────────

export default function BrowseView() {
  const [platform, setPlatform] = useState<PlatformTab>('all');
  const [view, setView] = useState<ViewTab>('hot');
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');

  const [clawhub, setClawhub] = useState<PlatformPage>({
    skills: [],
    total: 0,
    cursor: null,
    loading: false,
    error: null,
    hasMore: true,
  });
  const [skillssh, setSkillssh] = useState<PlatformPage>({
    skills: [],
    total: 0,
    cursor: null,
    loading: false,
    error: null,
    hasMore: true,
  });

  const [selectedSkill, setSelectedSkill] = useState<UnifiedSkill | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ── Debounced search ──────────────────────────────────────────────

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      setDebouncedSearch(search);
      // Reset state when search changes
      setClawhub((prev) => ({ ...prev, cursor: null, skills: [], hasMore: true }));
      setSkillssh((prev) => ({ ...prev, cursor: null, skills: [], hasMore: true }));
    }, 400);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [search]);

  // ── Fetch helpers ─────────────────────────────────────────────────

  const fetchClawhub = useCallback(async (cursor: string | null, q: string, viewTab: ViewTab) => {
    setClawhub((prev) => ({ ...prev, loading: true, error: null }));
    try {
      const sort = VIEW_TAB_TO_CLAWHUB_SORT[viewTab];
      const params = new URLSearchParams({ limit: String(PER_PAGE), sort, view: viewTab });
      if (cursor) params.set('cursor', cursor);
      if (q) params.set('q', q);
      const res = await apiFetch(`/api/skills/workshop/clawhub/browse?${params}`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      const newSkills: UnifiedSkill[] = data.skills ?? [];
      setClawhub((prev) => ({
        skills: cursor ? [...prev.skills, ...newSkills] : newSkills,
        total: data.total ?? 0,
        cursor: data.nextCursor ?? null,
        loading: false,
        error: null,
        hasMore: data.hasMore ?? !!data.nextCursor,
      }));
    } catch (err) {
      setClawhub((prev) => ({
        ...prev,
        loading: false,
        error: err instanceof Error ? err.message : '加载失败',
      }));
    }
  }, []);

  const fetchSkillssh = useCallback(async (q: string) => {
    setSkillssh((prev) => ({ ...prev, loading: true, error: null }));
    try {
      const params = new URLSearchParams({ limit: String(PER_PAGE) });
      if (q) params.set('q', q);
      const res = await apiFetch(`/api/skills/workshop/skillssh/browse?${params}`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      const newSkills: UnifiedSkill[] = data.skills ?? [];
      // skills.sh CLI search endpoint doesn't support cursor pagination
      setSkillssh({
        skills: newSkills,
        total: data.total ?? 0,
        cursor: null,
        loading: false,
        error: null,
        hasMore: false,
      });
    } catch (err) {
      setSkillssh((prev) => ({
        ...prev,
        loading: false,
        error: err instanceof Error ? err.message : '加载失败',
      }));
    }
  }, []);

  // ── Auto-fetch on tab/search/view change ──────────────────────────

  useEffect(() => {
    if (platform === 'all' || platform === 'clawhub') {
      fetchClawhub(null, debouncedSearch, view);
    }
    if (platform === 'all' || platform === 'skillssh') {
      fetchSkillssh(debouncedSearch);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [platform, debouncedSearch, view]);

  // ── Load more ─────────────────────────────────────────────────────

  const handleLoadMore = useCallback(
    (p: PlatformTab) => {
      if (p === 'clawhub' || p === 'all') {
        fetchClawhub(clawhub.cursor, debouncedSearch, view);
      }
      // skills.sh doesn't support cursor pagination
    },
    [clawhub.cursor, debouncedSearch, view, fetchClawhub]
  );

  // ── Derived: combined skills for "all" tab ────────────────────────

  const combinedSkills: UnifiedSkill[] = (() => {
    const list = [...clawhub.skills, ...skillssh.skills];
    list.sort((a, b) => b.installs - a.installs);
    return list;
  })();

  const displaySkills: UnifiedSkill[] =
    platform === 'all' ? combinedSkills : platform === 'clawhub' ? clawhub.skills : skillssh.skills;

  // ── Card click ────────────────────────────────────────────────────

  const handleCardClick = useCallback((skill: UnifiedSkill) => {
    setSelectedSkill(skill);
    setDialogOpen(true);
  }, []);

  // ── Render ────────────────────────────────────────────────────────

  const isLoading = clawhub.loading || skillssh.loading;

  return (
    <div className="space-y-4">
      {/* Platform tabs */}
      <div className="flex items-center gap-1 rounded-lg bg-muted p-1 w-fit">
        {PLATFORM_TABS.map((t) => (
          <button
            key={t.value}
            type="button"
            onClick={() => setPlatform(t.value)}
            className={cn(
              'rounded-md px-3 py-1.5 text-sm font-medium transition-colors',
              platform === t.value
                ? 'bg-background text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            )}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* View tabs + Search */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-1 rounded-lg bg-muted p-1">
          {VIEW_TABS.map((t) => (
            <button
              key={t.value}
              type="button"
              onClick={() => setView(t.value)}
              className={cn(
                'rounded-md px-3 py-1.5 text-sm font-medium transition-colors',
                view === t.value
                  ? 'bg-background text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              {t.label}
            </button>
          ))}
        </div>

        <div className="w-full sm:w-64">
          <Input
            type="text"
            placeholder="搜索技能..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-8 text-sm"
          />
        </div>
      </div>

      {/* Skills grid */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <AnimatePresence mode="popLayout">
          {isLoading && displaySkills.length === 0 ? (
            // Skeleton grid
            Array.from({ length: 6 }).map((_, i) => (
              <MotionDiv
                key={`skeleton-${i}`}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.2, delay: i * 0.03 }}
                className="rounded-xl border border-border bg-card p-4 space-y-3"
              >
                <div className="flex gap-2">
                  <Skeleton className="h-4 w-14" />
                  <Skeleton className="h-4 w-16" />
                </div>
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-3 w-full" />
                <Skeleton className="h-3 w-5/6" />
                <Skeleton className="h-3 w-1/3" />
              </MotionDiv>
            ))
          ) : displaySkills.length === 0 && !isLoading ? (
            <MotionDiv
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="col-span-full flex flex-col items-center justify-center py-16 text-muted-foreground"
            >
              <p className="text-sm">暂无技能</p>
              {debouncedSearch && <p className="mt-1 text-xs">试试其他搜索关键词</p>}
            </MotionDiv>
          ) : (
            displaySkills.map((skill, i) => (
              <MotionDiv
                key={`${skill.platform}-${skill.id}`}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.2, delay: i * 0.03 }}
              >
                <SkillCard skill={skill} onClick={() => handleCardClick(skill)} />
              </MotionDiv>
            ))
          )}
        </AnimatePresence>
      </div>

      {/* Errors */}
      {!isLoading && (
        <div className="space-y-2">
          {clawhub.error && platform !== 'skillssh' && (
            <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-2 text-sm text-red-600 dark:border-red-800 dark:bg-red-950/30 dark:text-red-400">
              ClawHub 暂时不可用: {clawhub.error}
            </div>
          )}
          {skillssh.error && platform !== 'clawhub' && (
            <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-2 text-sm text-red-600 dark:border-red-800 dark:bg-red-950/30 dark:text-red-400">
              skills.sh 暂时不可用: {skillssh.error}
            </div>
          )}
        </div>
      )}

      {/* Load More */}
      {!isLoading && (
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          {platform === 'all' ? (
            <>
              <LoadMoreButton
                label="ClawHub"
                hasMore={clawhub.hasMore}
                onLoadMore={() => handleLoadMore('clawhub')}
                count={clawhub.skills.length}
                total={clawhub.total}
                error={!!clawhub.error}
              />
              <LoadMoreButton
                label="skills.sh"
                hasMore={skillssh.hasMore}
                onLoadMore={() => {}}
                count={skillssh.skills.length}
                total={skillssh.total}
                error={!!skillssh.error}
              />
            </>
          ) : (
            <LoadMoreButton
              label={platform === 'clawhub' ? 'ClawHub' : 'skills.sh'}
              hasMore={platform === 'clawhub' ? clawhub.hasMore : skillssh.hasMore}
              onLoadMore={() => handleLoadMore(platform)}
              count={platform === 'clawhub' ? clawhub.skills.length : skillssh.skills.length}
              total={platform === 'clawhub' ? clawhub.total : skillssh.total}
              error={!!(platform === 'clawhub' ? clawhub.error : skillssh.error)}
            />
          )}
        </div>
      )}

      {/* Detail dialog */}
      <SkillDetailDialog skill={selectedSkill} open={dialogOpen} onOpenChange={setDialogOpen} />
    </div>
  );
}

// ── Load More sub-component ─────────────────────────────────────────

interface LoadMoreButtonProps {
  label: string;
  hasMore: boolean;
  onLoadMore: () => void;
  count: number;
  total: number;
  error: boolean;
}

function LoadMoreButton({ label, hasMore, onLoadMore, count, total, error }: LoadMoreButtonProps) {
  if (error || total === 0) return null;
  if (!hasMore && count > 0) {
    return (
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <span className="font-medium text-foreground/80">{label}</span>
        <span>共 {total} 个技能</span>
      </div>
    );
  }
  if (!hasMore) return null;

  return (
    <div className="flex items-center gap-2 text-sm text-muted-foreground">
      <span className="font-medium text-foreground/80">{label}</span>
      <span>
        已加载 {count} / {total}
      </span>
      <Button variant="outline" size="xs" onClick={onLoadMore}>
        加载更多
      </Button>
    </div>
  );
}
