'use client';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

interface FilterBarProps {
  onCrawl: () => void;
  onAnalyze: () => void;
  loading: boolean;
  keyword: string;
  setKeyword: (v: string) => void;
  targetCount: number;
  dateFrom: string;
  dateTo: string;
  setDateFrom: (v: string) => void;
  setDateTo: (v: string) => void;
}

export default function FilterBar({
  onCrawl,
  onAnalyze,
  loading,
  keyword,
  setKeyword,
  targetCount,
  dateFrom,
  dateTo,
  setDateFrom,
  setDateTo,
}: FilterBarProps) {
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !loading) {
      onCrawl();
    }
  };

  return (
    <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        {/* Keyword */}
        <div className="sm:col-span-2 lg:col-span-1">
          <label className="mb-1.5 block text-xs font-medium text-muted-foreground">
            关键词
          </label>
          <Input
            placeholder="如：AI产品经理"
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={loading}
          />
        </div>

        {/* Target count (display only) */}
        <div>
          <label className="mb-1.5 block text-xs font-medium text-muted-foreground">
            目标数量
          </label>
          <div className="flex h-9 items-center rounded-md border border-input bg-muted px-3 text-sm">
            {targetCount} 条
          </div>
        </div>

        {/* Date from */}
        <div>
          <label className="mb-1.5 block text-xs font-medium text-muted-foreground">
            开始日期
          </label>
          <Input
            type="date"
            value={dateFrom}
            onChange={(e) => setDateFrom(e.target.value)}
            disabled={loading}
          />
        </div>

        {/* Date to */}
        <div>
          <label className="mb-1.5 block text-xs font-medium text-muted-foreground">
            结束日期
          </label>
          <Input
            type="date"
            value={dateTo}
            onChange={(e) => setDateTo(e.target.value)}
            disabled={loading}
          />
        </div>

        {/* Buttons */}
        <div className="flex items-end gap-2">
          <Button
            onClick={onCrawl}
            disabled={loading || !keyword.trim() || !dateFrom || !dateTo}
          >
            {loading ? '处理中...' : '开始爬取'}
          </Button>
          <Button
            variant="outline"
            onClick={onAnalyze}
            disabled={loading}
          >
            重新分析
          </Button>
        </div>
      </div>
    </div>
  );
}
