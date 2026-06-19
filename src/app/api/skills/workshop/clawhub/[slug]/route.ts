import { NextRequest, NextResponse } from 'next/server';
import { getSkillDetail, getSkillFile } from '@/lib/clawhub/client';

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;

    // Try to get detail first (includes metadata)
    let detail;
    try {
      detail = await getSkillDetail(slug);
    } catch {
      // If detail endpoint fails, try file endpoint directly
      const content = await getSkillFile(slug);
      return NextResponse.json({
        skill: { name: slug, slug },
        content,
      });
    }

    // Extract SKILL.md content from files array or fetch separately
    let content = '';
    const skillFile = detail.files?.find(
      (f) => f.path === 'SKILL.md' || f.path.endsWith('SKILL.md')
    );

    if (skillFile?.contents) {
      content = skillFile.contents;
    } else {
      try {
        content = await getSkillFile(slug);
      } catch {
        // File endpoint not available, return empty content
      }
    }

    return NextResponse.json({
      skill: {
        name: detail.name,
        description: detail.description,
        author: detail.author,
        slug: detail.slug,
        tags: detail.tags,
        installs: detail.downloads,
        updatedAt: detail.updatedAt,
      },
      content,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'ClawHub 服务暂不可用';
    const status = message.includes('404') ? 404 : 502;
    return NextResponse.json({ error: message }, { status });
  }
}
