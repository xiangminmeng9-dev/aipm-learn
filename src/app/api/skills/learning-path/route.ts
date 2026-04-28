import { NextRequest, NextResponse } from 'next/server';
import { createClient, createServiceClient } from '@/lib/supabase/server';

// GET /api/skills/learning-path — 获取已保存的学习路径
export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: '请先登录' }, { status: 401 });

    const serviceClient = createServiceClient();
    const { data: paths, error } = await serviceClient
      .from('learning_paths')
      .select('id, target_position, current_level, time_budget, jd_text, path_data, created_at, updated_at')
      .eq('user_id', user.id)
      .order('updated_at', { ascending: false });

    if (error) {
      console.error('Get learning paths error:', error);
      return NextResponse.json({ error: '获取失败' }, { status: 500 });
    }

    return NextResponse.json({ paths: paths || [] });
  } catch (err) {
    console.error('Get learning paths error:', err);
    return NextResponse.json({ error: '获取失败' }, { status: 500 });
  }
}

// DELETE /api/skills/learning-path?id=xxx
export async function DELETE(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: '请先登录' }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    if (!id) return NextResponse.json({ error: '缺少 id' }, { status: 400 });

    const serviceClient = createServiceClient();
    const { error } = await serviceClient
      .from('learning_paths')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id);

    if (error) return NextResponse.json({ error: '删除失败' }, { status: 500 });
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('Delete learning path error:', err);
    return NextResponse.json({ error: '删除失败' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: '请先登录' }, { status: 401 });

    const { target_position, current_level, time_budget, jd_text } = await request.json();
    if (!target_position) return NextResponse.json({ error: '请输入目标岗位' }, { status: 400 });

    // Fetch existing skill modules for matching
    const { data: modules } = await supabase
      .from('skill_modules')
      .select('id, slug, name, level, level_name, description')
      .order('level', { ascending: true });

    const moduleNames = (modules || []).map(m => `${m.slug}|${m.name}|${m.level_name}`).join('\n');

    const { generateText } = await import('@/lib/ai/claude');
    const aiResult = await generateText(
      `你是一个 AI PM 学习路径规划专家。请为以下用户生成个性化学习路径。

用户信息：
- 目标岗位：${target_position}
- 当前水平：${current_level || '初级'}
- 时间预算：${time_budget || '3个月'}
${jd_text ? `\n目标岗位 JD：\n${jd_text}\n` : ''}
现有技能树模块（slug|名称|层级）：
${moduleNames || '暂无'}

${jd_text ? '请根据 JD 内容精准规划学习路径，重点覆盖 JD 中要求的技能和经验，确保学习路径与岗位需求高度匹配。' : '请生成学习路径，覆盖该岗位所需的核心技能。'}每个阶段包含模块。如果模块名称与现有技能树匹配，标记 matched_module_slug；如果不匹配，标记为 null（将自动补充到技能树）。

严格按以下 JSON 格式输出（不要加 markdown 代码块）：
{
  "path_title": "路径标题",
  "estimated_weeks": 12,
  "stages": [
    {
      "stage_name": "阶段名称",
      "duration_weeks": 2,
      "modules": [
        {
          "name": "模块名称",
          "matched_module_slug": "slug或null",
          "description": "模块描述",
          "key_tasks": ["任务1", "任务2"],
          "priority": "high"
        }
      ]
    }
  ]
}`,
      { system: '你是 AI PM 学习路径规划专家，擅长根据岗位需求设计个性化学习路径。只输出 JSON。', maxTokens: 3000 }
    );

    let path;
    try {
      const cleaned = aiResult.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      path = JSON.parse(cleaned);
    } catch {
      path = {
        path_title: `${target_position} 学习路径`,
        estimated_weeks: 12,
        stages: [
          { stage_name: '基础入门', duration_weeks: 3, modules: [
            { name: 'AI 产品基础', matched_module_slug: null, description: '理解 AI 产品的基本概念', key_tasks: ['了解 AI 产品分类', '学习产品生命周期'], priority: 'high' },
          ]},
          { stage_name: '核心能力', duration_weeks: 4, modules: [
            { name: '需求分析与澄清', matched_module_slug: null, description: '掌握 AI 产品需求分析方法', key_tasks: ['需求拆解', '用户场景分析'], priority: 'high' },
          ]},
          { stage_name: '进阶专项', duration_weeks: 3, modules: [
            { name: '算法沟通协作', matched_module_slug: null, description: '学会与算法团队高效协作', key_tasks: ['模型选型沟通', '评估指标设计'], priority: 'medium' },
          ]},
        ],
      };
    }

    // Create unmatched modules in skill tree
    const unmatchedModules = path.stages
      .flatMap((s: { modules: { matched_module_slug: string | null; name: string; description: string }[] }) => s.modules)
      .filter((m: { matched_module_slug: string | null }) => m.matched_module_slug === null);

    for (const m of unmatchedModules) {
      const existingMatch = (modules || []).find(mod =>
        mod.name.toLowerCase().includes(m.name.toLowerCase()) || m.name.toLowerCase().includes(mod.name.toLowerCase())
      );
      if (existingMatch) {
        m.matched_module_slug = existingMatch.slug;
      } else {
        const { data: newMod } = await supabase
          .from('user_skill_modules')
          .insert({
            user_id: user.id,
            name: m.name,
            description: m.description,
            icon: '📚',
            level: 2,
            level_name: '核心能力',
            source_description: `学习路径自动生成：${target_position}`,
            job_targets: [target_position],
            sort_order: 0,
          })
          .select()
          .single();
        if (newMod) m.matched_module_slug = `custom-${newMod.id}`;
      }
    }

    // Fetch progress for matched modules
    const { data: progress } = await supabase
      .from('learning_progress')
      .select('task_id, status, completed_at')
      .eq('user_id', user.id);

    const progressMap = new Map((progress || []).map(p => [p.task_id, p.status]));

    // Save path to database
    const serviceClient = createServiceClient();
    const { data: savedPath } = await serviceClient
      .from('learning_paths')
      .insert({
        user_id: user.id,
        target_position,
        current_level: current_level || '初级',
        time_budget: time_budget || '3个月',
        jd_text: jd_text || '',
        path_data: path,
      })
      .select('id')
      .single();

    return NextResponse.json({ path, progressMap: Object.fromEntries(progressMap), id: savedPath?.id });
  } catch (err) {
    console.error('Generate learning path error:', err);
    return NextResponse.json({ error: '生成失败' }, { status: 500 });
  }
}