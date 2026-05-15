'use client';

import { useState, useEffect, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import GradientBackground from '@/components/ui/gradient-background';

interface ExtractedSkill {
  skill_name: string;
  category: string;
  importance: string;
}

interface SkillMatch {
  skill_name: string;
  module_id: string | null;
  module_name: string;
  match_score: number;
}

interface Gap {
  skill_name: string;
  category: string;
  suggestion: string;
  related_module_id: string | null;
  related_module_name: string | null;
}

interface JdAnalysis {
  id: string;
  jd_text: string;
  company_name: string | null;
  position_name: string;
  extracted_skills: ExtractedSkill[];
  skill_module_matches?: SkillMatch[];
  gaps?: Gap[];
  created_at: string;
}

const importanceColors: Record<string, string> = {
  high: 'bg-red-100 text-red-700',
  medium: 'bg-amber-100 text-amber-700',
  low: 'bg-green-100 text-green-700',
};

const importanceLabels: Record<string, string> = {
  high: '高',
  medium: '中',
  low: '低',
};

export default function JdAnalysisPage() {
  const [jdText, setJdText] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<JdAnalysis | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [history, setHistory] = useState<JdAnalysis[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  const [addingSkill, setAddingSkill] = useState<string | null>(null);
  const [addedSkills, setAddedSkills] = useState<Set<string>>(new Set());

  const supabase = createClient();

  const fetchHistory = useCallback(async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;
      const res = await fetch('/api/jd/analyze');
      if (res.ok) {
        const data = await res.json();
        setHistory(data.analyses || []);
      }
    } catch {
      // ignore
    }
  }, [supabase]);

  const handleDelete = useCallback(async (id: string) => {
    if (!confirm('确定删除这条记录吗？')) return;
    try {
      const res = await fetch('/api/jd/analyze', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      });
      if (res.ok) {
        setHistory(prev => prev.filter(h => h.id !== id));
        if (result?.id === id) setResult(null);
      }
    } catch { /* ignore */ }
  }, [result]);

  useEffect(() => { fetchHistory(); }, [fetchHistory]);

  const handleAnalyze = async () => {
    if (!jdText.trim()) return;
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const res = await fetch('/api/jd/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ jdText: jdText.trim(), companyName: companyName.trim() || undefined }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || '分析失败');
      } else {
        setResult(data);
        fetchHistory();
      }
    } catch {
      setError('网络错误，请重试');
    } finally {
      setLoading(false);
    }
  };

  const handleAddToSkillTree = async (skill: Gap) => {
    setAddingSkill(skill.skill_name);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      // 使用 user_custom_tasks 表添加任务
      const { error } = await supabase.from('user_custom_tasks').insert({
        user_id: session.user.id,
        module_id: skill.related_module_id || null,
        title: skill.skill_name,
        objective: skill.suggestion || `针对岗位要求，深入学习 ${skill.skill_name}`,
        status: 'not_started',
        source_jd_id: result?.id || null,
      });

      if (error) {
        console.error('Add to skill tree failed:', error);
        return;
      }

      setAddedSkills(prev => new Set(prev).add(skill.skill_name));
    } catch (err) {
      console.error('Add to skill tree failed:', err);
    } finally {
      setAddingSkill(null);
    }
  };

  const displayResult = result || (showHistory && history.length > 0 ? history[0] : null);

  return (
    <div className="flex h-full flex-col bg-background">
      <GradientBackground />
      {/* Header */}
      <div className="relative z-10 shrink-0 border-b border-border bg-card px-6 py-4">
        <h1 className="text-lg font-semibold text-foreground">岗位分析</h1>
        <p className="text-xs text-muted-foreground">粘贴 JD 内容，AI 自动提取技能要求并匹配技能树</p>
      </div>

      {/* Content */}
      <div className="relative z-10 flex-1 overflow-y-auto p-6 space-y-5">
        {/* JD Input */}
        <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
          {/* 公司名称输入 */}
          <div className="mb-4">
            <label className="mb-2 block text-sm font-medium text-foreground">公司名称（选填）</label>
            <input
              type="text"
              value={companyName}
              onChange={(e) => setCompanyName(e.target.value)}
              placeholder="输入公司名称，用于数据看板按公司统计"
              className="w-full rounded-xl border-2 border-border bg-muted px-4 py-2.5 text-sm text-foreground placeholder-muted-foreground transition-colors focus:border-indigo-500 focus:bg-card focus:outline-none focus:ring-2 focus:ring-[#4F46E5]/20"
            />
          </div>
          <label className="mb-2 block text-sm font-medium text-foreground">粘贴岗位描述（JD）</label>
          <textarea
            value={jdText}
            onChange={(e) => setJdText(e.target.value)}
            placeholder="请粘贴完整的岗位描述内容，包括职位要求、技能要求、工作职责等..."
            className="w-full rounded-xl border-2 border-border bg-muted px-4 py-3 text-sm text-foreground placeholder-muted-foreground transition-colors focus:border-indigo-500 focus:bg-card focus:outline-none focus:ring-2 focus:ring-[#4F46E5]/20"
            rows={8}
          />
          <div className="mt-4 flex items-center justify-between">
            <span className="text-xs text-muted-foreground">{jdText.length} 字</span>
            <button
              onClick={handleAnalyze}
              disabled={loading || !jdText.trim()}
              className="rounded-xl bg-[#4F46E5] px-6 py-2.5 text-sm font-medium text-white transition-all hover:bg-[#4338CA] disabled:cursor-not-allowed disabled:opacity-50"
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>
                  分析中...
                </span>
              ) : '开始分析'}
            </button>
          </div>
        </div>

        {error && (
          <div className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
        )}

        {/* History Toggle */}
        {history.length > 0 && (
          <div className="mt-6">
            <button
              onClick={() => setShowHistory(!showHistory)}
              className="flex items-center gap-2 text-sm font-medium text-primary hover:text-[#4338CA]"
            >
              <svg className={`h-4 w-4 transition-transform ${showHistory ? 'rotate-90' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
              </svg>
              历史分析记录（{history.length}）
            </button>
            {showHistory && (
              <div className="mt-3 space-y-2">
                {history.map((h) => (
                  <div
                    key={h.id}
                    className={`rounded-xl border px-4 py-3 text-sm transition-colors ${
                      result?.id === h.id ? 'border-[#4F46E5] bg-indigo-50' : 'border-border bg-card hover:bg-muted'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <button
                        onClick={() => { setResult(h); setJdText(h.jd_text || ''); }}
                        className="flex-1 text-left"
                      >
                        <span className="font-medium text-foreground">{h.position_name}</span>
                        <span className="ml-2 text-xs text-muted-foreground">{new Date(h.created_at).toLocaleDateString()}</span>
                      </button>
                      <button
                        onClick={() => handleDelete(h.id)}
                        className="ml-2 rounded-lg p-1.5 text-muted-foreground hover:bg-rose-100 hover:text-rose-600 transition-colors"
                        title="删除"
                      >
                        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                        </svg>
                      </button>
                    </div>
                    {h.company_name && <span className="text-xs text-muted-foreground">{h.company_name}</span>}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Analysis Result */}
        {displayResult && (
          <div className="mt-8 space-y-6">
            {/* Header Card */}
            <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#4F46E5]/10 text-lg">📋</div>
                <div>
                  <h2 className="text-lg font-semibold text-foreground">{displayResult.position_name}</h2>
                  {displayResult.company_name && <p className="text-sm text-muted-foreground">{displayResult.company_name}</p>}
                </div>
              </div>
              {/* Show JD text if available */}
              {displayResult.jd_text && (
                <div className="mt-4 rounded-xl border border-border bg-muted p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-medium text-muted-foreground">岗位描述</span>
                    <button
                      onClick={() => setJdText(displayResult.jd_text || '')}
                      className="text-xs text-primary hover:text-[#4338CA]"
                    >
                      加载到输入框
                    </button>
                  </div>
                  <p className="text-xs text-muted-foreground line-clamp-4 whitespace-pre-wrap">{displayResult.jd_text}</p>
                </div>
              )}
            </div>

            {/* Extracted Skills */}
            <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
              <h3 className="mb-4 text-base font-semibold text-foreground">提取的技能要求</h3>
              <div className="flex flex-wrap gap-2">
                {displayResult.extracted_skills?.map((skill, i) => (
                  <div key={i} className="flex items-center gap-1.5 rounded-lg border border-border bg-muted px-3 py-1.5">
                    <span className="text-sm text-foreground">{skill.skill_name}</span>
                    <span className={`rounded px-1.5 py-0.5 text-[10px] font-medium ${importanceColors[skill.importance] || importanceColors.medium}`}>
                      {importanceLabels[skill.importance] || '中'}
                    </span>
                    <span className="text-[10px] text-muted-foreground">{skill.category}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Skill Module Matches */}
            {displayResult.skill_module_matches && displayResult.skill_module_matches.length > 0 && (
              <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
                <h3 className="mb-4 text-base font-semibold text-foreground">技能模块匹配</h3>
                <div className="space-y-3">
                  {displayResult.skill_module_matches.map((match, i) => (
                    <div key={i} className="flex items-center justify-between rounded-xl border border-border px-4 py-3">
                      <div className="flex items-center gap-3">
                        <span className="text-sm font-medium text-foreground">{match.skill_name || match.module_name}</span>
                        {match.skill_name && match.module_name && match.skill_name !== match.module_name && (
                          <>
                            <span className="text-xs text-muted-foreground">→</span>
                            <span className="text-sm text-primary">{match.module_name}</span>
                          </>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="h-2 w-20 overflow-hidden rounded-full bg-[#E5E7EB]">
                          <div
                            className={`h-full rounded-full ${match.match_score >= 70 ? 'bg-emerald-500' : match.match_score >= 40 ? 'bg-amber-500' : 'bg-red-500'}`}
                            style={{ width: `${Math.min(100, Math.max(0, match.match_score))}%` }}
                          />
                        </div>
                        <span className="text-xs font-medium text-muted-foreground">{match.match_score}%</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Skill Gaps */}
            {displayResult.gaps && displayResult.gaps.length > 0 && (
              <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
                <h3 className="mb-4 text-base font-semibold text-foreground">技能差距</h3>
                <div className="space-y-3">
                  {displayResult.gaps.map((gap, i) => (
                    <div key={i} className="rounded-xl border border-amber-200 bg-amber-50/50 px-4 py-3">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium text-foreground">{gap.skill_name}</span>
                            <span className="rounded bg-amber-100 px-1.5 py-0.5 text-[10px] text-amber-700">{gap.category}</span>
                          </div>
                          {gap.suggestion && <p className="mt-1 text-xs text-muted-foreground">{gap.suggestion}</p>}
                          {gap.related_module_name && (
                            <p className="mt-1 text-xs text-primary">相关模块：{gap.related_module_name}</p>
                          )}
                        </div>
                        <button
                          onClick={() => handleAddToSkillTree(gap)}
                          disabled={addingSkill === gap.skill_name || addedSkills.has(gap.skill_name)}
                          className={`ml-3 shrink-0 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
                            addedSkills.has(gap.skill_name)
                              ? 'bg-emerald-100 text-emerald-700'
                              : 'bg-[#4F46E5] text-white hover:bg-[#4338CA] disabled:opacity-50'
                          }`}
                        >
                          {addedSkills.has(gap.skill_name) ? '已添加' : addingSkill === gap.skill_name ? '添加中...' : '添加到技能树'}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
