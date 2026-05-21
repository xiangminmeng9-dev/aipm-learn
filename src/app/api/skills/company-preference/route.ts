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

    const prompt = `基于以下数据，用一段连贯的大白话总结${company}的招聘偏好。不要列点，写成一整段话，像跟朋友聊天一样自然流畅。

招聘岗位：${positions.join('、')}
高频技能要求：${topSkills.join('、')}
常见技能差距：${topGaps.join('、')}

要求：
- 直接说结论，不要"从数据来看"这种废话
- 提到最核心的2-3个技能偏好
- 如果有明显的岗位倾向也要提
- 写成一整段话，5-8句话左右，要有逻辑递进`;

    const result = await generateText(prompt, {
      model: 'haiku',
      maxTokens: 500,
    });

    return NextResponse.json({ preference: result.trim() });
  } catch (err) {
    console.error('Company preference error:', err);
    return NextResponse.json({ error: '生成失败' }, { status: 500 });
  }
}
