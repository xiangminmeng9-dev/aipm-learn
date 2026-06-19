import { NextRequest, NextResponse } from 'next/server';
import { browseSkills } from '@/lib/skillssh/client';
import { translateSkills } from '@/lib/skills/translator';
import type { UnifiedSkill } from '@/types/workshop';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const q = searchParams.get('q') || '';
    const limit = Math.min(Number(searchParams.get('limit')) || 20, 100);

    const result = await browseSkills({ q, limit });

    // Map to UnifiedSkill format
    let skills: UnifiedSkill[] = result.skills.map((s) => ({
      id: s.id,
      name: s.name,
      description: '',
      author: s.source.split('/')[0] || '',
      installs: s.installs,
      platform: 'skillssh' as const,
      url: s.url,
      slug: s.slug,
    }));

    // Translate skill names and descriptions to Chinese
    skills = await translateSkills(skills);

    return NextResponse.json({
      skills,
      total: result.total,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'skills.sh 服务暂不可用';
    const status = message.includes('认证') ? 401 : 502;
    return NextResponse.json(
      { error: message, skills: [] },
      { status },
    );
  }
}
