import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { streamChatResponse, generateText } from '@/lib/ai/claude';
import { buildStageSystemPrompt, buildEvaluationPrompt, EVALUATION_SYSTEM_PROMPT } from '@/lib/ai/simulator-prompts';

export const maxDuration = 60;

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: '请先登录' }, { status: 401 });

    const { session_id, stage_id, message, is_submission } = await request.json();

    if (!session_id || !stage_id || !message) {
      return NextResponse.json({ error: '参数不完整' }, { status: 400 });
    }

    const { data: session } = await supabase
      .from('simulator_sessions')
      .select('id, user_id')
      .eq('id', session_id)
      .eq('user_id', user.id)
      .single();

    if (!session) return NextResponse.json({ error: '会话不存在' }, { status: 404 });

    await supabase.from('simulator_messages').insert({
      session_id,
      stage_id,
      role: 'user',
      content: message,
    });

    const { data: historyMessages } = await supabase
      .from('simulator_messages')
      .select('role, content')
      .eq('session_id', session_id)
      .eq('stage_id', stage_id)
      .order('created_at', { ascending: true })
      .limit(20);

    const chatHistory = (historyMessages || [])
      .filter(m => m.role === 'user' || m.role === 'assistant')
      .map(m => ({ role: m.role as 'user' | 'assistant', content: m.content }));

    if (is_submission) {
      const conversationText = chatHistory
        .map(m => `${m.role === 'user' ? '用户' : 'AI'}：${m.content}`)
        .join('\n\n');

      const evalPrompt = buildEvaluationPrompt(stage_id, conversationText);
      const evalResult = await generateText(evalPrompt, {
        system: EVALUATION_SYSTEM_PROMPT,
        maxTokens: 1024,
      });

      let evaluation;
      try {
        const jsonMatch = evalResult.match(/\{[\s\S]*\}/);
        evaluation = jsonMatch ? JSON.parse(jsonMatch[0]) : { passed: false, score: 0, feedback: evalResult };
      } catch {
        evaluation = { passed: false, score: 0, feedback: evalResult };
      }

      await supabase.from('simulator_messages').insert({
        session_id,
        stage_id,
        role: 'assistant',
        content: JSON.stringify(evaluation),
      });

      return NextResponse.json({ type: 'evaluation', evaluation });
    }

    const systemPrompt = buildStageSystemPrompt(stage_id);

    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        let fullAnswer = '';
        try {
          for await (const chunk of streamChatResponse(chatHistory, { system: systemPrompt })) {
            fullAnswer += chunk;
            controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'chunk', content: chunk })}\n\n`));
          }

          await supabase.from('simulator_messages').insert({
            session_id,
            stage_id,
            role: 'assistant',
            content: fullAnswer,
          });

          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'done' })}\n\n`));
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
    return NextResponse.json({ error: '聊天失败' }, { status: 500 });
  }
}
