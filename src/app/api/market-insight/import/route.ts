import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { extractWithTavily } from '@/lib/ai/tavily-extract';
import type { ImportRequest } from '@/lib/market-insight/types';

// POST: Manually import JD URLs
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: '未登录' }, { status: 401 });
    }

    const body: ImportRequest = await request.json();
    const { urls, keyword } = body;

    if (!urls || !Array.isArray(urls) || urls.length === 0) {
      return NextResponse.json({ error: '请提供至少一个 URL' }, { status: 400 });
    }

    if (urls.length > 50) {
      return NextResponse.json({ error: '一次最多导入 50 个 URL' }, { status: 400 });
    }

    // Filter to only zhipin.com URLs
    const zhipinUrls = urls.filter((url) => {
      try {
        return new URL(url).hostname.includes('zhipin.com');
      } catch {
        return false;
      }
    });

    if (zhipinUrls.length === 0) {
      return NextResponse.json({ error: '没有有效的 BOSS直聘 URL' }, { status: 400 });
    }

    // Create a crawl job for tracking
    const { data: job } = await supabase
      .from('market_crawl_jobs')
      .insert({
        user_id: user.id,
        query_keyword: keyword || '手动导入',
        target_count: zhipinUrls.length,
        status: 'running',
        started_at: new Date().toISOString(),
      })
      .select()
      .single();

    const jobId = job?.id;
    let importedCount = 0;
    let failedCount = 0;

    // Batch extract (10 per call)
    for (let i = 0; i < zhipinUrls.length; i += 10) {
      const batch = zhipinUrls.slice(i, i + 10);

      try {
        const result = await extractWithTavily(batch, {
          extract_depth: 'advanced',
          query: `${keyword || '岗位'} 职位描述`,
          timeout: 30,
        });

        if (result?.results) {
          for (const item of result.results) {
            if (!item.raw_content || item.raw_content.length < 50) continue;

            // Simple parse
            const lines = item.raw_content.split('\n').filter((l) => l.trim());
            const jdText = item.raw_content.substring(0, 5000);

            // Extract salary
            const salaryMatch = item.raw_content.match(/(\d{1,3}[-~]\d{1,3}[Kk万])/);
            // Extract location
            const locationMatch = item.raw_content.match(/([北京上海广州深圳杭州成都南京武汉])[··]\S+/);

            await supabase.from('market_crawled_jds').insert({
              user_id: user.id,
              crawl_job_id: jobId,
              source_url: item.url,
              source_platform: 'zhipin',
              job_title: lines[0]?.substring(0, 100) || null,
              company_name: null,
              salary_range: salaryMatch?.[1] || null,
              location: locationMatch?.[0] || null,
              jd_text: jdText,
            });
            importedCount++;
          }
        }

        failedCount += result?.failed_results?.length || 0;
      } catch (err) {
        console.warn('[import] Batch failed:', err);
        failedCount += batch.length;
      }
    }

    // Update job
    if (jobId) {
      await supabase
        .from('market_crawl_jobs')
        .update({
          status: 'completed',
          crawled_count: importedCount,
          completed_at: new Date().toISOString(),
        })
        .eq('id', jobId);
    }

    return NextResponse.json({
      imported: importedCount,
      failed: failedCount,
      total: zhipinUrls.length,
    });
  } catch (err) {
    console.error('[market-insight/import] Error:', err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : '导入失败' },
      { status: 500 }
    );
  }
}
