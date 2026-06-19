import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { refreshDailyNews } from '@/lib/daily-ai-news/pipeline';

function getTodayShanghai(): string {
  return new Date().toLocaleDateString('sv-SE', { timeZone: 'Asia/Shanghai' });
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: '未登录' }, { status: 401 });
    }

    const body = await request.json().catch(() => ({}));
    const date = (body.date as string) ?? getTodayShanghai();

    const result = await refreshDailyNews(date);
    return NextResponse.json({ success: true, date, articleCount: result.articles.length });
  } catch (error) {
    console.error('Daily AI news refresh error:', error);
    return NextResponse.json({ error: '刷新失败', code: 'INTERNAL_ERROR' }, { status: 500 });
  }
}
