'use client';

import { useState, useCallback, useEffect } from 'react';
import { apiFetch } from '@/lib/api/fetch';
import FilterBar from '@/components/market-insight/FilterBar';
import CrawlStatus from '@/components/market-insight/CrawlStatus';
import InsightReport from '@/components/market-insight/InsightReport';
import SkillTrendChart from '@/components/market-insight/SkillTrendChart';
import AnalysisDiff from '@/components/market-insight/AnalysisDiff';
import type {
  MarketCrawlJob,
  MarketAnalysisSnapshot,
  MarketAnalysisDiff,
  ReportResponse,
} from '@/lib/market-insight/types';

export default function MarketInsightPage() {
  // Filter state
  const [keyword, setKeyword] = useState('AI产品经理');
  const [targetCount, setTargetCount] = useState(100);
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  // Crawl state
  const [crawlLoading, setCrawlLoading] = useState(false);
  const [crawlError, setCrawlError] = useState<string | null>(null);
  const [crawlJob, setCrawlJob] = useState<MarketCrawlJob | null>(null);
  const [crawledJdsCount, setCrawledJdsCount] = useState(0);

  // Analysis state
  const [analyzeLoading, setAnalyzeLoading] = useState(false);
  const [analyzeError, setAnalyzeError] = useState<string | null>(null);

  // Report state
  const [snapshot, setSnapshot] = useState<MarketAnalysisSnapshot | null>(null);
  const [diff, setDiff] = useState<MarketAnalysisDiff | null>(null);
  const [previousSnapshot, setPreviousSnapshot] = useState<MarketAnalysisSnapshot | null>(null);

  const loadReport = useCallback(async (kw: string) => {
    try {
      const res = await apiFetch(`/api/market-insight/report?keyword=${encodeURIComponent(kw)}`);
      if (res.ok) {
        const data: ReportResponse = await res.json();
        setSnapshot(data.snapshot);
        setDiff(data.diff);
        setPreviousSnapshot(data.previousSnapshot);
      }
    } catch {
      // Silently fail
    }
  }, []);

  const loadCrawlStatus = useCallback(async () => {
    try {
      const res = await apiFetch('/api/market-insight/crawl');
      if (res.ok) {
        const data = await res.json();
        if (data.jobs?.length > 0) {
          setCrawlJob(data.jobs[0]);
        }
        setCrawledJdsCount(data.crawled_jds_count || 0);
      }
    } catch {
      // Silently fail
    }
  }, []);

  // Load existing report and reset crawl state when keyword changes
  useEffect(() => {
    if (keyword.trim()) {
      loadReport(keyword.trim());
      setCrawlJob(null);
      loadCrawlStatus();
    }
  }, [keyword, loadReport, loadCrawlStatus]);

  // Poll crawl status when running
  useEffect(() => {
    if (crawlJob?.status !== 'running') return;
    const interval = setInterval(() => {
      loadCrawlStatus();
    }, 5000);
    return () => clearInterval(interval);
  }, [crawlJob?.status, loadCrawlStatus]);

  const handleCrawl = useCallback(async () => {
    if (!keyword.trim()) return;
    setCrawlLoading(true);
    setCrawlError(null);

    try {
      const res = await apiFetch('/api/market-insight/crawl', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          keyword: keyword.trim(),
          target_count: targetCount,
          date_from: dateFrom || undefined,
          date_to: dateTo || undefined,
        }),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || `HTTP ${res.status}`);
      }

      const data = await res.json();

      // Immediately set a running job so the UI shows progress
      if (data.jobId) {
        setCrawlJob({
          id: data.jobId,
          user_id: '',
          query_keyword: keyword.trim(),
          target_count: targetCount,
          date_from: dateFrom || '',
          date_to: dateTo || '',
          crawled_count: 0,
          status: 'running' as const,
          error_message: null,
          started_at: new Date().toISOString(),
          completed_at: null,
          created_at: new Date().toISOString(),
        });
      }

      // Also refresh full status
      loadCrawlStatus();
    } catch (err) {
      setCrawlError(err instanceof Error ? err.message : '爬取失败');
    } finally {
      setCrawlLoading(false);
    }
  }, [keyword, targetCount, dateFrom, dateTo, loadCrawlStatus]);

  const handleAnalyze = useCallback(async () => {
    if (!keyword.trim()) return;
    setAnalyzeLoading(true);
    setAnalyzeError(null);

    try {
      const res = await apiFetch('/api/market-insight/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          keyword: keyword.trim(),
          date_from: dateFrom || undefined,
          date_to: dateTo || undefined,
        }),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || `HTTP ${res.status}`);
      }

      // Reload report
      await loadReport(keyword.trim());
    } catch (err) {
      setAnalyzeError(err instanceof Error ? err.message : '分析失败');
    } finally {
      setAnalyzeLoading(false);
    }
  }, [keyword, dateFrom, dateTo, loadReport]);

  const isLoading = crawlLoading || analyzeLoading;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-xl font-bold text-foreground">JD 市场洞察</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          批量爬取 BOSS 直聘岗位 JD，AI 分析核心技能、未来趋势和市场变化
        </p>
      </div>

      {/* Filter Bar */}
      <FilterBar
        onCrawl={handleCrawl}
        onAnalyze={handleAnalyze}
        loading={isLoading}
        keyword={keyword}
        setKeyword={setKeyword}
        targetCount={targetCount}
        setTargetCount={setTargetCount}
        dateFrom={dateFrom}
        dateTo={dateTo}
        setDateFrom={setDateFrom}
        setDateTo={setDateTo}
      />

      {/* Crawl Status */}
      {(crawlJob || crawlError) && (
        <CrawlStatus job={crawlJob} crawledJdsCount={crawledJdsCount} error={crawlError} />
      )}

      {/* Analyze Error */}
      {analyzeError && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600 dark:border-red-800 dark:bg-red-950/30 dark:text-red-400">
          {analyzeError}
        </div>
      )}

      {/* Analyzing indicator */}
      {analyzeLoading && (
        <div className="flex flex-col items-center gap-4 py-12">
          <div className="relative h-12 w-12">
            <div className="absolute inset-0 animate-spin rounded-full border-2 border-amber-200 border-t-amber-500" />
          </div>
          <div className="text-center">
            <p className="text-sm font-medium text-foreground">AI 正在分析岗位市场...</p>
            <p className="mt-1 text-xs text-muted-foreground">提取技能、计算频率、生成洞察报告</p>
          </div>
        </div>
      )}

      {/* Report */}
      {snapshot?.report && !analyzeLoading && (
        <>
          <InsightReport report={snapshot.report} />

          {/* Skill Chart */}
          <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
            <h3 className="mb-4 text-sm font-semibold text-foreground">📈 技能频率分布</h3>
            <SkillTrendChart
              skillFrequency={snapshot.skill_frequency}
              categoryDistribution={snapshot.category_distribution}
            />
          </div>

          {/* Diff */}
          {diff && (
            <AnalysisDiff diff={diff} previousSnapshot={previousSnapshot} />
          )}
        </>
      )}

      {/* Empty state */}
      {!snapshot?.report && !analyzeLoading && !crawlLoading && (
        <div className="flex flex-col items-center gap-4 py-16 text-center">
          <div className="text-4xl">🔍</div>
          <p className="text-sm text-muted-foreground">
            输入岗位关键词和日期范围，点击「开始爬取」获取市场数据
          </p>
          <p className="text-xs text-muted-foreground">
            已爬取 {crawledJdsCount} 条 JD · 爬取完成后点击「重新分析」生成报告
          </p>
        </div>
      )}
    </div>
  );
}
