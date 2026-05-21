import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: '请先登录' }, { status: 401 });

    const { data, error } = await supabase
      .from('competitive_methodologies')
      .select('*')
      .eq('user_id', user.id)
      .single();

    if (error || !data) {
      return NextResponse.json({ methodology: null });
    }

    return NextResponse.json({ methodology: data });
  } catch (err) {
    console.error('Competitive methodology GET error:', err);
    return NextResponse.json({ error: '服务器错误' }, { status: 500 });
  }
}
