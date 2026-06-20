// ── Market Insight AI Prompts ───────────────────────────────────────
// Prompts for market analysis report generation and diff narrative.

import type { MarketAnalysisReport } from './types';

// ── Market Analysis Report Prompt ───────────────────────────────────

export const MARKET_ANALYSIS_SYSTEM_PROMPT = `你是一位资深的 AI 人才市场分析专家，擅长从大量岗位 JD 数据中洞察市场趋势。
你的分析必须基于数据，避免泛泛而谈。每个结论都要有数据支撑。
输出严格的 JSON 格式，不要包含任何其他内容。`;

export function buildMarketAnalysisPrompt(data: {
  keyword: string;
  jdCount: number;
  dateRange: string;
  skillFrequency: Record<string, number>;
  categoryDistribution: Record<string, number>;
  salaryDistribution: Record<string, number>;
  locationDistribution: Record<string, number>;
  companyDistribution: Record<string, number>;
  topJdTitles: string[];
}): string {
  const topSkills = Object.entries(data.skillFrequency)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 30)
    .map(([skill, freq]) => `  ${skill}: ${freq}次`)
    .join('\n');

  const categories = Object.entries(data.categoryDistribution)
    .sort(([, a], [, b]) => b - a)
    .map(([cat, count]) => `  ${cat}: ${count}`)
    .join('\n');

  const salaries = Object.entries(data.salaryDistribution)
    .sort(([, a], [, b]) => b - a)
    .map(([range, count]) => `  ${range}: ${count}个岗位`)
    .join('\n');

  const locations = Object.entries(data.locationDistribution)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 10)
    .map(([loc, count]) => `  ${loc}: ${count}个岗位`)
    .join('\n');

  const companies = Object.entries(data.companyDistribution)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 15)
    .map(([comp, count]) => `  ${comp}: ${count}个岗位`)
    .join('\n');

  return `请基于以下数据，对"${data.keyword}"岗位市场进行深度分析。

## 数据概览
- 分析岗位数: ${data.jdCount}个
- 时间范围: ${data.dateRange}
- 常见职位名: ${data.topJdTitles.slice(0, 10).join('、')}

## 技能频率 (Top 30)
${topSkills}

## 技能分类分布
${categories}

## 薪资分布
${salaries}

## 地域分布
${locations}

## 公司分布 (Top 15)
${companies}

---

请严格按以下 JSON 格式输出分析报告：
{
  "summary": "2-3句市场概述",
  "coreSkills": [
    {"skill": "技能名", "frequency": 次数, "percentage": 占比, "trend": "rising|stable|declining", "insight": "一句话解读为什么重要"}
  ],
  "futureTrends": [
    {"trend": "趋势名称", "evidence": "数据依据", "impact": "对求职者的影响", "timeHorizon": "6个月内|1-2年|长期"}
  ],
  "salaryInsights": {
    "overall": "薪资整体情况描述",
    "bySkill": [{"skill": "技能名", "salaryImpact": "该技能对薪资的影响"}]
  },
  "locationInsights": {
    "hottest": ["城市1", "城市2", "城市3"],
    "remoteTrend": "远程办公趋势描述"
  },
  "companyInsights": [
    {"company": "公司名", "hiringFocus": "招聘重点", "skillEmphasis": ["技能1", "技能2"]}
  ],
  "recommendations": [
    {"target": "技能提升|求职策略|薪资谈判", "action": "具体行动", "reasoning": "为什么这样建议"}
  ]
}

要求：
1. coreSkills 至少10个，按 frequency 降序
2. futureTrends 至少3个
3. recommendations 至少5个，覆盖不同 target 类型
4. 每个结论必须有数据支撑，不要凭空推测
5. trend 判断基于该技能在近期 JD 中的出现频率变化
6. 不要输出 JSON 之外的任何内容`;
}

// ── Diff Narrative Prompt ────────────────────────────────────────────

export const MARKET_DIFF_SYSTEM_PROMPT = `你是一位人才市场趋势分析师，擅长解读技能需求变化背后的市场逻辑。
你的分析要深入具体，解释"为什么"而不仅仅是"是什么"。
输出纯文本，段落式表达，不要使用 Markdown 格式。`;

export function buildMarketDiffNarrativePrompt(data: {
  keyword: string;
  newSkills: Array<{ skill: string; frequency: number; category: string }>;
  disappearedSkills: Array<{ skill: string; previousFrequency: number; category: string }>;
  frequencyChanges: Array<{
    skill: string;
    previousFrequency: number;
    currentFrequency: number;
    change: number;
    changePercent: number;
    category: string;
  }>;
  categoryShifts: Array<{
    category: string;
    previousPercentage: number;
    currentPercentage: number;
    change: number;
  }>;
  prevDate: string;
  currDate: string;
}): string {
  const newSkillsText = data.newSkills.length > 0
    ? data.newSkills.map((s) => `${s.skill}(${s.category}, 出现${s.frequency}次)`).join('、')
    : '无';

  const disappearedText = data.disappearedSkills.length > 0
    ? data.disappearedSkills.map((s) => `${s.skill}(${s.category}, 之前${s.previousFrequency}次)`).join('、')
    : '无';

  const topChanges = data.frequencyChanges
    .sort((a, b) => Math.abs(b.changePercent) - Math.abs(a.changePercent))
    .slice(0, 15)
    .map((c) => `${c.skill}: ${c.previousFrequency}次→${c.currentFrequency}次(${c.changePercent > 0 ? '+' : ''}${c.changePercent.toFixed(0)}%)`)
    .join('\n');

  const catShifts = data.categoryShifts
    .sort((a, b) => Math.abs(b.change) - Math.abs(a.change))
    .map((c) => `${c.category}: ${c.previousPercentage.toFixed(1)}%→${c.currentPercentage.toFixed(1)}%(${c.change > 0 ? '+' : ''}${c.change.toFixed(1)}%)`)
    .join('\n');

  return `请分析"${data.keyword}"岗位市场的变化趋势。

对比时间：${data.prevDate} vs ${data.currDate}

## 新出现的技能
${newSkillsText}

## 消失的技能
${disappearedText}

## 频率变化最大的技能 (Top 15)
${topChanges}

## 分类占比变化
${catShifts}

---

请从以下角度分析：

1. 新出现的技能说明了什么市场趋势？为什么这些技能开始被需要？
2. 消失的技能为什么不再被需要？是被什么替代了？
3. 频率变化最大的技能背后有什么市场逻辑？
4. 分类占比变化反映了什么结构性转变？
5. 基于以上变化，给求职者3-5条具体建议

要求：
- 不要使用 Markdown 格式，用纯文本段落表达
- 每个观点都要有具体数据支撑
- 建议要具体可执行，不要泛泛而谈`;
}

// ── Batch skill extraction prompt (lightweight) ──────────────────────

export const BATCH_SKILL_EXTRACT_SYSTEM_PROMPT = `你是一位技能提取专家，从岗位 JD 中提取关键技能。
输出严格的 JSON 格式，不要包含任何其他内容。`;

export function buildBatchSkillExtractPrompt(jds: Array<{ index: number; title: string; text: string }>): string {
  const jdList = jds
    .map((jd) => `--- JD #${jd.index} ---\n标题: ${jd.title}\n内容: ${jd.text.substring(0, 800)}`)
    .join('\n\n');

  return `请从以下 ${jds.length} 个岗位 JD 中提取关键技能。

${jdList}

---

请严格按以下 JSON 格式输出：
{
  "results": [
    {
      "index": JD编号,
      "skills": ["技能1", "技能2", ...]
    }
  ]
}

要求：
1. 每个 JD 提取 5-15 个核心技能
2. 技能名使用通用标准名称（如 "Prompt Engineering" 而非 "提示词工程"）
3. 不要输出 JSON 之外的任何内容`;
}
