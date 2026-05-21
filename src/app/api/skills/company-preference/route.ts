import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { generateText } from '@/lib/ai/claude';

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: '请先登录' }, { status: 401 });

    const company = request.nextUrl.searchParams.get('company');
    if (!company) return NextResponse.json({ error: '缺少公司名' }, { status: 400 });

    const { data: analyses } = await supabase
      .from('jd_analyses')
      .select('position_name, extracted_skills, gaps, company_name')
      .eq('user_id', user.id)
      .eq('company_name', company)
      .order('created_at', { ascending: false })
      .limit(20);

    if (!analyses || analyses.length === 0) {
      return NextResponse.json({ preference: '暂无该公司的分析数据' });
    }

    const positions = analyses.map(a => a.position_name).filter(Boolean);
    const allSkills: string[] = [];
    const allGaps: string[] = [];
    for (const a of analyses) {
      const skills = (a.extracted_skills as Array<{ skill_name: string }>) || [];
      for (const s of skills) {
        if (s.skill_name) allSkills.push(s.skill_name);
      }
      const gaps = (a.gaps as Array<{ skill_name: string }>) || [];
      for (const g of gaps) {
        if (g.skill_name) allGaps.push(g.skill_name);
      }
    }

    // Count skill frequency
    const skillFreq = new Map<string, number>();
    for (const s of allSkills) {
      skillFreq.set(s, (skillFreq.get(s) || 0) + 1);
    }
    const topSkills = Array.from(skillFreq.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 15)
      .map(([skill, count]) => `${skill}(${count}次)`);

    const gapFreq = new Map<string, number>();
    for (const g of allGaps) {
      gapFreq.set(g, (gapFreq.get(g) || 0) + 1);
    }
    const topGaps = Array.from(gapFreq.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([skill, count]) => `${skill}(${count}次)`);

    const prompt = `基于以下数据，分析${company}偏好什么样的人，输出结构化JSON。

招聘岗位：${positions.join('、')}
高频技能要求：${topSkills.join('、')}
常见技能差距：${topGaps.join('、')}

请输出如下JSON（不要输出其他内容）：
{
  "persona_tags": ["3-5个画像标签，如：技术型PM、数据驱动型、AI实战派"],
  "core_skills": ["最核心的3个技能偏好，每个不超过6字"],
  "background": "一句话描述偏好的背景/经验类型（不超过20字）",
  "soft_skills": ["2-3个软技能偏好，如：跨部门协作、抗压能力"],
  "avoid": "一句话描述这类公司不太看重什么（不超过15字）"
}

要求：
- persona_tags 要抽象出画像特征，不是简单罗列技能名
- core_skills 只写最突出的3个，不要贪多
- background 要具体，如"3年以上AI产品落地经验"而非"有经验"
- avoid 要有洞察，如"不太看重纯学术背景"
- 所有字段精炼，杜绝废话`;

    const result = await generateText(prompt, {
      model: 'haiku',
      maxTokens: 500,
    });

    // Parse structured JSON from AI response
    const jsonMatch = result.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      try {
        const parsed = JSON.parse(jsonMatch[0]);
        return NextResponse.json({ preference: parsed });
      } catch {
        // fallback: return raw text if JSON parse fails
      }
    }
    return NextResponse.json({ preference: { persona_tags: [], core_skills: [], background: result.trim(), soft_skills: [], avoid: '' } });
  } catch (err) {
    console.error('Company preference error:', err);
    return NextResponse.json({ error: '生成失败' }, { status: 500 });
  }
}
