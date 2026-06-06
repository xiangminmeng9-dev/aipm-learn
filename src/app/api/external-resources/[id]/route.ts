import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: '未登录' }, { status: 401 });

    const { id } = await params;

    // Get resource info before deleting for activity logging
    const { data: resource } = await supabase
      .from('external_resources')
      .select('id, title, resource_type, subcategory')
      .eq('id', id)
      .eq('user_id', user.id)
      .single();

    const { error } = await supabase
      .from('external_resources')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id);

    if (error) return NextResponse.json({ error: '删除失败' }, { status: 500 });

    // Log activity
    if (resource) {
      try {
        await supabase.from('user_activity_logs').insert({
          user_id: user.id,
          module: 'external_resources',
          action: 'resource_deleted',
          metadata: { title: resource.title, resource_type: resource.resource_type, subcategory: resource.subcategory },
        });
      } catch {
        // Non-critical
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('External resources DELETE error:', error);
    return NextResponse.json({ error: '服务器内部错误' }, { status: 500 });
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: '未登录' }, { status: 401 });

    const { id } = await params;
    const body = await request.json();

    const updateData: Record<string, unknown> = {};
    if (body.title) updateData.title = body.title.trim();
    if (body.url) updateData.url = body.url.trim();
    if (body.type) updateData.type = body.type;
    if (body.resource_type) updateData.resource_type = body.resource_type;
    if (body.subcategory) updateData.subcategory = body.subcategory;
    if (body.thumbnail_url) updateData.thumbnail_url = body.thumbnail_url;
    if (body.local_path) updateData.local_path = body.local_path;
    if (body.author) updateData.author = body.author;
    if (body.year) updateData.year = body.year;
    if (body.platform) updateData.platform = body.platform;
    if (body.duration) updateData.duration = body.duration;
    if (body.source) updateData.source = body.source;
    if (body.notes) updateData.notes = body.notes;
    if (body.description) updateData.description = body.description;
    if (body.related_module_id !== undefined) updateData.related_module_id = body.related_module_id || null;
    if (body.related_module_name !== undefined) updateData.related_module_name = body.related_module_name || null;
    if (body.parent_id !== undefined) updateData.parent_id = body.parent_id || null;
    if (body.sort_order !== undefined) updateData.sort_order = body.sort_order;

    let { data, error } = await supabase
      .from('external_resources')
      .update(updateData)
      .eq('id', id)
      .eq('user_id', user.id)
      .select()
      .single();

    if (error && error.message?.includes('column') && error.message?.includes('does not exist')) {
      // Remove new columns and retry
      const fallbackData = { ...updateData };
      delete fallbackData.resource_type;
      delete fallbackData.subcategory;
      delete fallbackData.thumbnail_url;
      delete fallbackData.local_path;
      delete fallbackData.author;
      delete fallbackData.year;
      delete fallbackData.platform;
      delete fallbackData.duration;
      const result = await supabase
        .from('external_resources')
        .update(fallbackData)
        .eq('id', id)
        .eq('user_id', user.id)
        .select()
        .single();
      data = result.data;
      error = result.error;
    }

    if (error) return NextResponse.json({ error: '更新失败' }, { status: 500 });
    return NextResponse.json({ resource: data });
  } catch (error) {
    console.error('External resources PATCH error:', error);
    return NextResponse.json({ error: '服务器内部错误' }, { status: 500 });
  }
}