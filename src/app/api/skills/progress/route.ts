import { NextRequest, NextResponse } from 'next/server';
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

    const { data: progress } = await supabase
      .from('learning_progress')
      .select('id, task_id, status, completed_at')
      .eq('user_id', user.id);

    return NextResponse.json({ progress: progress ?? [] });
  } catch (error) {
    console.error('Progress API error:', error);
    return NextResponse.json({ error: '服务器内部错误', code: 'INTERNAL_ERROR' }, { status: 500 });
  }
}

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
    const { task_id, status } = body as { task_id: string; status: 'completed' | 'not_started' };

    if (!task_id) {
      return NextResponse.json(
        { error: '缺少 task_id', code: 'VALIDATION_ERROR' },
        { status: 400 }
      );
    }

    const completedAt = status === 'completed' ? new Date().toISOString() : null;

    // Upsert
    const { error } = await supabase.from('learning_progress').upsert(
      {
        user_id: user.id,
        task_id,
        status,
        completed_at: completedAt,
      },
      { onConflict: 'user_id,task_id' }
    );

    if (error) {
      return NextResponse.json({ error: '更新进度失败', code: 'INTERNAL_ERROR' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Progress update API error:', error);
    return NextResponse.json({ error: '服务器内部错误', code: 'INTERNAL_ERROR' }, { status: 500 });
  }
}
