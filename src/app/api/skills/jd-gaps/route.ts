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

    // 获取没有 module_id 的 JD 差距任务
    const { data: tasks, error } = await supabase
      .from('user_custom_tasks')
      .select('id, title, objective, resources, status, completed_at, created_at, source_jd_id')
      .eq('user_id', user.id)
      .is('module_id', null)
      .order('created_at', { ascending: false });

    if (error) {
      return NextResponse.json({ error: '获取差距任务失败', code: 'INTERNAL_ERROR' }, { status: 500 });
    }

    // 获取用户添加的资源
    const taskIds = (tasks ?? []).map((t) => t.id);
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

    const tasksWithResources = (tasks ?? []).map((t) => ({
      ...t,
      resources: (t.resources as unknown[]) ?? [],
      user_resources: userResourcesByTask.get(t.id) ?? [],
    }));

    return NextResponse.json({ tasks: tasksWithResources });
  } catch (error) {
    console.error('JD gaps API error:', error);
    return NextResponse.json({ error: '服务器内部错误', code: 'INTERNAL_ERROR' }, { status: 500 });
  }
}
