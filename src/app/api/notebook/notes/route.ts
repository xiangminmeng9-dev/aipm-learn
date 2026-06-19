import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { searchParams } = request.nextUrl;
    const page = Math.max(1, parseInt(searchParams.get('page') || '1'));
    const page_size = Math.min(100, Math.max(1, parseInt(searchParams.get('page_size') || '20')));
    const category = searchParams.get('category');

    let countQuery = supabase
      .from('notebook_notes')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', user.id);
    if (category) countQuery = countQuery.eq('category', category);

    const { count } = await countQuery;

    let query = supabase
      .from('notebook_notes')
      // List view: keep content (frontend shows a 100-char preview) but drop the
      // potentially large ai_analysis column, which is only needed on detail view.
      .select('id, user_id, title, content, category, tags, pinned, created_at, updated_at')
      .eq('user_id', user.id)
      .order('pinned', { ascending: false })
      .order('updated_at', { ascending: false })
      .range((page - 1) * page_size, page * page_size - 1);

    if (category) query = query.eq('category', category);

    const { data, error } = await query;
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ data, total: count ?? 0, page, page_size });
  } catch (error) {
    console.error('[notebook/notes] Error:', error);
    return NextResponse.json({ error: '服务器内部错误', code: 'INTERNAL_ERROR' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await request.json();
    const { title, content, category, tags } = body;

    if (!title?.trim()) return NextResponse.json({ error: 'Title is required' }, { status: 400 });

    const { data, error } = await supabase
      .from('notebook_notes')
      .insert({
        user_id: user.id,
        title: title.trim(),
        content: content ?? '',
        category: category ?? 'general',
        tags: tags ?? [],
      })
      .select()
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ note: data });
  } catch (error) {
    console.error('[notebook/notes] Error:', error);
    return NextResponse.json({ error: '服务器内部错误', code: 'INTERNAL_ERROR' }, { status: 500 });
  }
}
