import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

export async function GET() {
  try {
    const sb = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);
    const { data, error } = await sb
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
