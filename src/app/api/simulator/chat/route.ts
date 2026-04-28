import { NextRequest, NextResponse } from 'next/server';
import { createClient, createServiceClient } from '@/lib/supabase/server';
import { SIMULATOR_SCENARIOS, findStageByStageId } from '@/lib/simulator-config';
import { streamChatResponse, generateText } from '@/lib/ai/claude';

export const maxDuration = 60;

export async function POST(request: NextRequest) {
  try {
    const { message, stage_id, scenario_id, session_id, is_submission, history } = await request.json();
    if (!message?.trim()) return NextResponse.json({ error: '请输入内容' }, { status: 400 });

    // Find stage config
    let stageConfig;
    if (scenario_id) {
      const scenario = SIMULATOR_SCENARIOS.find(s => s.id === scenario_id);
      stageConfig = scenario?.stages.find(s => s.id === stage_id);
    }
    if (!stageConfig) {
      const found = findStageByStageId(stage_id);
      stageConfig = found?.stage;
    }
    if (!stageConfig) return NextResponse.json({ error: '场景不存在' }, { status: 400 });

    // Check auth
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    let dbSessionId = session_id;

    // Create or find session in DB
    if (user) {
      if (!dbSessionId) {
        const { data: existing } = await supabase
          .from('simulator_sessions')
          .select('id')
          .eq('user_id', user.id)
          .eq('scenario_id', scenario_id || stage_id)
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle();

        if (existing) {
          dbSessionId = existing.id;
        } else {
          const { data: created } = await createServiceClient()
            .from('simulator_sessions')
            .insert({ user_id: user.id, scenario_id: scenario_id || stage_id, current_stage: stage_id, stage_scores: {} })
            .select('id')
            .single();
          if (created) dbSessionId = created.id;
        }
      }

      // Save stage start marker if this is the first message in this stage
      if (dbSessionId) {
        // Check if there's already a stage_start marker for this stage
        const { data: existingMarkers } = await supabase
          .from('simulator_messages')
          .select('id, content')
          .eq('session_id', dbSessionId)
          .eq('role', 'system')
          .limit(50);

        const hasStageStart = (existingMarkers || []).some(m => {
          try {
            const parsed = JSON.parse(m.content);
            return parsed.type === 'stage_start' && parsed.stage_id === stage_id;
          } catch { return false; }
        });

        if (!hasStageStart) {
          await supabase.from('simulator_messages').insert({
            session_id: dbSessionId,
            role: 'system',
            content: JSON.stringify({ type: 'stage_start', stage_id }),
          });
        }

        // Save user message
        await supabase.from('simulator_messages').insert({
          session_id: dbSessionId,
          role: 'user',
          content: message.trim(),
        });
      }
    }

    // Build chat history
    const chatHistory = (history || []).filter((m: { role: string }) => m.role === 'user' || m.role === 'assistant');

    // Submission: evaluate and return result
    if (is_submission) {
      const conversationText = chatHistory
        .map((m: { role: string; content: string }) => `${m.role === 'user' ? 'PM' : stageConfig!.npcName}：${m.content}`)
        .join('\n\n');

      const evalResult = await generateText(
        `阶段：${stageConfig.title}（${stageConfig.description}）\n对话记录：\n${conversationText}\n\n${stageConfig.evaluationPrompt}`,
        { system: '你是AI PM能力评估专家。严格公正评分。只输出JSON，不要markdown代码块。', maxTokens: 1000 }
      );

      let evaluation;
      try {
        const cleaned = evalResult.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
        const jsonMatch = cleaned.match(/\{[\s\S]*\}/);
        evaluation = jsonMatch ? JSON.parse(jsonMatch[0]) : { passed: false, score: 50, feedback: evalResult, scores: [] };
      } catch {
        evaluation = { passed: false, score: 50, feedback: '评分解析异常', scores: [] };
      }

      // Save evaluation
      if (user && dbSessionId) {
        await supabase.from('simulator_messages').insert({
          session_id: dbSessionId,
          role: 'system',
          content: JSON.stringify({ type: 'evaluation', stage_id, ...evaluation }),
        });

        // Update stage scores in session
        const { data: session } = await supabase
          .from('simulator_sessions')
          .select('stage_scores')
          .eq('id', dbSessionId)
          .single();

        const currentScores = session?.stage_scores || {};
        currentScores[stage_id] = { score: evaluation.score ?? 0, feedback: evaluation.feedback || '', completed_at: new Date().toISOString() };

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
          .eq('id', dbSessionId);
      }

      return NextResponse.json({ evaluation, session_id: dbSessionId });
    }

    // Normal chat: SSE stream
    const systemPrompt = stageConfig.systemPrompt;

    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        let fullAnswer = '';
        try {
          for await (const chunk of streamChatResponse(chatHistory, { system: systemPrompt })) {
            fullAnswer += chunk;
            controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'chunk', content: chunk })}\n\n`));
          }

          // Save assistant message
          if (user && dbSessionId) {
            await supabase.from('simulator_messages').insert({
              session_id: dbSessionId,
              role: 'assistant',
              content: fullAnswer,
            });
          }

          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'done', session_id: dbSessionId })}\n\n`));
        } catch (err) {
          console.error('Simulator chat stream error:', err);
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'error', error: 'AI 服务异常' })}\n\n`));
        } finally {
          controller.close();
        }
      },
    });

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        Connection: 'keep-alive',
      },
    });
  } catch (err) {
    console.error('Simulator chat error:', err);
    return NextResponse.json({ error: '对话失败' }, { status: 500 });
  }
}
