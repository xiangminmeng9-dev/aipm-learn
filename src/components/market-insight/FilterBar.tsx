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
  setTargetCount: (v: number) => void;
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
  setTargetCount,
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
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-6">
        {/* Keyword */}
        <div className="sm:col-span-2">
          <label className="mb-1.5 block text-xs font-medium text-muted-foreground">
            岗位关键词
          </label>
          <Input
            placeholder="如：AI产品经理"
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={loading}
          />
        </div>

        {/* Target count */}
        <div>
          <label className="mb-1.5 block text-xs font-medium text-muted-foreground">
            目标数量 (10-500)
          </label>
          <Input
            type="number"
            min={10}
            max={500}
            value={targetCount}
            onChange={(e) => {
              const v = parseInt(e.target.value, 10);
              if (!isNaN(v)) setTargetCount(Math.min(500, Math.max(10, v)));
            }}
            disabled={loading}
          />
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
            disabled={loading || !keyword.trim()}
          >
            {loading ? '处理中...' : '开始爬取'}
          </Button>
          <Button
            variant="outline"
            onClick={onAnalyze}
            disabled={loading}
          >
            分析
          </Button>
        </div>
      </div>

      {/* Quick date presets */}
      <div className="mt-3 flex flex-wrap gap-2">
        <span className="text-xs text-muted-foreground">快捷:</span>
        {[
          { label: '近1个月', months: 1 },
          { label: '近3个月', months: 3 },
          { label: '近6个月', months: 6 },
          { label: '近1年', months: 12 },
        ].map((preset) => (
          <button
            key={preset.months}
            type="button"
            className="rounded-md border border-border px-2 py-0.5 text-xs text-muted-foreground transition-colors hover:border-indigo-400 hover:text-indigo-600 dark:hover:border-indigo-500 dark:hover:text-indigo-400"
            onClick={() => {
              const to = new Date();
              const from = new Date();
              from.setMonth(from.getMonth() - preset.months);
              setDateTo(to.toISOString().split('T')[0]);
              setDateFrom(from.toISOString().split('T')[0]);
            }}
            disabled={loading}
          >
            {preset.label}
          </button>
        ))}
      </div>
    </div>
  );
}
