import { NextResponse } from 'next/server';
import { createClient, createServiceClient } from '@/lib/supabase/server';

export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: '请先登录' }, { status: 401 });
    }

    const serviceClient = createServiceClient();
    const { data, error } = await serviceClient
      .from('daily_ai_news_articles')
      .select('news_date')
      .order('news_date', { ascending: false });

    if (error) return NextResponse.json({ dates: [] });

    const dates = [...new Set((data ?? []).map((r: { news_date: string }) => r.news_date))];
    return NextResponse.json({ dates });
  } catch (error) {
    console.error('Daily AI news dates API error:', error);
    return NextResponse.json({ dates: [] });
  }
}