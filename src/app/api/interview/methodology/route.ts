import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { generateOrUpdateMethodology, MIN_SOURCE_COUNT } from '@/lib/ai/methodology';

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: '请先登录' }, { status: 401 });

  try {
    const body = await request.json();
    const { type_id } = body;
    if (!type_id) return NextResponse.json({ error: '缺少 type_id' }, { status: 400 });

    const { data: analyses } = await supabase
      .from('question_analyses')
      .select('id')
      .eq('user_id', user.id)
      .eq('interview_questions.type_id', type_id);

    if ((analyses ?? []).length < MIN_SOURCE_COUNT) {
      return NextResponse.json({
        error: `至少需要 ${MIN_SOURCE_COUNT} 条分析记录才能生成方法论`,
        code: 'INSUFFICIENT_DATA',
      }, { status: 400 });
    }

    await generateOrUpdateMethodology(supabase, user.id, type_id);

    const { data: methodology } = await supabase
      .from('interview_methodologies')
      .select('id, framework, key_steps, typical_cases, source_count, updated_at')
      .eq('user_id', user.id)
      .eq('type_id', type_id)
      .single();

    return NextResponse.json({ data: methodology });
  } catch (err) {
    console.error('Generate methodology error:', err);
    return NextResponse.json({ error: '生成方法论失败' }, { status: 500 });
  }
}
