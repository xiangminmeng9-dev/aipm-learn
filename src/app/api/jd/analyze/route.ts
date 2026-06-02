import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { generateText } from '@/lib/ai/claude';
import { buildCombinedJdAnalysisPrompt, COMBINED_JD_ANALYSIS_SYSTEM_PROMPT } from '@/lib/ai/prompts';

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
      .order('created_at', { ascending: false });

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
    const { jdText, companyName, resumeText, existingId } = await request.json();
    if (!jdText || typeof jdText !== 'string') {
      return NextResponse.json({ error: '请提供岗位描述文本' }, { status: 400 });
    }

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: '请先登录' }, { status: 401 });
    }

    // 并行获取模块和已有技能
    const [modulesRes, existingSkillsRes] = await Promise.all([
      supabase.from('skill_modules').select('id, name, description').limit(20),
      supabase.from('jd_skills').select('id, skill_name, frequency').eq('user_id', user.id),
    ]);

    const moduleList = (modulesRes.data || []).map((m) => ({
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

    // 构建已有技能映射用于快速查找
    const existingSkillsMap = new Map(
      (existingSkillsRes.data || []).map(s => [s.skill_name, s])
    );

    // AI调用
    const prompt = buildCombinedJdAnalysisPrompt(jdText, defaultModules, resumeText);

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

    let parsed;
    try {
      const jsonMatch = aiResponse.match(/\{[\s\S]*\}/);
      if (!jsonMatch) throw new Error('AI 返回格式异常');

      let jsonStr = jsonMatch[0];

      // 修复截断的JSON
      const openBrackets = (jsonStr.match(/\[/g) || []).length;
      const closeBrackets = (jsonStr.match(/\]/g) || []).length;
      const openBraces = (jsonStr.match(/\{/g) || []).length;
      const closeBraces = (jsonStr.match(/\}/g) || []).length;

      if (openBrackets > closeBrackets || openBraces > closeBraces) {
        // Try to preserve resume_match if it was partially written
        const resumeMatchStart = jsonStr.lastIndexOf('"resume_match"');
        if (resumeMatchStart !== -1 && resumeMatchStart > jsonStr.lastIndexOf('}')) {
          // resume_match field exists but object is incomplete — remove it entirely so null is used
          jsonStr = jsonStr.slice(0, resumeMatchStart).replace(/,\s*$/, '');
        } else {
          jsonStr = jsonStr.replace(/,\s*"[^"]*":\s*[^,}\]]*$/g, '');
          jsonStr = jsonStr.replace(/,\s*$/g, '');
        }
        for (let i = 0; i < openBrackets - closeBrackets; i++) jsonStr += ']';
        for (let i = 0; i < openBraces - closeBraces; i++) jsonStr += '}';
      }

      parsed = JSON.parse(jsonStr);
    } catch (parseError) {
      console.error('JD analyze parse error:', parseError);
      return NextResponse.json(
        { error: 'AI 分析结果解析失败，请重试', raw: aiResponse?.substring(0, 500) },
        { status: 500 },
      );
    }

    // 标准化技能数据
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

    const skillModuleMatches = (parsed.matches || []).map((m: Record<string, unknown>) => ({
      skill_name: String(m.skill_name || m.skill || ''),
      module_id: m.module_id ? String(m.module_id) : null,
      module_name: String(m.module_name || ''),
      match_score: typeof m.match_score === 'number' ? m.match_score : 50,
    }));

    const gaps = (parsed.gaps || []).map((g: unknown) => {
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

    // 简历匹配结果
    const resumeMatch = parsed.resume_match ? {
      match_score: typeof parsed.resume_match.match_score === 'number' ? parsed.resume_match.match_score : 0,
      strengths: Array.isArray(parsed.resume_match.strengths) ? parsed.resume_match.strengths.map(String) : [],
      resume_gaps: Array.isArray(parsed.resume_match.resume_gaps) ? parsed.resume_match.resume_gaps.map((g: unknown) => {
        if (typeof g === 'string') return { skill_name: g, detail: '', suggestion: '' };
        const obj = g as Record<string, unknown>;
        return {
          skill_name: String(obj.skill_name || ''),
          detail: String(obj.detail || ''),
          suggestion: String(obj.suggestion || ''),
        };
      }) : [],
      improvement_suggestions: Array.isArray(parsed.resume_match.improvement_suggestions) ? parsed.resume_match.improvement_suggestions.map(String) : [],
      apply_recommendation: parsed.resume_match.apply_recommendation ? {
        should_apply: !!parsed.resume_match.apply_recommendation.should_apply,
        confidence: ['high', 'medium', 'low'].includes(parsed.resume_match.apply_recommendation.confidence) ? parsed.resume_match.apply_recommendation.confidence : 'medium',
        reason: String(parsed.resume_match.apply_recommendation.reason || ''),
        key_actions: Array.isArray(parsed.resume_match.apply_recommendation.key_actions) ? parsed.resume_match.apply_recommendation.key_actions.map(String) : [],
      } : null,
    } : null;

    const result = {
      company_name: (() => {
        const raw = (companyName || parsed.company_name || '').trim();
        const unknownPatterns = /^(未|无|没有|暂无|未提及|未明确|未提供|未注明|未填写|none|null|n\/a|—|-)$/i;
        return !raw || unknownPatterns.test(raw) ? null : raw;
      })(),
      position_name: parsed.position_name || '未命名岗位',
      extracted_skills: skills,
      skill_module_matches: skillModuleMatches,
      gaps,
      resume_match: resumeMatch,
    };

    // 并行保存分析结果和更新技能频率
    const now = new Date().toISOString();
    const skillUpserts = skills.map(skill => {
      const existing = existingSkillsMap.get(skill.skill_name);
      if (existing) {
        return supabase.from('jd_skills').update({
          frequency: (existing.frequency || 0) + 1,
          last_seen_at: now,
        }).eq('id', existing.id);
      }
      return supabase.from('jd_skills').insert({
        user_id: user.id,
        skill_name: skill.skill_name,
        category: skill.category,
        frequency: 1,
        first_seen_at: now,
        last_seen_at: now,
      });
    });

    // Update existing record or insert new one
    if (existingId) {
      const { error: updateError } = await supabase
        .from('jd_analyses')
        .update({
          extracted_skills: skills,
          skill_module_matches: skillModuleMatches,
          gaps,
          resume_match: resumeMatch || null,
          resume_text: resumeText || null,
        })
        .eq('id', existingId)
        .eq('user_id', user.id);

      if (updateError) {
        return NextResponse.json({ error: updateError.message }, { status: 500 });
      }

      // Also update skill frequencies
      await Promise.all(skillUpserts);

      return NextResponse.json({
        ...result,
        id: existingId,
        jd_text: jdText,
      });
    }

    const [insertResult] = await Promise.all([
      supabase.from('jd_analyses').insert({
        user_id: user.id,
        jd_text: jdText,
        company_name: result.company_name,
        position_name: result.position_name,
        extracted_skills: result.extracted_skills,
        skill_module_matches: result.skill_module_matches,
        gaps: result.gaps,
        resume_text: resumeText || null,
        resume_match: resumeMatch || null,
      }).select('id, created_at').single(),
      ...skillUpserts,
    ]);

    return NextResponse.json({ ...result, id: insertResult.data?.id, jd_text: jdText, created_at: insertResult.data?.created_at });
  } catch (err) {
    console.error('JD analyze error:', err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : '分析失败' },
      { status: 500 },
    );
  }
}