import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { STAGES_CONFIG } from '@/lib/simulator-config';

export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: '请先登录' }, { status: 401 });

    const { data: session } = await supabase
      .from('simulator_sessions')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (!session) {
      return NextResponse.json({ session: null });
    }

    return NextResponse.json({ session });
  } catch (err) {
    console.error('Simulator progress GET error:', err);
    return NextResponse.json({ error: '获取进度失败' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: '请先登录' }, { status: 401 });

    const { action, stage_id, score_data } = await request.json();

    if (action === 'start') {
      const firstStage = STAGES_CONFIG[0];
      const { data, error } = await supabase
        .from('simulator_sessions')
        .insert({
          user_id: user.id,
          current_stage_id: firstStage.id,
          status: 'in_progress',
        })
        .select('*')
        .single();

      if (error) return NextResponse.json({ error: error.message }, { status: 500 });
      return NextResponse.json({ session: data });
    }

    if (action === 'next_stage' && stage_id && score_data) {
      const { data: session } = await supabase
        .from('simulator_sessions')
        .select('*')
        .eq('user_id', user.id)
        .eq('status', 'in_progress')
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (!session) return NextResponse.json({ error: '没有进行中的模拟' }, { status: 404 });

      const currentIndex = STAGES_CONFIG.findIndex(s => s.id === stage_id);
      const nextStage = STAGES_CONFIG[currentIndex + 1];

      const updatedScores = {
        ...(session.stage_scores as Record<string, unknown>),
        [stage_id]: {
          score: score_data.score,
          feedback: score_data.feedback,
          completed_at: new Date().toISOString(),
        },
      };

      const isCompleted = !nextStage;

      const { data: updated, error } = await supabase
        .from('simulator_sessions')
        .update({
          current_stage_id: nextStage ? nextStage.id : stage_id,
          stage_scores: updatedScores,
          status: isCompleted ? 'completed' : 'in_progress',
        })
        .eq('id', session.id)
        .select('*')
        .single();

      if (error) return NextResponse.json({ error: error.message }, { status: 500 });
      return NextResponse.json({ session: updated });
    }

    return NextResponse.json({ error: '无效操作' }, { status: 400 });
  } catch (err) {
    console.error('Simulator progress POST error:', err);
    return NextResponse.json({ error: '操作失败' }, { status: 500 });
  }
}
