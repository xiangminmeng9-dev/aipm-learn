import { createServiceClient } from '@/lib/supabase/server';
import type { DailyAiNewsArticle, DailyAiNewsDigest } from '@/types';

const CACHE_STALE_MS = 3 * 60 * 60 * 1000; // 3 hours

export async function getCachedArticles(date: string): Promise<DailyAiNewsArticle[]> {
  const sb = createServiceClient();
  const { data } = await sb
    .from('daily_ai_news_articles')
    .select('*')
    .eq('news_date', date)
    .order('published_at', { ascending: false });
  return (data ?? []) as DailyAiNewsArticle[];
}

export async function getCachedDigest(date: string): Promise<DailyAiNewsDigest | null> {
  const sb = createServiceClient();
  const { data } = await sb
    .from('daily_ai_news_digests')
    .select('*')
    .eq('news_date', date)
    .maybeSingle();
  return data as DailyAiNewsDigest | null;
}

export async function saveArticlesToCache(date: string, articles: { title: string; url: string; source: string; summary: string | null; published_at: string }[]): Promise<void> {
  const sb = createServiceClient();

  // Only delete articles from daily-ai-news pipeline's own sources
  // This prevents overwriting articles inserted by refreshRssArticles() (RSS pipeline)
  const dailyNewsSources = [
    '36氪', '机器之心', '量子位', '人人都是产品经理', 'InfoQ 中文', '少数派', '虎嗅',
    'OpenAI News', 'Google DeepMind', 'Google AI Blog', 'Hugging Face', 'GitHub Blog',
    'Last Week in AI', 'Simon Willison', 'BAIR Blog',
  ];

  // Only delete articles that came from the daily-ai-news pipeline's own sources
  if (dailyNewsSources.length > 0) {
    await sb.from('daily_ai_news_articles').delete().eq('news_date', date).in('source', dailyNewsSources);
  }

  if (articles.length === 0) return;

  // Filter out articles whose URL already exists (inserted by RSS pipeline with translation)
  const existingUrls = new Set<string>();
  if (articles.length > 0) {
    const urls = articles.map(a => a.url).filter(Boolean);
    if (urls.length > 0) {
      const { data: existing } = await sb
        .from('daily_ai_news_articles')
        .select('url')
        .in('url', urls);
      (existing ?? []).forEach((r: { url: string }) => existingUrls.add(r.url));
    }
  }

  const newArticles = articles.filter(a => a.url && !existingUrls.has(a.url));
  if (newArticles.length === 0) return;

  const rows = newArticles.map((a) => ({
    news_date: date,
    source: a.source,
    title: a.title,
    url: a.url,
    summary: a.summary,
    published_at: a.published_at,
  }));

  await sb.from('daily_ai_news_articles').insert(rows);
}

export async function saveDigestToCache(date: string, digest: string, articleCount: number): Promise<void> {
  const sb = createServiceClient();
  await sb
    .from('daily_ai_news_digests')
    .upsert({ news_date: date, digest, article_count: articleCount }, { onConflict: 'news_date' });
}

export function isCacheStale(articles: DailyAiNewsArticle[]): boolean {
  if (articles.length === 0) return true;
  // Find oldest fetched_at using Date comparison (not string)
  const timestamps = articles
    .map(a => new Date(a.fetched_at).getTime())
    .filter(t => !isNaN(t));
  if (timestamps.length === 0) return true; // Invalid dates = stale
  const oldest = Math.min(...timestamps);
  return Date.now() - oldest > CACHE_STALE_MS;
}