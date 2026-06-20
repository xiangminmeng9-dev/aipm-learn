import { NextRequest, NextResponse } from 'next/server';
import { createClient, createServiceClient } from '@/lib/supabase/server';
export const dynamic = 'force-dynamic';

export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;

    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: '请先登录' }, { status: 401 });
    }

    const serviceClient = createServiceClient();
    const { data, error } = await serviceClient
      .from('skill_workshop_analyses')
      .select(
        'id, skill_content, skill_name, skill_slug, skill_source, analysis_result, created_at'
      )
      .eq('id', id)
      .eq('user_id', user.id)
      .single();

    if (error || !data) {
      return NextResponse.json({ error: '未找到分析记录' }, { status: 404 });
    }

    return NextResponse.json({
      id: data.id,
      skill_content: data.skill_content,
      skill_name: data.skill_name,
      skill_slug: data.skill_slug,
      skill_source: data.skill_source,
      analysis_result: data.analysis_result,
      created_at: data.created_at,
    });
  } catch (err) {
    console.error('[skill-analyze-history/[id]] Error:', err);
    return NextResponse.json({ error: '获取分析记录失败' }, { status: 500 });
  }
}
