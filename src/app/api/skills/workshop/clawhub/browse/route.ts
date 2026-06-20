import { NextRequest, NextResponse } from 'next/server';
import { browseSkills } from '@/lib/clawhub/client';
import { translateSkills } from '@/lib/skills/translator';
import type { ClawHubSortValue, UnifiedSkill } from '@/types/workshop';
import { VIEW_TAB_TO_CLAWHUB_SORT } from '@/types/workshop';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const cursor = searchParams.get('cursor') || undefined;
    const limit = Math.min(Number(searchParams.get('limit')) || 20, 200);
    const sortParam = searchParams.get('sort') || '';
    const view = searchParams.get('view') || '';
    const q = searchParams.get('q') || '';

    // Map view param to sort if sort not explicitly provided
    let sort: ClawHubSortValue = 'updated';
    if (sortParam) {
      sort = sortParam as ClawHubSortValue;
    } else if (view && view in VIEW_TAB_TO_CLAWHUB_SORT) {
      sort = VIEW_TAB_TO_CLAWHUB_SORT[view as keyof typeof VIEW_TAB_TO_CLAWHUB_SORT];
    }

    // If there's a search query, use search instead of browse
    if (q && q.length >= 2) {
      const { searchSkills } = await import('@/lib/clawhub/client');
      const searchResult = await searchSkills(q);
      let skills: UnifiedSkill[] = searchResult.results.map((s) => ({
        id: s.slug,
        name: s.name,
        description: s.description,
        author: s.author,
        installs: s.downloads,
        platform: 'clawhub' as const,
        url: s.url || `https://clawhub.ai/skills/${s.slug}`,
        slug: s.slug,
        tags: s.tags,
        updatedAt: s.updatedAt,
      }));
      // Translate to Chinese
      skills = await translateSkills(skills);
      return NextResponse.json({
        skills,
        total: searchResult.total,
        nextCursor: null,
        hasMore: false,
      });
    }

    const result = await browseSkills({ cursor, limit, sort });

    // Map to UnifiedSkill format
    let skills: UnifiedSkill[] = result.skills.map((s) => ({
      id: s.slug,
      name: s.name,
      description: s.description,
      author: s.author,
      installs: s.downloads,
      platform: 'clawhub' as const,
      url: s.url || `https://clawhub.ai/skills/${s.slug}`,
      slug: s.slug,
      tags: s.tags,
      updatedAt: s.updatedAt,
    }));

    // Translate skill names and descriptions to Chinese
    skills = await translateSkills(skills);

    return NextResponse.json({
      skills,
      nextCursor: result.nextCursor,
      hasMore: result.hasMore,
      total: result.total,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'ClawHub 服务暂不可用';
    return NextResponse.json(
      { error: message, skills: [], nextCursor: null, hasMore: false },
      { status: 502 }
    );
  }
}
