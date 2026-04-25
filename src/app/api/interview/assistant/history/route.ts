import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ records: [] });

    // Get all analyses for this user
    const { data: analyses } = await supabase
      .from('question_analyses')
      .select('id, question_id, analysis, created_at')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(50);

    if (!analyses || analyses.length === 0) {
      return NextResponse.json({ records: [] });
    }

    const qIds = analyses.map(a => a.question_id);
    const { data: questions } = await supabase
      .from('interview_questions')
      .select('id, text, type_id, source')
      .in('id', qIds);

    // Only include records where the question was created by the assistant
    const assistantQIds = new Set(
      (questions || []).filter(q => q.source === 'assistant').map(q => q.id)
    );

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

    const records = analyses
      .filter(a => assistantQIds.has(a.question_id))
      .map(a => {
        const q = qMap.get(a.question_id);
        const categoryName = q?.type_id ? typeMap.get(q.type_id) : undefined;
        return {
          id: a.id,
          question: q?.text || '',
          analysis: a.analysis || '',
          category: categoryName,
          created_at: a.created_at,
        };
      })
      .filter(r => r.question);

    return NextResponse.json({ records });
  } catch (err) {
    console.error('Get assistant history error:', err);
    return NextResponse.json({ records: [] });
  }
}
