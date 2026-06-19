import { NextRequest, NextResponse } from 'next/server';
import { searchSkills } from '@/lib/skillssh/client';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get('q') || '';

  if (!query || query.length < 2) {
    return NextResponse.json({ error: '搜索关键词至少 2 个字符' }, { status: 400 });
  }

  try {
    const result = await searchSkills(query);
    return NextResponse.json(result);
  } catch (error) {
    console.error('[workshop/skillssh/search] Error:', error);
    return NextResponse.json(
      { error: 'skills.sh 搜索失败', results: [], total: 0 },
      { status: 502 }
    );
  }
}
