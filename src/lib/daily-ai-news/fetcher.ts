import { AI_NEWS_RSS_FEEDS, isAiRelated, type RawNewsArticle } from './sources';

export type { RawNewsArticle };

const FETCH_TIMEOUT_MS = 8000;

function stripHtml(html: string): string {
  return html
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, ' ')
    .trim();
}

async function fetchWithTimeout(url: string): Promise<string> {
  const controller = new AbortController();
  const t = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
  try {
    const res = await fetch(url, {
      signal: controller.signal,
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; AIPMBot/1.0; +https://example.com/bot)' },
      next: { revalidate: 0 },
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.text();
  } finally {
    clearTimeout(t);
  }
}

async function parseNewsFeed(url: string, source: string): Promise<RawNewsArticle[]> {
  const xml = await fetchWithTimeout(url);
  const { XMLParser } = await import('fast-xml-parser');
  const parser = new XMLParser({ ignoreAttributes: false, attributeNamePrefix: '@_' });
  const doc = parser.parse(xml);
  const rawItems = doc?.rss?.channel?.item ?? doc?.feed?.entry ?? [];
  const list: Array<Record<string, unknown>> = Array.isArray(rawItems) ? rawItems : [rawItems];

  const articles: RawNewsArticle[] = [];
  for (const item of list) {
    const title = String(item.title ?? '').trim();
    if (!title) continue;
    const rawDesc = String(item.description ?? item.summary ?? item['content:encoded'] ?? item.content ?? '');
    const description = stripHtml(rawDesc).slice(0, 500);
    const combined = `${title} ${description}`;

    if (!isAiRelated(combined)) continue;

    const pub = String(item.pubDate ?? item.published ?? item.isoDate ?? item.updated ?? '');
    const published_at = pub ? new Date(pub).toISOString() : new Date().toISOString();
    const linkVal = item.link as unknown;
    const link = typeof linkVal === 'string' ? linkVal : (linkVal as { '@_href'?: string })?.['@_href'] ?? '';

    articles.push({ title: title.slice(0, 200), url: link, source, description, published_at });
  }
  return articles;
}

function deduplicateArticles(articles: RawNewsArticle[]): RawNewsArticle[] {
  const seen = new Set<string>();
  return articles.filter((a) => {
    const key = a.title.toLowerCase().slice(0, 60);
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

export async function fetchArticlesFromRSS(): Promise<RawNewsArticle[]> {
  const results = await Promise.allSettled(
    AI_NEWS_RSS_FEEDS.map((f) => parseNewsFeed(f.url, f.source))
  );
  const articles: RawNewsArticle[] = [];
  for (const r of results) {
    if (r.status === 'fulfilled') articles.push(...r.value);
  }
  const unique = deduplicateArticles(articles);
  unique.sort((a, b) => new Date(b.published_at).getTime() - new Date(a.published_at).getTime());
  return unique.slice(0, 30);
}
