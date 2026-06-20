import { NextRequest, NextResponse } from 'next/server';
import { createClient, createServiceClient } from '@/lib/supabase/server';
export const dynamic = 'force-dynamic';

export async function GET() {
  try {
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
        'id, name, description, status, template_type, validation_status, clawhub_slug, clawhub_url, skillssh_slug, skillssh_url, created_at, updated_at'
      )
      .eq('user_id', user.id)
      .order('updated_at', { ascending: false })
      .limit(50);

    if (error) {
      console.error('[skill-drafts-list] DB error:', error.message);
      return NextResponse.json({ drafts: [] });
    }

    return NextResponse.json({ drafts: data || [] });
  } catch (err) {
    console.error('[skill-drafts-list] Error:', err);
    return NextResponse.json({ drafts: [] });
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: '请先登录' }, { status: 401 });
    }

    const body = await request.json();
    const { name, description, content, template_type } = body as {
      name?: string;
      description?: string;
      content?: string;
      template_type?: string;
    };

    if (!name?.trim()) {
      return NextResponse.json({ error: '草稿名称不能为空' }, { status: 400 });
    }

    const serviceClient = createServiceClient();
    const { data, error } = await serviceClient
      .from('user_skill_drafts')
      .insert({
        user_id: user.id,
        name: name.trim(),
        description: description?.trim() || null,
        content: content?.trim() || '',
        template_type: template_type || 'basic',
      })
      .select('id')
      .single();

    if (error) {
      console.error('[skill-drafts-create] DB error:', error.message);
      return NextResponse.json({ error: '创建草稿失败' }, { status: 500 });
    }

    return NextResponse.json({ id: data.id });
  } catch (err) {
    console.error('[skill-drafts-create] Error:', err);
    return NextResponse.json({ error: '创建草稿失败' }, { status: 500 });
  }
}
