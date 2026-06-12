/**
 * JD 岗位分析 — 本地评分计算
 *
 * 将评分逻辑从 AI prompt 移到本地代码，AI 只负责语义判断（技能是否覆盖、
 * 职责是否匹配等），分数由确定性公式计算，确保结果一致且可审计。
 */

import type { ExtractedSkill, DimensionScore, DimensionScores, ResumeMatch, ResumeGap } from '@/app/skills/jd-analysis/types';

// ── AI 返回的语义判断结构 ──────────────────────────────────────

export interface AiResumeJudgment {
  /** 简历覆盖的技能名列表（与 extracted_skills 中的 skill_name 对应） */
  covered_skills: string[];
  /** 有量化成果描述（含数字/百分比/金额）的技能名列表 */
  quantified_skills: string[];
  /** 从 JD 中提取的职责条目 */
  jd_responsibilities: string[];
  /** 简历有对应经历的职责条目 */
  covered_responsibilities: string[];
  /** 简历体现的软技能名列表 */
  demonstrated_soft_skills: string[];
  /** JD 要求的工作年限（null 表示未要求） */
  required_years: number | null;
  /** 从简历推断的候选人工作年限（null 表示无法推断） */
  candidate_years: number | null;
  /** 行业匹配度 */
  industry_match_level: 'exact' | 'related' | 'unrelated' | 'unknown';
  /** 匹配优势（3-5 条） */
  strengths: string[];
  /** 简历差距 */
  resume_gaps: { skill_name: string; detail: string; suggestion: string }[];
  /** 简历改进建议（2-4 条） */
  improvement_suggestions: string[];
}

// ── 软技能类别关键词 ────────────────────────────────────────────

const SOFT_SKILL_CATEGORIES = ['软技能', '沟通', '协作', '管理', '领导', '素质', '能力', '态度', '性格'];

function isSoftSkill(skill: ExtractedSkill): boolean {
  const cat = skill.category.toLowerCase();
  return SOFT_SKILL_CATEGORIES.some(kw => cat.includes(kw));
}

// ── 行业匹配度 → 分数映射 ──────────────────────────────────────

const INDUSTRY_SCORE_MAP: Record<string, number> = {
  exact: 100,
  related: 70,
  unrelated: 30,
  unknown: 50,
};

// ── 核心计算函数 ────────────────────────────────────────────────

/**
 * 根据 AI 的语义判断 + 已提取的技能列表，本地计算 7 维度评分和加权总分。
 *
 * @param judgment  AI 返回的语义判断数据
 * @param skills    已提取的技能列表（含 importance 和 category）
 * @returns 完整的 ResumeMatch 对象，可直接存入数据库
 */
export function computeResumeMatch(
  judgment: AiResumeJudgment,
  skills: ExtractedSkill[],
): ResumeMatch {
  // ── 1. core_skill_match (25%) ──────────────────────────────
  const highImportanceSkills = skills.filter(s => s.importance === 'high');
  const totalHigh = highImportanceSkills.length;
  const coveredHigh = highImportanceSkills.filter(s =>
    judgment.covered_skills.some(cs => cs === s.skill_name),
  );
  const coveredHighNames = coveredHigh.map(s => s.skill_name);
  const missingHighNames = highImportanceSkills
    .filter(s => !coveredHighNames.includes(s.skill_name))
    .map(s => s.skill_name);

  const coreSkillScore = totalHigh > 0
    ? Math.round((coveredHigh.length / totalHigh) * 100)
    : 80; // 无核心技能要求时给 80

  const coreSkillDetail = totalHigh > 0
    ? `${totalHigh}项核心技能中覆盖${coveredHigh.length}项${missingHighNames.length > 0 ? `，缺${missingHighNames.join('、')}` : ''}`
    : 'JD未明确核心技能要求';

  // ── 2. skill_coverage (20%) ────────────────────────────────
  const totalSkills = skills.length;
  const coveredSkillCount = judgment.covered_skills.filter(cs =>
    skills.some(s => s.skill_name === cs),
  ).length;

  const skillCoverageScore = totalSkills > 0
    ? Math.round((coveredSkillCount / totalSkills) * 100)
    : 0;

  const skillCoverageDetail = `${totalSkills}项技能中覆盖${coveredSkillCount}项`;

  // ── 3. responsibility_coverage (20%) ───────────────────────
  const totalResp = judgment.jd_responsibilities.length;
  const coveredRespCount = judgment.covered_responsibilities.length;

  const responsibilityScore = totalResp > 0
    ? Math.round((coveredRespCount / totalResp) * 100)
    : 80; // 无职责条目时给 80

  const responsibilityDetail = totalResp > 0
    ? `${totalResp}项职责中${coveredRespCount}项有对应经历`
    : 'JD未明确职责条目';

  // ── 4. years_match (10%) ───────────────────────────────────
  let yearsScore: number;
  let yearsDetail: string;

  if (!judgment.required_years) {
    yearsScore = 80;
    yearsDetail = 'JD未要求工作年限';
  } else if (!judgment.candidate_years) {
    yearsScore = 40;
    yearsDetail = `要求${judgment.required_years}年，候选人年限无法推断`;
  } else {
    yearsScore = Math.min(Math.round((judgment.candidate_years / judgment.required_years) * 100), 100);
    yearsDetail = `要求${judgment.required_years}年，候选人有${judgment.candidate_years}年`;
  }

  // ── 5. soft_skill_match (10%) ──────────────────────────────
  const softSkills = skills.filter(isSoftSkill);
  const totalSoft = softSkills.length;
  const demonstratedSoft = softSkills.filter(s =>
    judgment.demonstrated_soft_skills.some(ds => ds === s.skill_name),
  ).length;

  let softSkillScore: number;
  let softSkillDetail: string;

  if (totalSoft === 0) {
    softSkillScore = 75;
    softSkillDetail = 'JD无软技能要求';
  } else {
    softSkillScore = Math.round((demonstratedSoft / totalSoft) * 100);
    softSkillDetail = `${totalSoft}项软技能中体现${demonstratedSoft}项`;
  }

  // ── 6. industry_match (8%) ─────────────────────────────────
  const industryScore = INDUSTRY_SCORE_MAP[judgment.industry_match_level] ?? 50;
  const industryLabels: Record<string, string> = {
    exact: '完全匹配',
    related: '相关',
    unrelated: '不相关',
    unknown: '无法判断',
  };
  const industryDetail = `行业匹配度：${industryLabels[judgment.industry_match_level] || '未知'}`;

  // ── 7. project_depth (7%) ──────────────────────────────────
  const quantifiedInCovered = judgment.quantified_skills.filter(qs =>
    judgment.covered_skills.some(cs => cs === qs),
  ).length;

  const projectDepthScore = coveredSkillCount > 0
    ? Math.round((quantifiedInCovered / coveredSkillCount) * 100)
    : 0;

  const projectDepthDetail = coveredSkillCount > 0
    ? `已覆盖${coveredSkillCount}项技能中${quantifiedInCovered}项有量化成果`
    : '无覆盖技能，无法评估项目深度';

  // ── 加权总分 ───────────────────────────────────────────────
  const matchScore = Math.min(100, Math.round(
    coreSkillScore * 0.25 +
    skillCoverageScore * 0.20 +
    responsibilityScore * 0.20 +
    yearsScore * 0.10 +
    softSkillScore * 0.10 +
    industryScore * 0.08 +
    projectDepthScore * 0.07,
  ));

  // ── 组装 dimension_scores ──────────────────────────────────
  const dimensionScores: DimensionScores = {
    core_skill_match: { score: coreSkillScore, detail: coreSkillDetail },
    skill_coverage: { score: skillCoverageScore, detail: skillCoverageDetail },
    responsibility_coverage: { score: responsibilityScore, detail: responsibilityDetail },
    years_match: { score: yearsScore, detail: yearsDetail },
    soft_skill_match: { score: softSkillScore, detail: softSkillDetail },
    industry_match: { score: industryScore, detail: industryDetail },
    project_depth: { score: projectDepthScore, detail: projectDepthDetail },
  };

  // ── 投递建议 ───────────────────────────────────────────────
  const applyRecommendation = computeApplyRecommendation(matchScore, dimensionScores, missingHighNames);

  // ── 组装 ResumeMatch ───────────────────────────────────────
  return {
    match_score: matchScore,
    dimension_scores: dimensionScores,
    jd_responsibilities: judgment.jd_responsibilities,
    required_years: judgment.required_years ?? undefined,
    candidate_years: judgment.candidate_years ?? undefined,
    strengths: judgment.strengths,
    resume_gaps: judgment.resume_gaps.map(g => ({
      skill_name: g.skill_name,
      detail: g.detail,
      suggestion: g.suggestion,
    })),
    improvement_suggestions: judgment.improvement_suggestions,
    apply_recommendation: applyRecommendation,
  };
}

// ── 投递建议计算 ────────────────────────────────────────────────

function computeApplyRecommendation(
  matchScore: number,
  dimensionScores: DimensionScores,
  missingHighSkills: string[],
): ResumeMatch['apply_recommendation'] {
  let shouldApply: boolean;
  let confidence: 'high' | 'medium' | 'low';
  let reason: string;
  const keyActions: string[] = [];

  if (matchScore >= 75) {
    shouldApply = true;
    confidence = 'high';
    reason = '简历与岗位高度匹配，核心技能覆盖良好';
  } else if (matchScore >= 55) {
    shouldApply = true;
    confidence = 'medium';
    reason = '简历与岗位基本匹配，但部分技能需补强';
    if (missingHighSkills.length > 0) {
      keyActions.push(`简历中补充${missingHighSkills.slice(0, 3).join('、')}相关经验`);
    }
    if (dimensionScores.project_depth.score < 50) {
      keyActions.push('在项目描述中增加量化成果（数据、百分比、业务指标）');
    }
  } else if (matchScore >= 40) {
    shouldApply = true;
    confidence = 'low';
    reason = '简历与岗位匹配度偏低，需针对性提升';
    if (missingHighSkills.length > 0) {
      keyActions.push(`重点补强核心技能：${missingHighSkills.slice(0, 3).join('、')}`);
    }
    keyActions.push('面试前准备该岗位相关的案例和项目经验');
  } else {
    shouldApply = false;
    confidence = 'low';
    reason = '简历与岗位匹配度较低，核心技能差距较大';
    if (missingHighSkills.length > 0) {
      keyActions.push(`核心技能差距：${missingHighSkills.slice(0, 5).join('、')}`);
    }
    keyActions.push('建议先通过学习或项目积累相关经验');
  }

  return { should_apply: shouldApply, confidence, reason, key_actions: keyActions };
}
