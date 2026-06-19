import { NextRequest, NextResponse } from 'next/server';
import { searchSkills } from '@/lib/clawhub/client';
import type { UnifiedSkill } from '@/types/workshop';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const q = searchParams.get('q') || '';

    if (!q || q.length < 2) {
      return NextResponse.json({ results: [], total: 0, query: q });
    }

    const result = await searchSkills(q);

    // Map to UnifiedSkill format
    const skills: UnifiedSkill[] = result.results.map((s) => ({
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

    return NextResponse.json({
      results: skills,
      total: result.total,
      query: result.query,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'ClawHub 搜索暂不可用';
    return NextResponse.json({ error: message, results: [], total: 0 }, { status: 502 });
  }
}
