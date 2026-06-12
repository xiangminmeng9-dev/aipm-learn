import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { generateText } from '@/lib/ai/claude';
import { aggregateSkills } from '@/lib/ai/skill-normalizer';
import { getFixedPersona, normalizeCompanyName, getCompanyNameVariants, COMPANY_FIXED_CORE_SKILLS, COMPANY_FIXED_SOFT_SKILLS } from '@/lib/ai/company-personas';
import type { CompanyType } from '@/types';

const BIG_COMPANY_KEYWORDS = ['字节跳动', '腾讯', '阿里巴巴', '阿里', '百度', '美团', '京东', '拼多多', '网易', '小米', '华为', '快手', '滴滴', '蚂蚁', 'baidu', 'tencent', 'alibaba', 'bytedance', 'meituan', 'jd.com', 'pinduoduo', 'netease', 'xiaomi', 'huawei', 'kuaishou', 'didi'];
const FOREIGN_KEYWORDS = ['google', 'microsoft', 'amazon', 'apple', 'meta', 'facebook', 'intel', 'nvidia', 'amd', 'qualcomm', 'sap', 'oracle', 'ibm', 'cisco', 'dell', 'salesforce', 'adobe', 'spotify', 'uber', 'airbnb', 'stripe', 'paypal', '谷歌', '微软', '亚马逊', '苹果', '脸书', '英特尔', '英伟达'];
const STATE_OWNED_KEYWORDS = ['中国银行', '工商银行', '建设银行', '农业银行', '交通银行', '国家电网', '中国移动', '中国电信', '中国联通', '中石油', '中石化', '中铁', '中建', '国开行', '邮政', '烟草', '电网'];
const STARTUP_KEYWORDS = ['创业', '天使轮', 'a轮', 'b轮', 'pre-a', 'seed', '早期', '初创'];

const COMPANY_TYPE_LABELS: Record<string, string> = {
  big_company: '大厂（BAT/TMD级别大型科技公司）',
  foreign: '外企（跨国/外资公司）',
  state_owned: '国企（央企/事业单位）',
  startup: '创业公司（早期初创）',
  traditional: '传统行业（非科技类）',
  other: '其他',
};

function detectCompanyType(name: string): CompanyType | null {
  const lower = name.toLowerCase();
  for (const kw of BIG_COMPANY_KEYWORDS) if (lower.includes(kw)) return 'big_company';
  for (const kw of FOREIGN_KEYWORDS) if (lower.includes(kw)) return 'foreign';
  for (const kw of STATE_OWNED_KEYWORDS) if (lower.includes(kw)) return 'state_owned';
  for (const kw of STARTUP_KEYWORDS) if (lower.includes(kw)) return 'startup';
  return null;
}

interface CompanyPreference {
  persona: string;
  core_skills: Array<{ name: string; count: number }>;
  soft_skills: string[];
  not_care: string;
  suggestion: string;
  strengthen: string;
}

export async function GET(request: NextRequest) {
  try {
    const company = request.nextUrl.searchParams.get('company');
    if (!company || company.trim().length < 2) {
      return NextResponse.json({ error: '公司名至少2个字符' }, { status: 400 });
    }

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: '请先登录' }, { status: 401 });

    const companyName = company.trim();

    // ── Step 1: Detect company type ──
    let companyType: CompanyType = 'other';
    let companyTypeSource = 'fallback';

    // 1a. Check existing records
    const { data: existing } = await supabase
      .from('resume_applications')
      .select('company_type')
      .eq('user_id', user.id)
      .ilike('company_name', `%${companyName}%`)
      .neq('company_type', 'other')
      .limit(1)
      .maybeSingle();

    if (existing?.company_type) {
      companyType = existing.company_type as CompanyType;
      companyTypeSource = 'existing';
    } else {
      // 1b. Keyword matching
      const keywordResult = detectCompanyType(companyName);
      if (keywordResult) {
        companyType = keywordResult;
        companyTypeSource = 'keyword';
      } else {
        // 1c. AI classification (haiku, fast & cheap)
        try {
          const aiResult = await generateText(
            `请判断以下公司属于哪种类型，只回复一个类型代码：
big_company: 中国/国际大型科技公司（BAT、TMD级别）
foreign: 外企/跨国公司
state_owned: 国企/央企/事业单位
startup: 创业公司/早期公司
traditional: 传统行业（非科技类）
other: 无法判断

公司名：${companyName}

只回复类型代码，不要其他内容。`,
            { model: 'haiku', maxTokens: 20 }
          );
          const type = aiResult.trim().toLowerCase() as CompanyType;
          const validTypes = ['big_company', 'foreign', 'state_owned', 'startup', 'traditional', 'other'];
          if (validTypes.includes(type)) {
            companyType = type;
            companyTypeSource = 'ai';
          }
        } catch {
          // fallback to 'other'
        }
      }
    }

    // ── Step 2: Try to get preference from existing JD analyses ──
    let preference: CompanyPreference | null = null;
    let report: string | null = null;
    let preferenceSource: 'fixed' | 'jd_analyses' | 'web_research' | 'generic' | null = null;

    // Normalize company name and query all variants (e.g., "阿里" matches "阿里巴巴")
    const companyVariants = getCompanyNameVariants(companyName);

    let { data: analyses } = await supabase
      .from('jd_analyses')
      .select('position_name, extracted_skills, gaps, company_name')
      .eq('user_id', user.id)
      .in('company_name', companyVariants)
      .order('created_at', { ascending: false })
      .limit(50);

    // Fallback: if no results, try ilike substring match for unknown companies
    if (!analyses || analyses.length === 0) {
      const { data: fuzzyAnalyses } = await supabase
        .from('jd_analyses')
        .select('position_name, extracted_skills, gaps, company_name')
        .eq('user_id', user.id)
        .ilike('company_name', `%${companyName}%`)
        .order('created_at', { ascending: false })
        .limit(50);
      if (fuzzyAnalyses && fuzzyAnalyses.length > 0) {
        analyses = fuzzyAnalyses;
      }
    }

    if (analyses && analyses.length > 0) {
      // 2a. Generate preference from aggregated JD data
      const positions = [...new Set(analyses.map(a => a.position_name).filter(Boolean))];
      const skillMap = aggregateSkills(analyses);

      const gapFreq = new Map<string, number>();
      for (const a of analyses) {
        for (const g of ((a.gaps as Array<{ skill_name: string }>) || [])) {
          if (g.skill_name) gapFreq.set(g.skill_name, (gapFreq.get(g.skill_name) || 0) + 1);
        }
      }

      const topSkills = Array.from(skillMap.entries()).sort((a, b) => b[1].count - a[1].count).slice(0, 15);
      const topGaps = Array.from(gapFreq.entries()).sort((a, b) => b[1] - a[1]).slice(0, 8);
      const skillDetail = topSkills.map(([s, d]) => `${s}(${d.count}次)`).join('、');
      const gapDetail = topGaps.map(([s, c]) => `${s}(${c}次)`).join('、');

      const prefPrompt = `你是一位资深互联网招聘分析师，非常了解各大公司的招聘风格和用人偏好。请基于以下JD数据，用非常直白、接地气的语言分析${companyName}偏好什么样的人。

分析岗位数：${analyses.length}
招聘岗位：${positions.join('、')}
高频技能（归一化后，含出现次数）：${skillDetail}
常见技能差距（含出现次数）：${gapDetail}

请严格按以下JSON格式输出（不要输出其他内容）：
{
  "persona": "用非常口语化、直白的语言描述这家公司想要什么样的人，像内部员工私下聊天一样告诉你朋友真相。必须覆盖以下维度并用具体细节填充：1)他们看重什么样的人（性格、做事风格）2)特别看重什么能力或特质 3)面试风格是怎样的 4)喜欢什么类型的人 5)讨厌什么类型的人。每个维度都要有画面感的细节，不能泛泛而谈。示例格式：'聪明、能扛事的，特别看重你对数据的敏感度，思维的深度，所有岗位都会往技术思维上靠，你去面试，面试官基本不跟你唠闲嗑，拿着简历深挖你的项目，比如这个想法怎么来的、怎么验证的、怎么落地的、中间翻过几次车怎么救回来的，而且特别喜欢有主见、偏强势有独立判断的人。' 每个公司的风格完全不同，要写出鲜明的个性差异。",
  "core_skills": [{"name":"技能名","count":出现次数}],
  "soft_skills": ["软技能1","软技能2"],
  "not_care": "用直白的语言说这家公司不太看重什么",
  "suggestion": "给求职者的具体建议，包括怎么准备面试、简历怎么改",
  "strengthen": "目前简历最需要补强的技能"
}`;

      const prefResult = await generateText(prefPrompt, { model: 'haiku', maxTokens: 2048 });
      const jsonMatch = prefResult.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        try {
          let jsonStr = jsonMatch[0];
          const openB = (jsonStr.match(/\[/g) || []).length;
          const closeB = (jsonStr.match(/\]/g) || []).length;
          const openC = (jsonStr.match(/\{/g) || []).length;
          const closeC = (jsonStr.match(/\}/g) || []).length;
          if (openB > closeB || openC > closeC) {
            jsonStr = jsonStr.replace(/,\s*"[^"]*":\s*[^,}\]]*$/g, '');
            jsonStr = jsonStr.replace(/,\s*$/g, '');
            for (let i = 0; i < openB - closeB; i++) jsonStr += ']';
            for (let i = 0; i < openC - closeC; i++) jsonStr += '}';
          }
          preference = JSON.parse(jsonStr);
          preferenceSource = 'jd_analyses';
        } catch {
          preference = { persona: prefResult.trim(), core_skills: [], soft_skills: [], not_care: '', suggestion: '', strengthen: '' };
        }
      }

      // 2b. Generate company analysis report — parallel with preference
      // Report doesn't depend on preference result, so we can run both concurrently
      const skillStats = topSkills.map(([s, d]) => `${s}: ${d.count}次${d.positions?.length ? ' (出现在' + d.positions.join('、') + ')' : ''}`).join('\n');
      const positionDetails = analyses.slice(0, 10).map(a => {
        const skills = ((a.extracted_skills as Array<{ skill_name: string; importance: string }>) || []).map(s => s.skill_name).join('、');
        return `- ${a.position_name}: ${skills}`;
      }).join('\n');

      const resumeGaps = topGaps.map(([s, c]) => `${s}(${c}次)`).join('、');

      const reportPrompt = `请基于以下数据，为${companyName}生成一份招聘画像分析报告。

公司名：${companyName}
分析岗位数：${analyses.length}
涉及技能数：${skillMap.size}

技能统计（归一化后）：
${skillStats}

各岗位技能要求：
${positionDetails}

常见技能差距：${resumeGaps || '无'}

请按以下5个部分生成报告，每部分用【】标注标题：

【这家公司喜欢什么样的人】
综合分析该公司偏好的候选人画像，包括核心能力、经验背景、性格特质等。

【不同岗位的差异】
分析不同岗位在技能要求上的差异，哪些是通用要求，哪些是岗位特有要求。

【这家公司不太看重什么】
分析该公司招聘中不太强调或不太看重的方面。

【针对各岗位的简历优化建议】
为每个岗位方向给出具体的简历优化建议。

【投递建议与补强方向】
给出投递策略建议和需要补强的技能方向。`;

      try {
        report = await generateText(reportPrompt, { model: 'sonnet', maxTokens: 4096 });
      } catch {
        report = null;
      }
    }

    // ── Step 2.5: Web Research — try fetching public web pages ──
    // 核心原则：搜不到就不用，能搜到就用
    // 仅在无 JD 分析数据且无固定画像时才尝试
    if (!preference && !getFixedPersona(companyName)) {
      try {
        const { fetchCompanyInfo, generateCompanyPreferenceFromWeb } = await import('@/lib/ai/web-research');
        const webContents = await fetchCompanyInfo(companyName);

        if (webContents.length > 0) {
          const webResult = await generateCompanyPreferenceFromWeb(
            companyName,
            webContents,
            async (prompt, opts) => generateText(prompt, opts as { model: 'haiku'; maxTokens: number })
          );

          if (webResult) {
            preference = webResult.preference;
            preferenceSource = 'web_research';
            // Mark the suggestion to indicate web research origin
            if (preference && preference.suggestion) {
              preference.suggestion = `[基于官网信息推断] ${preference.suggestion}`;
            }
          }
        }
      } catch (err) {
        console.error('Web research failed for', companyName, err);
        // 静默降级 — 搜不到就不用，不影响主流程
      }
    }

    // ── Step 3: Fallback — generate generic preference from company type ──
    if (!preference) {
      const typeLabel = COMPANY_TYPE_LABELS[companyType] || companyType;
      try {
        const fallbackResult = await generateText(
          `请根据以下信息，生成该公司的招聘偏好画像（针对AI/互联网产品经理方向）。

公司名称：${companyName}
公司类型：${typeLabel}

请按以下格式输出（严格使用 JSON）：
{
  "persona": "画像描述，如：具备XX经验、XX能力的产品经理",
  "core_skills": [{"name":"技能名","count":1}],
  "soft_skills": ["软技能1","软技能2"],
  "not_care": "不看重的内容",
  "suggestion": "给求职者的建议",
  "strengthen": "需要补强的技能"
}

注意：这是基于公司类型的通用推断，不是基于实际JD数据。请给出该类型公司普遍看重的方面。`,
          { model: 'haiku', maxTokens: 1024 }
        );
        const jsonMatch = fallbackResult.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          try {
            preference = JSON.parse(jsonMatch[0]);
            preferenceSource = 'generic';
            // Mark as generic/inferred
            if (preference) {
              preference.suggestion = `[基于公司类型推断] ${preference.suggestion || ''}`;
            }
          } catch {
            preference = null;
          }
        }
      } catch {
        preference = null;
      }
    }

    // ── Step 4: Prepend fixed persona if available ──
    const fixedPersona = getFixedPersona(companyName);
    const normalizedCompany = normalizeCompanyName(companyName);
    if (fixedPersona && preference) {
      preference.persona = fixedPersona + '\n\n' + preference.persona;
      // Fixed persona prepended → upgrade source to 'fixed'
      if (!preferenceSource || preferenceSource === 'generic') {
        preferenceSource = 'fixed';
      }
      // Fill in missing core_skills/soft_skills from fixed data if AI didn't generate them
      if ((!preference.core_skills || preference.core_skills.length === 0) && COMPANY_FIXED_CORE_SKILLS[normalizedCompany]) {
        preference.core_skills = COMPANY_FIXED_CORE_SKILLS[normalizedCompany];
      }
      if ((!preference.soft_skills || preference.soft_skills.length === 0) && COMPANY_FIXED_SOFT_SKILLS[normalizedCompany]) {
        preference.soft_skills = COMPANY_FIXED_SOFT_SKILLS[normalizedCompany];
      }
    } else if (fixedPersona && !preference) {
      preference = {
        persona: fixedPersona,
        core_skills: COMPANY_FIXED_CORE_SKILLS[normalizedCompany] || [],
        soft_skills: COMPANY_FIXED_SOFT_SKILLS[normalizedCompany] || [],
        not_care: '',
        suggestion: '',
        strengthen: '',
      };
      preferenceSource = 'fixed';
    }

    return NextResponse.json({
      company_type: companyType,
      source: companyTypeSource,
      preference,
      report,
      fixed_persona: fixedPersona || null,
      preference_source: preferenceSource,
    });
  } catch (err) {
    console.error('Company profile API error:', err);
    return NextResponse.json({ error: '获取公司画像失败' }, { status: 500 });
  }
}
