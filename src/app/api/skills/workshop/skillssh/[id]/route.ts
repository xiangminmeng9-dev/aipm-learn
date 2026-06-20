import { NextRequest, NextResponse } from 'next/server';
import { getSkillDetail } from '@/lib/skillssh/client';

export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const detail = await getSkillDetail(id);

    // Extract SKILL.md content from files array
    const skillFile = detail.files?.find(
      (f) => f.path === 'SKILL.md' || f.path.endsWith('SKILL.md')
    );
    const content = skillFile?.contents || '';

    return NextResponse.json({
      skill: {
        name: detail.slug,
        description: '',
        source: detail.source,
        slug: detail.slug,
        installs: detail.installs,
      },
      content,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'skills.sh 服务暂不可用';
    const status = message.includes('未找到') ? 404 : message.includes('认证') ? 401 : 502;
    return NextResponse.json({ error: message }, { status });
  }
}
