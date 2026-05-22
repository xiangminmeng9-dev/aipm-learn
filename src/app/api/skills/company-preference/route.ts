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
      return NextResponse.json({ preference: null });
    }

    // Aggregate data
    const positions = [...new Set(analyses.map(a => a.position_name).filter(Boolean))];
    const skillFreq = new Map<string, number>();
    const gapFreq = new Map<string, number>();
    for (const a of analyses) {
      for (const s of ((a.extracted_skills as Array<{ skill_name: string }>) || [])) {
        if (s.skill_name) skillFreq.set(s.skill_name, (skillFreq.get(s.skill_name) || 0) + 1);
      }
      for (const g of ((a.gaps as Array<{ skill_name: string }>) || [])) {
        if (g.skill_name) gapFreq.set(g.skill_name, (gapFreq.get(g.skill_name) || 0) + 1);
      }
    }
    const topSkills = Array.from(skillFreq.entries()).sort((a, b) => b[1] - a[1]).slice(0, 10).map(([s, c]) => `${s}(${c})`);
    const topGaps = Array.from(gapFreq.entries()).sort((a, b) => b[1] - a[1]).slice(0, 8).map(([s, c]) => `${s}(${c})`);

    const prompt = `分析${company}的JD数据，抽象出该公司偏好的人才画像。

岗位：${positions.join('、')}
高频技能：${topSkills.join('、')}
常见差距：${topGaps.join('、')}

严格输出JSON，不要输出任何其他文字：
{"persona_tags":["画像标签1","画像标签2","画像标签3","画像标签4"],"core_skills":["技能1","技能2","技能3"],"background":"偏好背景描述","soft_skills":["软技能1","软技能2"],"avoid":"不太看重的方面","position_trend":"岗位倾向描述","growth_direction":"成长方向建议"}`;

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
        return NextResponse.json({ preference: parsed });
      } catch {
        // fallback
      }
    }
    return NextResponse.json({ preference: { persona_tags: [], core_skills: [], background: result.trim(), soft_skills: [], avoid: '', position_trend: '', growth_direction: '' } });
  } catch (err) {
    console.error('Company preference error:', err);
    return NextResponse.json({ error: '生成失败' }, { status: 500 });
  }
}
