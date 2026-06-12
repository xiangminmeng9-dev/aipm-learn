import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { generateText } from '@/lib/ai/claude';
import { aggregateSkills } from '@/lib/ai/skill-normalizer';
import { getCompanyNameVariants } from '@/lib/ai/company-personas';
import { withTimeout, AI_TIMEOUT_MS } from '@/lib/ai/with-timeout';

const COMPANY_ANALYSIS_PROMPT = `你是一位资深招聘分析师，擅长从多个岗位JD中深入分析公司的招聘偏好和人才画像。

请基于以下数据，生成一份针对该公司的招聘偏好分析报告。

公司名称：{companyName}
分析岗位数：{positionCount}
提取技能总数：{skillCount}

全部技能频率统计（归一化后，按频率排序）：
{skillStats}

各岗位详情：
{positionDetails}

简历差距汇总：
{resumeGaps}

请严格按照以下5个部分输出分析报告，每部分用中文数字编号加顿号开头（如"一、"），部分之间空一行。不要使用任何markdown格式符号（如星号、井号、反引号等），全部使用纯文本：

一、该公司喜欢招什么样的人
重点阐述该公司偏好的人才画像，必须充分利用所有岗位数据来佐证。展示高频通用技能及其出现频率（如"在分析的X个岗位中，Y技能出现了Z次"），说明为什么该公司看重这些能力。不要只列几个数字，要展现数据全貌，体现分析的广度和深度。

二、不同岗位的特殊性
列出各岗位独特看重的技能，不高频但对于AI产品经理岗位仍然重要。格式为"XX岗位重点看重XX技能"，每个岗位列出1-2个特别技能，总共3-5个即可。

三、不看重什么及差异点
指出该公司相对不强调的能力，说明不看重的原因，并与其他企业（如大厂、创业公司、外企等）对比，指出差异点在哪里。

四、具体岗位待优化建议
针对每个岗位给出具体建议，格式为"根据XX岗位JD，目前简历欠缺XX，建议添加XX描述"，让求职者知道具体怎么改简历。

五、投递建议与补强方向
最终给出是否值得投递该公司的明确建议，以及投递后重点补强学习方向（列出2-3个具体学习方向）。

输出要求：
- 全部纯文本，不要使用任何特殊符号如星号、井号、反引号、加粗标记等
- 语言简洁有力，避免空话
- 用具体数据支撑观点，数据来源要覆盖所有分析的岗位
- 突出差异化洞察，让求职者获得真正有价值的信息`;

export async function POST(request: NextRequest) {
  try {
    const { companyName } = await request.json();
    if (!companyName) {
      return NextResponse.json({ error: '请提供公司名称' }, { status: 400 });
    }

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: '请先登录' }, { status: 401 });
    }

    const companyVariants = getCompanyNameVariants(companyName);

    let { data: analyses, error } = await supabase
      .from('jd_analyses')
      .select('*')
      .eq('user_id', user.id)
      .in('company_name', companyVariants)
      .order('created_at', { ascending: false });

    // Fallback: if no results, try ilike substring match for unknown companies
    if ((!error && (!analyses || analyses.length === 0))) {
      const { data: fuzzyAnalyses, error: fuzzyError } = await supabase
        .from('jd_analyses')
        .select('*')
        .eq('user_id', user.id)
        .ilike('company_name', `%${companyName}%`)
        .order('created_at', { ascending: false });
      if (!fuzzyError && fuzzyAnalyses && fuzzyAnalyses.length > 0) {
        analyses = fuzzyAnalyses;
      }
    }

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    if (!analyses || analyses.length === 0) {
      return NextResponse.json({ error: '未找到该公司的分析记录' }, { status: 404 });
    }

    // Aggregate skills with normalization
    const skillMap = aggregateSkills(analyses);
    const sortedSkills = Array.from(skillMap.entries())
      .sort((a, b) => b[1].count - a[1].count);

    // Build position details (per-JD skill list)
    const positionDetails: string[] = [];
    for (const analysis of analyses) {
      const posName = analysis.position_name || '未命名岗位';
      const skills = analysis.extracted_skills || [];
      const skillList = skills.map((s: { skill_name: string; importance?: string }) =>
        `${s.skill_name}(${s.importance || '未标注'})`
      ).join('、');
      positionDetails.push(`【${posName}】${skillList}`);
    }

    // Resume gaps
    const allResumeGaps: string[] = [];
    for (const analysis of analyses) {
      if (analysis.resume_match?.resume_gaps) {
        for (const gap of analysis.resume_match.resume_gaps) {
          allResumeGaps.push(`【${analysis.position_name || '未命名岗位'}】${gap.skill_name}: ${gap.detail || '缺少相关经验'}。建议: ${gap.suggestion || '补充相关项目经验'}`);
        }
      }
    }

    // Skill stats with positions info
    const skillStats = sortedSkills
      .map(([name, data]) => {
        const positionsStr = data.positions && data.positions.length === analyses.length
          ? '全部岗位'
          : `${data.positions?.length || 0}个岗位`;
        return `${name}(${data.count}次, ${positionsStr})`;
      })
      .join('、');

    const prompt = COMPANY_ANALYSIS_PROMPT
      .replace('{companyName}', companyName)
      .replace('{positionCount}', String(analyses.length))
      .replace('{skillCount}', String(skillMap.size))
      .replace('{skillStats}', skillStats || '无')
      .replace('{positionDetails}', positionDetails.join('\n'))
      .replace('{resumeGaps}', allResumeGaps.length > 0 ? allResumeGaps.join('\n') : '暂无简历差距数据');

    let report: string;
    try {
      report = await withTimeout(generateText(prompt, { maxTokens: 2048 }), AI_TIMEOUT_MS);
    } catch (aiError) {
      console.error('Company analysis AI call error:', aiError);
      return NextResponse.json(
        { error: `AI 调用失败: ${aiError instanceof Error ? aiError.message : '未知错误'}` },
        { status: 500 },
      );
    }

    return NextResponse.json({
      companyName,
      positionCount: analyses.length,
      skillCount: skillMap.size,
      topSkills: sortedSkills.slice(0, 15).map(([name, data]) => ({
        name,
        count: data.count,
        positions: data.positions,
      })),
      report,
    });
  } catch (err) {
    console.error('Company analysis error:', err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : '分析失败' },
      { status: 500 }
    );
  }
}