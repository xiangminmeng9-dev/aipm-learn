'use client';

import type { MarketCrawlJob } from '@/lib/market-insight/types';

interface CrawlStatusProps {
  job: MarketCrawlJob | null;
  crawledJdsCount: number;
  error?: string | null;
}

export default function CrawlStatus({ job, crawledJdsCount, error }: CrawlStatusProps) {
  if (!job && !error) return null;

  const targetCount = job?.target_count || 100;
  const progress = job && targetCount > 0
    ? Math.min(100, Math.round((crawledJdsCount / targetCount) * 100))
    : 0;

  const status = job?.status || 'pending';

  const statusColor = {
    pending: 'text-muted-foreground',
    running: 'text-amber-600 dark:text-amber-400',
    completed: 'text-emerald-600 dark:text-emerald-400',
    failed: 'text-red-600 dark:text-red-400',
  }[status];

  const barColor = {
    pending: 'bg-muted-foreground/30',
    running: 'bg-amber-500',
    completed: 'bg-emerald-500',
    failed: 'bg-red-500',
  }[status];

  const statusText = (() => {
    if (error) return `爬取失败: ${error}`;
    switch (status) {
      case 'pending':
        return '等待中...';
      case 'running':
        return `正在爬取... ${crawledJdsCount}/${targetCount} JD`;
      case 'completed':
        return `爬取完成！共获取 ${crawledJdsCount} 条 JD`;
      case 'failed':
        return `爬取失败: ${job?.error_message || '未知错误'}`;
    }
  })();

  return (
    <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-foreground">爬取状态</span>
          {status === 'running' && (
            <span className="inline-block h-2 w-2 animate-pulse rounded-full bg-amber-500" />
          )}
        </div>
        <span className={`text-sm font-semibold ${statusColor}`}>{progress}%</span>
      </div>

      {/* Progress bar */}
      <div className="mb-3 h-2 w-full overflow-hidden rounded-full bg-muted">
        <div
          className={`h-full rounded-full transition-all duration-500 ${barColor}`}
          style={{ width: `${progress}%` }}
        />
      </div>

      {/* Status text */}
      <p className={`text-sm ${statusColor}`}>{statusText}</p>

      {/* Job metadata */}
      {job && (
        <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
          <span>关键词: {job.query_keyword}</span>
          {job.started_at && (
            <span>开始: {new Date(job.started_at).toLocaleString('zh-CN')}</span>
          )}
          {job.completed_at && (
            <span>完成: {new Date(job.completed_at).toLocaleString('zh-CN')}</span>
          )}
        </div>
      )}
    </div>
  );
}
