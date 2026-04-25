import { NextRequest, NextResponse } from 'next/server';
import { RSS_SOURCES } from '@/lib/rss/sources';

// GET /api/rss/sources?category=ai_tech|ai_pm
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const category = searchParams.get('category') || 'ai_tech';

  const sources = RSS_SOURCES
    .filter((s) => s.category === category)
    .map((s) => ({
      id: s.name,
      name: s.name,
      url: s.url,
      category: s.category,
      language: s.language,
      is_active: true,
      last_fetched_at: null,
    }));

  return NextResponse.json({ sources });
}