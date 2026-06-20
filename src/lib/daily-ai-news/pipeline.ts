import { fetchArticlesFromRSS, type RawNewsArticle } from './fetcher';
import { getCachedArticles, getCachedDigest, saveArticlesToCache, saveDigestToCache } from './cache';
import { generateText } from '@/lib/ai/claude';
import { buildDailyNewsDigestPrompt, DAILY_NEWS_DIGEST_SYSTEM_PROMPT, buildArticleSummaryPrompt, ARTICLE_SUMMARY_SYSTEM_PROMPT } from '@/lib/ai/prompts';

async function summarizeArticle(article: RawNewsArticle): Promise<string | null> {
  try {
    const summary = await generateText(
      buildArticleSummaryPrompt(article.title, article.description),
      { model: 'haiku', maxTokens: 80 }
    );
    return summary?.trim() || null;
  } catch (err) {
    console.warn('[summarizeArticle] Failed for:', article.title?.slice(0, 30), err instanceof Error ? err.message : String(err));
    return null;
  }
}

async function generateDailyDigest(articles: { title: string; source: string; summary: string | null }[]): Promise<string> {
  const prompt = buildDailyNewsDigestPrompt(articles);
  const digest = await generateText(prompt, {
    model: 'haiku',
    maxTokens: 1024,
    system: DAILY_NEWS_DIGEST_SYSTEM_PROMPT,
  });
  return digest || '暂无摘要';
}

export async function refreshDailyNews(date: string): Promise<{ articles: RawNewsArticle[]; digest: string | null }> {
  // 1. Fetch articles from RSS
  const rawArticles = await fetchArticlesFromRSS();

  // 2. Filter to articles published within a 24-hour window ending at the target date
  // This handles the case where the cron runs at midnight — articles published "yesterday"
  // in the RSS feed are still relevant for "today's" daily news
  const dayEnd = new Date(date + 'T23:59:59+08:00');
  const windowStart = new Date(dayEnd.getTime() - 24 * 60 * 60 * 1000); // 24h before end of day
  const dayArticles = rawArticles.filter((a) => {
    const pub = new Date(a.published_at);
    return pub >= windowStart && pub <= dayEnd;
  });

  // 3. Generate per-article AI summaries (top 15, parallel)
  const toSummarize = dayArticles.slice(0, 15);
  const summaries = await Promise.allSettled(toSummarize.map((a) => summarizeArticle(a)));
  const articlesWithSummary = dayArticles.map((a, i) => ({
    ...a,
    summary: i < toSummarize.length ? (summaries[i].status === 'fulfilled' ? summaries[i].value : null) : null,
  }));

  // 4. Save articles to cache
  await saveArticlesToCache(date, articlesWithSummary.map((a) => ({
    title: a.title,
    url: a.url,
    source: a.source,
    summary: a.summary,
    published_at: a.published_at,
  })));

  // 5. Generate daily digest
  let digest: string | null = null;
  if (articlesWithSummary.length > 0) {
    digest = await generateDailyDigest(articlesWithSummary);
    await saveDigestToCache(date, digest, articlesWithSummary.length);
  }

  return { articles: dayArticles, digest };
}

export async function refreshDailyNewsInBackground(date: string): Promise<void> {
  try {
    await refreshDailyNews(date);
  } catch (err) {
    console.error('[refreshDailyNewsInBackground] Failed for', date, err instanceof Error ? err.message : String(err));
  }
}

export { getCachedArticles, getCachedDigest };
