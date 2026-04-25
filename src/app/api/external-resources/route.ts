import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: '未登录', code: 'UNAUTHORIZED' }, { status: 401 });

    const { data: resources, error } = await supabase
      .from('external_resources')
      .select('*')
      .eq('user_id', user.id)
      .order('sort_order', { ascending: true })
      .order('created_at', { ascending: false });

    if (error) return NextResponse.json({ error: '获取失败', code: 'INTERNAL_ERROR' }, { status: 500 });
    return NextResponse.json({ resources: resources ?? [] });
  } catch (error) {
    console.error('External resources GET error:', error);
    return NextResponse.json({ error: '服务器内部错误', code: 'INTERNAL_ERROR' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: '未登录', code: 'UNAUTHORIZED' }, { status: 401 });

    const body = await request.json();
    const { title, url, type, source, notes, related_module_id, related_module_name, parent_id } = body as {
      title: string; url?: string; type?: string; source?: string; notes?: string;
      related_module_id?: string; related_module_name?: string; parent_id?: string;
    };

    if (!title?.trim()) {
      return NextResponse.json({ error: '标题必填', code: 'VALIDATION_ERROR' }, { status: 400 });
    }

    const resourceType = type ?? 'link';
    if (!['link', 'video', 'doc', 'folder'].includes(resourceType)) {
      return NextResponse.json({ error: '无效类型', code: 'VALIDATION_ERROR' }, { status: 400 });
    }

    // Non-folder types require url
    if (resourceType !== 'folder' && !url?.trim()) {
      return NextResponse.json({ error: '链接必填', code: 'VALIDATION_ERROR' }, { status: 400 });
    }

    const { data: resource, error } = await supabase
      .from('external_resources')
      .insert({
        user_id: user.id,
        parent_id: parent_id || null,
        title: title.trim(),
        url: resourceType === 'folder' ? '' : (url?.trim() ?? ''),
        type: resourceType,
        source: source?.trim() ?? '',
        notes: notes?.trim() || null,
        related_module_id: related_module_id || null,
        related_module_name: related_module_name?.trim() || null,
      })
      .select()
      .single();

    if (error) return NextResponse.json({ error: '添加失败', code: 'INTERNAL_ERROR' }, { status: 500 });
    return NextResponse.json({ resource });
  } catch (error) {
    console.error('External resources POST error:', error);
    return NextResponse.json({ error: '服务器内部错误', code: 'INTERNAL_ERROR' }, { status: 500 });
  }
}
