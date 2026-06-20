import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: '请先登录' }, { status: 401 });

    const { data, error } = await supabase
      .from('notebook_tasks')
      .select('*')
      .eq('user_id', user.id)
      .eq('category', 'todo')
      .order('created_at', { ascending: false })
      .limit(100);

    if (error) {
      console.error('Todos GET error:', error);
      return NextResponse.json({ todos: [] });
    }
    return NextResponse.json({ todos: data || [] });
  } catch (err) {
    console.error('Todos GET error:', err);
    return NextResponse.json({ error: '服务器错误' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: '请先登录' }, { status: 401 });

    const body = await request.json();
    const { title, description, priority, due_date } = body;
    if (!title || typeof title !== 'string' || !title.trim()) {
      return NextResponse.json({ error: '请输入标题' }, { status: 400 });
    }

    const { data, error } = await supabase
      .from('notebook_tasks')
      .insert({
        user_id: user.id,
        title: title.trim(),
        description: description || '',
        priority: priority || 'medium',
        status: 'pending',
        category: 'todo',
        due_date: due_date || null,
      })
      .select()
      .single();

    if (error) {
      console.error('Todos POST error:', error);
      return NextResponse.json({ error: '创建失败' }, { status: 500 });
    }
    return NextResponse.json({ todo: data });
  } catch (err) {
    console.error('Todos POST error:', err);
    return NextResponse.json({ error: '服务器错误' }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: '请先登录' }, { status: 401 });

    const body = await request.json();
    const { id, title, description, priority, status, due_date } = body;
    if (!id) return NextResponse.json({ error: '缺少 id' }, { status: 400 });

    const updates: Record<string, unknown> = {};
    if (title !== undefined) updates.title = title;
    if (description !== undefined) updates.description = description;
    if (priority !== undefined) updates.priority = priority;
    if (due_date !== undefined) updates.due_date = due_date;
    if (status !== undefined) {
      updates.status = status;
      updates.completed_at = status === 'completed' ? new Date().toISOString() : null;
    }

    const { data, error } = await supabase
      .from('notebook_tasks')
      .update(updates)
      .eq('id', id)
      .eq('user_id', user.id)
      .select()
      .single();

    if (error) {
      console.error('Todos PATCH error:', error);
      return NextResponse.json({ error: '更新失败' }, { status: 500 });
    }
    return NextResponse.json({ todo: data });
  } catch (err) {
    console.error('Todos PATCH error:', err);
    return NextResponse.json({ error: '服务器错误' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: '请先登录' }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    if (!id) return NextResponse.json({ error: '缺少 id' }, { status: 400 });

    const { error } = await supabase
      .from('notebook_tasks')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id);

    if (error) {
      console.error('Todos DELETE error:', error);
      return NextResponse.json({ error: '删除失败' }, { status: 500 });
    }
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('Todos DELETE error:', err);
    return NextResponse.json({ error: '服务器错误' }, { status: 500 });
  }
}