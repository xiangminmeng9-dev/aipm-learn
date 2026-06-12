/**
 * 批量重新评分脚本 — 使用项目内置的 generateText 函数
 * 读取所有带简历的 JD 记录，调 AI 获取语义判断，本地计算评分，更新数据库
 */
import { createClient } from '@supabase/supabase-js';
import Anthropic from '@anthropic-ai/sdk';
import { createDecipheriv, scryptSync } from 'crypto';

// ── 解密函数 ──────────────────────────────────────────────────
const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'default-key-change-me';
function decryptKey(encryptedText: string): string {
  const parts = encryptedText.split(':');
  if (parts.length !== 3) return encryptedText; // Not encrypted
  const iv = Buffer.from(parts[0], 'hex');
  const tag = Buffer.from(parts[1], 'hex');
  const encrypted = parts[2];
  const key = scryptSync(ENCRYPTION_KEY, 'salt', 32);
  const decipher = createDecipheriv('aes-256-gcm', key, iv);
  decipher.setAuthTag(tag);
  let decrypted = decipher.update(encrypted, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  return decrypted;
}

// ── 配置 ──────────────────────────────────────────────────────
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const CONCURRENCY = 1;
const MAX_RETRIES = 3;
const RETRY_DELAY_MS = 5000;
const BETWEEN_RECORDS_MS = 2000;

// ── Supabase client ───────────────────────────────────────────
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

// ── 获取用户 AI 配置 ──────────────────────────────────────────
interface AIConfig { protocol: string; baseURL: string | undefined; apiKey: string; model: string; }

async function getUserAiConfig(userId: string): Promise<AIConfig | null> {
  const { data } = await supabase
    .from('user_ai_configs')
    .select('protocol, base_url, api_key, model')
    .eq('user_id', userId)
    .maybeSingle();
  if (data && data.api_key && data.model) {
    let apiKey = data.api_key;
    try { apiKey = decryptKey(apiKey); } catch { /* legacy unencrypted */ }
    return {
      protocol: data.protocol || 'anthropic',
      baseURL: data.base_url || undefined,
      apiKey,
      model: data.model,
    };
  }
  return null;
}

// ── Anthropic client builder ──────────────────────────────────
const stripAuthFetch: typeof globalThis.fetch = (url, init) => {
  const headers = new Headers(init?.headers);
  headers.delete('authorization');
  return globalThis.fetch(url, { ...init, headers });
};

function buildClient(cfg: AIConfig): Anthropic {
  // 修复 baseURL 重复 /v1 的问题
  let baseURL = cfg.baseURL;
  if (baseURL) {
    // Anthropic SDK 会自动加 /v1 前缀，如果 baseURL 已经包含则去掉
    baseURL = baseURL.replace(/\/v1\/?$/, '');
  }
  return new Anthropic({
    apiKey: cfg.apiKey,
    baseURL,
    timeout: 180_000,
    maxRetries: 0,
    fetch: cfg.baseURL ? stripAuthFetch : undefined,
  });
}

// ── 软技能类别 ────────────────────────────────────────────────
const SOFT_SKILL_CATEGORIES = ['软技能', '沟通', '协作', '管理', '领导', '素质', '能力', '态度', '性格'];
function isSoftSkill(skill: { category: string }): boolean {
  const cat = skill.category.toLowerCase();
  return SOFT_SKILL_CATEGORIES.some(kw => cat.includes(kw));
}

// ── 行业匹配度映射 ────────────────────────────────────────────
const INDUSTRY_SCORE_MAP: Record<string, number> = { exact: 100, related: 70, unrelated: 30, unknown: 50 };

// ── 类型 ──────────────────────────────────────────────────────
interface ExtractedSkill { skill_name: string; category: string; importance: string; }
interface AiResumeJudgment {
  covered_skills: string[]; quantified_skills: string[]; jd_responsibilities: string[];
  covered_responsibilities: string[]; demonstrated_soft_skills: string[];
  required_years: number | null; candidate_years: number | null;
  industry_match_level: 'exact' | 'related' | 'unrelated' | 'unknown';
  strengths: string[]; resume_gaps: { skill_name: string; detail: string; suggestion: string }[];
  improvement_suggestions: string[];
}

// ── 本地评分计算 ──────────────────────────────────────────────
function computeResumeMatch(judgment: AiResumeJudgment, skills: ExtractedSkill[]) {
  const highSkills = skills.filter(s => s.importance === 'high');
  const totalHigh = highSkills.length;
  const coveredHigh = highSkills.filter(s => judgment.covered_skills.includes(s.skill_name));
  const missingHigh = highSkills.filter(s => !judgment.covered_skills.includes(s.skill_name)).map(s => s.skill_name);
  const coreSkillScore = totalHigh > 0 ? Math.round((coveredHigh.length / totalHigh) * 100) : 80;
  const coreSkillDetail = totalHigh > 0
    ? `${totalHigh}项核心技能中覆盖${coveredHigh.length}项${missingHigh.length > 0 ? `，缺${missingHigh.join('、')}` : ''}`
    : 'JD未明确核心技能要求';

  const totalSkills = skills.length;
  const coveredSkillCount = judgment.covered_skills.filter(cs => skills.some(s => s.skill_name === cs)).length;
  const skillCoverageScore = totalSkills > 0 ? Math.round((coveredSkillCount / totalSkills) * 100) : 0;
  const skillCoverageDetail = `${totalSkills}项技能中覆盖${coveredSkillCount}项`;

  const totalResp = judgment.jd_responsibilities.length;
  const coveredRespCount = judgment.covered_responsibilities.length;
  const responsibilityScore = totalResp > 0 ? Math.round((coveredRespCount / totalResp) * 100) : 80;
  const responsibilityDetail = totalResp > 0 ? `${totalResp}项职责中${coveredRespCount}项有对应经历` : 'JD未明确职责条目';

  let yearsScore: number, yearsDetail: string;
  if (!judgment.required_years) { yearsScore = 80; yearsDetail = 'JD未要求工作年限'; }
  else if (!judgment.candidate_years) { yearsScore = 40; yearsDetail = `要求${judgment.required_years}年，候选人年限无法推断`; }
  else { yearsScore = Math.min(Math.round((judgment.candidate_years / judgment.required_years) * 100), 100); yearsDetail = `要求${judgment.required_years}年，候选人有${judgment.candidate_years}年`; }

  const softSkills = skills.filter(isSoftSkill);
  const totalSoft = softSkills.length;
  const demonstratedSoft = softSkills.filter(s => judgment.demonstrated_soft_skills.includes(s.skill_name)).length;
  let softSkillScore: number, softSkillDetail: string;
  if (totalSoft === 0) { softSkillScore = 75; softSkillDetail = 'JD无软技能要求'; }
  else { softSkillScore = Math.round((demonstratedSoft / totalSoft) * 100); softSkillDetail = `${totalSoft}项软技能中体现${demonstratedSoft}项`; }

  const industryScore = INDUSTRY_SCORE_MAP[judgment.industry_match_level] ?? 50;
  const industryLabels: Record<string, string> = { exact: '完全匹配', related: '相关', unrelated: '不相关', unknown: '无法判断' };
  const industryDetail = `行业匹配度：${industryLabels[judgment.industry_match_level] || '未知'}`;

  const quantifiedInCovered = judgment.quantified_skills.filter(qs => judgment.covered_skills.includes(qs)).length;
  const projectDepthScore = coveredSkillCount > 0 ? Math.round((quantifiedInCovered / coveredSkillCount) * 100) : 0;
  const projectDepthDetail = coveredSkillCount > 0 ? `已覆盖${coveredSkillCount}项技能中${quantifiedInCovered}项有量化成果` : '无覆盖技能，无法评估项目深度';

  const matchScore = Math.min(100, Math.round(
    coreSkillScore * 0.25 + skillCoverageScore * 0.20 + responsibilityScore * 0.20 +
    yearsScore * 0.10 + softSkillScore * 0.10 + industryScore * 0.08 + projectDepthScore * 0.07
  ));

  const dimension_scores = {
    core_skill_match: { score: coreSkillScore, detail: coreSkillDetail },
    skill_coverage: { score: skillCoverageScore, detail: skillCoverageDetail },
    responsibility_coverage: { score: responsibilityScore, detail: responsibilityDetail },
    years_match: { score: yearsScore, detail: yearsDetail },
    soft_skill_match: { score: softSkillScore, detail: softSkillDetail },
    industry_match: { score: industryScore, detail: industryDetail },
    project_depth: { score: projectDepthScore, detail: projectDepthDetail },
  };

  // 投递建议
  let should_apply: boolean, confidence: 'high' | 'medium' | 'low', reason: string;
  const key_actions: string[] = [];
  if (matchScore >= 75) { should_apply = true; confidence = 'high'; reason = '简历与岗位高度匹配，核心技能覆盖良好'; }
  else if (matchScore >= 55) {
    should_apply = true; confidence = 'medium'; reason = '简历与岗位基本匹配，但部分技能需补强';
    if (missingHigh.length > 0) key_actions.push(`简历中补充${missingHigh.slice(0, 3).join('、')}相关经验`);
    if (dimension_scores.project_depth.score < 50) key_actions.push('在项目描述中增加量化成果');
  } else if (matchScore >= 40) {
    should_apply = true; confidence = 'low'; reason = '简历与岗位匹配度偏低，需针对性提升';
    if (missingHigh.length > 0) key_actions.push(`重点补强核心技能：${missingHigh.slice(0, 3).join('、')}`);
    key_actions.push('面试前准备该岗位相关的案例和项目经验');
  } else {
    should_apply = false; confidence = 'low'; reason = '简历与岗位匹配度较低，核心技能差距较大';
    if (missingHigh.length > 0) key_actions.push(`核心技能差距：${missingHigh.slice(0, 5).join('、')}`);
    key_actions.push('建议先通过学习或项目积累相关经验');
  }

  return {
    match_score: matchScore, dimension_scores,
    jd_responsibilities: judgment.jd_responsibilities,
    required_years: judgment.required_years, candidate_years: judgment.candidate_years,
    strengths: judgment.strengths, resume_gaps: judgment.resume_gaps,
    improvement_suggestions: judgment.improvement_suggestions,
    apply_recommendation: { should_apply, confidence, reason, key_actions },
  };
}

// ── 构建 AI prompt ────────────────────────────────────────────
const SYSTEM_PROMPT = `你是技术招聘专家。只做语义判断（技能是否覆盖、职责是否匹配等），不要计算分数，评分由系统本地计算。输出纯JSON，无markdown。`;

function buildPrompt(jdText: string, resumeText: string, skills: ExtractedSkill[]): string {
  const skillList = skills.map(s => s.skill_name).join('、');
  return `分析JD与简历的匹配度，只做语义判断，不要计算分数。

已提取的技能（${skillList}）：
${JSON.stringify(skills)}

JD：${jdText}

候选人简历：
${resumeText}

输出严格JSON格式，不要markdown。输出格式：
{"resume_judgment":{"covered_skills":["简历覆盖的技能名1","技能名2"],"quantified_skills":["有量化成果的技能名1"],"jd_responsibilities":["职责条1","职责2"],"covered_responsibilities":["简历有对应经历的职责1"],"demonstrated_soft_skills":["简历体现的软技能名1"],"required_years":3,"candidate_years":5,"industry_match_level":"exact","strengths":["匹配优势1","匹配优势2"],"resume_gaps":[{"skill_name":"差距技能","detail":"简历中缺少的具体内容","suggestion":"提升建议"}],"improvement_suggestions":["简历改进建议1","简历改进建议2"]}}

要求：
1. covered_skills：逐条对照已提取的技能列表，判断简历中是否有该技能的体现
2. quantified_skills：在covered_skills中，哪些技能在简历中有量化成果描述（含数字/百分比/金额）
3. jd_responsibilities：从JD中提取岗位职责条目（3-8条）
4. covered_responsibilities：逐条判断简历是否有对应经历
5. demonstrated_soft_skills：从已提取技能中category含软技能的条目，判断简历是否体现了该软技能
6. required_years：从JD提取年限要求，无则填null
7. candidate_years：从简历推断候选人工作年限，无法推断则填null
8. industry_match_level：exact/related/unrelated/unknown
9. strengths：简历中已具备的JD要求（3-5条）
10. resume_gaps：对比简历后发现候选人缺少什么
11. improvement_suggestions：针对简历本身的改进建议（2-4条）`;
}

// ── 调 AI 获取判断 ────────────────────────────────────────────
async function getJudgment(client: Anthropic, model: string, jdText: string, resumeText: string, skills: ExtractedSkill[]): Promise<AiResumeJudgment | null> {
  const prompt = buildPrompt(jdText, resumeText, skills);
  const msg = await client.messages.create({
    model,
    max_tokens: 4096,
    system: SYSTEM_PROMPT,
    messages: [{ role: 'user', content: prompt }],
  });

  const text = msg.content[0].type === 'text' ? msg.content[0].text : '';
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) return null;

  let jsonStr = jsonMatch[0];
  const openB = (jsonStr.match(/\[/g) || []).length;
  const closeB = (jsonStr.match(/\]/g) || []).length;
  const openBr = (jsonStr.match(/\{/g) || []).length;
  const closeBr = (jsonStr.match(/\}/g) || []).length;
  if (openB > closeB || openBr > closeBr) {
    const rmStart = jsonStr.lastIndexOf('"resume_judgment"');
    if (rmStart !== -1 && rmStart > jsonStr.lastIndexOf('}')) {
      jsonStr = jsonStr.slice(0, rmStart).replace(/,\s*$/, '');
    } else {
      jsonStr = jsonStr.replace(/,\s*"[^"]*":\s*[^,}\]]*$/g, '');
      jsonStr = jsonStr.replace(/,\s*$/g, '');
    }
    for (let i = 0; i < openB - closeB; i++) jsonStr += ']';
    for (let i = 0; i < openBr - closeBr; i++) jsonStr += '}';
  }

  const parsed = JSON.parse(jsonStr);
  const j = parsed.resume_judgment || parsed;
  return {
    covered_skills: Array.isArray(j.covered_skills) ? j.covered_skills.map(String) : [],
    quantified_skills: Array.isArray(j.quantified_skills) ? j.quantified_skills.map(String) : [],
    jd_responsibilities: Array.isArray(j.jd_responsibilities) ? j.jd_responsibilities.map(String) : [],
    covered_responsibilities: Array.isArray(j.covered_responsibilities) ? j.covered_responsibilities.map(String) : [],
    demonstrated_soft_skills: Array.isArray(j.demonstrated_soft_skills) ? j.demonstrated_soft_skills.map(String) : [],
    required_years: typeof j.required_years === 'number' ? j.required_years : null,
    candidate_years: typeof j.candidate_years === 'number' ? j.candidate_years : null,
    industry_match_level: ['exact', 'related', 'unrelated', 'unknown'].includes(j.industry_match_level) ? j.industry_match_level : 'unknown',
    strengths: Array.isArray(j.strengths) ? j.strengths.map(String) : [],
    resume_gaps: Array.isArray(j.resume_gaps) ? j.resume_gaps.map((g: unknown) => {
      if (typeof g === 'string') return { skill_name: g, detail: '', suggestion: '' };
      const obj = g as Record<string, unknown>;
      return { skill_name: String(obj.skill_name || ''), detail: String(obj.detail || ''), suggestion: String(obj.suggestion || '') };
    }) : [],
    improvement_suggestions: Array.isArray(j.improvement_suggestions) ? j.improvement_suggestions.map(String) : [],
  };
}

// ── 主流程 ────────────────────────────────────────────────────
async function main() {
  console.log('🚀 开始批量重新评分...');

  // 获取所有带简历的记录
  const { data: records, error } = await supabase
    .from('jd_analyses')
    .select('id, user_id, jd_text, resume_text, position_name, extracted_skills')
    .not('resume_text', 'is', null);

  if (error || !records) {
    console.error('❌ 查询失败:', error);
    process.exit(1);
  }

  console.log(`📊 共 ${records.length} 条带简历的记录需要评分`);

  // 获取所有不重复的 user_id
  const userIds = [...new Set(records.map(r => r.user_id))];
  console.log(`👤 涉及 ${userIds.length} 个用户`);

  // 预加载每个用户的 AI 配置
  const aiConfigs = new Map<string, AIConfig | null>();
  for (const uid of userIds) {
    const cfg = await getUserAiConfig(uid);
    aiConfigs.set(uid, cfg);
    if (!cfg) {
      // fallback to env
      aiConfigs.set(uid, {
        protocol: 'anthropic',
        baseURL: process.env.ANTHROPIC_BASE_URL || undefined,
        apiKey: process.env.ANTHROPIC_API_KEY || '',
        model: process.env.AI_MODEL || 'astron-code-latest',
      });
    }
  }

  let updated = 0;
  let failed = 0;
  let skipped = 0;

  for (let i = 0; i < records.length; i++) {
    const record = records[i];
    const skills: ExtractedSkill[] = Array.isArray(record.extracted_skills)
      ? record.extracted_skills.map((s: unknown) => {
          if (typeof s === 'string') return { skill_name: s, category: '未分类', importance: 'medium' };
          const obj = s as Record<string, unknown>;
          return { skill_name: String(obj.skill_name || ''), category: String(obj.category || '未分类'), importance: String(obj.importance || 'medium') };
        })
      : [];

    if (skills.length === 0) {
      skipped++;
      continue;
    }

    const cfg = aiConfigs.get(record.user_id);
    if (!cfg || !cfg.apiKey) {
      skipped++;
      console.log(`  ⏭️ ${record.position_name} - 无AI配置`);
      continue;
    }

    const client = buildClient(cfg);

    // 重试逻辑
    let judgment: AiResumeJudgment | null = null;
    for (let retry = 0; retry <= MAX_RETRIES; retry++) {
      try {
        judgment = await getJudgment(client, cfg.model, record.jd_text, record.resume_text, skills);
        if (judgment) break;
      } catch (err) {
        const errMsg = err instanceof Error ? err.message : String(err);
        if (retry < MAX_RETRIES) {
          console.log(`  ⚠️ [${i+1}/${records.length}] ${record.position_name} 重试 ${retry + 1}: ${errMsg.slice(0, 80)}`);
          await new Promise(r => setTimeout(r, RETRY_DELAY_MS));
        } else {
          console.log(`  ❌ [${i+1}/${records.length}] ${record.position_name} - ${errMsg.slice(0, 100)}`);
        }
      }
    }

    if (!judgment) {
      failed++;
      continue;
    }

    // 本地计算评分
    const resumeMatch = computeResumeMatch(judgment, skills);

    // 更新数据库
    const { error: updateError } = await supabase
      .from('jd_analyses')
      .update({ resume_match: resumeMatch })
      .eq('id', record.id);

    if (updateError) {
      failed++;
      console.log(`  ❌ [${i+1}/${records.length}] ${record.position_name} - DB更新失败: ${updateError.message}`);
    } else {
      updated++;
      console.log(`  ✅ [${i+1}/${records.length}] ${record.position_name} → ${resumeMatch.match_score}分`);
    }

    // 记录间延迟
    if (i < records.length - 1) {
      await new Promise(r => setTimeout(r, BETWEEN_RECORDS_MS));
    }

    // 每 20 条打印进度
    if ((i + 1) % 20 === 0) {
      console.log(`\n📈 进度: ${i+1}/${records.length} (成功${updated} 失败${failed} 跳过${skipped})\n`);
    }
  }

  console.log(`\n🏁 完成！成功: ${updated}, 失败: ${failed}, 跳过: ${skipped}, 总计: ${records.length}`);
}

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
