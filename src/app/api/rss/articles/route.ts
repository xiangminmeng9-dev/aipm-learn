import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { RSS_SOURCES } from '@/lib/rss/sources';

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const category = searchParams.get('category'); // 'ai_tech' | 'ai_pm'
  const page = Math.max(1, parseInt(searchParams.get('page') || '1'));
  const page_size = Math.min(100, Math.max(1, parseInt(searchParams.get('page_size') || '20')));

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: '请先登录' }, { status: 401 });
  }

  // Get source names for the requested category
  const sourceNames = category
    ? RSS_SOURCES.filter(s => s.category === category).map(s => s.name)
    : RSS_SOURCES.map(s => s.name);

  if (sourceNames.length === 0) {
    return NextResponse.json({ data: [], total: 0, page, page_size });
  }

  // Get total count
  const { count } = await supabase
    .from('daily_ai_news_articles')
    .select('id', { count: 'exact', head: true })
    .in('source', sourceNames);

  const { data, error } = await supabase
    .from('daily_ai_news_articles')
    .select('*')
    .in('source', sourceNames)
    .order('published_at', { ascending: false })
    .range((page - 1) * page_size, page * page_size - 1);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Parse articles and extract translation data from summary
  const articles = (data || []).map(article => {
    let plainExplanation: string | null = null;
    let impact: string | null = null;
    let tags: string[] = [];

    // Try to parse translation JSON from summary
    try {
      const parsed = JSON.parse(article.summary || '');
      if (parsed && typeof parsed === 'object') {
        plainExplanation = parsed.explanation || parsed.summary || null;
        impact = parsed.impact || null;
        tags = parsed.tags || [];
      }
    } catch {
      // summary is plain text, not JSON
      plainExplanation = article.summary || null;
    }

    return {
      id: article.id,
      title: article.title,
      link: article.url || article.link,
      source: article.source,
      publishedAt: article.published_at,
      summary: plainExplanation || article.summary,
      plainExplanation,
      impact,
      tags,
      category: RSS_SOURCES.find(s => s.name === article.source)?.category || 'ai_tech',
    };
  });

  return NextResponse.json({ data: articles, total: count ?? 0, page, page_size });
}
