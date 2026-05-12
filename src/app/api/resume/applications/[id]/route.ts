import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: '未登录', code: 'UNAUTHORIZED' }, { status: 401 });

    const { id } = await params;
    const body = await request.json();

    // Fetch current record to check ownership and get status_history
    const { data: existing, error: fetchErr } = await supabase
      .from('resume_applications')
      .select('id, user_id, status, status_history')
      .eq('id', id)
      .single();

    if (fetchErr || !existing) return NextResponse.json({ error: '记录不存在', code: 'NOT_FOUND' }, { status: 404 });
    if (existing.user_id !== user.id) return NextResponse.json({ error: '无权操作', code: 'FORBIDDEN' }, { status: 403 });

    const updates: Record<string, unknown> = {};
    if (body.company_name !== undefined) updates.company_name = body.company_name;
    if (body.position_name !== undefined) updates.position_name = body.position_name;
    if (body.channel !== undefined) updates.channel = body.channel;
    if (body.applied_at !== undefined) updates.applied_at = body.applied_at;
    if (body.notes !== undefined) updates.notes = body.notes;
    if (body.city !== undefined) updates.city = body.city;
    if (body.position_category !== undefined) updates.position_category = body.position_category;
    if (body.resume_version_id !== undefined) updates.resume_version_id = body.resume_version_id;

    // Status change: append to status_history
    if (body.status !== undefined && body.status !== existing.status) {
      const history = (existing.status_history as unknown[]) || [];
      history.push({ status: body.status, date: new Date().toISOString(), note: body.status_note || '' });
      updates.status = body.status;
      updates.status_history = history;
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ error: '无更新内容', code: 'VALIDATION_ERROR' }, { status: 400 });
    }

    updates.updated_at = new Date().toISOString();

    const { data, error } = await supabase
      .from('resume_applications')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) return NextResponse.json({ error: '更新失败', code: 'INTERNAL_ERROR' }, { status: 500 });
    return NextResponse.json({ application: data });
  } catch (err) {
    console.error('Resume applications PATCH error:', err);
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
      .from('resume_applications')
      .select('user_id')
      .eq('id', id)
      .single();

    if (!existing) return NextResponse.json({ error: '记录不存在', code: 'NOT_FOUND' }, { status: 404 });
    if (existing.user_id !== user.id) return NextResponse.json({ error: '无权操作', code: 'FORBIDDEN' }, { status: 403 });

    const { error } = await supabase.from('resume_applications').delete().eq('id', id);
    if (error) return NextResponse.json({ error: '删除失败', code: 'INTERNAL_ERROR' }, { status: 500 });
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('Resume applications DELETE error:', err);
    return NextResponse.json({ error: '服务器内部错误', code: 'INTERNAL_ERROR' }, { status: 500 });
  }
}
