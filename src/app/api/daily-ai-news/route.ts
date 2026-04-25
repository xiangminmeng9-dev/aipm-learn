import { NextResponse } from 'next/server';
import { getCachedArticles, getCachedDigest, isCacheStale, saveArticlesToCache, saveDigestToCache } from '@/lib/daily-ai-news/cache';
import { refreshDailyNews, refreshDailyNewsInBackground } from '@/lib/daily-ai-news/pipeline';

function getTodayShanghai(): string {
  return new Date().toLocaleDateString('sv-SE', { timeZone: 'Asia/Shanghai' });
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const dateParam = url.searchParams.get('date');
  const force = url.searchParams.get('refresh') === '1';
  const date = dateParam ?? getTodayShanghai();
  const isToday = date === getTodayShanghai();

  try {
    const [cachedArticles, cachedDigest] = await Promise.all([
      getCachedArticles(date),
      getCachedDigest(date),
    ]);

    // Past dates: only return cache
    if (!isToday) {
      return NextResponse.json({ date, articles: cachedArticles, digest: cachedDigest });
    }

    // Today: check staleness
    const stale = isCacheStale(cachedArticles);

    if (force || (stale && cachedArticles.length === 0)) {
      // No cache → fetch synchronously
      const fresh = await refreshDailyNews(date).catch(() => null);
      if (fresh) {
        const freshArticles = await getCachedArticles(date);
        const freshDigest = await getCachedDigest(date);
        return NextResponse.json({ date, articles: freshArticles, digest: freshDigest });
      }
      return NextResponse.json({ date, articles: cachedArticles, digest: cachedDigest });
    }

    if (stale) {
      // Has cache but stale → return cache, refresh in background
      refreshDailyNewsInBackground(date).catch(() => {});
    }

    return NextResponse.json({ date, articles: cachedArticles, digest: cachedDigest });
  } catch (error) {
    console.error('Daily AI news API error:', error);
    return NextResponse.json({ date, articles: [], digest: null });
  }
}
