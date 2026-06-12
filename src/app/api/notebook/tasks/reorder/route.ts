import { createClient, createServiceClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

export async function PATCH(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await request.json();
  const { orders } = body as { orders: { id: string; sort_order: number }[] };

  if (!orders?.length) return NextResponse.json({ error: 'No orders provided' }, { status: 400 });

  // Use service client for batch updates — Supabase doesn't support bulk UPDATE with different values per row,
  // so we still need individual queries but use service client to skip RLS checks (faster)
  const serviceClient = createServiceClient();
  const results = await Promise.all(
    orders.map(({ id, sort_order }) =>
      serviceClient
        .from('notebook_daily_tasks')
        .update({ sort_order })
        .eq('id', id)
        .eq('user_id', user.id)
    ),
  );

  const errors = results.filter((r) => r.error);
  if (errors.length) return NextResponse.json({ error: 'Some updates failed' }, { status: 500 });
  return NextResponse.json({ success: true });
}
