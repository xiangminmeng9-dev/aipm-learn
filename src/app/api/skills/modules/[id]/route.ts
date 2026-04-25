import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: '未登录', code: 'UNAUTHORIZED' }, { status: 401 });
    }

    const { id } = await params;

    // 获取模块信息
    const { data: module } = await supabase
      .from('skill_modules')
      .select('id, slug, name, description, icon, job_targets, sort_order, level, level_name, prerequisites')
      .eq('id', id)
      .single();

    if (!module) {
      return NextResponse.json({ error: '模块不存在', code: 'NOT_FOUND' }, { status: 404 });
    }

    const { data: tasks, error } = await supabase
      .from('learning_tasks')
      .select('*')
      .eq('module_id', id)
      .order('sort_order', { ascending: true });

    if (error) {
      return NextResponse.json(
        { error: '获取学习任务失败', code: 'INTERNAL_ERROR' },
        { status: 500 }
      );
    }

    // 获取用户进度
    const { data: progress } = await supabase
      .from('learning_progress')
      .select('task_id, status, completed_at')
      .eq('user_id', user.id);

    const progressMap = new Map((progress ?? []).map((p) => [p.task_id, p]));

    const tasksWithProgress = (tasks ?? []).map((t) => {
      const p = progressMap.get(t.id);
      return {
        ...t,
        resources: (t.resources as unknown[]) ?? [],
        prerequisites: (t.prerequisites as string[]) ?? [],
        status: (p?.status as 'not_started' | 'completed') ?? 'not_started',
        completed_at: p?.completed_at ?? null,
      };
    });

    // 获取该模块的用户自定义任务（来自 JD 分析）
    const { data: customTasks } = await supabase
      .from('user_custom_tasks')
      .select('id, title, objective, resources, status, completed_at, created_at')
      .eq('user_id', user.id)
      .eq('module_id', id)
      .order('created_at', { ascending: true });

    const customTasksWithProgress = (customTasks ?? []).map((t) => ({
      ...t,
      is_custom: true,
      resources: (t.resources as unknown[]) ?? [],
    }));

    // Fetch user-added resources for all tasks
    const taskIds = tasksWithProgress.map((t) => t.id);
    const customTaskIds = customTasksWithProgress.map((t) => t.id);
    const allTaskIds = [...taskIds, ...customTaskIds];

    let userResourcesByTask = new Map<string, unknown[]>();
    if (allTaskIds.length > 0) {
      const { data: userResources } = await supabase
        .from('user_task_resources')
        .select('*')
        .eq('user_id', user.id)
        .in('task_id', allTaskIds);

      for (const r of userResources ?? []) {
        const list = userResourcesByTask.get(r.task_id) ?? [];
        list.push(r);
        userResourcesByTask.set(r.task_id, list);
      }
    }

    const tasksWithUserResources = tasksWithProgress.map((t) => ({
      ...t,
      user_resources: userResourcesByTask.get(t.id) ?? [],
    }));

    const customTasksWithUserResources = customTasksWithProgress.map((t) => ({
      ...t,
      user_resources: userResourcesByTask.get(t.id) ?? [],
    }));

    // 面试联动：该模块关联的面试题型和方法论
    const { data: mappings } = await supabase
      .from('type_skill_mappings')
      .select('type_id, question_types(id, name)')
      .eq('skill_module_id', id);

    const mappedTypes = (mappings ?? [])
      .map((m) => {
        const qt = m.question_types as unknown as { id: string; name: string } | null;
        return qt ? { id: qt.id, name: qt.name } : null;
      })
      .filter(Boolean) as { id: string; name: string }[];

    const mappedTypeIds = mappedTypes.map((t) => t.id);

    let methodologiesForModule: { id: string; type: { id: string; name: string }; framework: string; key_steps: string[]; source_count: number }[] = [];
    if (mappedTypeIds.length > 0) {
      const { data: methodologies } = await supabase
        .from('interview_methodologies')
        .select('id, type_id, framework, key_steps, source_count, question_types(id, name)')
        .eq('user_id', user.id)
        .in('type_id', mappedTypeIds);

      methodologiesForModule = (methodologies ?? []).map((m) => {
        const qt = m.question_types as unknown as { id: string; name: string } | null;
        return {
          id: m.id,
          type: { id: m.type_id, name: qt?.name ?? '未知' },
          framework: m.framework,
          key_steps: (m.key_steps as string[]) ?? [],
          source_count: m.source_count,
        };
      });
    }

    return NextResponse.json({
      module: {
        ...module,
        job_targets: module.job_targets as string[],
        prerequisites: (module.prerequisites as string[]) ?? [],
        level: module.level,
        level_name: module.level_name,
      },
      tasks: tasksWithUserResources,
      custom_tasks: customTasksWithUserResources,
      interview_insights: {
        mapped_types: mappedTypes,
        methodologies: methodologiesForModule,
      },
    });
  } catch (error) {
    console.error('Module tasks API error:', error);
    return NextResponse.json({ error: '服务器内部错误', code: 'INTERNAL_ERROR' }, { status: 500 });
  }
}
