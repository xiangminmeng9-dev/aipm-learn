import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ records: [] });

    const { data: records } = await supabase
      .from('assistant_qa_records')
      .select('id, question, category, answer, evaluation, created_at')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(20);

    if (!records) return NextResponse.json({ records: [] });

    const result = records.map(r => ({
      id: r.id,
      question: r.question,
      analysis: r.answer || '',
      category: r.category,
      created_at: r.created_at,
    }));

    return NextResponse.json({ records: result });
  } catch (err) {
    console.error('Get assistant history error:', err);
    return NextResponse.json({ records: [] });
  }
}