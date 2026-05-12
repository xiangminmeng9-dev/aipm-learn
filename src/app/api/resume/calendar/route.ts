import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: '未登录', code: 'UNAUTHORIZED' }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const year = parseInt(searchParams.get('year') || String(new Date().getFullYear()));
    const month = parseInt(searchParams.get('month') || String(new Date().getMonth() + 1));

    const startDate = `${year}-${String(month).padStart(2, '0')}-01`;
    const lastDay = new Date(year, month, 0).getDate();
    const endDate = `${year}-${String(month).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`;

    const { data, error } = await supabase
      .from('resume_applications')
      .select('id, company_name, position_name, status, applied_at, notes')
      .eq('user_id', user.id)
      .gte('applied_at', startDate)
      .lte('applied_at', endDate)
      .order('applied_at', { ascending: true });

    if (error) return NextResponse.json({ error: '获取日历数据失败', code: 'INTERNAL_ERROR' }, { status: 500 });

    // Group by date
    const byDate = new Map<string, typeof data>();
    for (const app of data || []) {
      const list = byDate.get(app.applied_at) || [];
      list.push(app);
      byDate.set(app.applied_at, list);
    }

    // Check interviews for dates near the application dates
    const interviewStatuses = ['初面', '二面', '终面'];
    const days = Array.from(byDate.entries())
      .map(([date, apps]) => ({
        date,
        applications_count: apps.length,
        interviews: apps
          .filter((a) => interviewStatuses.includes(a.status))
          .map((a) => ({ company_name: a.company_name, position_name: a.position_name, status: a.status as '初面' | '二面' | '终面' })),
        has_note: apps.some((a) => a.notes),
      }))
      .sort((a, b) => a.date.localeCompare(b.date));

    return NextResponse.json({ days });
  } catch (err) {
    console.error('Resume calendar GET error:', err);
    return NextResponse.json({ error: '服务器内部错误', code: 'INTERNAL_ERROR' }, { status: 500 });
  }
}
