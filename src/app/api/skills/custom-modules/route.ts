import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: '未登录', code: 'UNAUTHORIZED' }, { status: 401 });
    }

    // 获取用户所有自定义模块
    const { data: modules, error } = await supabase
      .from('user_skill_modules')
      .select('*')
      .eq('user_id', user.id)
      .order('level', { ascending: true })
      .order('sort_order', { ascending: true });

    if (error) {
      return NextResponse.json(
        { error: '获取自定义模块失败', code: 'INTERNAL_ERROR' },
        { status: 500 }
      );
    }

    // 获取所有任务
    const moduleIds = (modules ?? []).map((m) => m.id);
    const { data: allTasks } = await supabase
      .from('user_module_tasks')
      .select('id, module_id, status')
      .in('module_id', moduleIds.length > 0 ? moduleIds : ['00000000-0000-0000-0000-000000000000']);

    // 计算每个模块的进度
    const tasksByModule = new Map<string, { total: number; completed: number }>();
    for (const task of allTasks ?? []) {
      const entry = tasksByModule.get(task.module_id) ?? { total: 0, completed: 0 };
      entry.total++;
      if (task.status === 'completed') entry.completed++;
      tasksByModule.set(task.module_id, entry);
    }

    const result = (modules ?? []).map((m) => {
      const counts = tasksByModule.get(m.id) ?? { total: 0, completed: 0 };
      return {
        ...m,
        job_targets: m.job_targets as string[],
        task_count: counts.total,
        completed_count: counts.completed,
        progress_percentage: counts.total
          ? Math.round((counts.completed / counts.total) * 100)
          : 0,
        is_custom: true as const,
      };
    });

    return NextResponse.json({ modules: result });
  } catch (error) {
    console.error('Custom modules API error:', error);
    return NextResponse.json({ error: '服务器内部错误', code: 'INTERNAL_ERROR' }, { status: 500 });
  }
}
