const CACHE_PREFIX = 'aipm:';

const MAX_STORAGE_BYTES = 4 * 1024 * 1024; // 4MB

export const TTL = {
  DAILY: 24 * 3600 * 1000,        // 24h
  STATIC: 7 * 24 * 3600 * 1000,   // 7d
  USER_DATA: 1 * 3600 * 1000,     // 1h
  FLASHCARDS: 12 * 3600 * 1000,   // 12h
  RSS: 6 * 3600 * 1000,           // 6h
} as const;

interface CacheEntry {
  data: unknown;
  ts: number;
  ttl: number;
}

function getNS(): string {
  try {
    const uid = localStorage.getItem('aipm_uid') || 'anon';
    return `${CACHE_PREFIX}${uid}:`;
  } catch {
    return `${CACHE_PREFIX}anon:`;
  }
}

export function setCacheUserId(id: string) {
  try { localStorage.setItem('aipm_uid', id); } catch { /* ignore */ }
}

export function cacheGet<T>(key: string): T | null {
  try {
    const raw = localStorage.getItem(getNS() + key);
    if (!raw) return null;
    const entry: CacheEntry = JSON.parse(raw);
    if (Date.now() - entry.ts > entry.ttl) {
      localStorage.removeItem(getNS() + key);
      return null;
    }
    return entry.data as T;
  } catch {
    return null;
  }
}

export function cacheSet(key: string, data: unknown, ttlMs: number) {
  try {
    const fullKey = getNS() + key;
    const entry: CacheEntry = { data, ts: Date.now(), ttl: ttlMs };
    const serialized = JSON.stringify(entry);
    if (serialized.length > MAX_STORAGE_BYTES) return;
    evictIfNeeded(serialized.length);
    localStorage.setItem(fullKey, serialized);
  } catch { /* storage full */ }
}

export function cacheRemove(key: string) {
  try { localStorage.removeItem(getNS() + key); } catch { /* ignore */ }
}

function evictIfNeeded(newSize: number) {
  const ns = getNS();
  const entries: { key: string; ts: number; size: number }[] = [];
  let total = newSize;

  for (let i = 0; i < localStorage.length; i++) {
    const k = localStorage.key(i);
    if (k && k.startsWith(ns)) {
      const v = localStorage.getItem(k) || '';
      total += v.length;
      try {
        const e: CacheEntry = JSON.parse(v);
        entries.push({ key: k, ts: e.ts, size: v.length });
      } catch {
        entries.push({ key: k, ts: 0, size: v.length });
      }
    }
  }

  entries.sort((a, b) => a.ts - b.ts);
  while (total > MAX_STORAGE_BYTES && entries.length > 0) {
    const oldest = entries.shift()!;
    localStorage.removeItem(oldest.key);
    total -= oldest.size;
  }
}

export function cacheClear() {
  const ns = getNS();
  const keys: string[] = [];
  for (let i = 0; i < localStorage.length; i++) {
    const k = localStorage.key(i);
    if (k && k.startsWith(ns)) keys.push(k);
  }
  keys.forEach(k => localStorage.removeItem(k));
}
