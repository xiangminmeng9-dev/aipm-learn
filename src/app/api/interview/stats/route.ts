import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: '未登录', code: 'UNAUTHORIZED' }, { status: 401 });
    }

    // 总练习数（问答分析数 + 面试助手记录数）
    const { count: qaCount } = await supabase
      .from('question_analyses')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id);

    const { count: assistantCount } = await supabase
      .from('assistant_qa_records')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id);

    const totalQuestions = (qaCount ?? 0) + (assistantCount ?? 0);

    // 类型分布
    const { data: typeDistribution } = await supabase
      .from('question_analyses')
      .select('interview_questions(type_id, question_types(name))')
      .eq('user_id', user.id);

    const typeCountMap: Record<string, { name: string; count: number }> = {};
    const total = typeDistribution?.length ?? 0;

    for (const item of typeDistribution ?? []) {
      const q = item.interview_questions as unknown as {
        type_id: string;
        question_types: { name: string };
      } | null;
      if (!q?.type_id) continue;
      const typeName = q.question_types?.name ?? '未知';
      if (!typeCountMap[q.type_id]) {
        typeCountMap[q.type_id] = { name: typeName, count: 0 };
      }
      typeCountMap[q.type_id].count++;
    }

    const typeDistributionResult = Object.values(typeCountMap)
      .sort((a, b) => b.count - a.count)
      .map((t) => ({
        type_name: t.name,
        count: t.count,
        percentage: total > 0 ? Math.round((t.count / total) * 1000) / 10 : 0,
      }));

    // 模拟面试统计
    const { data: mockInterviews } = await supabase
      .from('mock_interviews')
      .select('id, total_score, completed_at')
      .eq('user_id', user.id)
      .eq('status', 'completed')
      .order('completed_at', { ascending: true });

    const completedMocks = mockInterviews ?? [];
    const validScores = completedMocks
      .filter((m) => m.total_score !== null)
      .map((m) => m.total_score!);
    const averageScore =
      validScores.length > 0
        ? Math.round((validScores.reduce((s, v) => s + v, 0) / validScores.length) * 10) / 10
        : 0;

    const scoreTrend = completedMocks
      .filter((m) => m.total_score !== null && m.completed_at)
      .map((m) => ({
        date: m.completed_at!.split('T')[0],
        score: m.total_score!,
      }));

    // 弱项领域（平均分低于 6 的类型）
    const { data: answerScores } = await supabase
      .from('interview_answers')
      .select('score, question_type_id, question_types(name)')
      .not('score', 'is', null)
      .not('question_type_id', 'is', null);

    const typeScoreMap: Record<string, { name: string; scores: number[] }> = {};
    for (const a of answerScores ?? []) {
      if (!a.question_type_id) continue;
      const typeName = (a.question_types as unknown as { name: string })?.name ?? '未知';
      if (!typeScoreMap[a.question_type_id]) {
        typeScoreMap[a.question_type_id] = { name: typeName, scores: [] };
      }
      typeScoreMap[a.question_type_id].scores.push(a.score!);
    }

    const weakAreas = Object.entries(typeScoreMap)
      .map(([typeId, data]) => ({
        type_id: typeId,
        type_name: data.name,
        average_score:
          Math.round((data.scores.reduce((s, v) => s + v, 0) / data.scores.length) * 10) / 10,
      }))
      .filter((a) => a.average_score < 6)
      .sort((a, b) => a.average_score - b.average_score)
      .slice(0, 5);

    // 为弱项领域推荐题目 — batch queries instead of N+1
    const weakTypeIds = weakAreas.map(a => a.type_id);

    // Single query for all recommended questions across weak types
    const { data: allRecommendedQuestions } = weakTypeIds.length > 0
      ? await supabase
          .from('interview_questions')
          .select('id, text, type_id')
          .in('type_id', weakTypeIds)
          .limit(3 * weakTypeIds.length)
      : { data: [] };

    // Single query for all module mappings across weak types
    const { data: allModuleMappings } = weakTypeIds.length > 0
      ? await supabase
          .from('type_skill_mappings')
          .select('type_id, skill_modules(id, name, slug)')
          .in('type_id', weakTypeIds)
      : { data: [] };

    // Group results by type_id in JS
    const questionsByType: Record<string, { id: string; text: string }[]> = {};
    for (const q of (allRecommendedQuestions ?? []) as (typeof allRecommendedQuestions extends (infer T)[] | null ? T : never)[]) {
      if (!q) continue;
      const tid = (q as { type_id?: string }).type_id;
      if (tid) {
        if (!questionsByType[tid]) questionsByType[tid] = [];
        if (questionsByType[tid].length < 3) {
          questionsByType[tid].push({ id: (q as { id: string }).id, text: (q as { text: string }).text });
        }
      }
    }

    const modulesByType: Record<string, { id: string; name: string; slug: string }[]> = {};
    for (const m of (allModuleMappings ?? []) as Record<string, unknown>[]) {
      if (!m) continue;
      const tid = m.type_id as string;
      const mod = m.skill_modules as unknown as { id: string; name: string; slug: string } | null;
      if (tid && mod) {
        if (!modulesByType[tid]) modulesByType[tid] = [];
        modulesByType[tid].push(mod);
      }
    }

    const weakAreasWithRecommendations = weakAreas.map(area => ({
      type_name: area.type_name,
      average_score: area.average_score,
      recommended_questions: questionsByType[area.type_id] ?? [],
      related_modules: modulesByType[area.type_id] ?? [],
    }));

    return NextResponse.json({
      total_questions: totalQuestions ?? 0,
      type_distribution: typeDistributionResult,
      mock_interviews: {
        total: completedMocks.length,
        average_score: averageScore,
        score_trend: scoreTrend,
      },
      weak_areas: weakAreasWithRecommendations,
    });
  } catch (error) {
    console.error('Stats API error:', error);
    return NextResponse.json({ error: '服务器内部错误', code: 'INTERNAL_ERROR' }, { status: 500 });
  }
}
