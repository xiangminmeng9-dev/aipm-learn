import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const date = request.nextUrl.searchParams.get('date') || new Date().toISOString().slice(0, 10);

  // 1. Fetch existing tasks for the date
  const { data: tasks, error: tasksError } = await supabase
    .from('notebook_daily_tasks')
    .select('*')
    .eq('user_id', user.id)
    .eq('date', date)
    .order('sort_order', { ascending: true });

  if (tasksError) return NextResponse.json({ error: tasksError.message }, { status: 500 });

  // 2. Try to fetch active fixed task templates (table may not exist yet)
  const { data: templates } = await supabase
    .from('notebook_fixed_task_templates')
    .select('*')
    .eq('user_id', user.id)
    .eq('is_active', true);

  // 3. Auto-create fixed task instances if templates exist
  if (templates && templates.length > 0) {
    // Try to fetch skips for this date (table may not exist yet)
    const { data: skips } = await supabase
      .from('notebook_fixed_task_skips')
      .select('template_id')
      .eq('user_id', user.id)
      .eq('date', date);

    const skipSet = new Set((skips ?? []).map((s) => s.template_id));
    const existingTitles = new Set((tasks ?? []).map((t) => t.title));

    // Get current max sort_order
    const maxOrder = (tasks ?? []).reduce((m, t) => Math.max(m, t.sort_order ?? 0), -1);
    let nextOrder = maxOrder + 1;

    const toCreate = templates.filter(
      (tpl) => !skipSet.has(tpl.id) && !existingTitles.has(tpl.title)
    );

    if (toCreate.length > 0) {
      const rows = toCreate.map((tpl) => ({
        user_id: user.id,
        date,
        title: tpl.title,
        description: tpl.description,
        start_time: tpl.start_time,
        duration: tpl.duration,
        status: 'todo',
        sort_order: nextOrder++,
        from_template: false,
        is_fixed: true,
      }));

      const { data: newTasks, error: insertError } = await supabase
        .from('notebook_daily_tasks')
        .insert(rows)
        .select();

      // Ignore unique constraint violations (23505) or missing column errors
      if (insertError && insertError.code !== '23505') {
        // If is_fixed column doesn't exist yet, retry without it
        if (insertError.message?.includes('is_fixed') || insertError.code === '42703') {
          const fallbackRows = toCreate.map((tpl) => ({
            user_id: user.id,
            date,
            title: tpl.title,
            description: tpl.description,
            start_time: tpl.start_time,
            duration: tpl.duration,
            status: 'todo',
            sort_order: nextOrder++,
            from_template: false,
          }));
          const { data: fallbackTasks, error: fallbackError } = await supabase
            .from('notebook_daily_tasks')
            .insert(fallbackRows)
            .select();
          if (!fallbackError && fallbackTasks && fallbackTasks.length > 0) {
            const { data: allTasks, error: refetchError } = await supabase
              .from('notebook_daily_tasks')
              .select('*')
              .eq('user_id', user.id)
              .eq('date', date)
              .order('sort_order', { ascending: true });
            if (!refetchError) return NextResponse.json({ tasks: allTasks });
          }
        } else {
          return NextResponse.json({ error: insertError.message }, { status: 500 });
        }
      }

      if (newTasks && newTasks.length > 0) {
        // Re-fetch all tasks to get the complete ordered list
        const { data: allTasks, error: refetchError } = await supabase
          .from('notebook_daily_tasks')
          .select('*')
          .eq('user_id', user.id)
          .eq('date', date)
          .order('sort_order', { ascending: true });

        if (refetchError) return NextResponse.json({ error: refetchError.message }, { status: 500 });
        return NextResponse.json({ tasks: allTasks });
      }
    }
  }

  return NextResponse.json({ tasks: tasks ?? [] });
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

  const rows = items.map((t: { title: string; description?: string; start_time?: string; duration?: string; from_template?: boolean; is_fixed?: boolean }) => ({
    user_id: user.id,
    date,
    title: t.title,
    description: t.description ?? '',
    start_time: t.start_time ?? '',
    duration: t.duration ?? '',
    sort_order: nextOrder++,
    from_template: t.from_template ?? false,
    is_fixed: t.is_fixed ?? false,
  }));

  const { data, error } = await supabase
    .from('notebook_daily_tasks')
    .insert(rows)
    .select();

  if (error) {
    // If is_fixed column missing, retry without it
    if (error.message?.includes('is_fixed') || error.code === '42703') {
      const fallbackRows = items.map((t: { title: string; description?: string; start_time?: string; duration?: string; from_template?: boolean }) => ({
        user_id: user.id,
        date,
        title: t.title,
        description: t.description ?? '',
        start_time: t.start_time ?? '',
        duration: t.duration ?? '',
        sort_order: nextOrder++,
        from_template: t.from_template ?? false,
      }));
      const { data: fallbackData, error: fallbackError } = await supabase
        .from('notebook_daily_tasks')
        .insert(fallbackRows)
        .select();
      if (fallbackError) {
        if (fallbackError.code === '23505') {
          return NextResponse.json({ error: 'Task already exists for this date', code: 'DUPLICATE' }, { status: 409 });
        }
        return NextResponse.json({ error: fallbackError.message }, { status: 500 });
      }
      return NextResponse.json({ tasks: fallbackData });
    }
    // Handle unique constraint violation (duplicate title on same date)
    if (error.code === '23505') {
      return NextResponse.json({ error: 'Task already exists for this date', code: 'DUPLICATE' }, { status: 409 });
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ tasks: data });
}