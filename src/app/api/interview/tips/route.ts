import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl;
    const category = searchParams.get('category') || null;

    const serviceClient = createServiceClient();
    let query = serviceClient.from('interview_tips').select('*').order('sort_order', { ascending: true });
    if (category) query = query.eq('category', category);

    const { data, error } = await query;
    if (error) return NextResponse.json({ error: '查询失败' }, { status: 500 });

    // Group by category
    const grouped: Record<string, { id: string; title: string; content: string; category: string; tags: string[] }[]> = {};
    for (const tip of data ?? []) {
      if (!grouped[tip.category]) grouped[tip.category] = [];
      grouped[tip.category].push(tip);
    }

    return NextResponse.json({ tips: data ?? [], categories: grouped });
  } catch (err) {
    console.error('Tips GET error:', err);
    return NextResponse.json({ error: '获取失败' }, { status: 500 });
  }
}
