import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: '未登录' }, { status: 401 });
    }

    const { module_id, title, objective } = await request.json();

    if (!title || typeof title !== 'string' || !title.trim()) {
      return NextResponse.json({ error: '请输入任务标题' }, { status: 400 });
    }

    const { data, error } = await supabase
      .from('user_custom_tasks')
      .insert({
        user_id: user.id,
        module_id: module_id || null,
        title: title.trim(),
        objective: (objective || title).trim(),
        status: 'not_started',
      })
      .select('id')
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ id: data.id });
  } catch (err) {
    console.error('Create task error:', err);
    return NextResponse.json({ error: '创建失败' }, { status: 500 });
  }
}
