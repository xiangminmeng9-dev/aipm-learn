import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { validateBody, createSessionSchema } from '@/lib/validations';

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: '未登录', code: 'UNAUTHORIZED' }, { status: 401 });
    }

    const { searchParams } = request.nextUrl;
    const page = Math.max(1, parseInt(searchParams.get('page') ?? '1'));
    const page_size = Math.min(100, Math.max(1, parseInt(searchParams.get('page_size') ?? '20')));

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
      .range((page - 1) * page_size, page * page_size - 1);

    if (error) {
      return NextResponse.json(
        { error: '获取 Session 列表失败', code: 'INTERNAL_ERROR' },
        { status: 500 }
      );
    }

    const items = (sessions ?? []).map((s) => ({
      id: s.id,
      title: s.title,
      has_jd: !!s.jd_text,
      has_resume: !!s.resume_text,
      message_count: (s.chat_messages as unknown as { count: number }[])?.[0]?.count ?? 0,
      updated_at: s.updated_at,
    }));

    return NextResponse.json({ data: items, total: count ?? 0, page, page_size });
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
    const validation = validateBody(createSessionSchema, body);
    if (!validation.success) {
      return NextResponse.json({ error: validation.error, code: 'VALIDATION_ERROR' }, { status: 400 });
    }
    const { title, jd_text, resume_text } = validation.data;

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
