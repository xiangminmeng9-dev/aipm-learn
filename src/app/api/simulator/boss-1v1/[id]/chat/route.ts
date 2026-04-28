import { NextRequest, NextResponse } from 'next/server';
import { createClient, createServiceClient } from '@/lib/supabase/server';
import { BOSS_TYPES } from '@/lib/boss-1v1-config';
import { streamChatResponse, generateText } from '@/lib/ai/claude';

export const maxDuration = 60;

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: '请先登录' }, { status: 401 });

    const { message, is_submission } = await request.json();
    if (!message) return NextResponse.json({ error: '请输入内容' }, { status: 400 });

    // Verify session ownership
    const { data: session } = await supabase
      .from('boss_1v1_sessions')
      .select('id, user_id, boss_type, scenario_id, status')
      .eq('id', id)
      .eq('user_id', user.id)
      .single();

    if (!session) return NextResponse.json({ error: '会话不存在' }, { status: 404 });
    if (session.status === 'completed') return NextResponse.json({ error: '会话已结束' }, { status: 400 });

    const bossConfig = BOSS_TYPES.find((b) => b.id === session.boss_type);
    const scenario = bossConfig?.scenarios.find((s) => s.id === session.scenario_id);

    // Save user message
    await supabase.from('boss_1v1_messages').insert({
      session_id: id,
      role: 'user',
      content: message,
    });

    // Get chat history
    const { data: historyMessages } = await supabase
      .from('boss_1v1_messages')
      .select('role, content')
      .eq('session_id', id)
      .order('created_at', { ascending: true })
      .limit(30);

    const chatHistory = (historyMessages || [])
      .filter((m) => m.role === 'user' || m.role === 'assistant')
      .map((m) => ({ role: m.role as 'user' | 'assistant', content: m.content }));

    // Submission: evaluate and end session
    if (is_submission) {
      const conversationText = chatHistory
        .map((m) => `${m.role === 'user' ? '用户' : bossConfig?.bossName ?? 'Boss'}：${m.content}`)
        .join('\n\n');

      const evalResult = await generateText(
        `场景：${scenario?.description ?? ''}\n对话记录：\n${conversationText}\n\n${bossConfig?.evaluationPrompt ?? ''}`,
        { system: '你是软技能评估专家。严格公正评分。只输出JSON，不要markdown代码块。', maxTokens: 1000 }
      );

      let evaluation;
      try {
        const cleaned = evalResult.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
        const jsonMatch = cleaned.match(/\{[\s\S]*\}/);
        evaluation = jsonMatch ? JSON.parse(jsonMatch[0]) : { total_score: 50, overall_comment: evalResult, improvement: '', scores: [] };
      } catch {
        evaluation = { total_score: 50, overall_comment: '评分解析异常', improvement: '', scores: [] };
      }

      // Update session status and save evaluation
      await createServiceClient()
        .from('boss_1v1_sessions')
        .update({
          status: 'completed',
          score: evaluation.total_score ?? 0,
          feedback: evaluation,
        })
        .eq('id', id);

      await supabase.from('boss_1v1_messages').insert({
        session_id: id,
        role: 'system',
        content: JSON.stringify(evaluation),
      });

      return NextResponse.json({ type: 'evaluation', evaluation });
    }

    // Normal chat: SSE stream
    const systemPrompt = `${bossConfig?.systemPrompt ?? ''}\n\n当前场景：${scenario?.description ?? ''}`;

    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        let fullAnswer = '';
        try {
          for await (const chunk of streamChatResponse(chatHistory, { system: systemPrompt })) {
            fullAnswer += chunk;
            controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'chunk', content: chunk })}\n\n`));
          }

          await supabase.from('boss_1v1_messages').insert({
            session_id: id,
            role: 'assistant',
            content: fullAnswer,
          });

          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'done' })}\n\n`));
        } catch (err) {
          console.error('Boss chat stream error:', err);
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
    console.error('Boss chat error:', err);
    return NextResponse.json({ error: '聊天失败' }, { status: 500 });
  }
}