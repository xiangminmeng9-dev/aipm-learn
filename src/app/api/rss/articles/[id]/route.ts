import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// GET /api/rss/articles/[id]
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const supabase = await createClient();
  const { id } = await params;

  const { data, error } = await supabase
    .from('rss_articles')
    .select('*, source:rss_sources(id, name, language, url)')
    .eq('id', id)
    .single();

  if (error) {
    return NextResponse.json({ error: '文章不存在' }, { status: 404 });
  }

  // Mark as read
  await supabase
    .from('rss_articles')
    .update({ is_read: true })
    .eq('id', id);

  return NextResponse.json({ article: data });
}
