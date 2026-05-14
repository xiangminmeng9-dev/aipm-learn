import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { generateText } from '@/lib/ai/claude';
import { buildCombinedJdAnalysisPrompt, COMBINED_JD_ANALYSIS_SYSTEM_PROMPT, buildSkillMatchingPrompt, SKILL_MATCHING_SYSTEM_PROMPT } from '@/lib/ai/prompts';

export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: '请先登录' }, { status: 401 });
    }

    const { data, error } = await supabase
      .from('jd_analyses')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(20);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ analyses: data || [] });
  } catch (err) {
    console.error('JD analyze GET error:', err);
    return NextResponse.json({ error: '获取历史失败' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: '未登录' }, { status: 401 });
    }

    const { id } = await request.json();
    if (!id) {
      return NextResponse.json({ error: '缺少记录ID' }, { status: 400 });
    }

    const { error } = await supabase
      .from('jd_analyses')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id);

    if (error) {
      console.error('Delete JD analysis error:', error);
      return NextResponse.json({ error: '删除失败' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('JD analyze DELETE error:', err);
    return NextResponse.json({ error: '删除失败' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const { jdText, companyName } = await request.json();
    if (!jdText || typeof jdText !== 'string') {
      return NextResponse.json({ error: '请提供岗位描述文本' }, { status: 400 });
    }

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: '请先登录' }, { status: 401 });
    }

    // Fetch modules first so we can do extraction + matching in one AI call
    const { data: modules } = await supabase
      .from('skill_modules')
      .select('id, name, description')
      .limit(20);

    const moduleList = (modules || []).map((m: { id: string; name: string; description?: string }) => ({
      id: m.id,
      name: m.name,
      description: m.description,
    }));

    const defaultModules = moduleList.length > 0 ? moduleList : [
      { id: 'm1', name: 'AI 产品基础', description: 'AI 产品经理核心概念、AI 技术栈概览' },
      { id: 'm2', name: 'LLM 技术原理', description: '大语言模型原理、Prompt Engineering、RAG、Agent' },
      { id: 'm3', name: 'AI 产品设计', description: 'AI 产品设计方法、用户体验、交互设计' },
      { id: 'm4', name: '数据与评估', description: 'AI 产品数据指标、A/B 测试、效果评估' },
      { id: 'm5', name: 'AI 工程实践', description: 'MLOps、模型部署、性能优化' },
      { id: 'm6', name: '行业应用', description: 'AI 在各行业的应用案例和商业模式' },
    ];

    // Single AI call: extract skills + match with modules
    const prompt = buildCombinedJdAnalysisPrompt(jdText, defaultModules);

    let aiResponse: string;
    try {
      aiResponse = await generateText(prompt, { system: COMBINED_JD_ANALYSIS_SYSTEM_PROMPT, maxTokens: 8192 });
    } catch (aiError) {
      console.error('JD analyze AI call error:', aiError);
      return NextResponse.json(
        { error: `AI 调用失败: ${aiError instanceof Error ? aiError.message : '未知错误'}` },
        { status: 500 },
      );
    }

    console.log('JD analyze AI response length:', aiResponse?.length || 0);
    console.log('JD analyze AI response preview:', aiResponse?.substring(0, 500));

    let parsed;
    try {
      // Try to extract JSON from response
      const jsonMatch = aiResponse.match(/\{[\s\S]*\}/);
      if (!jsonMatch) throw new Error('AI 返回格式异常');

      let jsonStr = jsonMatch[0];

      // Try to fix truncated JSON by closing open brackets
      const openBrackets = (jsonStr.match(/\[/g) || []).length;
      const closeBrackets = (jsonStr.match(/\]/g) || []).length;
      const openBraces = (jsonStr.match(/\{/g) || []).length;
      const closeBraces = (jsonStr.match(/\}/g) || []).length;

      // If JSON is truncated, try to fix it
      if (openBrackets > closeBrackets || openBraces > closeBraces) {
        // Remove trailing incomplete content
        jsonStr = jsonStr.replace(/,\s*"[^"]*":\s*[^,}\]]*$/g, '');
        jsonStr = jsonStr.replace(/,\s*$/g, '');

        // Close open brackets
        for (let i = 0; i < openBrackets - closeBrackets; i++) jsonStr += ']';
        for (let i = 0; i < openBraces - closeBraces; i++) jsonStr += '}';
      }

      parsed = JSON.parse(jsonStr);
    } catch (parseError) {
      console.error('JD analyze parse error:', parseError);
      console.error('Raw response:', aiResponse);
      return NextResponse.json(
        { error: 'AI 分析结果解析失败，请重试', raw: aiResponse?.substring(0, 1000) },
        { status: 500 },
      );
    }

    // Normalize extracted_skills to object array
    const skills: { skill_name: string; category: string; importance: string }[] = (parsed.extracted_skills || []).map((s: unknown) => {
      if (typeof s === 'string') {
        return { skill_name: s, category: '未分类', importance: 'medium' };
      }
      const obj = s as Record<string, unknown>;
      return {
        skill_name: String(obj.skill_name || obj.name || s),
        category: String(obj.category || '未分类'),
        importance: String(obj.importance || 'medium'),
      };
    });

    // Parse matches and gaps from the combined response
    let skillModuleMatches: { skill_name: string; module_id: string | null; module_name: string; match_score: number }[] = [];
    let gaps: { skill_name: string; category: string; suggestion: string; related_module_id: string | null; related_module_name: string | null }[] = [];

    const matchData = parsed.matches || [];
    skillModuleMatches = matchData.map((m: Record<string, unknown>) => ({
      skill_name: String(m.skill_name || m.skill || ''),
      module_id: m.module_id ? String(m.module_id) : null,
      module_name: String(m.module_name || ''),
      match_score: typeof m.match_score === 'number' ? m.match_score : 50,
    }));
    if (skillModuleMatches.length > 0 && !skillModuleMatches[0].skill_name) {
      skillModuleMatches = skillModuleMatches.map((m, i) => ({
        ...m,
        skill_name: i < skills.length ? skills[i].skill_name : m.module_name,
      }));
    }

    gaps = (parsed.gaps || []).map((g: unknown) => {
      if (typeof g === 'string') {
        return { skill_name: g, category: '未分类', suggestion: '建议深入学习', related_module_id: null, related_module_name: null };
      }
      const obj = g as Record<string, unknown>;
      return {
        skill_name: String(obj.skill_name || ''),
        category: String(obj.category || '未分类'),
        suggestion: String(obj.suggestion || ''),
        related_module_id: obj.related_module_id ? String(obj.related_module_id) : null,
        related_module_name: obj.related_module_name ? String(obj.related_module_name) : null,
      };
    });

    // Fallback: if no gaps from AI, treat all extracted skills as gaps
    if (gaps.length === 0 && skills.length > 0 && skillModuleMatches.length === 0) {
      gaps = skills.map((s) => ({
        skill_name: s.skill_name,
        category: s.category,
        suggestion: `建议学习 ${s.skill_name} 相关知识和实践`,
        related_module_id: null,
        related_module_name: null,
      }));
    }

    const result = {
      company_name: companyName || parsed.company_name || null,
      position_name: parsed.position_name || '未命名岗位',
      extracted_skills: skills,
      skill_module_matches: skillModuleMatches,
      gaps,
    };

    // Step 4: Save to database with full results
    const { data: insertedRow, error: dbError } = await supabase
      .from('jd_analyses')
      .insert({
        user_id: user.id,
        jd_text: jdText,
        company_name: result.company_name,
        position_name: result.position_name,
        extracted_skills: result.extracted_skills,
        skill_module_matches: result.skill_module_matches,
        gaps: result.gaps,
      })
      .select('id')
      .single();

    if (dbError) {
      console.error('Failed to save JD analysis:', dbError);
    }

    // Step 5: Upsert skills into jd_skills for frequency tracking
    if (insertedRow && skills.length > 0) {
      for (const skill of skills) {
        // Try to increment existing skill frequency
        const { data: existingSkill } = await supabase
          .from('jd_skills')
          .select('id, frequency')
          .eq('user_id', user.id)
          .eq('skill_name', skill.skill_name)
          .maybeSingle();

        if (existingSkill) {
          await supabase
            .from('jd_skills')
            .update({
              frequency: (existingSkill.frequency || 0) + 1,
              last_seen_at: new Date().toISOString(),
            })
            .eq('id', existingSkill.id);
        } else {
          await supabase.from('jd_skills').insert({
            user_id: user.id,
            skill_name: skill.skill_name,
            category: skill.category,
            frequency: 1,
            first_seen_at: new Date().toISOString(),
            last_seen_at: new Date().toISOString(),
          });
        }
      }
    }

    return NextResponse.json({ ...result, id: insertedRow?.id });
  } catch (err) {
    console.error('JD analyze error:', err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : '分析失败' },
      { status: 500 },
    );
  }
}
