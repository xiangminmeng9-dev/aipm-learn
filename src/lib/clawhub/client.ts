// ClawHub API client — server-side only
// Base: https://clawhub.ai/api/v1
//
// IMPORTANT: The ClawHub API uses cursor-based pagination, NOT page-based.
// Pass `cursor` for subsequent pages (omit for first page).
// Response shape: { items: [...], nextCursor: "..." | null }

import type { ClawHubSortValue } from '@/types/workshop';

const CLAWHUB_BASE = 'https://clawhub.ai/api/v1';

// Simple in-memory cache with TTL
const cache = new Map<string, { data: unknown; expires: number }>();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

function getCached<T>(key: string): T | null {
  const entry = cache.get(key);
  if (entry && entry.expires > Date.now()) return entry.data as T;
  cache.delete(key);
  return null;
}

function setCache(key: string, data: unknown, ttl = CACHE_TTL) {
  cache.set(key, { data, expires: Date.now() + ttl });
}

// Types
export interface ClawHubSkillSummary {
  id: string;
  name: string;
  description: string;
  slug: string;
  stars: number;
  downloads: number;
  category: string;
  author: string;
  tags: string[];
  updatedAt: string;
  url: string;
}

export interface ClawHubBrowseResult {
  skills: ClawHubSkillSummary[];
  nextCursor: string | null;
  hasMore: boolean;
  total: number;
}

export interface ClawHubSkillDetail {
  id: string;
  name: string;
  description: string;
  slug: string;
  stars: number;
  downloads: number;
  category: string;
  author: string;
  tags: string[];
  updatedAt: string;
  files: Array<{ path: string; contents: string }>;
}

export interface ClawHubSearchResult {
  results: ClawHubSkillSummary[];
  total: number;
  query: string;
}

export interface ClawHubPublishResult {
  slug: string;
  url: string;
  version: string;
}

// Sort values mapping (ViewTab → ClawHub API sort param)
export const CLAWHUB_SORT_VALUES: Record<ClawHubSortValue, string> = {
  updated: 'updated',
  recommended: 'recommended',
  installsCurrent: 'installsCurrent',
  installsAllTime: 'installsAllTime',
  trending: 'trending',
  createdAt: 'createdAt',
};

// API functions

/** Browse ClawHub skills with cursor-based pagination */
export async function browseSkills(params: {
  cursor?: string;
  limit?: number;
  sort?: ClawHubSortValue;
  category?: string;
}): Promise<ClawHubBrowseResult> {
  const { cursor, limit = 20, sort = 'updated', category = '' } = params;
  const cacheKey = `clawhub:browse:${cursor ?? 'first'}:${limit}:${sort}:${category}`;

  const cached = getCached<ClawHubBrowseResult>(cacheKey);
  if (cached) return cached;

  const searchParams = new URLSearchParams({
    limit: String(Math.min(limit, 200)),
    sort: CLAWHUB_SORT_VALUES[sort] || sort,
  });
  if (cursor) searchParams.set('cursor', cursor);
  if (category) searchParams.set('category', category);

  const res = await fetch(`${CLAWHUB_BASE}/skills?${searchParams}`, {
    headers: { Accept: 'application/json' },
    next: { revalidate: 300 },
  });

  if (!res.ok) {
    throw new Error(`ClawHub browse failed: ${res.status}`);
  }

  const data = await res.json();
  // Parse cursor-based response: { items: [...], nextCursor: "..." }
  const items = data.items || data.data || [];
  const result: ClawHubBrowseResult = {
    skills: items.map(normalizeSkillSummary),
    nextCursor: data.nextCursor || data.next_cursor || null,
    hasMore: !!(data.nextCursor || data.next_cursor),
    total: data.total || items.length,
  };

  setCache(cacheKey, result);
  return result;
}

/** Search ClawHub skills */
export async function searchSkills(query: string): Promise<ClawHubSearchResult> {
  const cacheKey = `clawhub:search:${query}`;

  const cached = getCached<ClawHubSearchResult>(cacheKey);
  if (cached) return cached;

  const res = await fetch(`${CLAWHUB_BASE}/search?q=${encodeURIComponent(query)}`, {
    headers: { Accept: 'application/json' },
    next: { revalidate: 300 },
  });

  if (!res.ok) {
    throw new Error(`ClawHub search failed: ${res.status}`);
  }

  const data = await res.json();
  const result: ClawHubSearchResult = {
    results: (data.results || data.data || []).map(normalizeSkillSummary),
    total: data.total || 0,
    query,
  };

  setCache(cacheKey, result);
  return result;
}

/** Get skill detail by slug */
export async function getSkillDetail(slug: string): Promise<ClawHubSkillDetail> {
  const cacheKey = `clawhub:detail:${slug}`;

  const cached = getCached<ClawHubSkillDetail>(cacheKey);
  if (cached) return cached;

  const res = await fetch(`${CLAWHUB_BASE}/skills/${encodeURIComponent(slug)}`, {
    headers: { Accept: 'application/json' },
    next: { revalidate: 600 },
  });

  if (!res.ok) {
    throw new Error(`ClawHub getSkill failed: ${res.status}`);
  }

  const data = await res.json();
  // The detail endpoint returns { skill: {...}, latestVersion: {...}, owner: {...} }
  const skill = data.skill || data;
  const result: ClawHubSkillDetail = {
    id: skill.id || slug,
    name: skill.displayName || skill.name || slug,
    description: skill.summary || skill.description || '',
    slug: skill.slug || slug,
    stars: skill.stats?.stars || skill.stars || 0,
    downloads: skill.stats?.installsAllTime || skill.stats?.installsCurrent || skill.downloads || 0,
    category: skill.category || '',
    author: skill.owner?.handle || skill.author || '',
    tags: Array.isArray(skill.tags) ? skill.tags.map(String) : [],
    updatedAt: skill.updatedAt || skill.updated_at || '',
    files: skill.files || [{ path: 'SKILL.md', contents: '' }],
  };

  // Cache longer for details (10 min)
  setCache(cacheKey, result, 10 * 60 * 1000);
  return result;
}

/** Get a single skill file content */
export async function getSkillFile(slug: string, path = 'SKILL.md'): Promise<string> {
  const res = await fetch(
    `${CLAWHUB_BASE}/skills/${encodeURIComponent(slug)}/file?path=${encodeURIComponent(path)}`,
    { next: { revalidate: 600 } }
  );

  if (!res.ok) {
    throw new Error(`ClawHub getFile failed: ${res.status}`);
  }

  // File endpoint returns raw text content
  const content = await res.text();
  return content;
}

/** Publish a skill to ClawHub (requires API token) */
export async function publishSkill(
  content: string,
  token: string,
  options?: { slug?: string; name?: string; version?: string }
): Promise<ClawHubPublishResult> {
  const res = await fetch(`${CLAWHUB_BASE}/skills`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      name: options?.name || 'untitled-skill',
      description: '',
      files: { 'SKILL.md': content },
      ...(options?.slug ? { slug: options.slug } : {}),
      ...(options?.version ? { version: options.version } : {}),
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`ClawHub publish failed: ${res.status} — ${err}`);
  }

  const data = await res.json();
  return {
    slug: data.slug || options?.slug || '',
    url: data.url || `https://clawhub.ai/skills/${data.slug || options?.slug}`,
    version: data.version || data.latestVersion?.version || '1.0.0',
  };
}

// Normalize different API response shapes into a consistent summary type
function normalizeSkillSummary(raw: Record<string, unknown>): ClawHubSkillSummary {
  const stats = (raw.stats || {}) as Record<string, unknown>;
  const owner = (raw.owner || {}) as Record<string, unknown>;
  return {
    id: String(raw.id || raw.slug || ''),
    name: String(raw.displayName || raw.name || raw.slug || ''),
    description: String(raw.summary || raw.description || ''),
    slug: String(raw.slug || raw.name || ''),
    stars: Number(stats.stars || raw.stars || raw.installs || 0),
    downloads: Number(
      stats.installsAllTime || stats.installsCurrent || raw.downloads || raw.installs || 0
    ),
    category: String(raw.category || ''),
    author: String(
      owner.handle ||
        raw.author ||
        (typeof raw.source === 'string' ? raw.source.split('/')[0] : '') ||
        ''
    ),
    tags: Array.isArray(raw.tags) ? raw.tags.map(String) : [],
    updatedAt: String(raw.updatedAt || raw.updated_at || ''),
    url: String(raw.url || ''),
  };
}
