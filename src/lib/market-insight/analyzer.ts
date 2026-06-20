// ── Market Insight Analyzer ────────────────────────────────────────
// Batch skill extraction + aggregation + AI report generation.

import { createClient } from '@/lib/supabase/server';
import { generateText } from '@/lib/ai/claude';
import { withTimeout } from '@/lib/ai/with-timeout';
import { getSkillCategory } from '@/lib/ai/skill-categories';
import {
  MARKET_ANALYSIS_SYSTEM_PROMPT,
  buildMarketAnalysisPrompt,
  BATCH_SKILL_EXTRACT_SYSTEM_PROMPT,
  buildBatchSkillExtractPrompt,
} from './prompts';
import type {
  MarketAnalysisReport,
  MarketAnalysisSnapshot,
  ExtractedSkill,
} from './types';

// ── Public interface ────────────────────────────────────────────────

export interface AnalyzeOptions {
  keyword: string;
  userId: string;
  dateFrom?: string;
  dateTo?: string;
}

export interface AnalyzeResult {
  snapshotId: string;
  jdCount: number;
  topSkills: Array<{ skill: string; frequency: number }>;
}

// ── Main analysis function ──────────────────────────────────────────

export async function analyzeMarket(options: AnalyzeOptions): Promise<AnalyzeResult> {
  const { keyword, userId, dateFrom, dateTo } = options;
  const supabase = await createClient();

  // 1. Fetch unanalyzed JDs for this keyword
  let query = supabase
    .from('market_crawled_jds')
    .select('id, job_title, jd_text, salary_range, location, company_name')
    .eq('user_id', userId)
    .eq('is_analyzed', false);

  // Filter by date range if provided (via published_date or created_at)
  if (dateFrom) {
    query = query.gte('created_at', dateFrom);
  }
  if (dateTo) {
    query = query.lte('created_at', dateTo + 'T23:59:59');
  }

  const { data: jds, error: fetchErr } = await query;
  if (fetchErr) {
    throw new Error(`Failed to fetch JDs: ${fetchErr.message}`);
  }

  if (!jds || jds.length === 0) {
    throw new Error('没有可分析的岗位数据，请先爬取 JD');
  }

  // 2. Batch extract skills (5 JDs per AI call)
  const batchSize = 5;
  const allSkills: Record<string, number> = {};
  const jdSkillsMap: Record<string, string[]> = {};
  const salaryData: Record<string, number> = {};
  const locationData: Record<string, number> = {};
  const companyData: Record<string, number> = {};
  const titleData: Record<string, number> = {};

  for (let i = 0; i < jds.length; i += batchSize) {
    const batch = jds.slice(i, i + batchSize);
    const indexedJds = batch.map((jd, idx) => ({
      index: i + idx,
      title: jd.job_title || '未知职位',
      text: jd.jd_text,
    }));

    try {
      const extractPrompt = buildBatchSkillExtractPrompt(indexedJds);
      const response = await withTimeout(
        generateText(extractPrompt, {
          model: 'haiku',
          system: BATCH_SKILL_EXTRACT_SYSTEM_PROMPT,
          maxTokens: 4096,
        }),
        60000
      );

      // Parse the extraction results
      const parsed = parseExtractResponse(response);
      for (const result of parsed) {
        const jdIndex = result.index;
        const jd = jds[jdIndex];
        if (!jd) continue;

        const skills: ExtractedSkill[] = result.skills.map((s: string) => ({
          name: s,
          category: getSkillCategory(s) || '其他',
          frequency: 1,
        }));

        jdSkillsMap[jd.id] = result.skills;

        // Aggregate skill frequencies
        for (const skill of result.skills) {
          allSkills[skill] = (allSkills[skill] || 0) + 1;
        }

        // Aggregate salary data
        if (jd.salary_range) {
          salaryData[jd.salary_range] = (salaryData[jd.salary_range] || 0) + 1;
        }

        // Aggregate location data
        if (jd.location) {
          const city = jd.location.split('·')[0];
          locationData[city] = (locationData[city] || 0) + 1;
        }

        // Aggregate company data
        if (jd.company_name) {
          companyData[jd.company_name] = (companyData[jd.company_name] || 0) + 1;
        }

        // Aggregate title data
        if (jd.job_title) {
          titleData[jd.job_title] = (titleData[jd.job_title] || 0) + 1;
        }

        // Mark as analyzed & save extracted skills
        await supabase
          .from('market_crawled_jds')
          .update({
            is_analyzed: true,
            extracted_skills: skills,
          })
          .eq('id', jd.id);
      }
    } catch (err) {
      console.warn(`[analyzer] Batch ${i} skill extraction failed:`, err);
      // Continue with next batch
    }

    // Small delay between batches
    if (i + batchSize < jds.length) {
      await new Promise((r) => setTimeout(r, 1000));
    }
  }

  // 3. Compute category distribution
  const categoryDist: Record<string, number> = {};
  for (const [skill, freq] of Object.entries(allSkills)) {
    const cat = getSkillCategory(skill) || '其他';
    categoryDist[cat] = (categoryDist[cat] || 0) + freq;
  }

  // 4. Generate AI report
  const topJdTitles = Object.entries(titleData)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 15)
    .map(([t]) => t);

  const dateRange = dateFrom && dateTo ? `${dateFrom} ~ ${dateTo}` : '全部时间';

  const reportPrompt = buildMarketAnalysisPrompt({
    keyword,
    jdCount: jds.length,
    dateRange,
    skillFrequency: allSkills,
    categoryDistribution: categoryDist,
    salaryDistribution: salaryData,
    locationDistribution: locationData,
    companyDistribution: companyData,
    topJdTitles,
  });

  const reportResponse = await withTimeout(
    generateText(reportPrompt, {
      model: 'sonnet',
      system: MARKET_ANALYSIS_SYSTEM_PROMPT,
      maxTokens: 8192,
    }),
    180000
  );

  const report = parseReportResponse(reportResponse);

  // 5. Save snapshot to DB
  const { data: snapshot, error: insertErr } = await supabase
    .from('market_analysis_snapshots')
    .insert({
      user_id: userId,
      query_keyword: keyword,
      jd_count: jds.length,
      date_range_start: dateFrom || null,
      date_range_end: dateTo || null,
      skill_frequency: allSkills,
      category_distribution: categoryDist,
      salary_distribution: salaryData,
      location_distribution: locationData,
      company_distribution: companyData,
      report,
    })
    .select()
    .single();

  if (insertErr || !snapshot) {
    throw new Error(`Failed to save snapshot: ${insertErr?.message}`);
  }

  // 6. Generate diff with previous snapshot
  await generateDiff(supabase, userId, keyword, snapshot);

  const topSkills = Object.entries(allSkills)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 10)
    .map(([skill, frequency]) => ({ skill, frequency }));

  return {
    snapshotId: snapshot.id,
    jdCount: jds.length,
    topSkills,
  };
}

// ── Diff generation ─────────────────────────────────────────────────

async function generateDiff(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabase: any,
  userId: string,
  keyword: string,
  currentSnapshot: MarketAnalysisSnapshot
): Promise<void> {
  // Find the previous snapshot for this keyword
  const { data: prevSnapshots } = await supabase
    .from('market_analysis_snapshots')
    .select('*')
    .eq('user_id', userId)
    .eq('query_keyword', keyword)
    .lt('created_at', currentSnapshot.created_at)
    .order('created_at', { ascending: false })
    .limit(1);

  const prevSnapshot = prevSnapshots?.[0] as MarketAnalysisSnapshot | undefined;

  if (!prevSnapshot) {
    // First analysis, no diff to generate
    return;
  }

  // Compute diff
  const prevSkills = prevSnapshot.skill_frequency;
  const currSkills = currentSnapshot.skill_frequency;

  // New skills (not in previous)
  const newSkills = Object.entries(currSkills)
    .filter(([skill]) => !prevSkills[skill])
    .map(([skill, frequency]) => ({
      skill,
      frequency,
      category: getSkillCategory(skill) || '其他',
    }));

  // Disappeared skills
  const disappearedSkills = Object.entries(prevSkills)
    .filter(([skill]) => !currSkills[skill])
    .map(([skill, previousFrequency]) => ({
      skill,
      previousFrequency,
      category: getSkillCategory(skill) || '其他',
    }));

  // Frequency changes
  const frequencyChanges = Object.entries(currSkills)
    .filter(([skill]) => prevSkills[skill] !== undefined)
    .map(([skill, currentFrequency]) => {
      const previousFrequency = prevSkills[skill];
      const change = currentFrequency - previousFrequency;
      const changePercent = previousFrequency > 0 ? (change / previousFrequency) * 100 : 0;
      return {
        skill,
        previousFrequency,
        currentFrequency,
        change,
        changePercent,
        category: getSkillCategory(skill) || '其他',
      };
    })
    .filter((c) => Math.abs(c.changePercent) > 10); // Only significant changes

  // Category shifts
  const prevTotal = Object.values(prevSnapshot.category_distribution).reduce((a, b) => a + b, 0);
  const currTotal = Object.values(currentSnapshot.category_distribution).reduce((a, b) => a + b, 0);

  const allCategories = new Set([
    ...Object.keys(prevSnapshot.category_distribution),
    ...Object.keys(currentSnapshot.category_distribution),
  ]);

  const categoryShifts = Array.from(allCategories).map((category) => {
    const prevCount = prevSnapshot.category_distribution[category] || 0;
    const currCount = currentSnapshot.category_distribution[category] || 0;
    const previousPercentage = prevTotal > 0 ? (prevCount / prevTotal) * 100 : 0;
    const currentPercentage = currTotal > 0 ? (currCount / currTotal) * 100 : 0;
    return {
      category,
      previousPercentage,
      currentPercentage,
      change: currentPercentage - previousPercentage,
    };
  }).filter((s) => Math.abs(s.change) > 1); // Only significant shifts

  // Generate narrative
  const { MARKET_DIFF_SYSTEM_PROMPT: diffSystem, buildMarketDiffNarrativePrompt } = await import('./prompts');
  const narrativePrompt = buildMarketDiffNarrativePrompt({
    keyword,
    newSkills,
    disappearedSkills,
    frequencyChanges,
    categoryShifts,
    prevDate: new Date(prevSnapshot.created_at).toLocaleDateString('zh-CN'),
    currDate: new Date(currentSnapshot.created_at).toLocaleDateString('zh-CN'),
  });

  let narrative: string | null = null;
  let recommendations: string | null = null;

  try {
    const narrativeResponse = await withTimeout(
      generateText(narrativePrompt, {
        model: 'sonnet',
        system: diffSystem,
        maxTokens: 4096,
      }),
      120000
    );

    // Split narrative and recommendations
    const parts = narrativeResponse.split(/建议[：:]/);
    narrative = parts[0].trim();
    recommendations = parts.length > 1 ? '建议：' + parts.slice(1).join('建议：').trim() : null;
  } catch (err) {
    console.warn('[analyzer] Diff narrative generation failed:', err);
    narrative = '变化叙事生成失败';
  }

  // Save diff
  await supabase.from('market_analysis_diffs').insert({
    user_id: userId,
    query_keyword: keyword,
    previous_snapshot_id: prevSnapshot.id,
    current_snapshot_id: currentSnapshot.id,
    new_skills: newSkills,
    disappeared_skills: disappearedSkills,
    frequency_changes: frequencyChanges,
    category_shifts: categoryShifts,
    narrative,
    recommendations,
  });
}

// ── Response parsers ────────────────────────────────────────────────

interface ExtractResult {
  index: number;
  skills: string[];
}

function parseExtractResponse(response: string): ExtractResult[] {
  try {
    const cleaned = response.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    const parsed = JSON.parse(cleaned);
    return parsed.results || [];
  } catch {
    console.warn('[analyzer] Failed to parse extract response, returning empty');
    return [];
  }
}

function parseReportResponse(response: string): MarketAnalysisReport {
  try {
    const cleaned = response.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    const parsed = JSON.parse(cleaned);

    // Validate required fields with defaults
    return {
      summary: parsed.summary || '',
      coreSkills: (parsed.coreSkills || []).map((s: Record<string, unknown>) => ({
        skill: String(s.skill || ''),
        frequency: Number(s.frequency || 0),
        percentage: Number(s.percentage || 0),
        trend: (s.trend === 'rising' || s.trend === 'stable' || s.trend === 'declining')
          ? s.trend
          : 'stable',
        insight: String(s.insight || ''),
      })),
      futureTrends: (parsed.futureTrends || []).map((t: Record<string, unknown>) => ({
        trend: String(t.trend || ''),
        evidence: String(t.evidence || ''),
        impact: String(t.impact || ''),
        timeHorizon: String(t.timeHorizon || ''),
      })),
      salaryInsights: {
        overall: parsed.salaryInsights?.overall || '',
        bySkill: (parsed.salaryInsights?.bySkill || []).map((s: Record<string, unknown>) => ({
          skill: String(s.skill || ''),
          salaryImpact: String(s.salaryImpact || ''),
        })),
      },
      locationInsights: {
        hottest: parsed.locationInsights?.hottest || [],
        remoteTrend: parsed.locationInsights?.remoteTrend || '',
      },
      companyInsights: (parsed.companyInsights || []).map((c: Record<string, unknown>) => ({
        company: String(c.company || ''),
        hiringFocus: String(c.hiringFocus || ''),
        skillEmphasis: Array.isArray(c.skillEmphasis) ? c.skillEmphasis.map(String) : [],
      })),
      recommendations: (parsed.recommendations || []).map((r: Record<string, unknown>) => ({
        target: String(r.target || ''),
        action: String(r.action || ''),
        reasoning: String(r.reasoning || ''),
      })),
    };
  } catch (err) {
    console.warn('[analyzer] Failed to parse report response:', err);
    // Return minimal fallback
    return {
      summary: response.substring(0, 200),
      coreSkills: [],
      futureTrends: [],
      salaryInsights: { overall: '', bySkill: [] },
      locationInsights: { hottest: [], remoteTrend: '' },
      companyInsights: [],
      recommendations: [],
    };
  }
}
