import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { validateBody, communityVoteSchema } from '@/lib/validations';

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: '请先登录' }, { status: 401 });

    const body = await request.json();
    const validation = validateBody(communityVoteSchema, body);
    if (!validation.success) return NextResponse.json({ error: validation.error }, { status: 400 });

    const { question_id, vote } = validation.data;

    // Check existing vote
    const { data: existing } = await supabase
      .from('community_question_votes')
      .select('id, vote')
      .eq('user_id', user.id)
      .eq('question_id', question_id)
      .maybeSingle();

    if (existing) {
      if (existing.vote === vote) {
        // Same vote — remove (toggle off)
        await supabase.from('community_question_votes').delete().eq('id', existing.id);
        return NextResponse.json({ action: 'removed' });
      }
      // Different vote — update
      await supabase.from('community_question_votes').update({ vote }).eq('id', existing.id);
      return NextResponse.json({ action: 'updated' });
    }

    // New vote
    await supabase.from('community_question_votes').insert({ user_id: user.id, question_id, vote });
    return NextResponse.json({ action: 'created' }, { status: 201 });
  } catch (err) {
    console.error('Community vote POST error:', err);
    return NextResponse.json({ error: '投票失败' }, { status: 500 });
  }
}
