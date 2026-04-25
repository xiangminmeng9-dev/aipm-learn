import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { generateText } from '@/lib/ai/claude';
import { buildSkillRecommendationPrompt, SKILL_RECOMMENDATION_SYSTEM_PROMPT } from '@/lib/ai/prompts';

export async function GET() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: '未登录', code: 'UNAUTHORIZED' }, { status: 401 });
    }

    // 检查 JD 数量
    const { count } = await supabase
      .from('jd_analyses')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', user.id);

    if (!count || count < 3) {
      return NextResponse.json({
        recommendations: [],
        message: `需要至少分析 3 个 JD 才能生成推荐（当前 ${count ?? 0} 个）`,
      });
    }

    // 获取高频技能 (frequency >= 2)
    const { data: highFreqSkills } = await supabase
      .from('jd_skills')
      .select('skill_name, category, frequency')
      .eq('user_id', user.id)
      .gte('frequency', 2)
      .order('frequency', { ascending: false })
      .limit(15);

    if (!highFreqSkills || highFreqSkills.length === 0) {
      return NextResponse.json({ recommendations: [], high_freq_skills: [], message: '暂无高频技能' });
    }

    // 获取现有模块
    const { data: modules } = await supabase
      .from('skill_modules')
      .select('name, description');

    // AI 生成推荐
    const prompt = buildSkillRecommendationPrompt(highFreqSkills, modules ?? []);
    const result = await generateText(prompt, {
      model: 'sonnet',
      system: SKILL_RECOMMENDATION_SYSTEM_PROMPT,
      maxTokens: 2048,
    });

    let recommendations = [];
    try {
      const parsed = JSON.parse(result.replace(/```json\n?|\n?```/g, '').trim());
      recommendations = parsed.recommendations ?? [];
    } catch {
      // 静默
    }

    return NextResponse.json({
      high_freq_skills: highFreqSkills,
      recommendations,
      jd_count: count,
    });
  } catch (error) {
    console.error('JD recommendations API error:', error);
    return NextResponse.json({ error: '服务器内部错误', code: 'INTERNAL_ERROR' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: '未登录', code: 'UNAUTHORIZED' }, { status: 401 });
    }

    const body = await request.json();
    const { tasks } = body as {
      tasks: { title: string; objective: string; module_id?: string; resources?: unknown[] }[];
    };

    if (!tasks || tasks.length === 0) {
      return NextResponse.json({ error: '缺少任务数据', code: 'VALIDATION_ERROR' }, { status: 400 });
    }

    const inserted = [];
    for (const task of tasks) {
      const { data, error } = await supabase
        .from('user_custom_tasks')
        .insert({
          user_id: user.id,
          module_id: task.module_id ?? null,
          title: task.title,
          objective: task.objective,
          resources: task.resources ?? [],
        })
        .select('id, title, objective, status, created_at')
        .single();

      if (!error && data) inserted.push(data);
    }

    return NextResponse.json({ tasks: inserted });
  } catch (error) {
    console.error('Custom tasks API error:', error);
    return NextResponse.json({ error: '服务器内部错误', code: 'INTERNAL_ERROR' }, { status: 500 });
  }
}
