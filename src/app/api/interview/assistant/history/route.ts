import { NextRequest, NextResponse } from 'next/server';
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
      .order('created_at', { ascending: false });

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

export async function DELETE(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: '未登录' }, { status: 401 });

    const { id } = await request.json();
    if (!id) return NextResponse.json({ error: '缺少记录ID' }, { status: 400 });

    const { error } = await supabase
      .from('assistant_qa_records')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id);

    if (error) {
      console.error('Delete assistant record error:', error);
      return NextResponse.json({ error: '删除失败' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('Delete assistant record error:', err);
    return NextResponse.json({ error: '删除失败' }, { status: 500 });
  }
}