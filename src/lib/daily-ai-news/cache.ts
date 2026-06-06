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
  await sb.from('daily_ai_news_articles').delete().eq('news_date', date);
  if (articles.length === 0) return;
  const rows = articles.map((a) => ({
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
  const oldest = articles.reduce((min, a) => (a.fetched_at < min ? a.fetched_at : min), articles[0].fetched_at);
  return Date.now() - new Date(oldest).getTime() > CACHE_STALE_MS;
}