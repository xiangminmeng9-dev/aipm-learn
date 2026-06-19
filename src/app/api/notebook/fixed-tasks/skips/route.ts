import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

export async function DELETE(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await request.json();
    const { template_id, date } = body;
    if (!template_id || !date) return NextResponse.json({ error: 'template_id and date are required' }, { status: 400 });

    // Remove the skip record
    const { error: skipError } = await supabase
      .from('notebook_fixed_task_skips')
      .delete()
      .eq('user_id', user.id)
      .eq('template_id', template_id)
      .eq('date', date);

    if (skipError) return NextResponse.json({ error: skipError.message }, { status: 500 });

    // Fetch the template to create a task instance
    const { data: template } = await supabase
      .from('notebook_fixed_task_templates')
      .select('*')
      .eq('id', template_id)
      .eq('user_id', user.id)
      .single();

    if (!template) return NextResponse.json({ error: 'Template not found' }, { status: 404 });

    // Get current max sort_order for the date
    const { data: existing } = await supabase
      .from('notebook_daily_tasks')
      .select('sort_order')
      .eq('user_id', user.id)
      .eq('date', date)
      .order('sort_order', { ascending: false })
      .limit(1);

    const nextOrder = (existing?.[0]?.sort_order ?? -1) + 1;

    // Create the task instance
    const { data: task, error: insertError } = await supabase
      .from('notebook_daily_tasks')
      .insert({
        user_id: user.id,
        date,
        title: template.title,
        description: template.description,
        start_time: template.start_time,
        duration: template.duration,
        status: 'todo',
        sort_order: nextOrder,
        from_template: false,
        is_fixed: true,
      })
      .select()
      .single();

    if (insertError) {
      if (insertError.code === '23505') {
        return NextResponse.json({ error: 'Task already exists for this date', code: 'DUPLICATE' }, { status: 409 });
      }
      return NextResponse.json({ error: insertError.message }, { status: 500 });
    }

    return NextResponse.json({ task });
  } catch (error) {
    console.error('[notebook/fixed-tasks/skips] Error:', error);
    return NextResponse.json({ error: '服务器内部错误', code: 'INTERNAL_ERROR' }, { status: 500 });
  }
}
