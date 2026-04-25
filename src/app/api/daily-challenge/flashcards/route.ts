import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ cards: [], dueCount: 0 });

    const url = new URL(request.url);
    const mode = url.searchParams.get('mode') || 'due';

    if (mode === 'due') {
      const now = new Date().toISOString();
      const { data: cards } = await supabase
        .from('flashcards')
        .select('*')
        .eq('user_id', user.id)
        .lte('next_review', now)
        .order('next_review', { ascending: true })
        .limit(20);
      return NextResponse.json({ cards: cards || [], dueCount: (cards || []).length });
    }

    const { data: cards } = await supabase
      .from('flashcards')
      .select('*')
      .eq('user_id', user.id)
      .order('updated_at', { ascending: false })
      .limit(100);

    const { count: dueCount } = await supabase
      .from('flashcards')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .lte('next_review', new Date().toISOString());

    return NextResponse.json({ cards: cards || [], dueCount: dueCount || 0 });
  } catch (err) {
    console.error('Get flashcards error:', err);
    return NextResponse.json({ error: '获取失败' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: '请先登录' }, { status: 401 });

    const body = await request.json();
    const { front, back, category, generate, topic } = body;

    // AI generate mode
    if (generate && topic) {
      try {
        const { generateText } = await import('@/lib/ai/claude');
        const aiResult = await generateText(
          `为AI产品经理生成8张知识闪卡，主题："${topic}"。每卡含正面(问题)和背面(答案)，简洁精炼。
只输出JSON数组：[{"front":"正面","back":"背面"},...]`,
          { system: '你是AI PM知识卡片专家。只输出JSON数组，不要markdown代码块。', maxTokens: 1500 }
        );

        const cleaned = aiResult.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
        const cards = JSON.parse(cleaned);

        if (Array.isArray(cards) && cards.length > 0) {
          const inserts = cards
            .filter((c: { front?: string; back?: string }) => c.front && c.back)
            .map((c: { front: string; back: string }) => ({
              user_id: user.id,
              front: c.front,
              back: c.back,
              category: topic,
            }));

          if (inserts.length > 0) {
            const { data: newCards, error } = await supabase
              .from('flashcards')
              .insert(inserts)
              .select();

            if (error) return NextResponse.json({ error: error.message }, { status: 500 });
            return NextResponse.json({ cards: newCards, generated: true });
          }
        }
      } catch {
        // Fall through to manual creation
      }
      return NextResponse.json({ error: 'AI 生成失败，请手动创建' }, { status: 500 });
    }

    // Manual create mode
    if (!front || !back) return NextResponse.json({ error: '正面和背面不能为空' }, { status: 400 });

    const { data, error } = await supabase
      .from('flashcards')
      .insert({ user_id: user.id, front, back, category: category || 'general' })
      .select()
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ card: data });
  } catch (err) {
    console.error('Create flashcard error:', err);
    return NextResponse.json({ error: '创建失败' }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: '请先登录' }, { status: 401 });

    const { card_id, rating } = await request.json();
    if (!card_id || !rating) return NextResponse.json({ error: '参数缺失' }, { status: 400 });

    const { data: card } = await supabase
      .from('flashcards')
      .select('*')
      .eq('id', card_id)
      .eq('user_id', user.id)
      .single();

    if (!card) return NextResponse.json({ error: '卡片不存在' }, { status: 404 });

    // SM-2 algorithm
    let { ease_factor: ef, repetitions: rep, interval_days: interval } = card;
    if (rating >= 3) {
      if (rep === 0) interval = 1;
      else if (rep === 1) interval = 6;
      else interval = Math.round(interval * ef);
      rep++;
    } else {
      rep = 0;
      interval = 1;
    }
    ef = Math.max(1.3, ef + (0.1 - (5 - rating) * (0.08 + (5 - rating) * 0.02)));

    const nextReview = new Date();
    nextReview.setDate(nextReview.getDate() + interval);

    await supabase.from('flashcard_reviews').insert({ user_id: user.id, card_id, rating });
    const { data: updated } = await supabase
      .from('flashcards')
      .update({ next_review: nextReview.toISOString(), interval_days: interval, ease_factor: ef, repetitions: rep })
      .eq('id', card_id)
      .select()
      .single();

    return NextResponse.json({ card: updated });
  } catch (err) {
    console.error('Review flashcard error:', err);
    return NextResponse.json({ error: '复习失败' }, { status: 500 });
  }
}
