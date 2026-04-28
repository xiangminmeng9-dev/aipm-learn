import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// GET /api/daily-challenge/wrong — 获取错题列表（score < 60）
export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: '请先登录' }, { status: 401 });

    const { data: submissions, error } = await supabase
      .from('daily_challenge_submissions')
      .select('id, challenge_id, answer, score, feedback, time_spent, submitted_at, daily_challenges(question, category, difficulty, perfect_answer)')
      .eq('user_id', user.id)
      .lt('score', 60)
      .order('submitted_at', { ascending: false });

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    const wrongQuestions = (submissions ?? []).map((s) => {
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
        perfect_answer: challenge?.perfect_answer ?? '',
        feedback: typeof s.feedback === 'string' ? s.feedback : JSON.stringify(s.feedback),
        created_at: s.submitted_at,
      };
    });

    // Group by category
    const byCategory: Record<string, typeof wrongQuestions> = {};
    for (const q of wrongQuestions) {
      const cat = q.category || '未分类';
      if (!byCategory[cat]) byCategory[cat] = [];
      byCategory[cat].push(q);
    }

    return NextResponse.json({ wrong: wrongQuestions, byCategory });
  } catch (err) {
    console.error('Get wrong questions error:', err);
    return NextResponse.json({ error: '获取失败' }, { status: 500 });
  }
}
