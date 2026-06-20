'use client';

import type { MarketAnalysisReport } from '@/lib/market-insight/types';

interface InsightReportProps {
  report: MarketAnalysisReport;
}

function TrendIcon({ trend }: { trend: 'rising' | 'stable' | 'declining' }) {
  switch (trend) {
    case 'rising':
      return <span className="font-bold text-emerald-600 dark:text-emerald-400">&uarr;</span>;
    case 'stable':
      return <span className="font-bold text-muted-foreground">&rarr;</span>;
    case 'declining':
      return <span className="font-bold text-red-600 dark:text-red-400">&darr;</span>;
  }
}

function CardShell({ icon, title, children }: {
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

export default function InsightReport({ report }: InsightReportProps) {
  return (
    <div className="space-y-4">
      {/* Summary */}
      <CardShell icon="📊" title="市场概况">
        <p className="text-sm leading-relaxed text-foreground/90">
          {report.summary}
        </p>
      </CardShell>

      {/* Core skills */}
      <CardShell icon="🎯" title="核心技能分析">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-left text-xs text-muted-foreground">
                <th className="pb-2 pr-4 font-medium">技能</th>
                <th className="pb-2 pr-4 font-medium">出现次数</th>
                <th className="pb-2 pr-4 font-medium">占比</th>
                <th className="pb-2 pr-4 font-medium">趋势</th>
                <th className="pb-2 font-medium">解读</th>
              </tr>
            </thead>
            <tbody>
              {report.coreSkills.map((s) => (
                <tr key={s.skill} className="border-b border-border/50 last:border-0">
                  <td className="py-2.5 pr-4 font-medium text-foreground">
                    {s.skill}
                  </td>
                  <td className="py-2.5 pr-4 text-muted-foreground">
                    {s.frequency}
                  </td>
                  <td className="py-2.5 pr-4 text-muted-foreground">
                    {s.percentage.toFixed(1)}%
                  </td>
                  <td className="py-2.5 pr-4">
                    <TrendIcon trend={s.trend} />
                  </td>
                  <td className="py-2.5 text-muted-foreground">
                    {s.insight}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardShell>

      {/* Future trends */}
      <CardShell icon="📈" title="未来趋势">
        <div className="space-y-4">
          {report.futureTrends.map((t, i) => (
            <div
              key={i}
              className="rounded-xl border border-border/60 bg-muted/30 p-4"
            >
              <div className="mb-2 flex items-center gap-2">
                <span className="font-semibold text-foreground">{t.trend}</span>
                <span className="inline-flex items-center rounded-full bg-primary/10 px-2 py-0.5 text-[11px] font-medium text-primary">
                  {t.timeHorizon}
                </span>
              </div>
              <div className="space-y-1 text-sm text-muted-foreground">
                <p><span className="font-medium text-foreground/70">证据:</span> {t.evidence}</p>
                <p><span className="font-medium text-foreground/70">影响:</span> {t.impact}</p>
              </div>
            </div>
          ))}
        </div>
      </CardShell>

      {/* Salary insights */}
      <CardShell icon="💰" title="薪资洞察">
        <p className="mb-4 text-sm leading-relaxed text-foreground/90">
          {report.salaryInsights.overall}
        </p>
        {report.salaryInsights.bySkill.length > 0 && (
          <div className="space-y-2">
            {report.salaryInsights.bySkill.map((s) => (
              <div
                key={s.skill}
                className="flex items-center justify-between rounded-lg border border-border/50 px-3 py-2"
              >
                <span className="text-sm font-medium text-foreground">{s.skill}</span>
                <span className="text-sm text-muted-foreground">{s.salaryImpact}</span>
              </div>
            ))}
          </div>
        )}
      </CardShell>

      {/* Location insights */}
      <CardShell icon="📍" title="地域分布">
        <div className="mb-4 flex flex-wrap gap-2">
          {report.locationInsights.hottest.map((city) => (
            <span
              key={city}
              className="inline-flex items-center rounded-full bg-primary/10 px-3 py-1 text-sm font-medium text-primary"
            >
              {city}
            </span>
          ))}
        </div>
        <p className="text-sm leading-relaxed text-foreground/90">
          {report.locationInsights.remoteTrend}
        </p>
      </CardShell>

      {/* Company insights */}
      <CardShell icon="🏢" title="公司洞察">
        <div className="grid gap-3 sm:grid-cols-2">
          {report.companyInsights.map((c) => (
            <div
              key={c.company}
              className="rounded-xl border border-border/60 bg-muted/30 p-4"
            >
              <h4 className="mb-1 font-semibold text-foreground">{c.company}</h4>
              <p className="mb-2 text-sm text-muted-foreground">{c.hiringFocus}</p>
              <div className="flex flex-wrap gap-1">
                {c.skillEmphasis.map((skill) => (
                  <span
                    key={skill}
                    className="inline-flex items-center rounded-md bg-secondary px-1.5 py-0.5 text-[11px] font-medium text-secondary-foreground"
                  >
                    {skill}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </CardShell>

      {/* Recommendations */}
      <CardShell icon="💡" title="建议">
        {(() => {
          const grouped = new Map<string, typeof report.recommendations>();
          for (const r of report.recommendations) {
            const list = grouped.get(r.target) ?? [];
            list.push(r);
            grouped.set(r.target, list);
          }
          return Array.from(grouped.entries()).map(([target, recs]) => (
            <div key={target} className="mb-4 last:mb-0">
              <h4 className="mb-2 text-sm font-semibold text-foreground/80">
                {target}
              </h4>
              <div className="space-y-2">
                {recs.map((r, i) => (
                  <div
                    key={i}
                    className="rounded-lg border border-border/50 bg-muted/30 p-3"
                  >
                    <p className="mb-1 text-sm font-medium text-foreground">
                      {r.action}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {r.reasoning}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          ));
        })()}
      </CardShell>
    </div>
  );
}
