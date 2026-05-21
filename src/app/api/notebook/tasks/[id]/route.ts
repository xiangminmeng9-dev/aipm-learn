import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;
  const body = await request.json();
  const updates: Record<string, unknown> = {};
  if ('title' in body) updates.title = body.title;
  if ('description' in body) updates.description = body.description;
  if ('start_time' in body) updates.start_time = body.start_time;
  if ('duration' in body) updates.duration = body.duration;
  if ('status' in body) updates.status = body.status;
  if ('sort_order' in body) updates.sort_order = body.sort_order;
  if ('is_fixed' in body) updates.is_fixed = body.is_fixed;

  const { data, error } = await supabase
    .from('notebook_daily_tasks')
    .update(updates)
    .eq('id', id)
    .eq('user_id', user.id)
    .select()
    .single();

  if (error) {
    // If is_fixed column doesn't exist yet, retry without it
    if ((error.message?.includes('is_fixed') || error.code === '42703') && 'is_fixed' in updates) {
      delete updates.is_fixed;
      const { data: retryData, error: retryError } = await supabase
        .from('notebook_daily_tasks')
        .update(updates)
        .eq('id', id)
        .eq('user_id', user.id)
        .select()
        .single();
      if (retryError) return NextResponse.json({ error: retryError.message }, { status: 500 });
      if (!retryData) return NextResponse.json({ error: 'Not found' }, { status: 404 });
      return NextResponse.json({ task: retryData });
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  if (!data) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  return NextResponse.json({ task: data });
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;

  // Try to check if this is a fixed task (table/column may not exist yet)
  try {
    const { data: task } = await supabase
      .from('notebook_daily_tasks')
      .select('is_fixed, date, title')
      .eq('id', id)
      .eq('user_id', user.id)
      .single();

    if (task?.is_fixed) {
      const { data: template } = await supabase
        .from('notebook_fixed_task_templates')
        .select('id')
        .eq('user_id', user.id)
        .eq('title', task.title)
        .maybeSingle();

      if (template) {
        await supabase
          .from('notebook_fixed_task_skips')
          .upsert(
            { user_id: user.id, template_id: template.id, date: task.date },
            { onConflict: 'user_id,template_id,date' }
          );
      }
    }
  } catch {
    // Tables/columns don't exist yet — just delete the task normally
  }

  const { error } = await supabase
    .from('notebook_daily_tasks')
    .delete()
    .eq('id', id)
    .eq('user_id', user.id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}