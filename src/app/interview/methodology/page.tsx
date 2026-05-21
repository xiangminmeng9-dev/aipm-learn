'use client';

import { useState, useEffect } from 'react';
import MethodologyCard from '@/components/interview/MethodologyCard';
import GradientBackground from '@/components/ui/gradient-background';

interface Methodology {
  id: string;
  type: { id: string; name: string };
  framework: string;
  key_steps: string[];
  typical_cases: string[];
  source_count: number;
  updated_at: string;
}

interface MethodologyDetail extends Methodology {
  high_frequency_questions: { id: string; text: string }[];
}

interface CompetitiveMethodology {
  id: string;
  framework: string;
  key_steps: string[];
  typical_cases: string[];
  common_pitfalls: string[];
  scoring_insights: string[];
  source_count: number;
  updated_at: string;
}

function cleanText(text: string): string {
  if (!text) return '';
  let s = text.trim();
  s = s.replace(/^```(?:json|javascript|js|markdown|md)?\s*\n?/i, '').replace(/\n?```\s*$/i, '');
  if (s.startsWith('{') || s.startsWith('[')) {
    try {
      const parsed = JSON.parse(s);
      return extractFromJson(parsed);
    } catch {
      s = s.replace(/^\{|\}$/g, '')
        .replace(/\\n/g, '\n')
        .replace(/\\"/g, '"')
        .replace(/"([^"]+)"\s*:\s*/g, '$1：')
        .replace(/[\[{]/g, '')
        .replace(/[\]}]/g, '')
        .replace(/,\s*$/gm, '');
    }
  }
  const jsonMatch = s.match(/\{[\s\S]*\}/);
  if (jsonMatch && jsonMatch.index != null && jsonMatch.index > 0) {
    const prose = s.slice(0, jsonMatch.index).trim();
    try { return prose + '\n' + extractFromJson(JSON.parse(jsonMatch[0])); } catch { /* keep */ }
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

export default function MethodologyPage() {
  const [methodologies, setMethodologies] = useState<Methodology[]>([]);
  const [competitiveMethodology, setCompetitiveMethodology] = useState<CompetitiveMethodology | null>(null);
  const [details, setDetails] = useState<Record<string, MethodologyDetail>>({});
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [compExpanded, setCompExpanded] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [message, setMessage] = useState('');

  useEffect(() => {
    fetchMethodologies();
  }, []);

  const fetchMethodologies = async () => {
    try {
      const [methodRes, compRes] = await Promise.all([
        fetch('/api/interview/methodology'),
        fetch('/api/interview/competitive/methodology'),
      ]);
      if (methodRes.ok) {
        const data = await methodRes.json();
        setMethodologies(data.methodologies ?? []);
        setMessage(data.message ?? '');
      }
      if (compRes.ok) {
        const data = await compRes.json();
        if (data.methodology) setCompetitiveMethodology(data.methodology);
      }
    } catch {
      // 静默失败
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggle = async (methodology: Methodology) => {
    if (expandedId === methodology.id) {
      setExpandedId(null);
      return;
    }

    setExpandedId(methodology.id);

    if (!details[methodology.id]) {
      try {
        const res = await fetch(`/api/interview/methodology/${methodology.type.id}`);
        if (res.ok) {
          const data = await res.json();
          setDetails((prev) => ({
            ...prev,
            [methodology.id]: { ...methodology, ...data },
          }));
        }
      } catch {
        // 静默失败
      }
    }
  };

  const comp = competitiveMethodology;

  return (
    <>
      <GradientBackground />
      <div className="relative z-10 p-8">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-foreground">方法论提炼</h1>
          <p className="mt-1 text-base text-muted-foreground">基于练习历史动态生成的方法论，类型不封顶</p>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-12">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-indigo-500 border-t-transparent" />
          </div>
        ) : methodologies.length === 0 && !comp ? (
          <div className="py-16 text-center">
            <p className="text-muted-foreground">{message || '还没有方法论'}</p>
            <p className="mt-1 text-base text-muted-foreground">多进行面试问答练习和竞品分析，系统会自动提炼方法论</p>
          </div>
        ) : (
          <div className="space-y-4">
            {/* 竞品分析方法论 */}
            {comp && (
              <div className="rounded-2xl border border-border bg-card shadow-sm overflow-hidden">
                <div className="h-1 w-full bg-gradient-to-r from-amber-400 to-orange-400" />
                <button
                  onClick={() => setCompExpanded(!compExpanded)}
                  className="w-full px-5 py-4 text-left hover:bg-muted/30 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-lg">🏆</span>
                      <span className="text-lg font-semibold text-foreground">竞品分析方法论</span>
                      <span className="rounded-lg bg-amber-100 dark:bg-amber-900/40 px-2 py-0.5 text-xs font-semibold text-amber-700 dark:text-amber-300">
                        {comp.source_count} 次分析
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-muted-foreground">
                        {new Date(comp.updated_at).toLocaleDateString('zh-CN')}
                      </span>
                      <svg className={`h-4 w-4 text-muted-foreground transition-transform ${compExpanded ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                      </svg>
                    </div>
                  </div>
                  {!compExpanded && (
                    <p className="mt-2 line-clamp-2 text-sm text-muted-foreground">
                      {cleanText(comp.framework)}
                    </p>
                  )}
                </button>

                {compExpanded && (
                  <div className="px-5 pb-5 space-y-4">
                    {/* 核心框架 */}
                    <div className="rounded-xl bg-amber-50/50 dark:bg-amber-950/30 p-4">
                      <div className="flex items-center gap-1.5 mb-2">
                        <span className="text-xs font-semibold text-amber-700 dark:text-amber-300">核心框架</span>
                      </div>
                      <p className="text-sm leading-relaxed text-foreground whitespace-pre-wrap">
                        {cleanText(comp.framework)}
                      </p>
                    </div>

                    {/* 关键步骤 */}
                    {comp.key_steps?.length > 0 && (
                      <div className="rounded-xl bg-indigo-50/50 dark:bg-indigo-950/30 p-4">
                        <div className="flex items-center gap-1.5 mb-3">
                          <span className="text-xs font-semibold text-indigo-700 dark:text-indigo-300">关键步骤</span>
                        </div>
                        <div className="space-y-3">
                          {comp.key_steps.map((step, i) => (
                            <div key={i} className="flex gap-3">
                              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-indigo-100 dark:bg-indigo-900/50 text-xs font-bold text-indigo-600 dark:text-indigo-300">
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
                    {comp.typical_cases?.length > 0 && (
                      <div className="rounded-xl bg-emerald-50/50 dark:bg-emerald-950/30 p-4">
                        <div className="flex items-center gap-1.5 mb-3">
                          <span className="text-xs font-semibold text-emerald-700 dark:text-emerald-300">典型案例</span>
                        </div>
                        <div className="space-y-2">
                          {comp.typical_cases.map((c, i) => (
                            <div key={i} className="rounded-lg border border-emerald-100 dark:border-emerald-900/50 bg-white/50 dark:bg-card/50 px-3 py-2">
                              <p className="text-sm leading-relaxed text-foreground">{cleanText(c)}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* 常见踩坑 */}
                    {comp.common_pitfalls?.length > 0 && (
                      <div className="rounded-xl bg-rose-50/50 dark:bg-rose-950/30 p-4">
                        <div className="flex items-center gap-1.5 mb-3">
                          <span className="text-xs font-semibold text-rose-700 dark:text-rose-300">常见踩坑</span>
                        </div>
                        <div className="space-y-2">
                          {comp.common_pitfalls.map((p, i) => (
                            <div key={i} className="flex gap-2">
                              <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-rose-100 dark:bg-rose-900/50 text-xs font-bold text-rose-600 dark:text-rose-300">!</span>
                              <p className="text-sm leading-relaxed text-foreground min-w-0">{cleanText(p)}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* 评分洞察 */}
                    {comp.scoring_insights?.length > 0 && (
                      <div className="rounded-xl bg-sky-50/50 dark:bg-sky-950/30 p-4">
                        <div className="flex items-center gap-1.5 mb-3">
                          <span className="text-xs font-semibold text-sky-700 dark:text-sky-300">评分洞察</span>
                        </div>
                        <div className="space-y-2">
                          {comp.scoring_insights.map((s, i) => (
                            <div key={i} className="flex gap-2">
                              <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-sky-100 dark:bg-sky-900/50 text-xs font-bold text-sky-600 dark:text-sky-300">*</span>
                              <p className="text-sm leading-relaxed text-foreground min-w-0">{cleanText(s)}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* 面试类型方法论 */}
            {methodologies.map((m) => (
              <MethodologyCard
                key={m.id}
                type={m.type}
                framework={m.framework}
                keySteps={details[m.id]?.key_steps ?? m.key_steps}
                typicalCases={details[m.id]?.typical_cases ?? m.typical_cases}
                sourceCount={m.source_count}
                updatedAt={m.updated_at}
                isExpanded={expandedId === m.id}
                onToggle={() => handleToggle(m)}
                highFrequencyQuestions={details[m.id]?.high_frequency_questions}
              />
            ))}
          </div>
        )}
      </div>
    </>
  );
}