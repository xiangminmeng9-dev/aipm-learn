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

    const { data: methodology, error } = await supabase
      .from('coding_methodologies')
      .select('*')
      .eq('user_id', user.id)
      .single();

    if (error || !methodology) {
      return NextResponse.json({
        methodology: null,
        message: '需要至少 3 次开发流程练习才能生成方法论',
      });
    }

    return NextResponse.json({
      methodology: {
        id: methodology.id,
        high_freq_questions: methodology.high_freq_questions as string[],
        common_breakdowns: methodology.common_breakdowns as string[],
        cross_mode_steps: methodology.cross_mode_steps as string[],
        key_notes: methodology.key_notes as string[],
        source_count: methodology.source_count,
        updated_at: methodology.updated_at,
      },
    });
  } catch (error) {
    console.error('Coding methodology API error:', error);
    return NextResponse.json({ error: '服务器内部错误', code: 'INTERNAL_ERROR' }, { status: 500 });
  }
}
