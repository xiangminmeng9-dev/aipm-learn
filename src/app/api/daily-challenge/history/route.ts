import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// GET /api/daily-challenge/history — 获取答题历史记录
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: '请先登录' }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const page = Math.max(1, Number(searchParams.get('page')) || 1);
    const limit = Math.min(50, Math.max(1, Number(searchParams.get('limit')) || 20));
    const from = (page - 1) * limit;

    const { data: submissions, error, count } = await supabase
      .from('daily_challenge_submissions')
      .select('id, challenge_id, answer, score, feedback, time_spent, submitted_at, daily_challenges(question, category, difficulty, perfect_answer)', { count: 'exact' })
      .eq('user_id', user.id)
      .order('submitted_at', { ascending: false })
      .range(from, from + limit - 1);

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    const records = (submissions ?? []).map((s) => {
      const challenge = s.daily_challenges as unknown as {
        question: string; category: string; difficulty: string; perfect_answer: string;
      } | null;
      return {
        submission_id: s.id,
        challenge_id: s.challenge_id,
        question: challenge?.question ?? '',
        category: challenge?.category ?? '未分类',
        difficulty: challenge?.difficulty ?? 'medium',
        score: s.score,
        answer: s.answer,
        feedback: typeof s.feedback === 'string' ? s.feedback : JSON.stringify(s.feedback),
        perfect_answer: challenge?.perfect_answer ?? '',
        time_spent: s.time_spent,
        submitted_at: s.submitted_at,
      };
    });

    // Stats
    const { data: allSubmissions } = await supabase
      .from('daily_challenge_submissions')
      .select('score')
      .eq('user_id', user.id);

    const totalCount = allSubmissions?.length ?? 0;
    const scores = (allSubmissions ?? []).map((s) => s.score).filter((s) => s != null);
    const avgScore = scores.length > 0 ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : 0;
    const maxScore = scores.length > 0 ? Math.max(...scores) : 0;

    return NextResponse.json({
      records,
      stats: { totalCount, avgScore, maxScore },
      pagination: { page, limit, total: count ?? 0 },
    });
  } catch (err) {
    console.error('Get history error:', err);
    return NextResponse.json({ error: '获取失败' }, { status: 500 });
  }
}
