import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/server';

// Vercel Cron: weekly market insight crawl
// Runs every Monday at 3 AM UTC
export async function GET(request: NextRequest) {
  // Verify cron secret
  const authHeader = request.headers.get('Authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const results: string[] = [];

  try {
    const supabase = createServiceClient();

    // Find users who have used market insight recently (last 30 days)
    const { data: recentUsers } = await supabase
      .from('market_crawl_jobs')
      .select('user_id, query_keyword')
      .gte('created_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString())
      .eq('status', 'completed');

    if (!recentUsers || recentUsers.length === 0) {
      return NextResponse.json({ message: 'No active users', results });
    }

    // Deduplicate by user_id + keyword
    const uniqueCombos = new Map<string, string>();
    for (const row of recentUsers) {
      const key = `${row.user_id}:${row.query_keyword}`;
      if (!uniqueCombos.has(key)) {
        uniqueCombos.set(key, row.query_keyword);
      }
    }

    results.push(`Found ${uniqueCombos.size} user-keyword combos to refresh`);

    // Note: Actual crawl is triggered as a background fetch to avoid
    // Vercel serverless function timeout. The crawl endpoint handles
    // its own async processing.
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || '';
    let triggered = 0;

    for (const [key, keyword] of uniqueCombos) {
      const [userId] = key.split(':');
      // Only trigger if no running job exists for this user+keyword
      const { data: runningJobs } = await supabase
        .from('market_crawl_jobs')
        .select('id')
        .eq('user_id', userId)
        .eq('query_keyword', keyword)
        .eq('status', 'running')
        .limit(1);

      if (runningJobs && runningJobs.length > 0) continue;

      // Calculate date range: last 6 months
      const dateTo = new Date().toISOString().split('T')[0];
      const dateFrom = new Date(Date.now() - 180 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

      try {
        // Trigger crawl via internal API
        if (appUrl) {
          await fetch(`${appUrl}/api/market-insight/crawl`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${process.env.CRON_SECRET}`,
            },
            body: JSON.stringify({
              keyword,
              target_count: 100,
              date_from: dateFrom,
              date_to: dateTo,
              user_id: userId, // Pass user_id for cron context
            }),
          });
          triggered++;
        }
      } catch (err) {
        results.push(`Failed to trigger crawl for ${userId}/${keyword}: ${err instanceof Error ? err.message : 'Unknown'}`);
      }
    }

    results.push(`Triggered ${triggered} crawl jobs`);
  } catch (err) {
    results.push(`Error: ${err instanceof Error ? err.message : 'Unknown'}`);
  }

  return NextResponse.json({ results });
}
