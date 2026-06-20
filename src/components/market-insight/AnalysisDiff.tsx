'use client';

import type { MarketAnalysisDiff, MarketAnalysisSnapshot } from '@/lib/market-insight/types';

interface AnalysisDiffProps {
  diff: MarketAnalysisDiff;
  previousSnapshot: MarketAnalysisSnapshot | null;
}

function SectionCard({ icon, title, children }: {
  icon: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
      <h3 className="mb-4 flex items-center gap-2 text-base font-semibold text-foreground">
        <span>{icon}</span>
        <span>{title}</span>
      </h3>
      {children}
    </div>
  );
}

function formatChangePercent(pct: number): string {
  const sign = pct > 0 ? '+' : '';
  return `${sign}${pct.toFixed(1)}%`;
}

export default function AnalysisDiff({ diff, previousSnapshot }: AnalysisDiffProps) {
  return (
    <div className="space-y-4">
      {/* Header with comparison context */}
      {previousSnapshot && (
        <div className="rounded-2xl border border-border bg-card p-4 shadow-sm">
          <p className="text-sm text-muted-foreground">
            对比基准：{previousSnapshot.query_keyword} · {previousSnapshot.jd_count} 条 JD · 创建于{' '}
            {new Date(previousSnapshot.created_at).toLocaleDateString('zh-CN')}
          </p>
        </div>
      )}

      {/* New skills */}
      {diff.new_skills.length > 0 && (
        <SectionCard icon="🆕" title="新出现技能">
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {diff.new_skills.map((s) => (
              <div
                key={s.skill}
                className="rounded-lg border border-emerald-200 bg-emerald-50 p-3 dark:border-emerald-800 dark:bg-emerald-950/40"
              >
                <div className="mb-1 flex items-center justify-between">
                  <span className="text-sm font-semibold text-foreground">
                    {s.skill}
                  </span>
                  <span className="inline-flex items-center rounded-md bg-emerald-100 px-1.5 py-0.5 text-[11px] font-medium text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-300">
                    {s.category}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground">
                  出现 {s.frequency} 次
                </p>
              </div>
            ))}
          </div>
        </SectionCard>
      )}

      {/* Disappeared skills */}
      {diff.disappeared_skills.length > 0 && (
        <SectionCard icon="❌" title="消失技能">
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {diff.disappeared_skills.map((s) => (
              <div
                key={s.skill}
                className="rounded-lg border border-red-200 bg-red-50 p-3 dark:border-red-800 dark:bg-red-950/40"
              >
                <div className="mb-1 flex items-center justify-between">
                  <span className="text-sm font-semibold text-foreground">
                    {s.skill}
                  </span>
                  <span className="inline-flex items-center rounded-md bg-red-100 px-1.5 py-0.5 text-[11px] font-medium text-red-700 dark:bg-red-900/50 dark:text-red-300">
                    {s.category}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground">
                  此前出现 {s.previousFrequency} 次
                </p>
              </div>
            ))}
          </div>
        </SectionCard>
      )}

      {/* Frequency changes */}
      {diff.frequency_changes.length > 0 && (
        <SectionCard icon="📊" title="频率变化">
          <div className="space-y-2">
            {[...diff.frequency_changes]
              .sort((a, b) => Math.abs(b.changePercent) - Math.abs(a.changePercent))
              .map((s) => {
                const isPositive = s.change > 0;
                return (
                  <div
                    key={s.skill}
                    className="flex items-center justify-between rounded-lg border border-border/50 px-3 py-2"
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-foreground">
                        {s.skill}
                      </span>
                      <span className="text-[11px] text-muted-foreground">
                        {s.category}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 text-sm">
                      <span className="text-muted-foreground">
                        {s.previousFrequency} &rarr; {s.currentFrequency}
                      </span>
                      <span
                        className={`font-semibold ${
                          isPositive
                            ? 'text-emerald-600 dark:text-emerald-400'
                            : 'text-red-600 dark:text-red-400'
                        }`}
                      >
                        {formatChangePercent(s.changePercent)}
                      </span>
                    </div>
                  </div>
                );
              })}
          </div>
        </SectionCard>
      )}

      {/* Category shifts */}
      {diff.category_shifts.length > 0 && (
        <SectionCard icon="📂" title="分类变化">
          <div className="space-y-2">
            {diff.category_shifts.map((c) => {
              const isPositive = c.change > 0;
              return (
                <div
                  key={c.category}
                  className="flex items-center justify-between rounded-lg border border-border/50 px-3 py-2"
                >
                  <span className="text-sm font-medium text-foreground">
                    {c.category}
                  </span>
                  <div className="flex items-center gap-3 text-sm">
                    <span className="text-muted-foreground">
                      {c.previousPercentage.toFixed(1)}% &rarr; {c.currentPercentage.toFixed(1)}%
                    </span>
                    <span
                      className={`font-semibold ${
                        isPositive
                          ? 'text-emerald-600 dark:text-emerald-400'
                          : 'text-red-600 dark:text-red-400'
                      }`}
                    >
                      {formatChangePercent(c.change)}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </SectionCard>
      )}

      {/* Narrative */}
      {diff.narrative && (
        <SectionCard icon="📝" title="变化分析">
          <p className="text-sm leading-relaxed text-foreground/90">
            {diff.narrative}
          </p>
        </SectionCard>
      )}

      {/* Recommendations */}
      {diff.recommendations && (
        <SectionCard icon="💡" title="变化建议">
          <p className="text-sm leading-relaxed text-foreground/90">
            {diff.recommendations}
          </p>
        </SectionCard>
      )}
    </div>
  );
}
