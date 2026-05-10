import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ typeId: string }> }
) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: '未登录', code: 'UNAUTHORIZED' }, { status: 401 });
    }

    const { typeId } = await params;

    // 获取方法论详情
    const { data: methodology, error } = await supabase
      .from('interview_methodologies')
      .select(
        'id, type_id, framework, key_steps, typical_cases, source_count, updated_at, question_types(id, name)'
      )
      .eq('user_id', user.id)
      .eq('type_id', typeId)
      .single();

    if (error || !methodology) {
      return NextResponse.json({ error: '方法论不存在', code: 'NOT_FOUND' }, { status: 404 });
    }

    // 获取该类型的高频问题
    const { data: highFreqQuestions } = await supabase
      .from('interview_questions')
      .select('id, text')
      .eq('type_id', typeId)
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(5);

    const qt = methodology.question_types as unknown as { id: string; name: string } | null;
    return NextResponse.json({
      type: qt ? { id: qt.id, name: qt.name } : { id: methodology.type_id, name: '未知类型' },
      framework: methodology.framework,
      key_steps: methodology.key_steps as string[],
      typical_cases: methodology.typical_cases as string[],
      high_frequency_questions: highFreqQuestions ?? [],
      source_count: methodology.source_count,
      updated_at: methodology.updated_at,
    });
  } catch (error) {
    console.error('Methodology detail API error:', error);
    return NextResponse.json({ error: '服务器内部错误', code: 'INTERNAL_ERROR' }, { status: 500 });
  }
}
