import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { generateText } from '@/lib/ai/claude';

const STANDARD_SKILLS = [
  // AI核心技术
  '大模型应用与落地', 'Agent搭建', 'Prompt Engineering', 'RAG', '微调', '模型评测', '多模态',
  // AI产品
  'AI产品设计', '对话系统', '推荐系统', '知识图谱', 'AI伦理', 'AIGC创作',
  // 产品核心
  '产品思维', '需求分析', 'PRD', '交互设计', '产品策略', '产品运营',
  // 数据与评估
  '数据驱动', '指标体系', 'A/B测试', 'SQL', '竞品分析',
  // 技术理解
  '技术理解', '平台化建设', 'NLP', 'Python',
  // 用户与商业
  '用户研究', '商业分析', '行业认知', 'B端产品',
  // 软技能
  '协作能力', '项目管理', '快速学习', '抗压能力', '逻辑思维', '结果导向', '创新精神',
];

const REEXTRACT_PROMPT = `你是AI产品经理招聘分析师。请从以下JD文本中提取技能，必须从标准技能列表中选择匹配的技能名。

标准技能列表（共${STANDARD_SKILLS.length}个）：
${STANDARD_SKILLS.map((s, i) => `${i + 1}. ${s}`).join('\n')}

JD文本：
{jdText}

规则：
1. 只能从上面的标准技能列表中选择，不要创造新技能名
2. 每个JD至少提取12个技能，尽可能多提取，标准是JD中明确提及或强暗示的能力要求
3. 技能提取范围要广，不要只提取最核心的3-5个，以下维度都要覆盖：
   - AI技术能力（大模型/Agent/Prompt/RAG/微调/评测/多模态等）
   - 产品能力（产品思维/需求分析/PRD/交互设计/产品策略/产品运营等）
   - 数据能力（数据驱动/指标体系/A/B测试/SQL/竞品分析等）
   - 技术理解（技术沟通/平台化/NLP/Python等）
   - 用户与商业（用户研究/商业分析/行业认知/B端产品等）
   - 软技能（协作/项目管理/快速学习/抗压/逻辑思维/结果导向/创新精神等）
4. 每个技能标注importance：high（核心要求/必须有）、medium（重要/加分项）、low（提及即可）
5. 每个技能标注evidence：JD原文中对应的句子片段（截取关键词即可，不超过30字）
6. 同一技能不要重复选取
7. 如果JD中有标准列表未覆盖的重要技能，放在other_skills中

严格输出JSON，不要输出其他内容：
{
  "skills": [
    {"skill_name": "标准技能名", "importance": "high/medium/low", "evidence": "原文片段"},
    ...
  ],
  "other_skills": ["标准列表未覆盖但JD明确要求的技能"]
}`;

export async function POST() {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: '请先登录' }, { status: 401 });

    const { data: analyses, error } = await supabase
      .from('jd_analyses')
      .select('id, position_name, company_name, raw_text, extracted_skills')
      .eq('user_id', user.id)
      .order('created_at', { ascending: true });

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    if (!analyses || analyses.length === 0) return NextResponse.json({ error: '没有JD数据' }, { status: 404 });

    let processed = 0;
    let failed = 0;
    const total = analyses.length;

    for (const jd of analyses) {
      try {
        const rawText = jd.raw_text || '';
        if (!rawText || rawText.length < 50) {
          failed++;
          continue;
        }

        const prompt = REEXTRACT_PROMPT.replace('{jdText}', rawText.slice(0, 4000));
        const result = await generateText(prompt, { maxTokens: 3000 });

        const jsonMatch = result.match(/\{[\s\S]*\}/);
        if (!jsonMatch) {
          failed++;
          continue;
        }

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
        const skills = (parsed.skills || []).map((s: { skill_name: string; importance: string; evidence: string }) => ({
          skill_name: s.skill_name,
          importance: s.importance || 'medium',
          evidence: s.evidence || '',
          category: getSkillCategory(s.skill_name),
        }));

        const otherSkills = (parsed.other_skills || []).map((name: string) => ({
          skill_name: name,
          importance: 'medium' as const,
          evidence: '',
          category: '其他',
        }));

        const allSkills = [...skills, ...otherSkills];

        await supabase
          .from('jd_analyses')
          .update({ extracted_skills: allSkills })
          .eq('id', jd.id);

        processed++;
      } catch {
        failed++;
      }
    }

    return NextResponse.json({
      success: true,
      total,
      processed,
      failed,
      message: `重新提取完成：${processed}/${total}条成功，${failed}条失败`,
    });
  } catch (err) {
    console.error('Reextract error:', err);
    return NextResponse.json({ error: '重新提取失败' }, { status: 500 });
  }
}

function getSkillCategory(skillName: string): string {
  const categories: Record<string, string[]> = {
    'AI核心技术': ['大模型应用与落地', 'Agent搭建', 'Prompt Engineering', 'RAG', '微调', '模型评测', '多模态'],
    'AI产品': ['AI产品设计', '对话系统', '推荐系统', '知识图谱', 'AI伦理', 'AIGC创作'],
    '产品核心': ['产品思维', '需求分析', 'PRD', '交互设计', '产品策略', '产品运营'],
    '数据与评估': ['数据驱动', '指标体系', 'A/B测试', 'SQL', '竞品分析'],
    '技术理解': ['技术理解', '平台化建设', 'NLP', 'Python'],
    '用户与商业': ['用户研究', '商业分析', '行业认知', 'B端产品'],
    '软技能': ['协作能力', '项目管理', '快速学习', '抗压能力', '逻辑思维', '结果导向', '创新精神'],
  };
  for (const [cat, skills] of Object.entries(categories)) {
    if (skills.includes(skillName)) return cat;
  }
  return '其他';
}
