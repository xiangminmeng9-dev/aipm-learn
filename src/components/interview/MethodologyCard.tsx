'use client';

import { Badge } from '@/components/ui/badge';

interface MethodologyCardProps {
  type: { id: string; name: string };
  framework: string;
  keySteps: string[];
  typicalCases: string[];
  sourceCount: number;
  updatedAt: string;
  isExpanded: boolean;
  onToggle: () => void;
  highFrequencyQuestions?: { id: string; text: string }[];
}

function cleanText(text: string): string {
  if (!text) return '';
  let s = text.trim();

  // Remove markdown code fences
  s = s.replace(/^```(?:json|javascript|js|markdown|md)?\s*\n?/i, '').replace(/\n?```\s*$/i, '');

  // Try JSON parse — extract readable content
  if (s.startsWith('{') || s.startsWith('[')) {
    try {
      const parsed = JSON.parse(s);
      return extractFromJson(parsed);
    } catch {
      // Broken JSON — strip structural chars
      s = s.replace(/^\{|\}$/g, '')
        .replace(/\\n/g, '\n')
        .replace(/\\"/g, '"')
        .replace(/"([^"]+)"\s*:\s*/g, '$1：')
        .replace(/[\[{]/g, '')
        .replace(/[\]}]/g, '')
        .replace(/,\s*$/gm, '');
    }
  }

  // Embedded JSON inside prose
  const jsonMatch = s.match(/\{[\s\S]*\}/);
  if (jsonMatch && jsonMatch.index != null && jsonMatch.index > 0) {
    const prose = s.slice(0, jsonMatch.index).trim();
    try {
      return prose + '\n' + extractFromJson(JSON.parse(jsonMatch[0]));
    } catch { /* keep as-is */ }
  }

  return s;
}

function extractFromJson(obj: unknown): string {
  if (typeof obj === 'string') {
    const s = obj.trim();
    if (s.startsWith('{') || s.startsWith('[')) {
      try { return extractFromJson(JSON.parse(s)); } catch { return s; }
    }
    return s;
  }
  if (typeof obj === 'number' || typeof obj === 'boolean') return String(obj);
  if (obj === null || obj === undefined) return '';
  if (Array.isArray(obj)) {
    return obj.map(item => typeof item === 'string' ? item : extractFromJson(item)).join('\n');
  }
  if (typeof obj === 'object') {
    const entries = Object.entries(obj as Record<string, unknown>);
    return entries
      .filter(([, v]) => v !== null && v !== undefined)
      .map(([key, value]) => {
        const label = key.replace(/_/g, ' ').replace(/([a-z])([A-Z])/g, '$1 $2');
        if (typeof value === 'string') return `${label}：${value}`;
        if (Array.isArray(value)) return `${label}：${value.join('、')}`;
        return `${label}：${extractFromJson(value)}`;
      })
      .join('\n');
  }
  return String(obj);
}

export default function MethodologyCard({
  type,
  framework,
  keySteps,
  typicalCases,
  sourceCount,
  updatedAt,
  isExpanded,
  onToggle,
  highFrequencyQuestions,
}: MethodologyCardProps) {
  const cleanFramework = cleanText(framework);

  return (
    <div className="rounded-2xl border border-border bg-card shadow-sm overflow-hidden">
      <div className="h-1 w-full bg-gradient-to-r from-indigo-400 to-violet-400" />
      <button
        onClick={onToggle}
        className="w-full px-5 py-4 text-left hover:bg-muted/30 transition-colors"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-lg">📘</span>
            <span className="text-lg font-semibold text-foreground">{type.name}</span>
            <Badge variant="secondary" className="bg-indigo-50 text-indigo-600 text-xs">
              {sourceCount} 次练习
            </Badge>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground">
              {new Date(updatedAt).toLocaleDateString('zh-CN')}
            </span>
            <svg
              className={`h-4 w-4 text-muted-foreground transition-transform ${isExpanded ? 'rotate-180' : ''}`}
              fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
            </svg>
          </div>
        </div>
        {!isExpanded && (
          <p className="mt-2 line-clamp-2 text-sm text-muted-foreground">
            {cleanFramework}
          </p>
        )}
      </button>

      {isExpanded && (
        <div className="px-5 pb-5 space-y-4">
          {/* 核心框架 */}
          <div className="rounded-xl bg-indigo-50/50 dark:bg-indigo-950/30 p-4">
            <div className="flex items-center gap-1.5 mb-2">
              <span className="text-xs font-semibold text-indigo-700 dark:text-indigo-300">核心框架</span>
            </div>
            <p className="text-sm leading-relaxed text-foreground whitespace-pre-wrap">
              {cleanFramework}
            </p>
          </div>

          {/* 关键步骤 */}
          {keySteps.length > 0 && (
            <div className="rounded-xl bg-amber-50/50 dark:bg-amber-950/30 p-4">
              <div className="flex items-center gap-1.5 mb-3">
                <span className="text-xs font-semibold text-amber-700 dark:text-amber-300">关键步骤</span>
              </div>
              <div className="space-y-3">
                {keySteps.map((step, i) => (
                  <div key={i} className="flex gap-3">
                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-amber-100 dark:bg-amber-900/50 text-xs font-bold text-amber-600 dark:text-amber-300">
                      {i + 1}
                    </span>
                    <p className="text-sm leading-relaxed text-foreground min-w-0">
                      {cleanText(step)}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 典型案例 */}
          {typicalCases.length > 0 && (
            <div className="rounded-xl bg-emerald-50/50 dark:bg-emerald-950/30 p-4">
              <div className="flex items-center gap-1.5 mb-3">
                <span className="text-xs font-semibold text-emerald-700 dark:text-emerald-300">典型案例</span>
              </div>
              <div className="space-y-2">
                {typicalCases.map((c, i) => (
                  <div key={i} className="rounded-lg border border-emerald-100 dark:border-emerald-900/50 bg-white/50 dark:bg-card/50 px-3 py-2">
                    <p className="text-sm leading-relaxed text-foreground">{cleanText(c)}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 高频问题 */}
          {highFrequencyQuestions && highFrequencyQuestions.length > 0 && (
            <div className="rounded-xl bg-sky-50/50 dark:bg-sky-950/30 p-4">
              <div className="flex items-center gap-1.5 mb-3">
                <span className="text-xs font-semibold text-sky-700 dark:text-sky-300">高频问题</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {highFrequencyQuestions.map((q) => (
                  <Badge key={q.id} variant="secondary" className="bg-card text-sky-600 dark:text-sky-300 border border-sky-200 dark:border-sky-800 text-xs max-w-[200px] truncate">
                    {q.text}
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}