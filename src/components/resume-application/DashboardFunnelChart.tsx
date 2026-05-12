'use client';

import { ChevronDown } from 'lucide-react';

interface Props {
  stages: { stage: string; count: number }[];
}

export default function DashboardFunnelChart({ stages }: Props) {
  const total = stages[0]?.count || 0;

  const colors = [
    '#6366F1',
    '#0EA5E9',
    '#10B981',
    '#F59E0B',
    '#8B5CF6',
    '#EF4444',
  ];

  // 获取实际存在的流程阶段
  const stageNames = stages.map(s => s.stage);

  return (
    <div className="rounded-2xl border border-border bg-card p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-foreground">Offer 转化漏斗</h3>
        <div className="relative">
          <select className="appearance-none text-xs text-muted-foreground bg-transparent pr-4 py-1 outline-none cursor-pointer hover:text-foreground transition-colors">
            <option>全部流程</option>
            {stageNames.map((stage) => (
              <option key={stage}>{stage}</option>
            ))}
          </select>
          <ChevronDown className="absolute right-0 top-1/2 -translate-y-1/2 h-3 w-3 text-muted-foreground pointer-events-none" />
        </div>
      </div>

      <div className="flex gap-6">
        {/* 左侧：漏斗图 */}
        <div className="flex-1 flex flex-col items-center justify-center" style={{ minHeight: '220px' }}>
          <svg viewBox="0 0 300 200" className="w-full h-auto" style={{ maxHeight: '220px' }}>
            {stages.map((s, i) => {
              const widthPercent = total > 0 ? (s.count / total) * 100 : 0;
              const topWidth = 280 * (widthPercent / 100) + 20;
              const bottomWidth = i < stages.length - 1
                ? 280 * ((stages[i + 1]?.count || 0) / total) + 20
                : topWidth * 0.8;

              const y = i * 33;
              const height = 30;
              const xTop = (300 - topWidth) / 2;
              const xBottom = (300 - bottomWidth) / 2;

              return (
                <polygon
                  key={s.stage}
                  points={`
                    ${xTop},${y}
                    ${xTop + topWidth},${y}
                    ${xBottom + bottomWidth},${y + height}
                    ${xBottom},${y + height}
                  `}
                  fill={colors[i % colors.length]}
                  stroke="transparent"
                />
              );
            })}
            {/* 阶段标签 */}
            {stages.map((s, i) => {
              const y = i * 33 + 18;
              return (
                <text
                  key={`label-${s.stage}`}
                  x="150"
                  y={y}
                  textAnchor="middle"
                  fill="white"
                  fontSize="11"
                  fontWeight="500"
                >
                  {s.stage}
                </text>
              );
            })}
          </svg>
        </div>

        {/* 右侧：转化数据 */}
        <div className="w-[120px] flex flex-col justify-center space-y-3">
          {stages.map((s, i) => {
            const prevCount = i > 0 ? stages[i - 1]?.count || 1 : s.count;
            const conversionRate = i > 0 && prevCount > 0 ? Math.round((s.count / prevCount) * 100) : 100;

            return (
              <div key={s.stage} className="flex items-center justify-end gap-2">
                <span className="text-sm font-medium text-foreground">{s.count}</span>
                {i > 0 && (
                  <span className="text-sm text-muted-foreground">({conversionRate}%)</span>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}