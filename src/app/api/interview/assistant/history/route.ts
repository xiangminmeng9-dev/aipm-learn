import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: '未登录' }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const category = searchParams.get('category');

  // Fetch all question_analyses for this user
  let analysisQuery = supabase
    .from('question_analyses')
    .select('id, question_id, analysis, answer_approach, created_at')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(50);

  const { data: analyses, error: aError } = await analysisQuery;

  if (aError) {
    return NextResponse.json({ error: aError.message }, { status: 500 });
  }

  if (!analyses || analyses.length === 0) {
    return NextResponse.json({ records: [] });
  }

  // Get the question texts
  const questionIds = analyses.map(a => a.question_id);
  const { data: questions } = await supabase
    .from('interview_questions')
    .select('id, text, type_id, created_at')
    .in('id', questionIds);

  // Get type names
  const typeIds = (questions || []).map(q => q.type_id).filter(Boolean);
  let typeMap: Record<string, string> = {};
  if (typeIds.length > 0) {
    const { data: types } = await supabase
      .from('question_types')
      .select('id, name')
      .in('id', typeIds);
    for (const t of types || []) {
      typeMap[t.id] = t.name;
    }
  }

  // Build question map
  const qMap = new Map((questions || []).map(q => [q.id, q]));

  // Calculate frequency per category
  const categoryCount: Record<string, number> = {};
  for (const a of analyses) {
    const q = qMap.get(a.question_id);
    const cat = q?.type_id ? typeMap[q.type_id] : null;
    if (cat) {
      categoryCount[cat] = (categoryCount[cat] || 0) + 1;
    }
  }

  const getFrequency = (count: number): string => {
    if (count >= 5) return '高频';
    if (count >= 2) return '中频';
    return '低频';
  };

  // Parse evaluation from answer_approach if it contains JSON
  const parseEvaluation = (answerApproach: string | null) => {
    if (!answerApproach) return null;
    try {
      const parsed = JSON.parse(answerApproach);
      if (parsed.evaluation) return parsed.evaluation;
      if (parsed.user_answer && parsed.evaluation) return parsed.evaluation;
    } catch { /* not JSON, it's regular text */ }
    return null;
  };

  const parseUserAnswer = (answerApproach: string | null) => {
    if (!answerApproach) return null;
    try {
      const parsed = JSON.parse(answerApproach);
      if (parsed.user_answer) return parsed.user_answer;
    } catch { /* not JSON */ }
    return null;
  };

  // Build records
  let records = analyses.map(a => {
    const q = qMap.get(a.question_id);
    const cat = q?.type_id ? typeMap[q.type_id] : null;

    // Filter by category if requested
    if (category && cat !== category) return null;

    return {
      id: a.id,
      question: q?.text || '',
      category: cat,
      answer: a.analysis || null,
      user_answer: parseUserAnswer(a.answer_approach),
      evaluation: parseEvaluation(a.answer_approach),
      created_at: a.created_at,
      frequency: cat ? getFrequency(categoryCount[cat] || 0) : undefined,
    };
  }).filter(Boolean);

  return NextResponse.json({ records });
}