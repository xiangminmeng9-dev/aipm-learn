'use client';

import { useState, useMemo, useCallback } from 'react';
import ReactECharts from '@/components/ui/LazyECharts';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { apiFetch } from '@/lib/api/fetch';
import { type AnalysisResultData, type ImprovementChange } from '@/types/workshop';

interface AnalysisResultProps {
  result: AnalysisResultData;
  analysisId?: string | null;
  originalContent?: string;
  onImprove?: (improvedContent: string) => void;
}

// ── Helpers ─────────────────────────────────────────────────────────

function getScoreColor(score: number): string {
  if (score >= 70) return 'text-emerald-500';
  if (score >= 40) return 'text-amber-500';
  return 'text-red-500';
}

function getScoreStroke(score: number): string {
  if (score >= 70) return '#10b981';
  if (score >= 40) return '#f59e0b';
  return '#ef4444';
}

function getScoreLabel(score: number): string {
  if (score >= 90) return '优秀';
  if (score >= 70) return '良好';
  if (score >= 40) return '一般';
  return '较差';
}

// ── Circular Gauge ──────────────────────────────────────────────────

function CircularGauge({ score, size = 120 }: { score: number; size?: number }) {
  const strokeWidth = 8;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;
  const color = getScoreStroke(score);

  return (
    <div
      className="relative inline-flex items-center justify-center"
      style={{ width: size, height: size }}
    >
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth={strokeWidth}
          className="text-muted/30"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          className="transition-all duration-700 ease-out"
        />
      </svg>
      <div className="absolute flex flex-col items-center">
        <span className={cn('text-3xl font-bold', getScoreColor(score))}>{score}</span>
        <span className="text-[10px] text-muted-foreground">{getScoreLabel(score)}</span>
      </div>
    </div>
  );
}

// ── Component ───────────────────────────────────────────────────────

export default function AnalysisResult({
  result,
  analysisId,
  originalContent,
  onImprove,
}: AnalysisResultProps) {
  const { overall_quality, structure_analysis, quality_scores, use_cases, improvements, summary } =
    result;

  const [improving, setImproving] = useState(false);
  const [improveError, setImproveError] = useState<string | null>(null);
  const [improveResult, setImproveResult] = useState<{
    improved_content: string;
    changes: ImprovementChange[];
  } | null>(null);

  // Radar chart option for quality scores
  const radarOption = useMemo(() => {
    const dimensions = [
      { key: 'clarity', label: '清晰度' },
      { key: 'completeness', label: '完整性' },
      { key: 'practicality', label: '实用性' },
      { key: 'robustness', label: '鲁棒性' },
      { key: 'innovation', label: '创新性' },
    ] as const;

    const indicators = dimensions.map((d) => ({
      name: `${d.label}\n${quality_scores[d.key]?.score ?? 0}`,
      max: 100,
    }));

    const values = dimensions.map((d) => quality_scores[d.key]?.score ?? 0);

    return {
      radar: {
        indicator: indicators,
        shape: 'polygon' as const,
        radius: '65%',
        axisName: {
          color: '#6B7280',
          fontSize: 11,
          lineHeight: 16,
        },
        splitArea: {
          areaStyle: {
            color: [
              'rgba(79,70,229,0.02)',
              'rgba(79,70,229,0.04)',
              'rgba(79,70,229,0.06)',
              'rgba(79,70,229,0.08)',
            ],
          },
        },
        splitLine: { lineStyle: { color: 'rgba(79,70,229,0.15)' } },
        axisLine: { lineStyle: { color: 'rgba(79,70,229,0.2)' } },
      },
      series: [
        {
          type: 'radar' as const,
          data: [
            {
              value: values,
              name: '质量评分',
              areaStyle: { color: 'rgba(79,70,229,0.15)' },
              lineStyle: { color: '#4F46E5', width: 2 },
              itemStyle: { color: '#4F46E5' },
              symbol: 'circle',
              symbolSize: 6,
            },
          ],
        },
      ],
      tooltip: {
        trigger: 'item' as const,
      },
    };
  }, [quality_scores]);

  const handleImprove = useCallback(async () => {
    if (!originalContent) return;
    setImproving(true);
    setImproveError(null);
    try {
      const res = await apiFetch('/api/skills/workshop/improve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: originalContent,
          analysisId: analysisId || undefined,
        }),
      });
      if (res.status === 429) {
        setImproveError('今日改进次数已达上限');
        return;
      }
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || `改进失败: HTTP ${res.status}`);
      }
      const data = await res.json();
      setImproveResult({
        improved_content: data.improved_content,
        changes: data.changes,
      });
    } catch (err) {
      setImproveError(err instanceof Error ? err.message : '改进失败');
    } finally {
      setImproving(false);
    }
  }, [originalContent, analysisId]);

  const handleUseImproved = useCallback(() => {
    if (improveResult?.improved_content && onImprove) {
      onImprove(improveResult.improved_content);
    }
  }, [improveResult, onImprove]);

  return (
    <div className="space-y-6">
      {/* Overall Score + Summary */}
      <div className="flex flex-col items-center gap-4 rounded-xl border border-border bg-card p-6 sm:flex-row sm:items-start sm:gap-8">
        <CircularGauge score={overall_quality} />
        <div className="flex-1 text-center sm:text-left">
          <h3 className="text-base font-semibold text-foreground">总体评价</h3>
          <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{summary}</p>
        </div>
      </div>

      {/* Structure Analysis */}
      <div className="rounded-xl border border-border bg-card p-5">
        <h3 className="mb-4 text-sm font-semibold text-foreground">结构分析</h3>
        <div className="space-y-3">
          {/* Frontmatter */}
          <div className="flex items-center gap-2 text-sm">
            <span
              className={structure_analysis.has_frontmatter ? 'text-emerald-500' : 'text-red-500'}
            >
              {structure_analysis.has_frontmatter ? '✅' : '❌'}
            </span>
            <span className="text-foreground">YAML Frontmatter</span>
            <span className="ml-auto text-xs text-muted-foreground">
              质量 {structure_analysis.frontmatter_quality}/100
            </span>
          </div>

          {/* Required fields */}
          <div className="space-y-1">
            <p className="text-xs font-medium text-muted-foreground">必填字段</p>
            <div className="flex flex-wrap gap-2">
              {structure_analysis.required_fields_present.map((f) => (
                <span
                  key={f}
                  className="inline-flex items-center gap-1 rounded-md bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400"
                >
                  {'✅'} {f}
                </span>
              ))}
              {structure_analysis.missing_fields.map((f) => (
                <span
                  key={f}
                  className="inline-flex items-center gap-1 rounded-md bg-red-50 px-2 py-0.5 text-xs font-medium text-red-700 dark:bg-red-900/30 dark:text-red-400"
                >
                  {'❌'} {f}
                </span>
              ))}
            </div>
          </div>

          {/* Optional fields */}
          {structure_analysis.optional_fields_used.length > 0 && (
            <div className="space-y-1">
              <p className="text-xs font-medium text-muted-foreground">可选字段（已使用）</p>
              <div className="flex flex-wrap gap-2">
                {structure_analysis.optional_fields_used.map((f) => (
                  <span
                    key={f}
                    className="inline-flex items-center gap-1 rounded-md bg-indigo-50 px-2 py-0.5 text-xs font-medium text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400"
                  >
                    {f}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Quality Scores — Radar + Bars */}
      <div className="grid gap-4 lg:grid-cols-2">
        {/* Radar chart */}
        <div className="rounded-xl border border-border bg-card p-4">
          <h3 className="mb-2 text-sm font-semibold text-foreground">五维评分</h3>
          <ReactECharts option={radarOption} style={{ height: 280 }} opts={{ renderer: 'svg' }} />
        </div>

        {/* Bar list with comments */}
        <div className="rounded-xl border border-border bg-card p-4">
          <h3 className="mb-3 text-sm font-semibold text-foreground">评分详情</h3>
          <div className="space-y-4">
            {(
              [
                { key: 'clarity', label: '清晰度' },
                { key: 'completeness', label: '完整性' },
                { key: 'practicality', label: '实用性' },
                { key: 'robustness', label: '鲁棒性' },
                { key: 'innovation', label: '创新性' },
              ] as const
            ).map((d) => {
              const qs = quality_scores[d.key];
              if (!qs) return null;
              return (
                <div key={d.key}>
                  <div className="mb-1 flex items-center justify-between">
                    <span className="text-sm font-medium text-foreground">{d.label}</span>
                    <span className={cn('text-sm font-semibold', getScoreColor(qs.score))}>
                      {qs.score}
                    </span>
                  </div>
                  <div className="mb-1 h-2 w-full overflow-hidden rounded-full bg-muted">
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{
                        width: `${qs.score}%`,
                        backgroundColor: getScoreStroke(qs.score),
                      }}
                    />
                  </div>
                  <p className="text-xs text-muted-foreground">{qs.comment}</p>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Use Cases */}
      {use_cases?.length > 0 && (
        <div className="rounded-xl border border-border bg-card p-5">
          <h3 className="mb-3 text-sm font-semibold text-foreground">适用场景</h3>
          <div className="grid gap-3 sm:grid-cols-2">
            {use_cases.map((uc, i) => (
              <div key={i} className="rounded-lg border border-border bg-muted/30 p-3">
                <p className="text-sm font-medium text-foreground">{uc.scenario}</p>
                <p className="mt-1 text-xs text-muted-foreground">{uc.example}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Improvements */}
      {improvements?.length > 0 && (
        <div className="rounded-xl border border-border bg-card p-5">
          <h3 className="mb-3 text-sm font-semibold text-foreground">改进建议</h3>
          <div className="space-y-3">
            {improvements.map((imp, i) => (
              <div key={i} className="rounded-lg border border-border bg-muted/30 p-3">
                <div className="mb-1 flex items-center gap-2">
                  <span className="text-xs font-semibold uppercase tracking-wide text-indigo-500">
                    {imp.aspect}
                  </span>
                </div>
                <div className="space-y-1 text-sm">
                  <p className="text-muted-foreground">
                    <span className="font-medium text-red-500 dark:text-red-400">当前：</span>
                    {imp.current}
                  </p>
                  <p className="text-muted-foreground">
                    <span className="font-medium text-emerald-500 dark:text-emerald-400">
                      建议：
                    </span>
                    {imp.suggestion}
                  </p>
                </div>
              </div>
            ))}
          </div>

          {/* One-click improve button */}
          <div className="mt-4 flex items-center gap-3">
            {!improveResult && (
              <Button
                variant="outline"
                onClick={handleImprove}
                disabled={improving || !originalContent}
              >
                {improving ? '正在改进...' : '一键改进'}
              </Button>
            )}
            {improveError && <span className="text-sm text-red-500">{improveError}</span>}
            {!originalContent && (
              <span className="text-xs text-muted-foreground">
                （需要原始 SKILL.md 内容才能改进）
              </span>
            )}
          </div>
        </div>
      )}

      {/* Improvement result */}
      {improveResult && (
        <div className="rounded-xl border border-indigo-200 bg-indigo-50 p-5 dark:border-indigo-800 dark:bg-indigo-950/30">
          <h3 className="mb-3 text-sm font-semibold text-foreground">改进结果</h3>

          {/* Changes summary */}
          {improveResult.changes?.length > 0 && (
            <div className="mb-4 space-y-2">
              {improveResult.changes.map((change, i) => (
                <div key={i} className="rounded-lg border border-border bg-muted/30 p-3">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-semibold text-indigo-600 dark:text-indigo-400">
                      {change.field}
                    </span>
                    <span className="text-xs text-muted-foreground">{change.reason}</span>
                  </div>
                  <div className="text-xs space-y-1">
                    <p className="text-red-500 dark:text-red-400">改动前: {change.before}</p>
                    <p className="text-emerald-500 dark:text-emerald-400">改动后: {change.after}</p>
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="flex gap-3">
            <Button onClick={handleUseImproved} disabled={!onImprove}>
              使用改进版本
            </Button>
            <Button variant="outline" onClick={() => setImproveResult(null)}>
              重新改进
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
