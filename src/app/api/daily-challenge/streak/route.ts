import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ streak: 0, history: [] });

    const { data: submissions } = await supabase
      .from('daily_challenge_submissions')
      .select('submitted_at')
      .eq('user_id', user.id)
      .order('submitted_at', { ascending: false })
      .limit(60);

    const history = (submissions || []).map(s => s.submitted_at.split('T')[0]);
    const uniqueDates = [...new Set(history)];

    let streak = 0;
    const today = new Date();
    for (let i = 0; i < 365; i++) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      const ds = d.toISOString().split('T')[0];
      if (uniqueDates.includes(ds)) {
        streak++;
      } else if (i > 0) {
        break;
      }
    }

    return NextResponse.json({ streak, history: uniqueDates });
  } catch (err) {
    console.error('Get streak error:', err);
    return NextResponse.json({ streak: 0, history: [] });
  }
}
