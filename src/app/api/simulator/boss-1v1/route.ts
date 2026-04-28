import { NextRequest, NextResponse } from 'next/server';
import { createClient, createServiceClient } from '@/lib/supabase/server';
import { BOSS_TYPES } from '@/lib/boss-1v1-config';

// GET /api/simulator/boss-1v1 — list user's sessions
export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: '请先登录' }, { status: 401 });

    const { data: sessions, error } = await supabase
      .from('boss_1v1_sessions')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ sessions: sessions ?? [] });
  } catch (err) {
    console.error('List boss sessions error:', err);
    return NextResponse.json({ error: '获取失败' }, { status: 500 });
  }
}

// POST /api/simulator/boss-1v1 — create new session
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: '请先登录' }, { status: 401 });

    const { boss_type, scenario_id } = await request.json();
    const bossConfig = BOSS_TYPES.find((b) => b.id === boss_type);
    if (!bossConfig) return NextResponse.json({ error: '无效的Boss类型' }, { status: 400 });
    const scenario = bossConfig.scenarios.find((s) => s.id === scenario_id);
    if (!scenario) return NextResponse.json({ error: '无效的场景' }, { status: 400 });

    const { data: session, error } = await supabase
      .from('boss_1v1_sessions')
      .insert({
        user_id: user.id,
        boss_type,
        scenario_id,
        status: 'active',
      })
      .select()
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    // Generate boss opening message
    const { generateText } = await import('@/lib/ai/claude');
    const opening = await generateText(
      `场景：${scenario.description}。你是${bossConfig.bossName}（${bossConfig.bossRole}）。
${bossConfig.systemPrompt}

请用1-2句话自然地开始对话，设定场景。不要输出JSON，直接说台词。`,
      { system: '你是一位严格的上级，正在进行1V1对话。直接输出台词，不要任何解释。', maxTokens: 200 }
    );

    // Save opening message
    const serviceClient = createServiceClient();
    await serviceClient
      .from('boss_1v1_messages')
      .insert({
        session_id: session.id,
        role: 'assistant',
        content: opening.trim(),
      });

    return NextResponse.json({ session, opening: opening.trim() });
  } catch (err) {
    console.error('Create boss session error:', err);
    return NextResponse.json({ error: '创建失败' }, { status: 500 });
  }
}
