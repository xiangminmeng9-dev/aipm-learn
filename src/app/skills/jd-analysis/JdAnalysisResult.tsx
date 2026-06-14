'use client';

import { ExtractedSkill, SkillMatch, Gap, ResumeMatch, DimensionScores, JdAnalysis } from './types';

const importanceColors: Record<string, string> = {
  high: 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300',
  medium: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300',
  low: 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300',
};

const importanceLabels: Record<string, string> = {
  high: '高',
  medium: '中',
  low: '低',
};

interface JdAnalysisResultProps {
  result: JdAnalysis;
  onLoadJd: (jdText: string) => void;
  onAnalyzeWithResume?: () => void;
  onAddToSkillTree: (gap: Gap) => void;
  addingSkill: string | null;
  addedSkills: Set<string>;
  loading?: boolean;
  showResumePrompt?: boolean;
}

export default function JdAnalysisResult({
  result,
  onLoadJd,
  onAnalyzeWithResume,
  onAddToSkillTree,
  addingSkill,
  addedSkills,
  loading,
  showResumePrompt,
}: JdAnalysisResultProps) {
  return (
    <div className="space-y-5">
      {/* Header Card */}
      <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-lg">📋</div>
          <div>
            <h2 className="text-lg font-semibold text-foreground">{result.position_name}</h2>
            {result.company_name && <p className="text-sm text-muted-foreground">{result.company_name}</p>}
          </div>
        </div>
        {result.jd_text && (
          <div className="mt-4 rounded-xl border border-border bg-muted p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-medium text-muted-foreground">岗位描述</span>
              <button
                onClick={() => onLoadJd(result.jd_text || '')}
                className="text-xs text-primary hover:text-primary/80"
              >
                加载到输入框
              </button>
            </div>
            <p className="text-xs text-muted-foreground line-clamp-4 whitespace-pre-wrap">{result.jd_text}</p>
          </div>
        )}
      </div>

      {/* Resume match prompt */}
      {showResumePrompt && result.resume_match === null && onAnalyzeWithResume && (
        <div className="rounded-2xl border-2 border-amber-200 bg-amber-50/30 p-4 shadow-sm dark:border-amber-800 dark:bg-amber-950/30">
          <div className="flex items-center gap-2">
            <span className="text-sm text-amber-700 dark:text-amber-400">此分析未包含简历匹配</span>
            <button
              onClick={onAnalyzeWithResume}
              disabled={loading}
              className="ml-auto rounded-lg bg-primary px-3 py-1.5 text-xs font-medium text-white hover:bg-primary/90 disabled:opacity-50 transition-colors"
            >
              {loading ? '分析中...' : '带简历重新分析'}
            </button>
          </div>
          <p className="mt-2 text-xs text-muted-foreground">点击后将补充简历匹配度分析</p>
        </div>
      )}

      {/* Resume Match Card */}
      {result.resume_match && <ResumeMatchCard match={result.resume_match} />}

      {/* Extracted Skills — grouped by module */}
      {result.skill_module_matches && result.skill_module_matches.length > 0 ? (
        <SkillModuleGroups
          skills={result.extracted_skills || []}
          matches={result.skill_module_matches}
          gaps={result.gaps || []}
        />
      ) : (
        <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
          <h3 className="mb-4 text-base font-semibold text-foreground">提取的技能要求</h3>
          <div className="space-y-2">
            {result.extracted_skills?.map((skill, i) => (
              <div key={i} className="flex items-center gap-2 rounded-xl border border-border px-3 py-2">
                <span className="text-sm font-medium text-foreground">{skill.skill_name}</span>
                <span className={`rounded px-1.5 py-0.5 text-xs font-medium ${importanceColors[skill.importance] || importanceColors.medium}`}>
                  {importanceLabels[skill.importance] || '中'}
                </span>
                <span className="text-xs text-muted-foreground">{skill.category}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Skill Gaps */}
      <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
        <h3 className="mb-4 text-base font-semibold text-foreground">技能差距</h3>
        {result.gaps && result.gaps.length > 0 ? (
          <div className="space-y-3">
            {result.gaps.map((gap, i) => (
              <div key={i} className="rounded-xl border border-amber-200 bg-amber-50/50 px-4 py-3 dark:border-amber-800 dark:bg-amber-900/20">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-foreground">{gap.skill_name}</span>
                      <span className="rounded bg-amber-100 px-1.5 py-0.5 text-xs text-amber-700 dark:bg-amber-900/40 dark:text-amber-300">{gap.category}</span>
                    </div>
                    {gap.suggestion && <p className="mt-1 text-xs text-muted-foreground">{gap.suggestion}</p>}
                    {gap.related_module_name && (
                      <p className="mt-1 text-xs text-primary">相关模块：{gap.related_module_name}</p>
                    )}
                  </div>
                  <button
                    onClick={() => onAddToSkillTree(gap)}
                    disabled={addingSkill === gap.skill_name || addedSkills.has(gap.skill_name)}
                    className={`ml-3 shrink-0 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
                      addedSkills.has(gap.skill_name)
                        ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300'
                        : 'bg-primary text-white hover:bg-primary/90 disabled:opacity-50'
                    }`}
                  >
                    {addedSkills.has(gap.skill_name) ? '已添加' : addingSkill === gap.skill_name ? '添加中...' : '添加到技能树'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">所有提取的技能均有模块覆盖，暂无明显差距</p>
        )}
      </div>
    </div>
  );
}

/* ── Sub-components ── */

function ResumeMatchCard({ match }: { match: ResumeMatch }) {
  const dims = match.dimension_scores;
  const scoreColor = (s: number) =>
    s >= 75 ? 'text-emerald-600 dark:text-emerald-400' :
    s >= 50 ? 'text-amber-600 dark:text-amber-400' :
    'text-red-600 dark:text-red-400';
  const scoreBg = (s: number) =>
    s >= 75 ? 'bg-emerald-500' :
    s >= 50 ? 'bg-amber-500' :
    'bg-red-500';

  const DIM_CONFIG: { key: keyof DimensionScores; label: string; weight: string; icon: string }[] = [
    { key: 'core_skill_match', label: '核心技能匹配', weight: '25%', icon: '🎯' },
    { key: 'skill_coverage', label: '技能覆盖率', weight: '20%', icon: '📊' },
    { key: 'responsibility_coverage', label: '岗位职责覆盖', weight: '20%', icon: '📋' },
    { key: 'years_match', label: '年限匹配', weight: '10%', icon: '📅' },
    { key: 'soft_skill_match', label: '软技能匹配', weight: '10%', icon: '🤝' },
    { key: 'industry_match', label: '行业匹配', weight: '8%', icon: '🏭' },
    { key: 'project_depth', label: '项目深度', weight: '7%', icon: '🔬' },
  ];

  return (
    <div className="rounded-2xl border-2 border-indigo-200 bg-indigo-50/30 p-6 shadow-sm dark:border-indigo-800 dark:bg-indigo-950/30">
      <div className="flex items-center gap-3 mb-4">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-lg">🎯</div>
        <h3 className="text-base font-semibold text-foreground">简历匹配度</h3>
        <div className="ml-auto flex items-center gap-2">
          <span className="text-3xl font-bold text-primary dark:text-indigo-400">{match.match_score}</span>
          <span className="text-sm text-muted-foreground">/ 100</span>
        </div>
      </div>
      <div className="h-3 overflow-hidden rounded-full bg-muted mb-2">
        <div
          className={`h-full rounded-full transition-all ${scoreBg(match.match_score)}`}
          style={{ width: `${match.match_score}%` }}
        />
      </div>
      <p className="text-xs text-muted-foreground mb-5">
        综合评分 = 7个维度加权求和（核心技能25% + 技能覆盖20% + 岗位职责20% + 年限10% + 软技能10% + 行业8% + 项目深度7%）
      </p>

      {/* Dimension Scores */}
      {dims && (
        <div className="mb-5 rounded-xl border border-border bg-card p-4 space-y-3">
          <h4 className="text-sm font-semibold text-foreground mb-3">维度评分详情</h4>
          {DIM_CONFIG.map(({ key, label, weight, icon }) => {
            const d = dims[key];
            if (!d) return null;
            return (
              <div key={key} className="space-y-1">
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-1.5 text-sm text-foreground">
                    <span className="text-xs">{icon}</span>
                    {label}
                    <span className="rounded bg-muted px-1.5 py-0.5 text-xs text-muted-foreground">{weight}</span>
                  </span>
                  <span className={`text-sm font-bold ${scoreColor(d.score)}`}>{d.score}</span>
                </div>
                <div className="h-1.5 overflow-hidden rounded-full bg-muted">
                  <div
                    className={`h-full rounded-full transition-all ${scoreBg(d.score)}`}
                    style={{ width: `${d.score}%` }}
                  />
                </div>
                {d.detail && <p className="text-xs text-muted-foreground">{d.detail}</p>}
              </div>
            );
          })}
        </div>
      )}

      {/* Years comparison */}
      {match.required_years != null && match.candidate_years != null && (
        <div className="mb-5 rounded-xl border border-border bg-card p-4">
          <div className="flex items-center gap-4">
            <div className="text-center">
              <p className="text-xs text-muted-foreground">JD要求</p>
              <p className="text-lg font-bold text-foreground">{match.required_years}年</p>
            </div>
            <div className="text-xs text-muted-foreground">→</div>
            <div className="text-center">
              <p className="text-xs text-muted-foreground">候选人</p>
              <p className="text-lg font-bold text-foreground">{match.candidate_years}年</p>
            </div>
          </div>
        </div>
      )}

      {match.apply_recommendation && <ApplyRecommendation rec={match.apply_recommendation} />}
      {match.strengths?.length > 0 && (
        <div className="mb-4">
          <h4 className="mb-2 text-sm font-medium text-emerald-700 dark:text-emerald-400">匹配优势</h4>
          <div className="space-y-1.5">
            {match.strengths.map((s, i) => (
              <div key={i} className="flex items-center gap-2 rounded-lg bg-emerald-50 px-3 py-1.5 dark:bg-emerald-900/30">
                <svg className="h-4 w-4 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
                <span className="text-sm text-foreground">{s}</span>
              </div>
            ))}
          </div>
        </div>
      )}
      {match.resume_gaps?.length > 0 && (
        <div className="mb-4">
          <h4 className="mb-2 text-sm font-medium text-amber-700 dark:text-amber-400">简历差距</h4>
          <div className="space-y-2">
            {match.resume_gaps.map((g, i) => (
              <div key={i} className="rounded-xl border border-amber-200 bg-amber-50/50 px-4 py-3 dark:border-amber-800 dark:bg-amber-900/20">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-foreground">{g.skill_name}</span>
                </div>
                {g.detail && <p className="mt-1 text-xs text-muted-foreground">{g.detail}</p>}
                {g.suggestion && <p className="mt-1 text-xs text-primary">{g.suggestion}</p>}
              </div>
            ))}
          </div>
        </div>
      )}
      {match.improvement_suggestions?.length > 0 && (
        <div>
          <h4 className="mb-2 text-sm font-medium text-indigo-700 dark:text-indigo-400">简历提升建议</h4>
          <div className="space-y-1.5">
            {match.improvement_suggestions.map((s, i) => (
              <div key={i} className="flex items-center gap-2 rounded-lg bg-indigo-50 px-3 py-1.5 dark:bg-indigo-900/30">
                <svg className="h-4 w-4 text-indigo-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                </svg>
                <span className="text-sm text-foreground">{s}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function ApplyRecommendation({ rec }: { rec: NonNullable<ResumeMatch['apply_recommendation']> }) {
  return (
    <div className={`mb-5 rounded-xl border-2 px-4 py-3 ${
      rec.should_apply
        ? 'border-emerald-300 bg-emerald-50/60 dark:border-emerald-700 dark:bg-emerald-900/20'
        : 'border-red-300 bg-red-50/60 dark:border-red-700 dark:bg-red-900/20'
    }`}>
      <div className="flex items-center gap-2 mb-1.5">
        <span className="text-base">{rec.should_apply ? '✅' : '⛔'}</span>
        <h4 className={`text-sm font-bold ${
          rec.should_apply
            ? 'text-emerald-700 dark:text-emerald-400'
            : 'text-red-700 dark:text-red-400'
        }`}>
          {rec.should_apply ? '建议投递' : '不建议投递'}
        </h4>
        {rec.confidence && (
          <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${
            rec.confidence === 'high'
              ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300'
              : rec.confidence === 'medium'
              ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300'
              : 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400'
          }`}>
            {rec.confidence === 'high' ? '高信心' : rec.confidence === 'medium' ? '中信心' : '低信心'}
          </span>
        )}
      </div>
      <p className="text-sm text-foreground mb-2">{rec.reason || ''}</p>
      {rec.key_actions?.length > 0 && (
        <div className="space-y-1">
          {rec.key_actions.map((a, i) => (
            <div key={i} className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <span>→</span>
              <span>{a}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function SkillModuleGroups({ skills, matches, gaps }: { skills: ExtractedSkill[]; matches: SkillMatch[]; gaps: Gap[] }) {
  const moduleGroups = new Map<string, { module_name: string; skills: { skill: ExtractedSkill; match: SkillMatch; isGap: boolean }[] }>();
  const unmatchedSkills: { skill: ExtractedSkill; isGap: boolean }[] = [];

  for (const skill of skills) {
    const match = matches.find(m => m.skill_name === skill.skill_name);
    const gap = gaps.find(g => g.skill_name === skill.skill_name);
    const isGap = !!gap;
    if (match && match.module_name) {
      const key = match.module_name;
      if (!moduleGroups.has(key)) {
        moduleGroups.set(key, { module_name: match.module_name, skills: [] });
      }
      moduleGroups.get(key)!.skills.push({ skill, match, isGap });
    } else {
      unmatchedSkills.push({ skill, isGap });
    }
  }

  const sortedGroups = Array.from(moduleGroups.entries())
    .sort((a, b) => b[1].skills.length - a[1].skills.length);

  return (
    <div className="space-y-4">
      {sortedGroups.map(([key, group]) => (
        <div key={key} className="rounded-2xl border border-border bg-card p-5 shadow-sm">
          <div className="flex items-center gap-2 mb-3">
            <span className="text-sm font-semibold text-primary">{group.module_name}</span>
            <span className="rounded bg-indigo-100 px-1.5 py-0.5 text-xs font-medium text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300">{group.skills.length} 项技能</span>
          </div>
          <div className="space-y-2">
            {group.skills.map(({ skill, match, isGap }, i) => (
              <div key={`${skill.skill_name}-${i}`} className="flex items-center gap-2 rounded-xl border border-border px-3 py-2">
                <span className="text-sm font-medium text-foreground">{skill.skill_name}</span>
                <span className={`rounded px-1.5 py-0.5 text-xs font-medium ${importanceColors[skill.importance] || importanceColors.medium}`}>
                  {importanceLabels[skill.importance] || '中'}
                </span>
                {isGap && (
                  <span className="rounded bg-amber-100 px-1.5 py-0.5 text-xs font-medium text-amber-700 dark:bg-amber-900/40 dark:text-amber-300">差距</span>
                )}
                <div className="ml-auto flex items-center gap-2">
                  <div className="h-2 w-16 overflow-hidden rounded-full bg-muted">
                    <div
                      className={`h-full rounded-full ${match.match_score >= 70 ? 'bg-emerald-500' : match.match_score >= 40 ? 'bg-amber-500' : 'bg-red-500'}`}
                      style={{ width: `${Math.min(100, Math.max(0, match.match_score))}%` }}
                    />
                  </div>
                  <span className={`text-xs font-medium ${match.match_score >= 70 ? 'text-emerald-600 dark:text-emerald-400' : match.match_score >= 40 ? 'text-amber-600 dark:text-amber-400' : 'text-red-500 dark:text-red-400'}`}>
                    {match.match_score}%
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
      {unmatchedSkills.length > 0 && (
        <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
          <div className="flex items-center gap-2 mb-3">
            <span className="text-sm font-semibold text-foreground">未匹配模块</span>
            <span className="rounded bg-amber-100 px-1.5 py-0.5 text-xs font-medium text-amber-700 dark:bg-amber-900/40 dark:text-amber-300">{unmatchedSkills.length} 项技能</span>
          </div>
          <div className="space-y-2">
            {unmatchedSkills.map(({ skill, isGap }, i) => (
              <div key={`${skill.skill_name}-${i}`} className="flex items-center gap-2 rounded-xl border border-border px-3 py-2">
                <span className="text-sm font-medium text-foreground">{skill.skill_name}</span>
                <span className={`rounded px-1.5 py-0.5 text-xs font-medium ${importanceColors[skill.importance] || importanceColors.medium}`}>
                  {importanceLabels[skill.importance] || '中'}
                </span>
                <span className="text-xs text-muted-foreground">{skill.category}</span>
                {isGap && (
                  <span className="rounded bg-amber-100 px-1.5 py-0.5 text-xs font-medium text-amber-700 dark:bg-amber-900/40 dark:text-amber-300">差距</span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
