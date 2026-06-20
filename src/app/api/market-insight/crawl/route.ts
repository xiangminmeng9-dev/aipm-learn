import { NextRequest, NextResponse } from 'next/server';
import { createClient, createServiceClient } from '@/lib/supabase/server';
import { crawlBossJds } from '@/lib/market-insight/crawler';
import type { CrawlRequest, CrawlStatusResponse } from '@/lib/market-insight/types';

// POST: Start a crawl job (async — returns immediately, poll GET for progress)
export async function POST(request: NextRequest) {
  try {
    const body: CrawlRequest & { user_id?: string } = await request.json();
    const { keyword, target_count = 100, date_from, date_to, user_id: cronUserId } = body;

    // Support both user-auth and cron-auth
    let userId: string;

    const authHeader = request.headers.get('Authorization');
    if (authHeader === `Bearer ${process.env.CRON_SECRET}` && cronUserId) {
      // Cron-triggered: use service client, trust user_id from body
      userId = cronUserId;
    } else {
      // User-triggered: authenticate via Supabase session
      const supabase = await createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        return NextResponse.json({ error: '未登录' }, { status: 401 });
      }
      userId = user.id;
    }

    if (!keyword || keyword.trim().length < 2) {
      return NextResponse.json({ error: '关键词至少2个字符' }, { status: 400 });
    }

    if (!date_from || !date_to) {
      return NextResponse.json({ error: '请指定开始日期和结束日期' }, { status: 400 });
    }

    const cappedCount = Math.min(Math.max(target_count, 10), 500);

    // Create job record immediately so we can return the ID
    const supabase = cronUserId ? createServiceClient() : await createClient();
    const { data: job, error: jobErr } = await supabase
      .from('market_crawl_jobs')
      .insert({
        user_id: userId,
        query_keyword: keyword.trim(),
        target_count: cappedCount,
        date_from,
        date_to,
        status: 'pending',
      })
      .select()
      .single();

    if (jobErr || !job) {
      return NextResponse.json({ error: `创建任务失败: ${jobErr?.message}` }, { status: 500 });
    }

    // Start crawl in background (don't await — return immediately)
    // The crawl function will update the job status as it progresses
    crawlBossJds({
      keyword: keyword.trim(),
      targetCount: cappedCount,
      dateFrom: date_from,
      dateTo: date_to,
      userId,
      jobId: job.id,
    }).catch((err) => {
      console.error('[market-insight/crawl] Background crawl failed:', err);
    });

    return NextResponse.json({ jobId: job.id, status: 'pending' });
  } catch (err) {
    console.error('[market-insight/crawl] Error:', err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : '爬取失败' },
      { status: 500 }
    );
  }
}

// GET: Check crawl job status
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: '未登录' }, { status: 401 });
    }

    const jobId = request.nextUrl.searchParams.get('jobId');

    if (jobId) {
      // Get specific job
      const { data: job, error } = await supabase
        .from('market_crawl_jobs')
        .select('*')
        .eq('id', jobId)
        .eq('user_id', user.id)
        .single();

      if (error || !job) {
        return NextResponse.json({ error: '任务不存在' }, { status: 404 });
      }

      // Count JDs for THIS specific job
      const { count } = await supabase
        .from('market_crawled_jds')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .eq('crawl_job_id', jobId);

      const response: CrawlStatusResponse = {
        job,
        crawled_jds_count: count || 0,
      };

      return NextResponse.json(response);
    }

    // Get latest jobs for this user
    const { data: jobs } = await supabase
      .from('market_crawl_jobs')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(5);

    const { count } = await supabase
      .from('market_crawled_jds')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id);

    return NextResponse.json({
      jobs: jobs || [],
      crawled_jds_count: count || 0,
    });
  } catch (err) {
    console.error('[market-insight/crawl] GET Error:', err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : '查询失败' },
      { status: 500 }
    );
  }
}
