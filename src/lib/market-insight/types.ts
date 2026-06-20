// ── Market Insight type definitions ──────────────────────────────────
// Centralized types for the JD market intelligence feature.

// ── Crawl types ──────────────────────────────────────────────────────

export type CrawlJobStatus = 'pending' | 'running' | 'completed' | 'failed';

export interface MarketCrawlJob {
  id: string;
  user_id: string;
  query_keyword: string;
  target_count: number;
  date_from: string;       // ISO date "2025-01-01"
  date_to: string;         // ISO date "2025-06-20"
  crawled_count: number;
  status: CrawlJobStatus;
  error_message: string | null;
  started_at: string | null;
  completed_at: string | null;
  created_at: string;
}

export interface MarketCrawledJd {
  id: string;
  user_id: string;
  crawl_job_id: string;
  source_url: string;
  source_platform: string;
  job_title: string | null;
  company_name: string | null;
  salary_range: string | null;
  location: string | null;
  jd_text: string;
  published_date: string | null;
  extracted_skills: ExtractedSkill[];
  is_analyzed: boolean;
  created_at: string;
}

export interface ExtractedSkill {
  name: string;
  category: string;
  frequency: number;
}

// ── Crawl request ────────────────────────────────────────────────────

export interface CrawlRequest {
  keyword: string;
  target_count: number;
  date_from: string;       // "2025-01-01"
  date_to: string;         // "2025-06-20"
}

// ── Analysis snapshot ────────────────────────────────────────────────

export interface MarketAnalysisSnapshot {
  id: string;
  user_id: string;
  query_keyword: string;
  jd_count: number;
  date_range_start: string | null;
  date_range_end: string | null;
  skill_frequency: Record<string, number>;
  category_distribution: Record<string, number>;
  salary_distribution: Record<string, number>;
  location_distribution: Record<string, number>;
  company_distribution: Record<string, number>;
  report: MarketAnalysisReport;
  created_at: string;
}

// ── Analysis report (structured, NOT markdown) ──────────────────────

export interface MarketAnalysisReport {
  summary: string;
  coreSkills: Array<{
    skill: string;
    frequency: number;
    percentage: number;
    trend: 'rising' | 'stable' | 'declining';
    insight: string;
  }>;
  futureTrends: Array<{
    trend: string;
    evidence: string;
    impact: string;
    timeHorizon: string;
  }>;
  salaryInsights: {
    overall: string;
    bySkill: Array<{ skill: string; salaryImpact: string }>;
  };
  locationInsights: {
    hottest: string[];
    remoteTrend: string;
  };
  companyInsights: Array<{
    company: string;
    hiringFocus: string;
    skillEmphasis: string[];
  }>;
  recommendations: Array<{
    target: string;
    action: string;
    reasoning: string;
  }>;
}

// ── Analysis diff ────────────────────────────────────────────────────

export interface MarketAnalysisDiff {
  id: string;
  user_id: string;
  query_keyword: string;
  previous_snapshot_id: string | null;
  current_snapshot_id: string;
  new_skills: Array<{ skill: string; frequency: number; category: string }>;
  disappeared_skills: Array<{ skill: string; previousFrequency: number; category: string }>;
  frequency_changes: Array<{
    skill: string;
    previousFrequency: number;
    currentFrequency: number;
    change: number;
    changePercent: number;
    category: string;
  }>;
  category_shifts: Array<{
    category: string;
    previousPercentage: number;
    currentPercentage: number;
    change: number;
  }>;
  narrative: string | null;
  recommendations: string | null;
  created_at: string;
}

// ── API response types ───────────────────────────────────────────────

export interface CrawlStatusResponse {
  job: MarketCrawlJob;
  crawled_jds_count: number;
}

export interface AnalyzeRequest {
  keyword: string;
  date_from?: string;
  date_to?: string;
}

export interface ReportResponse {
  snapshot: MarketAnalysisSnapshot | null;
  diff: MarketAnalysisDiff | null;
  previousSnapshot: MarketAnalysisSnapshot | null;
}

export interface ImportRequest {
  urls: string[];
  keyword: string;
}
