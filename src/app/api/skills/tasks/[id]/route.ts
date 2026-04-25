import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function PATCH(
  request: NextRequest,
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
    const body = await request.json();
    const { status } = body as { status: string };

    if (!status || !['completed', 'not_started', 'in_progress'].includes(status)) {
      return NextResponse.json({ error: '无效状态', code: 'VALIDATION_ERROR' }, { status: 400 });
    }

    const completedAt = status === 'completed' ? new Date().toISOString() : null;

    const { error } = await supabase
      .from('user_custom_tasks')
      .update({ status, completed_at: completedAt })
      .eq('id', id)
      .eq('user_id', user.id);

    if (error) {
      return NextResponse.json({ error: '更新失败', code: 'INTERNAL_ERROR' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Task update API error:', error);
    return NextResponse.json({ error: '服务器内部错误', code: 'INTERNAL_ERROR' }, { status: 500 });
  }
}

export async function DELETE(
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

    // Delete user's resources for this task first
    await supabase
      .from('user_task_resources')
      .delete()
      .eq('task_id', id)
      .eq('user_id', user.id);

    const { error } = await supabase
      .from('user_custom_tasks')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id);

    if (error) {
      return NextResponse.json({ error: '删除失败', code: 'INTERNAL_ERROR' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Task delete API error:', error);
    return NextResponse.json({ error: '服务器内部错误', code: 'INTERNAL_ERROR' }, { status: 500 });
  }
}
