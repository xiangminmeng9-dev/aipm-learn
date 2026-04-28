import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { generateText } from '@/lib/ai/claude';
import { buildCustomModulePrompt, CUSTOM_MODULE_SYSTEM_PROMPT } from '@/lib/ai/prompts';

const LEVEL_NAMES: Record<number, string> = {
  1: '基础入门',
  2: '核心能力',
  3: '进阶专项',
  4: '实战综合',
};

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
    const { description, level, prerequisites } = body;

    if (!description || description.trim().length < 5) {
      return NextResponse.json(
        { error: '描述至少需要 5 个字符', code: 'VALIDATION_ERROR' },
        { status: 400 }
      );
    }

    if (!level || level < 1 || level > 4) {
      return NextResponse.json(
        { error: '阶段必须是 1-4', code: 'VALIDATION_ERROR' },
        { status: 400 }
      );
    }

    const levelName = LEVEL_NAMES[level];

    // 获取该级别已有模块（seed + user），避免重复
    const { data: seedModules } = await supabase
      .from('skill_modules')
      .select('name, description')
      .eq('level', level);

    const { data: userModules } = await supabase
      .from('user_skill_modules')
      .select('name, description')
      .eq('user_id', user.id)
      .eq('level', level);

    const existingModules = [
      ...(seedModules ?? []),
      ...(userModules ?? []),
    ];

    // AI 生成模块
    const prompt = buildCustomModulePrompt(description.trim(), level, levelName, existingModules);
    const result = await generateText(prompt, {
      model: 'sonnet',
      system: CUSTOM_MODULE_SYSTEM_PROMPT,
      maxTokens: 4096,
    });

    let generated;
    try {
      const cleaned = result.trim().replace(/```json\n?|\n?```/g, '');
      generated = JSON.parse(cleaned);
    } catch {
      return NextResponse.json(
        { error: 'AI 生成内容格式错误，请重试', code: 'AI_PARSE_ERROR' },
        { status: 500 }
      );
    }

    // 获取当前用户在该 level 的最大 sort_order
    const { data: maxSortModule } = await supabase
      .from('user_skill_modules')
      .select('sort_order')
      .eq('user_id', user.id)
      .eq('level', level)
      .order('sort_order', { ascending: false })
      .limit(1);

    const nextSortOrder = (maxSortModule?.[0]?.sort_order ?? 99) + 1;

    // 插入模块
    const { data: newModule, error: moduleError } = await supabase
      .from('user_skill_modules')
      .insert({
        user_id: user.id,
        name: generated.name ?? '自定义模块',
        description: generated.description ?? '',
        icon: generated.icon ?? '✨',
        level,
        level_name: levelName,
        source_description: description.trim(),
        job_targets: generated.job_targets ?? [],
        sort_order: nextSortOrder,
        prerequisites: prerequisites ?? [],
      })
      .select()
      .single();

    if (moduleError || !newModule) {
      return NextResponse.json(
        { error: '创建模块失败', code: 'INTERNAL_ERROR' },
        { status: 500 }
      );
    }

    // 插入任务
    const tasks = (generated.tasks ?? []) as Array<{
      title: string;
      objective: string;
      estimated_days: number;
      content_summary: string;
      resources: Array<{ type: string; title: string; url: string; source: string }>;
    }>;

    if (tasks.length > 0) {
      const taskRows = tasks.map((t, i) => ({
        module_id: newModule.id,
        title: t.title ?? `学习任务 ${i + 1}`,
        objective: t.objective ?? '',
        estimated_days: Math.min(Math.max(t.estimated_days ?? 1, 0.5), 3),
        content_summary: t.content_summary ?? '',
        resources: t.resources ?? [],
        sort_order: i + 1,
        status: 'not_started' as const,
      }));

      const { data: newTasks, error: tasksError } = await supabase
        .from('user_module_tasks')
        .insert(taskRows)
        .select();

      if (tasksError) {
        // 任务插入失败，但模块已创建，返回模块和空任务
        console.error('Tasks insert error:', tasksError);
      }

      return NextResponse.json({
        module: {
          ...newModule,
          job_targets: newModule.job_targets as string[],
          task_count: tasks.length,
          completed_count: 0,
          progress_percentage: 0,
          is_custom: true as const,
        },
        tasks: newTasks ?? [],
      });
    }

    return NextResponse.json({
      module: {
        ...newModule,
        job_targets: newModule.job_targets as string[],
        task_count: 0,
        completed_count: 0,
        progress_percentage: 0,
        is_custom: true as const,
      },
      tasks: [],
    });
  } catch (error) {
    console.error('Custom module generate API error:', error);
    return NextResponse.json({ error: '服务器内部错误', code: 'INTERNAL_ERROR' }, { status: 500 });
  }
}
