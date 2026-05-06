import { NextRequest, NextResponse } from 'next/server';
import { refreshRssArticles } from '@/lib/rss/pipeline';
import { createClient } from '@/lib/supabase/server';

export const maxDuration = 60;

// POST /api/rss/refresh — fetch new articles from RSS sources and translate
export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: '未登录' }, { status: 401 });
  }
  const { searchParams } = new URL(request.url);
  const categoryParam = searchParams.get('category');
  const category = categoryParam === 'ai_tech' || categoryParam === 'ai_pm' ? categoryParam : undefined;

  try {
    const result = await refreshRssArticles(category);
    return NextResponse.json(result);
  } catch (err) {
    console.error('RSS refresh error:', err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : '刷新失败' },
      { status: 500 },
    );
  }
}
