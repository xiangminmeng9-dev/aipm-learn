import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; taskId: string }> }
) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: '未登录', code: 'UNAUTHORIZED' }, { status: 401 });
    }

    const { id, taskId } = await params;
    const body = await request.json();
    const { status } = body;

    if (!['not_started', 'in_progress', 'completed'].includes(status)) {
      return NextResponse.json(
        { error: '无效的状态', code: 'VALIDATION_ERROR' },
        { status: 400 }
      );
    }

    // 验证模块属于当前用户
    const { data: module } = await supabase
      .from('user_skill_modules')
      .select('id')
      .eq('id', id)
      .eq('user_id', user.id)
      .single();

    if (!module) {
      return NextResponse.json({ error: '模块不存在', code: 'NOT_FOUND' }, { status: 404 });
    }

    const completedAt = status === 'completed' ? new Date().toISOString() : null;

    const { error } = await supabase
      .from('user_module_tasks')
      .update({ status, completed_at: completedAt })
      .eq('id', taskId)
      .eq('module_id', id);

    if (error) {
      return NextResponse.json(
        { error: '更新失败', code: 'INTERNAL_ERROR' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Update custom task API error:', error);
    return NextResponse.json({ error: '服务器内部错误', code: 'INTERNAL_ERROR' }, { status: 500 });
  }
}
