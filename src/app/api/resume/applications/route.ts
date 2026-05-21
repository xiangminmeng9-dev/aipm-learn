import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: '未登录', code: 'UNAUTHORIZED' }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const company = searchParams.get('company') || undefined;
    const status = searchParams.get('status') || undefined;
    const channel = searchParams.get('channel') || undefined;
    const companyType = searchParams.get('company_type') || undefined;
    const dateFrom = searchParams.get('date_from') || undefined;
    const dateTo = searchParams.get('date_to') || undefined;
    const page = parseInt(searchParams.get('page') || '1');
    const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 200);
    const offset = (page - 1) * limit;

    let query = supabase
      .from('resume_applications')
      .select('*', { count: 'exact' })
      .eq('user_id', user.id)
      .order('applied_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (company) query = query.ilike('company_name', `%${company}%`);
    if (status) query = query.eq('status', status);
    if (channel) query = query.eq('channel', channel);
    if (companyType) query = query.eq('company_type', companyType);
    if (dateFrom) query = query.gte('applied_at', dateFrom);
    if (dateTo) query = query.lte('applied_at', dateTo);

    const { data, error, count } = await query;
    if (error) return NextResponse.json({ error: '获取投递记录失败', code: 'INTERNAL_ERROR' }, { status: 500 });

    return NextResponse.json({ applications: data || [], total: count || 0, page, limit });
  } catch (err) {
    console.error('Resume applications GET error:', err);
    return NextResponse.json({ error: '服务器内部错误', code: 'INTERNAL_ERROR' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: '未登录', code: 'UNAUTHORIZED' }, { status: 401 });

    const body = await request.json();
    const { company_name, position_name, channel, status, applied_at, notes, city, position_category, resume_version_id, company_type, company_preference } = body;

    if (!company_name || !position_name) {
      return NextResponse.json({ error: '公司名称和岗位名称不能为空', code: 'VALIDATION_ERROR' }, { status: 400 });
    }

    const { data, error } = await supabase
      .from('resume_applications')
      .insert({
        user_id: user.id,
        company_name,
        position_name,
        channel: channel || '官网',
        status: status || '已投递',
        applied_at: applied_at || new Date().toISOString().slice(0, 10),
        notes: notes || null,
        city: city || null,
        position_category: position_category || null,
        resume_version_id: resume_version_id || null,
        company_type: company_type || 'other',
        company_preference: company_preference || null,
        status_history: [{ status: status || '已投递', date: new Date().toISOString() }],
      })
      .select()
      .single();

    if (error) return NextResponse.json({ error: '创建投递记录失败', code: 'INTERNAL_ERROR' }, { status: 500 });
    return NextResponse.json({ application: data });
  } catch (err) {
    console.error('Resume applications POST error:', err);
    return NextResponse.json({ error: '服务器内部错误', code: 'INTERNAL_ERROR' }, { status: 500 });
  }
}
