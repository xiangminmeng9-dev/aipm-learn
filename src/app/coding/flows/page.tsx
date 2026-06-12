'use client';

import { useState, useEffect, useCallback } from 'react';
import { AnimatePresence, MotionDiv } from '@/components/ui/lazy-motion';
import dynamic from 'next/dynamic';
const Markdown = dynamic(() => import('@/components/ui/markdown'), { ssr: false });
import GradientBackground from '@/components/ui/gradient-background';
import { apiFetch } from '@/lib/api/fetch';

/* ---------------------------- Section Config ---------------------------- */

const SECTION_CONFIG = [
  { key: 'clarification', label: '澄清问题', icon: '💡', color: 'amber', accent: 'from-amber-400 to-orange-400', bg: 'bg-amber-50/50', border: 'border-amber-200/60', text: 'text-amber-700' },
  { key: 'breakdown', label: '需求拆解', icon: '🔧', color: 'sky', accent: 'from-sky-400 to-blue-400', bg: 'bg-sky-50/50', border: 'border-sky-200/60', text: 'text-sky-700' },
  { key: 'steps', label: '开发步骤', icon: '📋', color: 'indigo', accent: 'from-indigo-400 to-violet-400', bg: 'bg-indigo-50/50', border: 'border-indigo-200/60', text: 'text-indigo-700' },
  { key: 'notes', label: '重点关注', icon: '⚠️', color: 'rose', accent: 'from-rose-400 to-pink-400', bg: 'bg-rose-50/50', border: 'border-rose-200/60', text: 'text-rose-700' },
] as const;

const MODE_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  '前端开发': { bg: 'bg-sky-50', text: 'text-sky-600', border: 'border-sky-200' },
  '后端开发': { bg: 'bg-emerald-50', text: 'text-emerald-600', border: 'border-emerald-200' },
  '全栈开发': { bg: 'bg-violet-50', text: 'text-violet-600', border: 'border-violet-200' },
  '系统设计': { bg: 'bg-amber-50', text: 'text-amber-600', border: 'border-amber-200' },
  '算法': { bg: 'bg-rose-50', text: 'text-rose-600', border: 'border-rose-200' },
};

/* ---------------------------- Flow Section Block ---------------------------- */

function FlowSection({ label, icon, accent, bg, border, content }: {
  label: string;
  icon: string;
  accent: string;
  bg: string;
  border: string;
  content: string;
}) {
  return (
    <div className={`rounded-xl border ${border} ${bg} overflow-hidden`}>
      <div className="flex items-center gap-2 px-4 py-2.5">
        <div className={`flex h-6 w-6 items-center justify-center rounded-lg bg-gradient-to-br ${accent} text-white text-xs shadow-sm`}>
          {icon}
        </div>
        <h4 className="text-sm font-semibold text-foreground">{label}</h4>
      </div>
      <div className="border-t border-white/60 px-4 py-3">
        <Markdown content={content} className="text-sm" />
      </div>
    </div>
  );
}

/* ---------------------------- Flow Card ---------------------------- */

function FlowCard({ flow, isExpanded, onToggle }: {
  flow: Record<string, unknown>;
  isExpanded: boolean;
  onToggle: () => void;
}) {
  const modeName = (flow.dev_modes as { name: string })?.name ?? '未知';
  const modeStyle = MODE_COLORS[modeName] ?? { bg: 'bg-muted', text: 'text-muted-foreground', border: 'border-border' };
  const date = new Date(flow.created_at as string);
  const dateStr = date.toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' });
  const timeStr = date.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' });

  const sectionCount = SECTION_CONFIG.filter(({ key }) => flow[key]).length;

  return (
    <div className="group">
      <div className={`rounded-xl border bg-card transition-all duration-200 ${isExpanded ? 'border-indigo-200 shadow-md shadow-indigo-100/50' : 'border-border shadow-sm hover:shadow-md hover:border-border'}`}>
        <button
          onClick={onToggle}
          className="flex w-full items-start gap-3 p-4 text-left"
        >
          <div className={`mt-1 flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg ${modeStyle.bg} ${modeStyle.border} border`}>
            <span className={`text-sm font-bold ${modeStyle.text}`}>
              {modeName.charAt(0)}
            </span>
          </div>

          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-foreground leading-relaxed line-clamp-2">
              {flow.question_text as string}
            </p>
            <div className="mt-1.5 flex items-center gap-2">
              <span className={`inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium ${modeStyle.bg} ${modeStyle.text} ${modeStyle.border} border`}>
                {modeName}
              </span>
              <span className="text-xs text-muted-foreground">{dateStr} {timeStr}</span>
              {sectionCount > 0 && (
                <span className="text-xs text-muted-foreground">· {sectionCount} 个要点</span>
              )}
            </div>
          </div>

          <div className={`mt-1 flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-md transition-colors ${isExpanded ? 'bg-indigo-50 text-indigo-500' : 'text-muted-foreground group-hover:bg-secondary group-hover:text-muted-foreground'}`}>
            <svg className={`h-3.5 w-3.5 transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
            </svg>
          </div>
        </button>

        <AnimatePresence>
          {isExpanded && (
            <MotionDiv
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2, ease: 'easeInOut' }}
              className="overflow-hidden"
            >
              <div className="border-t border-border px-4 pb-4 pt-3">
                <div className="space-y-3">
                  {SECTION_CONFIG.map(({ key, label, icon, accent, bg, border }) => {
                    const content = flow[key] as string;
                    if (!content) return null;
                    return (
                      <FlowSection
                        key={key}
                        label={label}
                        icon={icon}
                        accent={accent}
                        bg={bg}
                        border={border}
                        content={content}
                      />
                    );
                  })}
                </div>
              </div>
            </MotionDiv>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

/* ---------------------------- Page ---------------------------- */

export default function CodingFlowsPage() {
  const [flows, setFlows] = useState<Record<string, unknown>[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fetchFlows = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const r = await apiFetch('/api/coding/flows');
      if (r.ok) {
        const data = await r.json();
        setFlows(data.flows ?? []);
      } else {
        setError('加载开发流程失败');
      }
    } catch {
      setError('加载开发流程失败');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => { fetchFlows(); }, [fetchFlows]);

  return (
    <div className="flex h-full flex-col bg-background">
      <GradientBackground />
      {isLoading ? (
        <div className="relative z-10 flex flex-1 items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-indigo-500 border-t-transparent" />
        </div>
      ) : error ? (
        <div className="relative z-10 flex flex-1 items-center justify-center">
          <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-800 dark:bg-red-900/30 dark:text-red-300">
            <p>{error}</p>
            <button onClick={fetchFlows} className="mt-1 text-xs font-medium text-red-600 hover:text-red-800 dark:text-red-400">重试</button>
          </div>
        </div>
      ) : flows.length === 0 ? (
        <div className="relative z-10 flex flex-1 items-center justify-center">
          <div className="rounded-xl border border-dashed border-border bg-card px-12 py-16 text-center">
            <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-secondary">
              <svg className="h-6 w-6 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 18 7.125v-1.5a1.125 1.125 0 0 0-1.125-1.125M3.75 14.25h16.5M3.75 9.75h16.5M3.75 5.25h16.5" />
              </svg>
            </div>
            <p className="text-sm font-medium text-muted-foreground">还没有开发流程记录</p>
            <p className="mt-1 text-xs text-muted-foreground">去练习页面生成你的第一个开发流程</p>
          </div>
        </div>
      ) : (
        <div className="relative z-10 flex-1 overflow-y-auto p-6">
          <div className="space-y-3">
            {flows.map((flow) => {
              const id = flow.id as string;
              return (
                <FlowCard
                  key={id}
                  flow={flow}
                  isExpanded={expandedId === id}
                  onToggle={() => setExpandedId(expandedId === id ? null : id)}
                />
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
