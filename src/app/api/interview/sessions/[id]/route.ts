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

    const { data: session, error } = await supabase
      .from('chat_sessions')
      .select(
        'id, title, jd_text, resume_text, compressed_summary, is_compressed, created_at, updated_at'
      )
      .eq('id', id)
      .eq('user_id', user.id)
      .single();

    if (error || !session) {
      return NextResponse.json({ error: 'Session 不存在', code: 'NOT_FOUND' }, { status: 404 });
    }

    const { data: messages } = await supabase
      .from('chat_messages')
      .select('id, role, content, created_at')
      .eq('session_id', id)
      .order('created_at', { ascending: true });

    return NextResponse.json({
      ...session,
      messages: messages ?? [],
    });
  } catch (error) {
    console.error('Get session API error:', error);
    return NextResponse.json({ error: '服务器内部错误', code: 'INTERNAL_ERROR' }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
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
    const { title, jd_text, resume_text } = body as {
      title?: string;
      jd_text?: string;
      resume_text?: string;
    };

    const updates: Record<string, string | null> = { updated_at: new Date().toISOString() };
    if (title !== undefined) updates.title = title.trim();
    if (jd_text !== undefined) updates.jd_text = jd_text.trim() || null;
    if (resume_text !== undefined) updates.resume_text = resume_text.trim() || null;

    const { error } = await supabase
      .from('chat_sessions')
      .update(updates)
      .eq('id', id)
      .eq('user_id', user.id);

    if (error) {
      return NextResponse.json(
        { error: '更新 Session 失败', code: 'INTERNAL_ERROR' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Update session API error:', error);
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

    const { error } = await supabase
      .from('chat_sessions')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id);

    if (error) {
      return NextResponse.json(
        { error: '删除 Session 失败', code: 'INTERNAL_ERROR' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Delete session API error:', error);
    return NextResponse.json({ error: '服务器内部错误', code: 'INTERNAL_ERROR' }, { status: 500 });
  }
}
