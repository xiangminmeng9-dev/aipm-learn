import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

const DEFAULT_GOALS = { daily_minutes_target: 30, weekly_sessions_target: 5, monthly_score_target: 75 };

export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: '请先登录' }, { status: 401 });

    const { data } = await supabase
      .from('user_daily_goals')
      .select('daily_minutes_target, weekly_sessions_target, monthly_score_target')
      .eq('user_id', user.id)
      .maybeSingle();

    return NextResponse.json(data || DEFAULT_GOALS);
  } catch {
    return NextResponse.json(DEFAULT_GOALS);
  }
}

export async function PUT(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: '请先登录' }, { status: 401 });

    const body = await request.json();
    const { daily_minutes_target, weekly_sessions_target, monthly_score_target } = body;

    const { error } = await supabase.from('user_daily_goals').upsert({
      user_id: user.id,
      daily_minutes_target: daily_minutes_target ?? 30,
      weekly_sessions_target: weekly_sessions_target ?? 5,
      monthly_score_target: monthly_score_target ?? 75,
      updated_at: new Date().toISOString(),
    }, { onConflict: 'user_id' });

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: '服务器错误' }, { status: 500 });
  }
}
