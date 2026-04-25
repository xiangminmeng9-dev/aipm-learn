import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: '未登录', code: 'UNAUTHORIZED' }, { status: 401 });
    }

    const { id } = await params;

    // 获取模块
    const { data: module, error: moduleError } = await supabase
      .from('user_skill_modules')
      .select('*')
      .eq('id', id)
      .eq('user_id', user.id)
      .single();

    if (moduleError || !module) {
      return NextResponse.json({ error: '模块不存在', code: 'NOT_FOUND' }, { status: 404 });
    }

    // 获取任务
    const { data: tasks, error: tasksError } = await supabase
      .from('user_module_tasks')
      .select('*')
      .eq('module_id', id)
      .order('sort_order', { ascending: true });

    if (tasksError) {
      return NextResponse.json(
        { error: '获取任务失败', code: 'INTERNAL_ERROR' },
        { status: 500 }
      );
    }

    const tasksWithResources = (tasks ?? []).map((t) => ({
      ...t,
      resources: t.resources as LearningResource[],
    }));

    // Fetch user-added resources
    const taskIds = tasksWithResources.map((t) => t.id);
    let userResourcesByTask = new Map<string, unknown[]>();
    if (taskIds.length > 0) {
      const { data: userResources } = await supabase
        .from('user_task_resources')
        .select('*')
        .eq('user_id', user.id)
        .in('task_id', taskIds);

      for (const r of userResources ?? []) {
        const list = userResourcesByTask.get(r.task_id) ?? [];
        list.push(r);
        userResourcesByTask.set(r.task_id, list);
      }
    }

    const tasksWithUserResources = tasksWithResources.map((t) => ({
      ...t,
      user_resources: userResourcesByTask.get(t.id) ?? [],
    }));

    return NextResponse.json({
      module: {
        ...module,
        job_targets: module.job_targets as string[],
      },
      tasks: tasksWithUserResources,
    });
  } catch (error) {
    console.error('Custom module detail API error:', error);
    return NextResponse.json({ error: '服务器内部错误', code: 'INTERNAL_ERROR' }, { status: 500 });
  }
}

interface LearningResource {
  type: 'article' | 'video' | 'book';
  title: string;
  url: string;
  source: string;
}
