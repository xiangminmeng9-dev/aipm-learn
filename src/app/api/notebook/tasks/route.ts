import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const date = request.nextUrl.searchParams.get('date') || new Date().toISOString().slice(0, 10);

  const { data, error } = await supabase
    .from('notebook_daily_tasks')
    .select('*')
    .eq('user_id', user.id)
    .eq('date', date)
    .order('sort_order', { ascending: true });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ tasks: data });
}

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await request.json();
  const { tasks } = body;

  // Support single or batch create
  const items = tasks ?? [body];
  if (!items.length) return NextResponse.json({ error: 'No tasks provided' }, { status: 400 });

  const date = items[0].date || new Date().toISOString().slice(0, 10);

  // Get current max sort_order for the date
  const { data: existing } = await supabase
    .from('notebook_daily_tasks')
    .select('sort_order')
    .eq('user_id', user.id)
    .eq('date', date)
    .order('sort_order', { ascending: false })
    .limit(1);

  let nextOrder = (existing?.[0]?.sort_order ?? -1) + 1;

  const rows = items.map((t: { title: string; description?: string; start_time?: string; duration?: string; from_template?: boolean }) => ({
    user_id: user.id,
    date,
    title: t.title,
    description: t.description ?? '',
    start_time: t.start_time ?? '',
    duration: t.duration ?? '',
    sort_order: nextOrder++,
    from_template: t.from_template ?? false,
  }));

  const { data, error } = await supabase
    .from('notebook_daily_tasks')
    .insert(rows)
    .select();

  if (error) {
    // Handle unique constraint violation (duplicate title on same date)
    if (error.code === '23505') {
      return NextResponse.json({ error: 'Task already exists for this date', code: 'DUPLICATE' }, { status: 409 });
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ tasks: data });
}
