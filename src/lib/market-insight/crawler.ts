// ── Market Insight Crawler ──────────────────────────────────────────
// Batch-crawls BOSS直聘 JDs using Tavily Search + Extract pipeline.
// Strategy: Tavily Search discovers JD URLs, Tavily Extract fetches content.

import { searchWithTavily } from '@/lib/ai/tavily-search';
import { extractWithTavily } from '@/lib/ai/tavily-extract';
import { createClient } from '@/lib/supabase/server';

// ── City/region variants for expanding search coverage ──────────────

const SEARCH_CITIES = [
  '',          // no city filter (nationwide)
  '北京',
  '上海',
  '深圳',
  '广州',
  '杭州',
  '成都',
  '南京',
  '武汉',
  '苏州',
];

const SEARCH_EXPRIENCE = [
  '',                          // no experience filter
  '1-3年',
  '3-5年',
  '5-10年',
];

// ── Public interface ────────────────────────────────────────────────

export interface CrawlOptions {
  keyword: string;
  targetCount: number;
  dateFrom: string;    // "2025-01-01"
  dateTo: string;      // "2025-06-20"
  userId: string;
  jobId: string;       // Pre-created job ID from API
}

export interface CrawlResult {
  jobId: string;
  discoveredUrls: number;
  newJds: number;
  duplicates: number;
  failed: number;
}

// ── Main crawl function ─────────────────────────────────────────────

export async function crawlBossJds(options: CrawlOptions): Promise<CrawlResult> {
  const { keyword, targetCount, dateFrom, dateTo, userId, jobId } = options;
  const supabase = await createClient();

  // Mark the pre-created job as running
  await supabase
    .from('market_crawl_jobs')
    .update({ status: 'running', started_at: new Date().toISOString() })
    .eq('id', jobId);

  const result: CrawlResult = {
    jobId,
    discoveredUrls: 0,
    newJds: 0,
    duplicates: 0,
    failed: 0,
  };

  try {
    // 2. Get already-crawled URLs for this user
    const { data: existingJds } = await supabase
      .from('market_crawled_jds')
      .select('source_url')
      .eq('user_id', userId);
    const crawledUrlSet = new Set((existingJds || []).map((j: { source_url: string }) => normalizeUrl(j.source_url)));

    // 3. Discover JD URLs via Tavily Search
    const discoveredUrls = await discoverJdUrls(keyword, dateFrom, dateTo, targetCount);
    result.discoveredUrls = discoveredUrls.length;

    // 4. Filter out already-crawled URLs
    const newUrls = discoveredUrls.filter((url) => !crawledUrlSet.has(normalizeUrl(url)));
    result.duplicates = discoveredUrls.length - newUrls.length;

    // 5. Batch extract JD content via Tavily Extract (10 URLs per call)
    const batchSize = 10;
    let processedCount = 0;

    for (let i = 0; i < newUrls.length && processedCount < targetCount; i += batchSize) {
      const batch = newUrls.slice(i, i + batchSize);
      const urlsToProcess = batch.slice(0, targetCount - processedCount);

      try {
        const extractResult = await extractWithTavily(urlsToProcess, {
          extract_depth: 'advanced',
          query: `${keyword} 职位描述`,
          timeout: 30,
        });

        if (extractResult?.results) {
          for (const item of extractResult.results) {
            if (!item.raw_content) continue;

            const parsed = parseJdFromText(item.raw_content);
            if (!parsed.jd_text || parsed.jd_text.length < 50) continue;

            // Save to DB
            const { error: insertErr } = await supabase
              .from('market_crawled_jds')
              .insert({
                user_id: userId,
                crawl_job_id: jobId,
                source_url: item.url,
                source_platform: 'zhipin',
                job_title: parsed.job_title,
                company_name: parsed.company_name,
                salary_range: parsed.salary_range,
                location: parsed.location,
                jd_text: parsed.jd_text,
                published_date: parsed.published_date,
              });

            if (insertErr) {
              console.warn(`[crawler] Failed to insert JD: ${insertErr.message}`);
              result.failed++;
            } else {
              result.newJds++;
              processedCount++;
            }
          }
        }

        // Count failed extractions
        if (extractResult?.failed_results) {
          result.failed += extractResult.failed_results.length;
        }
      } catch (err) {
        console.warn(`[crawler] Batch extract failed for batch starting at ${i}:`, err);
        result.failed += urlsToProcess.length;
      }

      // Rate limit: wait 2s between batches
      await sleep(2000);

      // Update progress
      await supabase
        .from('market_crawl_jobs')
        .update({ crawled_count: processedCount })
        .eq('id', jobId);
    }

    // 6. Mark job completed
    await supabase
      .from('market_crawl_jobs')
      .update({
        status: 'completed',
        crawled_count: result.newJds,
        completed_at: new Date().toISOString(),
      })
      .eq('id', jobId);

    return result;
  } catch (err) {
    // Mark job failed
    await supabase
      .from('market_crawl_jobs')
      .update({
        status: 'failed',
        error_message: err instanceof Error ? err.message : 'Unknown error',
        completed_at: new Date().toISOString(),
      })
      .eq('id', jobId);
    throw err;
  }
}

// ── URL Discovery via Tavily Search ─────────────────────────────────

async function discoverJdUrls(
  keyword: string,
  _dateFrom: string,
  _dateTo: string,
  targetCount: number
): Promise<string[]> {
  const urlSet = new Set<string>();
  const maxSearches = Math.min(Math.ceil(targetCount / 10), 50); // Cap at 50 searches

  // Build search queries with city and experience variants
  const queries: string[] = [];
  for (const city of SEARCH_CITIES) {
    for (const exp of SEARCH_EXPRIENCE) {
      if (queries.length >= maxSearches) break;
      const parts = [keyword, 'BOSS直聘', '招聘', 'site:zhipin.com'];
      if (city) parts.unshift(city);
      if (exp) parts.push(exp);
      queries.push(parts.join(' '));
    }
    if (queries.length >= maxSearches) break;
  }

  // Execute searches with concurrency limit
  const concurrencyLimit = 3;
  for (let i = 0; i < queries.length; i += concurrencyLimit) {
    const batch = queries.slice(i, i + concurrencyLimit);
    const results = await Promise.allSettled(
      batch.map((q) =>
        searchWithTavily(q, { maxResults: 10, topic: 'general' })
      )
    );

    for (const r of results) {
      if (r.status === 'fulfilled' && r.value.results) {
        for (const item of r.value.results) {
          const url = item.url;
          if (isZhipinJobUrl(url)) {
            urlSet.add(normalizeUrl(url));
          }
        }
      }
    }

    // Rate limit between batches
    await sleep(1500);
  }

  return Array.from(urlSet);
}

// ── URL helpers ─────────────────────────────────────────────────────

function isZhipinJobUrl(url: string): boolean {
  try {
    const u = new URL(url);
    // BOSS直聘 job detail URLs: zhipin.com/job_detail/... or zhipin.com/gongsi/...
    return (
      u.hostname.includes('zhipin.com') &&
      (u.pathname.includes('/job_detail/') || u.pathname.includes('/gongsi/'))
    );
  } catch {
    return false;
  }
}

function normalizeUrl(url: string): string {
  try {
    const u = new URL(url);
    // Strip query params and hash, keep only the canonical path
    return `${u.origin}${u.pathname}`.replace(/\/+$/, '').toLowerCase();
  } catch {
    return url.toLowerCase();
  }
}

// ── JD text parsing ─────────────────────────────────────────────────

interface ParsedJd {
  job_title: string | null;
  company_name: string | null;
  salary_range: string | null;
  location: string | null;
  jd_text: string;
  published_date: string | null;
}

function parseJdFromText(rawText: string): ParsedJd {
  // Extract structured fields from the raw text
  const lines = rawText.split('\n').map((l) => l.trim()).filter(Boolean);

  let job_title: string | null = null;
  let company_name: string | null = null;
  let salary_range: string | null = null;
  let location: string | null = null;

  // Try to find salary (e.g., "15-25K", "25-40K·14薪")
  const salaryMatch = rawText.match(/(\d{1,3}[-~]\d{1,3}[Kk万][·\.]?\d?[\d薪个月]?)/);
  if (salaryMatch) salary_range = salaryMatch[1];

  // Try to find location (e.g., "北京·朝阳区")
  const locationMatch = rawText.match(/([北京上海广州深圳杭州成都南京武汉苏州西安重庆长沙天津东莞佛山合肥郑州昆明青岛沈阳大连厦门哈尔滨])[··]\S+/);
  if (locationMatch) location = locationMatch[0];

  // Try to find job title — usually the first meaningful line or a "职位名称" prefix
  for (const line of lines.slice(0, 10)) {
    if (line.includes('职位名称') || line.includes('岗位名称')) {
      const parts = line.split(/[：:]/);
      if (parts.length > 1) job_title = parts[1].trim();
    }
  }
  if (!job_title && lines.length > 0) {
    // First short line that's not a label is likely the title
    job_title = lines[0].substring(0, 50);
  }

  // Try to find company name
  for (const line of lines.slice(0, 20)) {
    if (line.includes('公司名称') || line.includes('企业名称')) {
      const parts = line.split(/[：:]/);
      if (parts.length > 1) company_name = parts[1].trim();
    }
  }

  // Extract the JD body — everything after "岗位职责" or "职位描述"
  let jdStart = -1;
  const jdMarkers = ['岗位职责', '职位描述', '岗位描述', '工作内容', 'Job Description', 'Responsibilities'];
  for (let i = 0; i < lines.length; i++) {
    for (const marker of jdMarkers) {
      if (lines[i].includes(marker)) {
        jdStart = i;
        break;
      }
    }
    if (jdStart >= 0) break;
  }

  // Extract the JD body — everything before "公司信息" or "企业信息" etc
  let jdEnd = lines.length;
  const endMarkers = ['公司信息', '企业信息', '公司介绍', '公司简介', '工商信息', 'Business Information'];
  for (let i = jdStart >= 0 ? jdStart : 0; i < lines.length; i++) {
    for (const marker of endMarkers) {
      if (lines[i].includes(marker)) {
        jdEnd = i;
        break;
      }
    }
  }

  const jd_text = jdStart >= 0
    ? lines.slice(jdStart, jdEnd).join('\n')
    : rawText.substring(0, 3000);

  return {
    job_title,
    company_name,
    salary_range,
    location,
    jd_text: jd_text.substring(0, 5000), // Cap at 5000 chars
    published_date: null,
  };
}

// ── Utility ─────────────────────────────────────────────────────────

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
