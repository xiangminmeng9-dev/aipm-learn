'use client';

import { useState } from 'react';
import { AnimatePresence, MotionDiv } from '@/components/ui/lazy-motion';

interface ChangeItem {
  dimension?: string;
  location?: string;
  before?: string;
  after?: string;
  change?: string; // legacy field
  reason?: string;
}

// Dimension display config
const DIMENSION_CONFIG: Record<string, { label: string; color: string; icon: string }> = {
  'JD匹配': { label: 'JD匹配', color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300', icon: '📋' },
  '画像融入': { label: '画像融入', color: 'bg-violet-100 text-violet-700 dark:bg-violet-900/40 dark:text-violet-300', icon: '🎯' },
  'STAR法则': { label: 'STAR法则', color: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300', icon: '⭐' },
  'XYZ公式': { label: 'XYZ公式', color: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300', icon: '📐' },
  '量化指标': { label: '量化指标', color: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300', icon: '📊' },
  '成就导向': { label: '成就导向', color: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300', icon: '🏆' },
  '表达强化': { label: '表达强化', color: 'bg-sky-100 text-sky-700 dark:bg-sky-900/40 dark:text-sky-300', icon: '✍️' },
  '排序优化': { label: '排序优化', color: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300', icon: '↕️' },
  'Summary': { label: '定位语', color: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300', icon: '💬' },
  '格式统一': { label: '格式', color: 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400', icon: '📝' },
  '风格统一': { label: '风格', color: 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400', icon: '🎨' },
  '篇幅统一': { label: '篇幅', color: 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400', icon: '📏' },
  '去重': { label: '去重', color: 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400', icon: '🔄' },
  '红旗规避': { label: '红旗规避', color: 'bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-300', icon: '🚩' },
  '3C原则': { label: '3C原则', color: 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400', icon: '💡' },
  'ATS友好': { label: 'ATS', color: 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400', icon: '🤖' },
  '高匹配度策略': { label: '高匹配度', color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300', icon: '🎯' },
  'AI经历强化': { label: 'AI经历', color: 'bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300', icon: '🤖' },
  'AI术语嵌入': { label: 'AI术语', color: 'bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300', icon: '💡' },
};

// Map English skill IDs (from resume-skills.ts) to Chinese dimension names
const DIMENSION_ID_MAP: Record<string, string> = {
  'jd-keyword-align': 'JD匹配',
  'profile-hard-skill': '画像融入',
  'profile-soft-skill': '画像融入',
  'profile-tone-adapt': '画像融入',
  'profile-not-care': '画像融入',
  'star-method': 'STAR法则',
  'xyz-formula': 'XYZ公式',
  'quantify': '量化指标',
  'achievement-oriented': '成就导向',
  'strong-verbs': '表达强化',
  'remove-fluff': '表达强化',
  'reorder-experience': '排序优化',
  'summary-line': 'Summary',
  'format-unify': '格式统一',
  'style-unify': '风格统一',
  'length-unify': '篇幅统一',
  'dedup': '去重',
  'red-flag': '红旗规避',
  '3c-principle': '3C原则',
  'ats-friendly': 'ATS友好',
};

/** Normalize dimension field: map English IDs to Chinese names */
function normalizeDimension(dim: string): string {
  if (!dim) return '';
  // Direct match
  if (DIMENSION_CONFIG[dim]) return dim;
  // Map from English ID
  if (DIMENSION_ID_MAP[dim]) return DIMENSION_ID_MAP[dim];
  // Fuzzy match: if the dimension contains a known Chinese keyword
  for (const key of Object.keys(DIMENSION_CONFIG)) {
    if (dim.includes(key) || key.includes(dim)) return key;
  }
  return dim; // return as-is if no match
}

const DEFAULT_DIM = { label: '其他', color: 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400', icon: '📌' };

function parseChangesSummary(summary: string): ChangeItem[] {
  if (!summary) return [];
  try {
    // Try parsing as JSON array (new format from AI: {dimension, location, before, after, reason})
    const parsed = JSON.parse(summary);
    if (Array.isArray(parsed)) {
      return parsed.map((item: unknown) => {
        if (typeof item === 'object' && item !== null) {
          const obj = item as Record<string, string>;
          return {
            dimension: obj.dimension || '',
            location: obj.location || '',
            before: obj.before || '',
            after: obj.after || obj.change || obj.desc || '',
            reason: obj.reason || '',
          };
        }
        return { after: String(item) };
      });
    }
  } catch {
    // Not JSON, try other formats
  }

  // Try parsing as markdown-formatted changes summary
  const items: ChangeItem[] = [];

  if (summary.includes('**') || summary.includes('→') || summary.includes('→') || /^\s*[-*]\s/m.test(summary)) {
    const blocks = summary.split(/\n{2,}/);
    for (const block of blocks) {
      if (!block.trim()) continue;
      let dimension = '';
      let location = '';
      let before = '';
      let after = '';
      let reason = '';

      const dimMatch = block.match(/\*\*([^*]+?)[：:]\s*([^*]*?)\*\*/);
      if (dimMatch) {
        dimension = dimMatch[1].trim();
        location = dimMatch[2].trim();
      } else {
        const simpleDimMatch = block.match(/\*\*([^*]+?)\*\*/);
        if (simpleDimMatch) dimension = simpleDimMatch[1].replace(/[：:]$/, '').trim();
      }

      const lines = block.split('\n');
      for (const line of lines) {
        const trimmed = line.replace(/^\s*[-*]\s*/, '').trim();
        const beforeMatch = trimmed.match(/^(?:Before|原文|修改前)[：:]\s*(.+)/i);
        if (beforeMatch) { before = beforeMatch[1].trim(); continue; }
        const afterMatch = trimmed.match(/^(?:After|改后|修改后)[：:]\s*(.+)/i);
        if (afterMatch) { after = afterMatch[1].trim(); continue; }
        const reasonMatch = trimmed.match(/^(?:Reason|原因|理由)[：:]\s*(.+)/i);
        if (reasonMatch) { reason = reasonMatch[1].trim(); continue; }
        const locMatch = trimmed.match(/^(?:Location|位置|位置)[：:]\s*(.+)/i);
        if (locMatch) { location = locMatch[1].trim(); continue; }
        const arrowMatch = trimmed.match(/^(.+?)\s*→\s*(.+)/);
        if (arrowMatch && !before && !after) {
          before = arrowMatch[1].trim();
          after = arrowMatch[2].trim();
          continue;
        }
      }

      if (dimension || location || before || after) {
        items.push({ dimension, location, before, after, reason });
      } else if (block.trim()) {
        items.push({ after: block.trim().replace(/\*\*/g, '').replace(/^[-*]\s*/, '') });
      }
    }
    return items.length > 0 ? items : [{ after: summary.replace(/\*\*/g, '').trim() }];
  }

  // Parse 【维度】xxx format
  const lines = summary.split('\n').filter(Boolean);
  for (const line of lines) {
    const match = line.match(/^【(.+?)】(.+)/);
    if (match) {
      const rest = match[2];
      const parts = rest.split('——');
      items.push({
        dimension: match[1],
        after: parts[0]?.trim() || '',
        reason: parts[1]?.trim() || '',
      });
    } else {
      items.push({ after: line.trim() });
    }
  }
  return items;
}

function groupByDimension(items: ChangeItem[]): Record<string, ChangeItem[]> {
  const groups: Record<string, ChangeItem[]> = {};
  for (const item of items) {
    const rawDim = item.dimension || '其他';
    const dim = normalizeDimension(rawDim);
    if (!groups[dim]) groups[dim] = [];
    groups[dim].push({ ...item, dimension: dim });
  }
  return groups;
}

interface ChangesSummaryCardProps {
  summary: string;
  /** Whether the card is collapsible (default: true for inline, false for history page) */
  collapsible?: boolean;
  /** Default expanded state (default: true) */
  defaultExpanded?: boolean;
  /** Compact mode for history page (smaller padding, less spacing) */
  compact?: boolean;
}

export default function ChangesSummaryCard({
  summary,
  collapsible = true,
  defaultExpanded = true,
  compact = false,
}: ChangesSummaryCardProps) {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);
  const items = parseChangesSummary(summary);
  const groups = groupByDimension(items);
  const dimensionOrder = Object.keys(DIMENSION_CONFIG);
  const sortedDimensions = Object.keys(groups).sort((a, b) => {
    const ai = dimensionOrder.indexOf(a);
    const bi = dimensionOrder.indexOf(b);
    return (ai === -1 ? 999 : ai) - (bi === -1 ? 999 : bi);
  });

  const headerClass = compact
    ? 'flex w-full items-center justify-between px-3 py-2 text-left hover:bg-indigo-50/50 dark:hover:bg-indigo-950/50 transition-colors'
    : 'flex w-full items-center justify-between px-5 py-3.5 text-left hover:bg-indigo-50/50 dark:hover:bg-indigo-950/50 transition-colors';

  const titleClass = compact
    ? 'flex items-center gap-1.5 text-xs font-semibold text-indigo-700 dark:text-indigo-300'
    : 'flex items-center gap-2 text-sm font-semibold text-indigo-700 dark:text-indigo-300';

  const contentClass = compact
    ? 'border-t border-indigo-200 dark:border-indigo-700 px-3 py-2.5 space-y-2'
    : 'border-t border-indigo-200 dark:border-indigo-700 px-5 py-4 space-y-3';

  const itemTextClass = compact
    ? 'text-[11px] leading-relaxed'
    : 'text-xs leading-relaxed';

  const containerClass = compact
    ? 'overflow-hidden rounded-lg border border-indigo-200 bg-indigo-50/30 dark:border-indigo-700 dark:bg-indigo-950/30'
    : 'overflow-hidden rounded-xl border border-indigo-200 bg-indigo-50/30 dark:border-indigo-700 dark:bg-indigo-950/30';

  return (
    <div className={containerClass}>
      {/* Header */}
      {collapsible ? (
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className={headerClass}
        >
          <span className={titleClass}>
            <svg className={compact ? 'h-3.5 w-3.5' : 'h-4 w-4'} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" />
            </svg>
            修改摘要
            {items.length > 0 && (
              <span className={`font-normal text-indigo-500 dark:text-indigo-400 ${compact ? 'text-[10px]' : 'text-xs'}`}>
                {items.length}项改动
              </span>
            )}
          </span>
          <span className={`text-indigo-400 dark:text-indigo-400 ${compact ? 'text-[10px]' : 'text-xs'}`}>
            {isExpanded ? '收起' : '展开'}
          </span>
        </button>
      ) : (
        <div className={headerClass}>
          <span className={titleClass}>
            <svg className={compact ? 'h-3.5 w-3.5' : 'h-4 w-4'} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" />
            </svg>
            修改摘要
            {items.length > 0 && (
              <span className={`font-normal text-indigo-500 dark:text-indigo-400 ${compact ? 'text-[10px]' : 'text-xs'}`}>
                {items.length}项改动
              </span>
            )}
          </span>
        </div>
      )}

      {/* Content */}
      <AnimatePresence>
        {isExpanded && (
          <MotionDiv
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className={contentClass}>
              {sortedDimensions.map(dim => {
                const config = DIMENSION_CONFIG[dim] || DEFAULT_DIM;
                const groupItems = groups[dim];
                return (
                  <div key={dim} className={compact ? 'space-y-1' : 'space-y-1.5'}>
                    <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium ${config.color} ${compact ? '' : ''}`}>
                      <span>{config.icon}</span>
                      {config.label}
                    </span>
                    <div className={compact ? 'ml-1.5 space-y-1' : 'ml-2 space-y-2'}>
                      {groupItems.map((item, i) => (
                        <div key={i} className={itemTextClass}>
                          {item.location && (
                            <div className="text-muted-foreground mb-0.5">
                              {compact ? '📍' : '📍'} {item.location}
                            </div>
                          )}
                          {item.before && item.after ? (
                            <div className="space-y-0.5">
                              <div className="text-rose-600 dark:text-rose-400 line-through opacity-70 break-all">{item.before}</div>
                              <div className="text-emerald-700 dark:text-emerald-400 break-all">{item.after}</div>
                            </div>
                          ) : item.after ? (
                            <div className="text-foreground break-all">{item.after}</div>
                          ) : null}
                          {item.reason && (
                            <div className="text-muted-foreground mt-0.5">💡 {item.reason}</div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </MotionDiv>
        )}
      </AnimatePresence>
    </div>
  );
}
