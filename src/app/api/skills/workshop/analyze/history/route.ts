import { NextResponse } from 'next/server';
import { createClient, createServiceClient } from '@/lib/supabase/server';
export const dynamic = 'force-dynamic';

export async function GET() {
  try {
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
      .select('id, skill_name, skill_slug, skill_source, analysis_result, created_at')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(20);

    if (error) {
      console.error('[skill-analyze-history] DB error:', error.message);
      return NextResponse.json({ analyses: [] });
    }

    const analyses = (data || []).map((row) => {
      const result = (row as Record<string, unknown>).analysis_result as Record<
        string,
        unknown
      > | null;
      return {
        id: row.id,
        skill_name: row.skill_name,
        skill_slug: row.skill_slug,
        skill_source: row.skill_source,
        overall_quality: result?.overall_quality ?? 0,
        created_at: row.created_at,
      };
    });

    return NextResponse.json({ analyses });
  } catch (err) {
    console.error('[skill-analyze-history] Error:', err);
    return NextResponse.json({ analyses: [] });
  }
}
