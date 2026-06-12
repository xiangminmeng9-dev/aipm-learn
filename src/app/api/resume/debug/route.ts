import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

/**
 * Debug endpoint: fetch the most recent resume version for the current user.
 * Returns both the raw AI output and the normalized version for comparison.
 * GET /api/resume/debug
 */
export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: '未登录' }, { status: 401 });
    }

    const { data, error } = await supabase
      .from('resume_versions')
      .select('id, original_resume_text, modified_resume, changes_summary, style_type, company_name, created_at')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (error || !data) {
      return NextResponse.json({ error: '没有找到简历记录' }, { status: 404 });
    }

    return NextResponse.json({
      id: data.id,
      original_resume: data.original_resume_text,
      modified_resume: data.modified_resume,
      changes_summary: data.changes_summary,
      style_type: data.style_type,
      company_name: data.company_name,
      created_at: data.created_at,
    });
  } catch (error) {
    console.error('Resume debug API error:', error);
    return NextResponse.json({ error: '服务器内部错误' }, { status: 500 });
  }
}
