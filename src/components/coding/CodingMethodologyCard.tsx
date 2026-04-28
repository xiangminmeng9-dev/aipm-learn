'use client';

import Markdown from '@/components/ui/markdown';
import type { CodingMethodology } from '@/types';

interface CodingMethodologyCardProps {
  methodology: CodingMethodology;
}

export default function CodingMethodologyCard({ methodology }: CodingMethodologyCardProps) {
  return (
    <div className="space-y-4">
      {/* Source count badge */}
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <span className="text-lg">🧠</span>
        <span>基于 <strong className="text-indigo-600">{methodology.source_count}</strong> 次开发流程练习提炼</span>
        <span className="text-muted-foreground">·</span>
        <span>{new Date(methodology.updated_at).toLocaleDateString('zh-CN')}</span>
      </div>

      {/* 高频澄清问题 */}
      <div className="overflow-hidden rounded-xl border border-rose-100 bg-card">
        <div className="h-1 w-full bg-gradient-to-r from-rose-400 to-pink-400" />
        <div className="p-4">
          <h3 className="mb-3 flex items-center gap-1.5 text-sm font-semibold text-rose-700">
            <span>🔥</span>高频澄清问题
          </h3>
          <div className="flex flex-wrap gap-2">
            {methodology.high_freq_questions.map((q, i) => (
              <span key={i} className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-1.5 text-xs font-medium text-rose-600">
                {q}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* 通用拆解策略 */}
      <div className="overflow-hidden rounded-xl border border-amber-100 bg-card">
        <div className="h-1 w-full bg-gradient-to-r from-amber-400 to-yellow-400" />
        <div className="p-4">
          <h3 className="mb-3 flex items-center gap-1.5 text-sm font-semibold text-amber-700">
            <span>📋</span>通用拆解策略
          </h3>
          <ul className="space-y-2">
            {methodology.common_breakdowns.map((b, i) => (
              <li key={i} className="flex gap-2 text-sm text-muted-foreground">
                <span className="mt-0.5 flex-shrink-0 text-amber-500">▸</span>
                <Markdown content={b} className="[&_p]:inline" />
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* 跨模式共通步骤 */}
      <div className="overflow-hidden rounded-xl border border-indigo-100 bg-card">
        <div className="h-1 w-full bg-gradient-to-r from-indigo-400 to-violet-400" />
        <div className="p-4">
          <h3 className="mb-3 flex items-center gap-1.5 text-sm font-semibold text-indigo-700">
            <span>🔄</span>跨模式共通步骤
          </h3>
          <ol className="space-y-2">
            {methodology.cross_mode_steps.map((s, i) => (
              <li key={i} className="flex gap-2 text-sm text-muted-foreground">
                <span className="flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-indigo-100 text-xs font-bold text-indigo-600">{i + 1}</span>
                <Markdown content={s} className="[&_p]:inline" />
              </li>
            ))}
          </ol>
        </div>
      </div>

      {/* 关键注意事项 */}
      <div className="overflow-hidden rounded-xl border border-sky-100 bg-card">
        <div className="h-1 w-full bg-gradient-to-r from-sky-400 to-blue-400" />
        <div className="p-4">
          <h3 className="mb-3 flex items-center gap-1.5 text-sm font-semibold text-sky-700">
            <span>⚠️</span>关键注意事项
          </h3>
          <ul className="space-y-2">
            {methodology.key_notes.map((n, i) => (
              <li key={i} className="flex gap-2 text-sm text-muted-foreground">
                <span className="mt-0.5 flex-shrink-0 text-sky-500">•</span>
                <Markdown content={n} className="[&_p]:inline" />
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
