import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { generateText } from '@/lib/ai/claude';
import { buildSkillMatchingPrompt, SKILL_MATCHING_SYSTEM_PROMPT } from '@/lib/ai/prompts';

export async function POST(request: NextRequest) {
  try {
    const { skills } = await request.json();
    if (!skills || !Array.isArray(skills) || skills.length === 0) {
      return NextResponse.json({ error: '请提供技能列表' }, { status: 400 });
    }

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: '请先登录' }, { status: 401 });
    }

    // Fetch skill modules
    const { data: modules } = await supabase
      .from('skill_modules')
      .select('id, name, description')
      .eq('user_id', user.id);

    const moduleList = (modules || []).map((m: { id: string; name: string; description?: string }) => ({
      id: m.id,
      name: m.name,
      description: m.description,
    }));

    // If no modules exist, provide default AI PM modules
    const defaultModules = moduleList.length > 0 ? moduleList : [
      { id: 'm1', name: 'AI 产品基础', description: 'AI 产品经理核心概念、AI 技术栈概览' },
      { id: 'm2', name: 'LLM 技术原理', description: '大语言模型原理、Prompt Engineering、RAG、Agent' },
      { id: 'm3', name: 'AI 产品设计', description: 'AI 产品设计方法、用户体验、交互设计' },
      { id: 'm4', name: '数据与评估', description: 'AI 产品数据指标、A/B 测试、效果评估' },
      { id: 'm5', name: 'AI 工程实践', description: 'MLOps、模型部署、性能优化' },
      { id: 'm6', name: '行业应用', description: 'AI 在各行业的应用案例和商业模式' },
    ];

    // Normalize skills to object array
    const normalizedSkills: { skill_name: string; category: string; importance: string }[] = skills.map((s: unknown) => {
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

    // Call AI for skill matching
    const prompt = buildSkillMatchingPrompt(normalizedSkills, defaultModules);
    const aiResponse = await generateText(prompt, { system: SKILL_MATCHING_SYSTEM_PROMPT, maxTokens: 2048 });

    let parsed;
    try {
      const jsonMatch = aiResponse.match(/\{[\s\S]*\}/);
      if (!jsonMatch) throw new Error('AI 返回格式异常');
      parsed = JSON.parse(jsonMatch[0]);
    } catch {
      return NextResponse.json(
        { error: 'AI 匹配结果解析失败，请重试', raw: aiResponse },
        { status: 500 },
      );
    }

    // Normalize matches
    const matches = (parsed.matches || []).map((m: Record<string, unknown>) => ({
      skill_name: m.skill_name || m.skill || '',
      module_id: m.module_id || null,
      module_name: m.module_name || '',
      match_score: typeof m.match_score === 'number' ? m.match_score : 50,
    }));

    // Normalize gaps
    const gaps = (parsed.gaps || []).map((g: unknown) => {
      if (typeof g === 'string') {
        return { skill_name: g, category: '未分类', suggestion: '建议深入学习', related_module_id: null, related_module_name: null };
      }
      const obj = g as Record<string, unknown>;
      return {
        skill_name: obj.skill_name || '',
        category: obj.category || '未分类',
        suggestion: obj.suggestion || '',
        related_module_id: obj.related_module_id || null,
        related_module_name: obj.related_module_name || null,
      };
    });

    return NextResponse.json({
      skill_module_matches: matches,
      gaps,
    });
  } catch (err) {
    console.error('Skill gap analysis error:', err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : '分析失败' },
      { status: 500 },
    );
  }
}