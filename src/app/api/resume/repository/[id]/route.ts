import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: '未登录', code: 'UNAUTHORIZED' }, { status: 401 });

    const { id } = await params;
    const { data, error } = await supabase
      .from('resume_repository')
      .select('*')
      .eq('id', id)
      .eq('user_id', user.id)
      .single();

    if (error || !data) return NextResponse.json({ error: '记录不存在', code: 'NOT_FOUND' }, { status: 404 });
    return NextResponse.json({ item: data });
  } catch (err) {
    console.error('Resume repository GET error:', err);
    return NextResponse.json({ error: '服务器内部错误', code: 'INTERNAL_ERROR' }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: '未登录', code: 'UNAUTHORIZED' }, { status: 401 });

    const { id } = await params;
    const body = await request.json();

    const { data: existing } = await supabase
      .from('resume_repository')
      .select('user_id')
      .eq('id', id)
      .single();

    if (!existing) return NextResponse.json({ error: '记录不存在', code: 'NOT_FOUND' }, { status: 404 });
    if (existing.user_id !== user.id) return NextResponse.json({ error: '无权操作', code: 'FORBIDDEN' }, { status: 403 });

    const updates: Record<string, unknown> = { updated_at: new Date().toISOString() };
    if (body.company_name !== undefined) updates.company_name = body.company_name;
    if (body.position_name !== undefined) updates.position_name = body.position_name;
    if (body.jd_text !== undefined) updates.jd_text = body.jd_text;
    if (body.jd_link !== undefined) updates.jd_link = body.jd_link;
    if (body.resume_text !== undefined) updates.resume_text = body.resume_text;

    const { data, error } = await supabase
      .from('resume_repository')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) return NextResponse.json({ error: '更新失败', code: 'INTERNAL_ERROR' }, { status: 500 });
    return NextResponse.json({ item: data });
  } catch (err) {
    console.error('Resume repository PATCH error:', err);
    return NextResponse.json({ error: '服务器内部错误', code: 'INTERNAL_ERROR' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: '未登录', code: 'UNAUTHORIZED' }, { status: 401 });

    const { id } = await params;
    const { data: existing } = await supabase
      .from('resume_repository')
      .select('user_id')
      .eq('id', id)
      .single();

    if (!existing) return NextResponse.json({ error: '记录不存在', code: 'NOT_FOUND' }, { status: 404 });
    if (existing.user_id !== user.id) return NextResponse.json({ error: '无权操作', code: 'FORBIDDEN' }, { status: 403 });

    const { error } = await supabase.from('resume_repository').delete().eq('id', id);
    if (error) return NextResponse.json({ error: '删除失败', code: 'INTERNAL_ERROR' }, { status: 500 });
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('Resume repository DELETE error:', err);
    return NextResponse.json({ error: '服务器内部错误', code: 'INTERNAL_ERROR' }, { status: 500 });
  }
}
