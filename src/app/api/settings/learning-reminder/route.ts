import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { validateBody, learningReminderSchema } from '@/lib/validations';

export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: '请先登录' }, { status: 401 });

    const { data } = await supabase
      .from('learning_reminders')
      .select('*')
      .eq('user_id', user.id)
      .maybeSingle();

    return NextResponse.json({ reminder: data || null });
  } catch (err) {
    console.error('Learning reminder GET error:', err);
    return NextResponse.json({ error: '获取失败' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: '请先登录' }, { status: 401 });

    const body = await request.json();
    const validation = validateBody(learningReminderSchema, body);
    if (!validation.success) return NextResponse.json({ error: validation.error }, { status: 400 });

    const { reminder_time, enabled_days, enabled } = validation.data;

    const { data: existing } = await supabase
      .from('learning_reminders')
      .select('id')
      .eq('user_id', user.id)
      .maybeSingle();

    const payload: Record<string, unknown> = { updated_at: new Date().toISOString() };
    if (reminder_time !== undefined) payload.reminder_time = reminder_time;
    if (enabled_days !== undefined) payload.enabled_days = enabled_days;
    if (enabled !== undefined) payload.enabled = enabled;

    if (existing) {
      await supabase.from('learning_reminders').update(payload).eq('user_id', user.id);
    } else {
      await supabase.from('learning_reminders').insert({
        user_id: user.id,
        reminder_time: reminder_time || '20:00',
        enabled_days: enabled_days || [1, 2, 3, 4, 5],
        enabled: enabled ?? true,
      });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('Learning reminder POST error:', err);
    return NextResponse.json({ error: '保存失败' }, { status: 500 });
  }
}
