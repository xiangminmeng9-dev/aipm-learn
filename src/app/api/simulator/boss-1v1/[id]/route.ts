import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { BOSS_TYPES } from '@/lib/boss-1v1-config';

// GET /api/simulator/boss-1v1/[id] — get session with messages
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: '请先登录' }, { status: 401 });

    const { data: session, error: sessionError } = await supabase
      .from('boss_1v1_sessions')
      .select('*')
      .eq('id', id)
      .eq('user_id', user.id)
      .single();

    if (sessionError || !session) return NextResponse.json({ error: '会话不存在' }, { status: 404 });

    const { data: messages } = await supabase
      .from('boss_1v1_messages')
      .select('*')
      .eq('session_id', id)
      .order('created_at', { ascending: true });

    const bossConfig = BOSS_TYPES.find((b) => b.id === session.boss_type);

    return NextResponse.json({
      session,
      messages: messages ?? [],
      bossConfig: bossConfig ? { name: bossConfig.name, icon: bossConfig.icon, bossName: bossConfig.bossName, bossRole: bossConfig.bossRole, bossAvatar: bossConfig.bossAvatar } : null,
    });
  } catch (err) {
    console.error('Get boss session error:', err);
    return NextResponse.json({ error: '获取失败' }, { status: 500 });
  }
}

// DELETE /api/simulator/boss-1v1/[id]
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: '请先登录' }, { status: 401 });

    const { error } = await supabase
      .from('boss_1v1_sessions')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id);

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('Delete boss session error:', err);
    return NextResponse.json({ error: '删除失败' }, { status: 500 });
  }
}
