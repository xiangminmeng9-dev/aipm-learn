import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { generateText } from '@/lib/ai/claude';
import { aggregateSkills } from '@/lib/ai/skill-normalizer';
import { getFixedPersona, getCompanyNameVariants } from '@/lib/ai/company-personas';

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: '请先登录' }, { status: 401 });

    const company = request.nextUrl.searchParams.get('company');
    if (!company) return NextResponse.json({ error: '缺少公司名' }, { status: 400 });

    const companyVariants = getCompanyNameVariants(company);

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
        .ilike('company_name', `%${company}%`)
        .order('created_at', { ascending: false })
        .limit(50);
      if (fuzzyAnalyses && fuzzyAnalyses.length > 0) {
        analyses = fuzzyAnalyses;
      }
    }

    if (!analyses || analyses.length === 0) {
      return NextResponse.json({ preference: null });
    }

    // Aggregate skills with normalization
    const positions = [...new Set(analyses.map(a => a.position_name).filter(Boolean))];
    const skillMap = aggregateSkills(analyses);

    // Aggregate gaps (no normalization for gaps - they're already specific)
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

    const prompt = `你是一位资深互联网招聘分析师，非常了解各大公司的招聘风格和用人偏好。请基于以下JD数据，用非常直白、接地气的语言描述${company}想要什么样的人。

分析岗位数：${analyses.length}
招聘岗位：${positions.join('、')}
高频技能（归一化后，含出现次数）：${skillDetail}
常见技能差距（含出现次数）：${gapDetail}

请严格按以下JSON格式输出（不要输出其他内容）：
{
  "persona": "用非常口语化、直白的语言描述这家公司想要什么样的人。必须像内部员工私下聊天一样说出真相，要写出鲜明的个性差异。必须覆盖：1)看重什么样的人（性格、做事风格）2)特别看重什么能力或特质 3)面试风格 4)喜欢什么类型 5)讨厌什么类型。参考风格：'聪明、能扛事的，特别看重你对数据的敏感度，思维的深度，所有岗位都会往技术思维上靠，你去面试，面试官基本不跟你唠闲嗑，拿着简历深挖你的项目，比如这个想法怎么来的、怎么验证的、怎么落地的、中间翻过几次车怎么救回来的，而且特别喜欢有主见、偏强势有独立判断的人。' 注意：只写偏好描述，不要写'具体体现在'、'核心技能'、'建议'等总结性内容。",
  "core_skills": [{"name":"技能名","count":出现次数}],
  "soft_skills": ["软技能1","软技能2"],
  "not_care": "用直白的语言说这家公司不太看重什么",
  "suggestion": "给求职者的具体建议，包括怎么准备面试、简历怎么改",
  "strengthen": "目前简历最需要补强的技能"
}`;

    const result = await generateText(prompt, { maxTokens: 2048 });

    // Parse JSON with truncation repair
    const jsonMatch = result.match(/\{[\s\S]*\}/);
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
        const parsed = JSON.parse(jsonStr);
        // Prepend fixed persona if available
        const fixedPersona = getFixedPersona(company);
        if (fixedPersona && parsed.persona) {
          parsed.persona = fixedPersona + '\n\n' + parsed.persona;
        } else if (fixedPersona && !parsed.persona) {
          parsed.persona = fixedPersona;
        }
        return NextResponse.json({ preference: parsed, fixed_persona: fixedPersona || null });
      } catch {
        // fallback
      }
    }
    // Fallback with fixed persona
    const fixedPersona = getFixedPersona(company);
    const fallbackPersona = (fixedPersona ? fixedPersona + '\n\n' : '') + result.trim();
    return NextResponse.json({ preference: { persona: fallbackPersona, core_skills: [], soft_skills: [], not_care: '', suggestion: '', strengthen: '' }, fixed_persona: fixedPersona || null });
  } catch (err) {
    console.error('Company preference error:', err);
    return NextResponse.json({ error: '生成失败' }, { status: 500 });
  }
}
