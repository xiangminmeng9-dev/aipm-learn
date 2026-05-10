import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ records: [], total: 0, page: 1, page_size: 20 });

    const { searchParams } = request.nextUrl;
    const page = Math.max(1, parseInt(searchParams.get('page') || '1'));
    const page_size = Math.min(1000, Math.max(1, parseInt(searchParams.get('page_size') || '1000')));

    // Get total count
    const { count } = await supabase
      .from('question_analyses')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', user.id);

    // Get paginated analyses
    const { data: analyses } = await supabase
      .from('question_analyses')
      .select('id, question_id, analysis, thinking_framework, answer_approach, answer_template, created_at')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .range((page - 1) * page_size, page * page_size - 1);

    if (!analyses || analyses.length === 0) {
      return NextResponse.json({ records: [], total: count ?? 0, page, page_size });
    }

    const qIds = analyses.map(a => a.question_id);
    const { data: questions } = await supabase
      .from('interview_questions')
      .select('id, text, type_id')
      .in('id', qIds);

    const qMap = new Map((questions || []).map(q => [q.id, q]));

    // Get type names
    const typeIds = [...new Set((questions || []).map(q => q.type_id).filter(Boolean))];
    let typeMap = new Map<string, string>();
    if (typeIds.length > 0) {
      const { data: types } = await supabase
        .from('question_types')
        .select('id, name')
        .in('id', typeIds);
      (types || []).forEach(t => typeMap.set(t.id, t.name));
    }

    const records = analyses.map(a => {
      const q = qMap.get(a.question_id);
      return {
        id: a.id,
        question: q?.text || '',
        type_name: q?.type_id ? typeMap.get(q.type_id) : null,
        type_id: q?.type_id || null,
        created_at: a.created_at,
        // Full analysis content so history click can display without re-analyzing
        analysis: a.analysis,
        thinking_framework: a.thinking_framework,
        answer_approach: a.answer_approach,
        answer_template: a.answer_template,
      };
    }).filter(r => r.question);

    return NextResponse.json({ records, total: count ?? 0, page, page_size });
  } catch (err) {
    console.error('Get QA history error:', err);
    return NextResponse.json({ records: [], total: 0, page: 1, page_size: 20 });
  }
}
