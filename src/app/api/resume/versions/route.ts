import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: '未登录', code: 'UNAUTHORIZED' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const singleId = searchParams.get('id');

    if (singleId) {
      // Fetch single version with full content
      const { data: version, error } = await supabase
        .from('resume_versions')
        .select('id, style_type, company_name, position_name, changes_summary, modified_resume, original_resume_text, jd_text, created_at')
        .eq('id', singleId)
        .eq('user_id', user.id)
        .single();

      if (error || !version) {
        return NextResponse.json({ error: '版本不存在', code: 'NOT_FOUND' }, { status: 404 });
      }
      return NextResponse.json({ version });
    }

    // List versions with full content for expand view
    const { data: versions, error } = await supabase
      .from('resume_versions')
      .select('id, style_type, company_name, position_name, changes_summary, modified_resume, original_resume_text, jd_text, created_at')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(20);

    if (error) {
      console.error('Failed to fetch resume versions:', error);
      return NextResponse.json({ versions: [] });
    }

    return NextResponse.json({ versions: versions ?? [] });
  } catch (error) {
    console.error('Resume versions GET API error:', error);
    return NextResponse.json({ error: '服务器内部错误', code: 'INTERNAL_ERROR' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: '未登录', code: 'UNAUTHORIZED' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { error: '缺少版本 ID', code: 'VALIDATION_ERROR' },
        { status: 400 }
      );
    }

    const { error } = await supabase
      .from('resume_versions')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id);

    if (error) {
      console.error('Failed to delete resume version:', error);
      return NextResponse.json({ error: '删除失败', code: 'INTERNAL_ERROR' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Resume versions DELETE API error:', error);
    return NextResponse.json({ error: '服务器内部错误', code: 'INTERNAL_ERROR' }, { status: 500 });
  }
}