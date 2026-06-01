import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: '请先登录' }, { status: 401 });

    const resourceType = request.nextUrl.searchParams.get('resource_type');
    const subcategory = request.nextUrl.searchParams.get('subcategory');
    const search = request.nextUrl.searchParams.get('search');

    let query = supabase
      .from('external_resources')
      .select('*')
      .eq('user_id', user.id)
      .order('sort_order', { ascending: true });

    if (resourceType) query = query.eq('resource_type', resourceType);
    if (subcategory) query = query.eq('subcategory', subcategory);
    if (search) query = query.or(`title.ilike.%${search}%,url.ilike.%${search}%,description.ilike.%${search}%,author.ilike.%${search}%`);

    const { data, error } = await query;

    if (error) {
      // Fallback: if resource_type column doesn't exist yet, query without it
      const fallbackQuery = supabase
        .from('external_resources')
        .select('*')
        .eq('user_id', user.id)
        .order('sort_order', { ascending: true });
      if (search) fallbackQuery.or(`title.ilike.%${search}%,url.ilike.%${search}%,description.ilike.%${search}%`);
      const { data: fallbackData, error: fallbackError } = await fallbackQuery;
      if (fallbackError) return NextResponse.json({ error: fallbackError.message }, { status: 500 });
      return NextResponse.json({ resources: fallbackData || [] });
    }

    return NextResponse.json({ resources: data || [] });
  } catch (err) {
    console.error('External resources GET error:', err);
    return NextResponse.json({ error: '获取资源失败' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: '请先登录' }, { status: 401 });

    const body = await request.json();
    const { title, url, type, resource_type, subcategory, thumbnail_url, local_path, author, year, platform, duration, source, notes, related_module_name, description, parent_id } = body;

    if (!title || !title.trim()) {
      return NextResponse.json({ error: '请输入资源名称' }, { status: 400 });
    }

    const insertData: Record<string, unknown> = {
      user_id: user.id,
      title: title.trim(),
      url: url || '',
      type: type || 'link',
      resource_type: resource_type || 'website',
      subcategory: subcategory || null,
      thumbnail_url: thumbnail_url || null,
      local_path: local_path || null,
      author: author || null,
      year: year || null,
      platform: platform || null,
      duration: duration || null,
      source: source || 'manual',
      notes: notes || null,
      related_module_name: related_module_name || null,
      description: description || null,
      parent_id: parent_id || null,
    };

    // Try with new columns first, fallback without them
    let { data, error } = await supabase
      .from('external_resources')
      .insert(insertData)
      .select()
      .single();

    if (error && error.message?.includes('column') && error.message?.includes('does not exist')) {
      // Remove new columns and retry
      const fallbackData = { ...insertData };
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
        .insert(fallbackData)
        .select()
        .single();
      data = result.data;
      error = result.error;
    }

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    // Log activity
    try {
      await supabase.from('user_activities').insert({
        user_id: user.id,
        activity_type: 'resource_added',
        title: `添加资源: ${title.trim()}`,
        metadata: { resource_type: resource_type || 'website', subcategory, resource_id: data?.id },
      });
    } catch {
      // Activity logging is non-critical
    }

    return NextResponse.json({ resource: data });
  } catch (err) {
    console.error('External resources POST error:', err);
    return NextResponse.json({ error: '添加资源失败' }, { status: 500 });
  }
}
