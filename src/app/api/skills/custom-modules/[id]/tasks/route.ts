import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: '未登录' }, { status: 401 });
    }

    const { id: moduleId } = await params;

    const { data: module } = await supabase
      .from('user_skill_modules')
      .select('id')
      .eq('id', moduleId)
      .eq('user_id', user.id)
      .single();

    if (!module) {
      return NextResponse.json({ error: '模块不存在' }, { status: 404 });
    }

    const { title, objective } = await request.json();

    if (!title || typeof title !== 'string' || !title.trim()) {
      return NextResponse.json({ error: '请输入任务标题' }, { status: 400 });
    }

    const { data: maxOrder } = await supabase
      .from('user_module_tasks')
      .select('sort_order')
      .eq('module_id', moduleId)
      .order('sort_order', { ascending: false })
      .limit(1)
      .single();

    const nextOrder = (maxOrder?.sort_order ?? 0) + 1;

    const { data, error } = await supabase
      .from('user_module_tasks')
      .insert({
        module_id: moduleId,
        title: title.trim(),
        objective: (objective || title).trim(),
        estimated_days: 1.0,
        content_summary: '',
        sort_order: nextOrder,
        status: 'not_started',
      })
      .select('id, title, objective, estimated_days, content_summary, resources, sort_order, status, completed_at, created_at')
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data);
  } catch (err) {
    console.error('Create custom module task error:', err);
    return NextResponse.json({ error: '创建失败' }, { status: 500 });
  }
}
