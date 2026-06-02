import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

const VALID_MODULES = ['interview', 'coding', 'skills', 'simulator', 'notebook', 'resume', 'resources', 'daily-challenge'];
const VALID_ACTIONS = ['ai_call', 'page_view', 'practice_submit', 'analysis_complete', 'resource_add', 'resource_delete', 'resource_view', 'resource_search'];

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: '请先登录' }, { status: 401 });

    const body = await request.json();
    const { module, action, duration_seconds, input_tokens, output_tokens, metadata } = body;

    if (!module || !VALID_MODULES.includes(module)) {
      return NextResponse.json({ error: '无效的模块名称' }, { status: 400 });
    }
    if (!action || !VALID_ACTIONS.includes(action)) {
      return NextResponse.json({ error: '无效的操作类型' }, { status: 400 });
    }

    const { error } = await supabase.from('user_activity_logs').insert({
      user_id: user.id,
      module,
      action,
      duration_seconds: duration_seconds || 0,
      input_tokens: input_tokens || 0,
      output_tokens: output_tokens || 0,
      metadata: metadata || {},
    });

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json({ error: '服务器错误' }, { status: 500 });
  }
}
