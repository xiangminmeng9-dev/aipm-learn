// skills.sh API client — server-side only
// Uses CLI unauthenticated endpoints (/api/search, /api/download)
// The v1 API (/api/v1/...) requires Vercel OIDC token, which is unavailable
// for non-Vercel environments. The CLI endpoints are unauthenticated and
// used by the open-source skills.sh CLI.

const SKILLSSH_BASE = 'https://skills.sh';

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
export interface SkillsShSkillSummary {
  id: string; // "{source}/{slug}" e.g. "vercel-labs/skills/find-skills"
  name: string;
  slug: string;
  source: string; // "owner/repo" for GitHub, domain for well-known
  installs: number;
  sourceType: string; // "github" | "well-known"
  installUrl: string;
  url: string; // skills.sh page URL
  isDuplicate?: boolean;
}

export interface SkillsShBrowseResult {
  skills: SkillsShSkillSummary[];
  total: number;
}

export interface SkillsShSearchResult {
  results: SkillsShSkillSummary[];
  total: number;
  query: string;
  searchType: string; // "fuzzy" | "semantic"
}

export interface SkillsShSkillDetail {
  id: string;
  source: string;
  slug: string;
  installs: number;
  hash: string | null;
  files: Array<{ path: string; contents: string }> | null;
}

// API functions — all use CLI unauthenticated endpoints

/** Browse skills using the CLI search endpoint (no auth required)
 *  The /api/search endpoint requires q>=2 chars, so when no query is
 *  provided we use a broad query like "skill" to get popular results. */
export async function browseSkills(params: {
  q?: string;
  limit?: number;
}): Promise<SkillsShBrowseResult> {
  const { q = '', limit = 20 } = params;
  // skills.sh /api/search requires at least 2-char query;
  // use a broad default when no specific query given
  const searchQuery = q.trim().length >= 2 ? q.trim() : 'skill';
  const cacheKey = `skillssh:browse:${searchQuery}:${limit}`;

  const cached = getCached<SkillsShBrowseResult>(cacheKey);
  if (cached) return cached;

  const searchParams = new URLSearchParams({
    q: searchQuery,
    limit: String(limit),
  });

  const res = await fetch(`${SKILLSSH_BASE}/api/search?${searchParams}`, {
    headers: { Accept: 'application/json' },
    next: { revalidate: 300 },
  });

  if (res.status === 401) {
    throw new Error('skills.sh 需要认证');
  }
  if (!res.ok) {
    throw new Error(`skills.sh 服务暂不可用: HTTP ${res.status}`);
  }

  const data = await res.json();
  const skills = (data.skills || data.results || data.data || []).map(normalizeSkillSummary);
  const result: SkillsShBrowseResult = {
    skills,
    total: data.total || data.count || skills.length,
  };

  setCache(cacheKey, result);
  return result;
}

/** Search skills using the CLI search endpoint (no auth required) */
export async function searchSkills(query: string, limit = 20): Promise<SkillsShSearchResult> {
  const cacheKey = `skillssh:search:${query}:${limit}`;

  const cached = getCached<SkillsShSearchResult>(cacheKey);
  if (cached) return cached;

  const res = await fetch(
    `${SKILLSSH_BASE}/api/search?q=${encodeURIComponent(query)}&limit=${limit}`,
    { headers: { Accept: 'application/json' }, next: { revalidate: 300 } }
  );

  if (res.status === 401) {
    throw new Error('skills.sh 需要认证');
  }
  if (!res.ok) {
    throw new Error(`skills.sh 搜索失败: HTTP ${res.status}`);
  }

  const data = await res.json();
  const result: SkillsShSearchResult = {
    results: (data.results || data.data || []).map(normalizeSkillSummary),
    total: data.total || data.count || 0,
    query,
    searchType: data.searchType || 'semantic',
  };

  setCache(cacheKey, result);
  return result;
}

/** Get skill file content using the CLI download endpoint (no auth required) */
export async function downloadSkill(owner: string, repo: string, slug: string): Promise<string> {
  const cacheKey = `skillssh:download:${owner}/${repo}/${slug}`;

  const cached = getCached<string>(cacheKey);
  if (cached) return cached;

  const res = await fetch(
    `${SKILLSSH_BASE}/api/download/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}/${encodeURIComponent(slug)}`,
    { next: { revalidate: 600 } }
  );

  if (res.status === 401) {
    throw new Error('skills.sh 需要认证');
  }
  if (res.status === 404) {
    throw new Error(`skills.sh 技能未找到: ${owner}/${repo}/${slug}`);
  }
  if (!res.ok) {
    throw new Error(`skills.sh 下载失败: HTTP ${res.status}`);
  }

  // The download endpoint returns the raw SKILL.md content
  const content = await res.text();

  setCache(cacheKey, content, 10 * 60 * 1000);
  return content;
}

/** Get skill detail by parsing the download content — used by [id] route */
export async function getSkillDetail(id: string): Promise<SkillsShSkillDetail> {
  // id format: "owner/repo/slug"
  const parts = id.split('/');
  if (parts.length < 3) {
    throw new Error(`Invalid skills.sh skill ID format: ${id}`);
  }
  const [owner, repo, slug] = parts;

  const content = await downloadSkill(owner, repo, slug);

  const result: SkillsShSkillDetail = {
    id,
    source: `${owner}/${repo}`,
    slug,
    installs: 0, // download endpoint doesn't provide install count
    hash: null,
    files: [{ path: 'SKILL.md', contents: content }],
  };

  return result;
}

// The following v1 API functions are preserved as comments for future reference.
// They require Vercel OIDC token authentication which is not available in
// non-Vercel environments. When OIDC token support is added, these can be
// re-enabled.
//
// v1 API base: https://skills.sh/api/v1
// Auth header: Authorization: Bearer <VERCEL_OIDC_TOKEN>
// Available endpoints:
//   GET /api/v1/skills?page=&per_page=&view= (browse)
//   GET /api/v1/skills/search?q=&limit= (search)
//   GET /api/v1/skills/curated (curated)
//   GET /api/v1/skills/{source}/{skill} (detail)
//   GET /api/v1/skills/audit/{source}/{skill} (audit)
//
// Rate limit: 600 req/min per (team, project) when authenticated.

// Normalize skill summary from skills.sh API responses
function normalizeSkillSummary(raw: Record<string, unknown>): SkillsShSkillSummary {
  return {
    id: String(raw.id || ''),
    name: String(raw.name || raw.slug || ''),
    slug: String(raw.slug || ''),
    source: String(raw.source || ''),
    installs: Number(raw.installs || raw.install_count || 0),
    sourceType: String(raw.sourceType || 'github'),
    installUrl: String(raw.installUrl || ''),
    url: String(raw.url || ''),
    isDuplicate: raw.isDuplicate === true ? true : undefined,
  };
}
