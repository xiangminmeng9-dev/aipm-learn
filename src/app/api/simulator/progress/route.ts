import { NextRequest, NextResponse } from 'next/server';
import { createClient, createServiceClient } from '@/lib/supabase/server';
import { SIMULATOR_SCENARIOS } from '@/lib/simulator-config';

export async function POST(request: NextRequest) {
  try {
    const { action, scenario_id, stage_id, score, feedback, stage_scores } = await request.json();
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: '请先登录' }, { status: 401 });

    if (action === 'start') {
      // Check if session already exists for this scenario
      const { data: existing } = await supabase
        .from('simulator_sessions')
        .select('id, current_stage, scenario_id, stage_scores')
        .eq('user_id', user.id)
        .eq('scenario_id', scenario_id)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (existing) {
        // Return existing session with progress
        const { data: messages } = await supabase
          .from('simulator_messages')
          .select('role, content, created_at')
          .eq('session_id', existing.id)
          .order('created_at', { ascending: true });

        return NextResponse.json({
          session: existing,
          messages: messages || [],
        });
      }

      // Create new session
      const firstStage = SIMULATOR_SCENARIOS.find(s => s.id === scenario_id)?.stages[0]?.id || 'stage-1';
      const { data: session } = await createServiceClient()
        .from('simulator_sessions')
        .insert({
          user_id: user.id,
          scenario_id,
          current_stage: firstStage,
          stage_scores: {},
        })
        .select('id, current_stage, scenario_id, stage_scores')
        .single();

      return NextResponse.json({ session, messages: [] });
    }

    if (action === 'save_stage_score') {
      // Save a stage evaluation score
      const { data: session } = await supabase
        .from('simulator_sessions')
        .select('id, stage_scores, scenario_id')
        .eq('user_id', user.id)
        .eq('scenario_id', scenario_id)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (!session) return NextResponse.json({ error: '会话不存在' }, { status: 404 });

      const currentScores = session.stage_scores || {};
      currentScores[stage_id] = { score, feedback, completed_at: new Date().toISOString() };

      // Find next stage
      const scenario = SIMULATOR_SCENARIOS.find(s => s.id === scenario_id);
      let nextStage = stage_id;
      if (scenario) {
        const idx = scenario.stages.findIndex(s => s.id === stage_id);
        if (idx < scenario.stages.length - 1) nextStage = scenario.stages[idx + 1].id;
      }

      await createServiceClient()
        .from('simulator_sessions')
        .update({
          current_stage: nextStage,
          stage_scores: currentScores,
          updated_at: new Date().toISOString(),
        })
        .eq('id', session.id);

      return NextResponse.json({ success: true, next_stage: nextStage, stage_scores: currentScores });
    }

    if (action === 'save_progress') {
      // Bulk save stage scores
      const { data: session } = await supabase
        .from('simulator_sessions')
        .select('id')
        .eq('user_id', user.id)
        .eq('scenario_id', scenario_id)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (!session) return NextResponse.json({ error: '会话不存在' }, { status: 404 });

      await createServiceClient()
        .from('simulator_sessions')
        .update({
          current_stage: stage_id,
          stage_scores: stage_scores || {},
          updated_at: new Date().toISOString(),
        })
        .eq('id', session.id);

      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: '未知操作' }, { status: 400 });
  } catch (err) {
    console.error('Progress error:', err);
    return NextResponse.json({ error: '操作失败' }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const scenario_id = searchParams.get('scenario_id');
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ session: null, messages: [], stageScores: {} });

    const { data: session } = await supabase
      .from('simulator_sessions')
      .select('id, current_stage, scenario_id, stage_scores, created_at')
      .eq('user_id', user.id)
      .eq('scenario_id', scenario_id || 'ai-recommend')
      .order('created_at', { ascending: false })
      .limit(1)
    .maybeSingle();

    if (!session) return NextResponse.json({ session: null, messages: [], stageScores: {} });

    // Load messages for this session
    const { data: messages } = await supabase
      .from('simulator_messages')
      .select('role, content, created_at')
      .eq('session_id', session.id)
      .order('created_at', { ascending: true });

    return NextResponse.json({
      session,
      messages: messages || [],
      stageScores: session.stage_scores || {},
    });
  } catch (err) {
    console.error('Progress GET error:', err);
    return NextResponse.json({ error: '查询失败' }, { status: 500 });
  }
}
