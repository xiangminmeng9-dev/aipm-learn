import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { generateText } from '@/lib/ai/claude';
import { aggregateSkills } from '@/lib/ai/skill-normalizer';

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
      .limit(50);

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

    const prompt = `基于以下JD数据，分析${company}偏好什么样的人。

分析岗位数：${analyses.length}
招聘岗位：${positions.join('、')}
高频技能（归一化后，含出现次数）：${skillDetail}
常见技能差距（含出现次数）：${gapDetail}

严格输出JSON，不要输出其他内容：
{
  "persona": "画像描述，如：具备AI技术落地经验、数据驱动决策的产品经理",
  "core_skills": [{"name":"技能名","count":出现次数}],
  "soft_skills": ["软技能1","软技能2"],
  "not_care": "不看重的内容",
  "suggestion": "给求职者的建议",
  "strengthen": "需要补强的技能"
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
        return NextResponse.json({ preference: parsed });
      } catch {
        // fallback
      }
    }
    return NextResponse.json({ preference: { persona: result.trim(), core_skills: [], soft_skills: [], not_care: '', suggestion: '', strengthen: '' } });
  } catch (err) {
    console.error('Company preference error:', err);
    return NextResponse.json({ error: '生成失败' }, { status: 500 });
  }
}
