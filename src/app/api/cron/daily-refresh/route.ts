import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/server';
import { refreshRssArticles } from '@/lib/rss/pipeline';
import { refreshDailyNews } from '@/lib/daily-ai-news/pipeline';

export const maxDuration = 120;

export const dynamic = 'force-dynamic';

function getToday(): string {
  return new Date().toLocaleDateString('sv-SE', { timeZone: 'Asia/Shanghai' });
}

// Called by Vercel Cron at 00:05 Asia/Shanghai daily
export async function GET(request: NextRequest) {
  const auth = request.headers.get('authorization');
  if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }

  const today = getToday();
  const serviceClient = createServiceClient();
  const results: string[] = [];

  // 1. Refresh RSS articles
  try {
    const rssResult = await refreshRssArticles();
    results.push(`rss: ${rssResult.newArticles} new, ${rssResult.translated} translated, ${rssResult.errors.length} errors`);
  } catch (err) { results.push(`rss error: ${err instanceof Error ? err.message : 'unknown'}`); }

  // 2. Generate daily AI news digest from fresh articles
  try {
    const newsResult = await refreshDailyNews(today);
    results.push(`digest: ${newsResult.articles.length} articles`);
  } catch (err) { results.push(`digest error: ${err instanceof Error ? err.message : 'unknown'}`); }

  // 3. Clear daily challenge cache
  try {
    const { error: challengeErr } = await serviceClient
      .from('daily_challenges').delete().eq('date', today);
    results.push(challengeErr ? `challenge: ${challengeErr.message}` : 'challenge: cleared');
  } catch (err) { results.push(`challenge error: ${err instanceof Error ? err.message : 'unknown'}`); }

  // 4. Clear daily tech cache
  try {
    const { error: techErr } = await serviceClient
      .from('daily_tech_cache').delete().eq('date', today);
    results.push(techErr ? `tech: ${techErr.message}` : 'tech: cleared');
  } catch (err) { results.push(`tech error: ${err instanceof Error ? err.message : 'unknown'}`); }

  return NextResponse.json({ date: today, results });
}
