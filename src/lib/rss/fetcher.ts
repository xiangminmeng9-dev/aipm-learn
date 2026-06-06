import { XMLParser } from 'fast-xml-parser';
import { stripHtml } from './shared-utils';

export { stripHtml };

export interface RawFeedItem {
  title: string;
  link: string;
  content?: string;
  contentSnippet?: string;
  pubDate?: string;
  creator?: string;
  isoDate?: string;
}

export interface RawFeed {
  items: RawFeedItem[];
  title?: string;
  link?: string;
}

const FETCH_TIMEOUT_MS = 10000;

const xmlParser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: '@_',
});

async function fetchXml(url: string): Promise<string> {
  const controller = new AbortController();
  const t = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
  try {
    const res = await fetch(url, {
      signal: controller.signal,
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; AIPMBot/1.0; +https://example.com/bot)',
      },
      next: { revalidate: 0 },
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.text();
  } finally {
    clearTimeout(t);
  }
}

export async function fetchFeed(url: string): Promise<RawFeed> {
  try {
    const xml = await fetchXml(url);
    const doc = xmlParser.parse(xml);

    const channel = doc?.rss?.channel ?? doc?.feed;
    if (!channel) return { items: [] };

    const rawItems = channel.item ?? channel.entry ?? [];
    const list: Array<Record<string, unknown>> = Array.isArray(rawItems) ? rawItems : [rawItems];

    const items: RawFeedItem[] = [];
    for (const item of list) {
      const title = String(item.title ?? '').trim();
      if (!title) continue;

      // Extract link — can be string or object with @_href
      const linkVal = item.link as unknown;
      const link = typeof linkVal === 'string' ? linkVal : (linkVal as { '@_href'?: string })?.['@_href'] ?? '';

      // Extract content
      const rawContent = String(
        item['content:encoded'] ?? item.content ?? item.summary ?? item.description ?? ''
      );
      const contentSnippet = stripHtml(rawContent).slice(0, 500);

      // Extract date
      const pubDate = String(item.pubDate ?? item.published ?? item.updated ?? item.isoDate ?? '');

      // Extract creator
      const creator = String(item.creator ?? item.author ?? item['dc:creator'] ?? '');

      items.push({
        title,
        link,
        content: rawContent,
        contentSnippet,
        pubDate,
        creator,
        isoDate: pubDate ? new Date(pubDate).toISOString() : '',
      });
    }

    return {
      items,
      title: String(channel.title ?? ''),
      link: String(channel.link ?? ''),
    };
  } catch (err) {
    console.error(`Failed to fetch RSS feed: ${url}`, err);
    return { items: [] };
  }
}

export function truncateContent(content: string, maxLength = 3000): string {
  if (content.length <= maxLength) return content;
  return content.slice(0, maxLength) + '...';
}
