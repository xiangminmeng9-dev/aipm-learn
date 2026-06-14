import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: '请先登录' }, { status: 401 });

    const { data, error } = await supabase
      .from('jd_analyses')
      .select('id, company_name, created_at')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    const counts: Record<string, number> = {};
    let nullCount = 0;
    for (const d of data || []) {
      const c = d.company_name?.trim();
      if (!c) { nullCount++; continue; }
      counts[c] = (counts[c] || 0) + 1;
    }

    const sorted = Object.entries(counts).sort((a, b) => b[1] - a[1]);

    return NextResponse.json({
      total: data?.length || 0,
      null_company_count: nullCount,
      company_distribution: Object.fromEntries(sorted),
    });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
