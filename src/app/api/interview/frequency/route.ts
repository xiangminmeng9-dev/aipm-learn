import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

/**
 * GET /api/interview/frequency?type_name=xxx
 * Returns frequency tag (高频/中频/低频) for a question based on type occurrence count
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: '未登录' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const typeId = searchParams.get('type_id');
    const typeName = searchParams.get('type_name');

    let targetTypeId = typeId;

    if (!targetTypeId && typeName) {
      const { data: typeData } = await supabase
        .from('question_types')
        .select('id')
        .eq('name', typeName)
        .single();
      targetTypeId = typeData?.id;
    }

    if (!targetTypeId) {
      return NextResponse.json({ frequency: '低频' });
    }

    // Count how many questions of this type the user has asked
    const { count } = await supabase
      .from('interview_questions')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .eq('type_id', targetTypeId);

    const total = count ?? 0;

    let frequency: string;
    if (total >= 5) frequency = '高频';
    else if (total >= 2) frequency = '中频';
    else frequency = '低频';

    return NextResponse.json({ frequency, count: total });
  } catch (error) {
    console.error('Frequency API error:', error);
    return NextResponse.json({ frequency: '低频', count: 0 });
  }
}