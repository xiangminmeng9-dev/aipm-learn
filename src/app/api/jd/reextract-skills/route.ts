import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { generateText } from '@/lib/ai/claude';
import { getSkillCategory, SKILL_CATEGORIES } from '@/lib/ai/skill-categories';
import { normalizeSkill } from '@/lib/ai/skill-normalizer';

// 使用归一化后的技能分类
// JD分析后通过normalizeSkill()自动归一化到标准技能
// prompt中的维度列表与skill-categories.ts的7大类对齐

const REEXTRACT_PROMPT = `你是AI产品经理招聘分析师。请从以下JD文本中提取技能。

JD文本：
{jdText}

规则：
1. 尽可能提取JD中明确提及或强暗示的能力要求，每个JD至少提取12个技能
2. 技能名优先使用常见标准名称，含义相近的统一归到标准名（如"提示词工程"→"Prompt Engineering"，"数据分析"→"数据驱动"，"自驱力"≠"快速学习"）
3. 技能提取范围要广，以下维度都要覆盖：
   - AI核心技术（大模型应用与落地/大模型技术原理/Agent搭建/MCP协议/Function Calling/Prompt Engineering/RAG/微调/模型评测/多模态等）
   - AI产品（AI产品设计/AI前沿技术洞察/AI工具使用/对话系统/推荐系统/AIGC创作等）
   - 产品核心（产品思维/需求分析/业务抽象能力/PRD/交互设计/原型设计/产品策略/产品0到1/产品运营等）
   - 数据与评估（数据驱动/数据标注/用户反馈闭环/指标体系/A/B测试/SQL/竞品分析等）
   - 技术理解（技术理解/技术沟通能力/代码能力/机器学习基础/工作流设计/API设计/NLP/Python等）
   - 用户与商业（用户研究/用户同理心/商家理解/商业分析/行业认知/电商经验/B端产品/C端产品经验/增长策略/广告投放/营销策略等）
   - 软技能（协作能力/沟通表达能力/项目管理/团队管理能力/快速学习/自驱力/执行力/责任心/独立思考/逻辑思维/创新精神等）
4. 注意区分容易混淆的技能：自驱力≠快速学习，执行力≠结果导向，责任心≠抗压能力，独立思考≠快速学习
5. 每个技能标注importance：high（核心要求/必须有）、medium（重要/加分项）、low（提及即可）
6. 每个技能标注evidence：JD原文中对应的句子片段（截取关键词即可，不超过30字）
7. 同一技能不要重复选取

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
      .select('id, position_name, company_name, jd_text, extracted_skills')
      .eq('user_id', user.id)
      .order('created_at', { ascending: true });

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    if (!analyses || analyses.length === 0) return NextResponse.json({ error: '没有JD数据' }, { status: 404 });

    let processed = 0;
    let failed = 0;
    const total = analyses.length;

    for (const jd of analyses) {
      try {
        const rawText = jd.jd_text || '';
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
          skill_name: normalizeSkill(s.skill_name),
          importance: s.importance || 'medium',
          evidence: s.evidence || '',
          category: getSkillCategory(normalizeSkill(s.skill_name)),
        }));

        const otherSkills = (parsed.other_skills || []).map((name: string) => ({
          skill_name: normalizeSkill(name),
          importance: 'medium' as const,
          evidence: '',
          category: getSkillCategory(normalizeSkill(name)),
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
