import { NextRequest, NextResponse } from 'next/server';
import { createClient, createServiceClient } from '@/lib/supabase/server';
export const dynamic = 'force-dynamic';

export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;

    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: '请先登录' }, { status: 401 });
    }

    const serviceClient = createServiceClient();
    const { data, error } = await serviceClient
      .from('user_skill_drafts')
      .select(
        'id, name, description, content, status, template_type, validation_status, validation_errors, clawhub_slug, clawhub_url, skillssh_slug, skillssh_url, created_at, updated_at'
      )
      .eq('id', id)
      .eq('user_id', user.id)
      .single();

    if (error || !data) {
      return NextResponse.json({ error: '未找到草稿' }, { status: 404 });
    }

    return NextResponse.json({
      id: data.id,
      name: data.name,
      description: data.description,
      content: data.content,
      status: data.status,
      clawhub_slug: data.clawhub_slug,
      clawhub_url: data.clawhub_url,
      skillssh_slug: data.skillssh_slug,
      skillssh_url: data.skillssh_url,
      created_at: data.created_at,
      updated_at: data.updated_at,
    });
  } catch (err) {
    console.error('[skill-drafts-get] Error:', err);
    return NextResponse.json({ error: '获取草稿失败' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;

    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: '请先登录' }, { status: 401 });
    }

    const body = await request.json();
    const { name, description, content, template_type, validation_status, validation_errors } =
      body as {
        name?: string;
        description?: string;
        content?: string;
        template_type?: string;
        validation_status?: string;
        validation_errors?: string[];
      };

    const serviceClient = createServiceClient();
    const updateData: Record<string, unknown> = { updated_at: new Date().toISOString() };
    if (name !== undefined) updateData.name = name.trim();
    if (description !== undefined) updateData.description = description?.trim() || null;
    if (content !== undefined) updateData.content = content.trim();
    if (template_type !== undefined) updateData.template_type = template_type;
    if (validation_status !== undefined) updateData.validation_status = validation_status;
    if (validation_errors !== undefined) updateData.validation_errors = validation_errors;

    const { error } = await serviceClient
      .from('user_skill_drafts')
      .update(updateData)
      .eq('id', id)
      .eq('user_id', user.id);

    if (error) {
      console.error('[skill-drafts-update] DB error:', error.message);
      return NextResponse.json({ error: '更新草稿失败' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('[skill-drafts-update] Error:', err);
    return NextResponse.json({ error: '更新草稿失败' }, { status: 500 });
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: '请先登录' }, { status: 401 });
    }

    const serviceClient = createServiceClient();
    const { error } = await serviceClient
      .from('user_skill_drafts')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id);

    if (error) {
      console.error('[skill-drafts-delete] DB error:', error.message);
      return NextResponse.json({ error: '删除草稿失败' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('[skill-drafts-delete] Error:', err);
    return NextResponse.json({ error: '删除草稿失败' }, { status: 500 });
  }
}
