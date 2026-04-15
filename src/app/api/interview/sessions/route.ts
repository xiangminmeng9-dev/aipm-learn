import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: '未登录', code: 'UNAUTHORIZED' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') ?? '1');
    const limit = parseInt(searchParams.get('limit') ?? '20');
    const offset = (page - 1) * limit;

    const {
      data: sessions,
      error,
      count,
    } = await supabase
      .from('chat_sessions')
      .select('id, title, jd_text, resume_text, updated_at, chat_messages(count)', {
        count: 'exact',
      })
      .eq('user_id', user.id)
      .order('updated_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      return NextResponse.json(
        { error: '获取 Session 列表失败', code: 'INTERNAL_ERROR' },
        { status: 500 }
      );
    }

    const result = (sessions ?? []).map((s) => ({
      id: s.id,
      title: s.title,
      has_jd: !!s.jd_text,
      has_resume: !!s.resume_text,
      message_count: (s.chat_messages as unknown as { count: number }[])?.[0]?.count ?? 0,
      updated_at: s.updated_at,
    }));

    return NextResponse.json({ sessions: result, total: count ?? 0 });
  } catch (error) {
    console.error('Sessions list API error:', error);
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
    const { title, jd_text, resume_text } = body as {
      title?: string;
      jd_text?: string;
      resume_text?: string;
    };

    const { data: session, error } = await supabase
      .from('chat_sessions')
      .insert({
        user_id: user.id,
        title: title?.trim() || '新对话',
        jd_text: jd_text?.trim() || null,
        resume_text: resume_text?.trim() || null,
      })
      .select('id, title, created_at')
      .single();

    if (error || !session) {
      return NextResponse.json(
        { error: '创建 Session 失败', code: 'INTERNAL_ERROR' },
        { status: 500 }
      );
    }

    return NextResponse.json(session, { status: 201 });
  } catch (error) {
    console.error('Create session API error:', error);
    return NextResponse.json({ error: '服务器内部错误', code: 'INTERNAL_ERROR' }, { status: 500 });
  }
}
