import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: '未登录', code: 'UNAUTHORIZED' }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || undefined;

    let query = supabase
      .from('resume_repository')
      // List view: load summary columns only. Large text (resume_text, jd_text)
      // is fetched on the single-item GET (/api/resume/repository/[id]).
      .select('id, user_id, company_name, position_name, jd_link, file_name, file_url, resume_version_id, created_at, updated_at')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(200);

    if (search) {
      query = query.or(`company_name.ilike.%${search}%,position_name.ilike.%${search}%`);
    }

    const { data, error } = await query;
    if (error) return NextResponse.json({ error: '获取简历列表失败', code: 'INTERNAL_ERROR' }, { status: 500 });

    return NextResponse.json({ items: data || [] });
  } catch (err) {
    console.error('Resume repository GET error:', err);
    return NextResponse.json({ error: '服务器内部错误', code: 'INTERNAL_ERROR' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: '未登录', code: 'UNAUTHORIZED' }, { status: 401 });

    const body = await request.json();
    const { company_name, position_name, jd_text, jd_link, file_name, resume_text } = body;

    if (!company_name || !position_name || !resume_text) {
      return NextResponse.json({ error: '公司名、岗位名和简历文本不能为空', code: 'VALIDATION_ERROR' }, { status: 400 });
    }

    // Auto-create a resume_versions record
    const { data: version, error: versionErr } = await supabase
      .from('resume_versions')
      .insert({
        user_id: user.id,
        original_resume_text: resume_text,
        jd_text: jd_text || '',
        company_name,
        position_name,
        style_type: 'standard',
      })
      .select('id')
      .single();

    if (versionErr) {
      console.error('Failed to create version for repository item:', versionErr);
    }

    const { data, error } = await supabase
      .from('resume_repository')
      .insert({
        user_id: user.id,
        company_name,
        position_name,
        jd_text: jd_text || '',
        jd_link: jd_link || null,
        file_name: file_name || null,
        resume_text,
        resume_version_id: version?.id || null,
      })
      .select()
      .single();

    if (error) return NextResponse.json({ error: '保存简历失败', code: 'INTERNAL_ERROR' }, { status: 500 });
    return NextResponse.json({ item: data });
  } catch (err) {
    console.error('Resume repository POST error:', err);
    return NextResponse.json({ error: '服务器内部错误', code: 'INTERNAL_ERROR' }, { status: 500 });
  }
}
