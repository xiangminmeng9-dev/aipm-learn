import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: '请先登录' }, { status: 401 });
    }

    const { searchParams } = request.nextUrl;
    const range = searchParams.get('range') || '30d';

    const now = new Date();
    const cutoffDate = range === '7d' ? new Date(now.getTime() - 7 * 86400000).toISOString()
                    : range === '30d' ? new Date(now.getTime() - 30 * 86400000).toISOString()
                    : new Date(0).toISOString();

    // 并行查询所有数据
    const [
      submissionsRes,
      allSubmissionsRes,
      flashcardCountRes,
      dueFlashcardCountRes,
      flashcardReviewsRes,
      wrongCountRes,
      techBookmarksRes,
      submissionsWithCategoryRes,
      submissionsWithDifficultyRes,
    ] = await Promise.all([
      supabase.from('daily_challenge_submissions').select('id, score, time_spent, submitted_at, challenge_id').eq('user_id', user.id).gte('submitted_at', cutoffDate),
      supabase.from('daily_challenge_submissions').select('submitted_at').eq('user_id', user.id).order('submitted_at', { ascending: false }),
      supabase.from('flashcards').select('id', { count: 'exact', head: true }).eq('user_id', user.id),
      supabase.from('flashcards').select('id', { count: 'exact', head: true }).eq('user_id', user.id).lte('next_review', now.toISOString()),
      supabase.from('flashcard_reviews').select('rating, created_at').eq('user_id', user.id).gte('created_at', cutoffDate),
      supabase.from('daily_challenge_submissions').select('id', { count: 'exact', head: true }).eq('user_id', user.id).lt('score', 60),
      supabase.from('daily_tech_bookmarks').select('id', { count: 'exact', head: true }).eq('user_id', user.id),
      supabase.from('daily_challenge_submissions').select('challenge_id, daily_challenges(category)').eq('user_id', user.id),
      supabase.from('daily_challenge_submissions').select('challenge_id, score, daily_challenges(difficulty)').eq('user_id', user.id),
    ]);

    const submissions = submissionsRes.data || [];
    const allSubmissions = allSubmissionsRes.data || [];
    const totalFlashcards = flashcardCountRes.count || 0;
    const dueFlashcards = dueFlashcardCountRes.count || 0;
    const flashcardReviews = flashcardReviewsRes.data || [];
    const wrongCount = wrongCountRes.count || 0;
    const techBookmarks = techBookmarksRes.count || 0;
    const submissionsWithCategory = submissionsWithCategoryRes.data || [];
    const submissionsWithDifficulty = submissionsWithDifficultyRes.data || [];

    // 答题统计
    const totalSubmissions = submissions.length;
    const scores = submissions.filter(s => s.score != null).map(s => s.score!);
    const avgScore = scores.length > 0 ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : 0;
    const maxScore = scores.length > 0 ? Math.max(...scores) : 0;
    const highScores = scores.filter(s => s >= 80).length;
    const lowScores = scores.filter(s => s < 60).length;

    // 连续打卡
    const history = allSubmissions.map(s => s.submitted_at.split('T')[0]);
    const uniqueDates = [...new Set(history)];
    let streak = 0;
    for (let i = 0; i < 365; i++) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      const ds = d.toISOString().split('T')[0];
      if (uniqueDates.includes(ds)) streak++;
      else if (i > 0) break;
    }

    // 闪卡统计
    const totalReviews = flashcardReviews.length;
    const goodReviews = flashcardReviews.filter(r => r.rating >= 3).length;
    const goodReviewRate = totalReviews > 0 ? Math.round((goodReviews / totalReviews) * 100) : 0;

    // 得分趋势
    const scoreByDate = new Map<string, number[]>();
    for (const s of submissions) {
      if (s.score != null && s.submitted_at) {
        const date = s.submitted_at.slice(0, 10);
        if (!scoreByDate.has(date)) scoreByDate.set(date, []);
        scoreByDate.get(date)!.push(s.score);
      }
    }
    const scoreTrend = Array.from(scoreByDate.entries())
      .map(([date, dayScores]) => ({ date, score: Math.round(dayScores.reduce((a, b) => a + b, 0) / dayScores.length) }))
      .sort((a, b) => a.date.localeCompare(b.date))
      .slice(-30);

    // 类别分布
    const categoryCount = new Map<string, number>();
    for (const s of submissionsWithCategory) {
      const challenge = s.daily_challenges as unknown as { category?: string } | null;
      const cat = challenge?.category || '未分类';
      categoryCount.set(cat, (categoryCount.get(cat) || 0) + 1);
    }
    const categoryDistribution = Array.from(categoryCount.entries())
      .map(([category, count]) => ({ category, count }))
      .sort((a, b) => b.count - a.count);

    // 难度分布
    const difficultyScores = new Map<string, number[]>();
    for (const s of submissionsWithDifficulty) {
      const challenge = s.daily_challenges as unknown as { difficulty?: string } | null;
      const diff = challenge?.difficulty || 'medium';
      if (!difficultyScores.has(diff)) difficultyScores.set(diff, []);
      if (s.score != null) difficultyScores.get(diff)!.push(s.score);
    }
    const difficultyStats = Array.from(difficultyScores.entries())
      .map(([difficulty, scores]) => ({
        difficulty,
        count: scores.length,
        avgScore: Math.round(scores.reduce((a, b) => a + b, 0) / scores.length),
      }));

    // 每日活动
    const days = range === '7d' ? 7 : range === '30d' ? 30 : 90;
    const activityByDate = new Map<string, number>();
    for (const s of submissions) {
      if (s.submitted_at) {
        const date = s.submitted_at.slice(0, 10);
        activityByDate.set(date, (activityByDate.get(date) || 0) + 1);
      }
    }
    const dailyActivity = Array.from({ length: days }, (_, i) => {
      const d = new Date(now.getTime() - (days - 1 - i) * 86400000);
      const dateStr = d.toISOString().slice(0, 10);
      return { date: dateStr, count: activityByDate.get(dateStr) || 0 };
    });

    // 漏斗
    const funnelStages = [
      { stage: '总答题数', count: totalSubmissions },
      { stage: '良好(≥60)', count: totalSubmissions - lowScores },
      { stage: '优秀(≥80)', count: highScores },
    ];

    // 环比
    const weekAgo = new Date(now.getTime() - 7 * 86400000).toISOString();
    const twoWeeksAgo = new Date(now.getTime() - 14 * 86400000).toISOString();
    const thisWeekCount = submissions.filter(s => s.submitted_at >= weekAgo).length;
    const lastWeekCount = allSubmissions.filter(s => s.submitted_at >= twoWeeksAgo && s.submitted_at < weekAgo).length;
    const submissionChange = lastWeekCount > 0 ? Math.round(((thisWeekCount - lastWeekCount) / lastWeekCount) * 100) : (thisWeekCount > 0 ? 100 : 0);

    return NextResponse.json({
      stats: {
        total_submissions: totalSubmissions,
        avg_score: avgScore,
        max_score: maxScore,
        high_score_count: highScores,
        low_score_count: lowScores,
        streak,
        total_flashcards: totalFlashcards,
        due_flashcards: dueFlashcards,
        total_reviews: totalReviews,
        good_review_rate: goodReviewRate,
        wrong_count: wrongCount,
        tech_bookmarks: techBookmarks,
        submission_change: submissionChange,
        score_trend: scoreTrend,
        category_distribution: categoryDistribution,
        categories: categoryDistribution.map(c => c.category),
        difficulty_stats: difficultyStats,
        difficulties: difficultyStats.map(d => d.difficulty),
        daily_activity: dailyActivity,
        funnel_stages: funnelStages,
      },
    });
  } catch (error) {
    console.error('Daily challenge dashboard error:', error);
    return NextResponse.json({ error: '获取数据失败' }, { status: 500 });
  }
}