import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { streamChatResponse } from '@/lib/ai/claude';
import { buildSessionSystemPrompt } from '@/lib/ai/prompts';
import {
  checkCompressionNeeded,
  compressMemory,
  buildChatContext,
  estimateTokens,
} from '@/lib/ai/memory';

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: '未登录', code: 'UNAUTHORIZED' }, { status: 401 });
    }

    const { id: sessionId } = await params;
    const body = await request.json();
    const { message } = body as { message: string };

    if (!message || message.trim().length < 1 || message.length > 5000) {
      return NextResponse.json(
        { error: '消息内容不能为空或超过5000字符', code: 'VALIDATION_ERROR' },
        { status: 400 }
      );
    }

    // 获取 Session 信息
    const { data: session, error: sessionError } = await supabase
      .from('chat_sessions')
      .select('id, jd_text, resume_text, compressed_summary, user_id')
      .eq('id', sessionId)
      .eq('user_id', user.id)
      .single();

    if (sessionError || !session) {
      return NextResponse.json({ error: 'Session 不存在', code: 'NOT_FOUND' }, { status: 404 });
    }

    // 保存用户消息
    const userTokenCount = estimateTokens(message);
    const { data: _userMsg } = await supabase
      .from('chat_messages')
      .insert({
        session_id: sessionId,
        role: 'user',
        content: message.trim(),
        token_count: userTokenCount,
      })
      .select('id')
      .single();

    // 获取最近消息
    const { data: recentMessages } = await supabase
      .from('chat_messages')
      .select('role, content, token_count, is_compressed')
      .eq('session_id', sessionId)
      .order('created_at', { ascending: true });

    const messages = recentMessages ?? [];

    // 检查是否需要压缩
    let compressed = false;
    let currentSummary = session.compressed_summary;

    if (checkCompressionNeeded(messages, userTokenCount)) {
      const { summary, messagesToKeep } = await compressMemory(messages);
      if (summary) {
        currentSummary = summary;
        compressed = true;

        // 更新 Session 的压缩摘要
        await supabase
          .from('chat_sessions')
          .update({
            compressed_summary: summary,
            is_compressed: true,
            updated_at: new Date().toISOString(),
          })
          .eq('id', sessionId);

        // 标记旧消息为已压缩
        const oldMessageIds = messages
          .filter((m) => !messagesToKeep.includes(m))
          .map((m) => (m as { id?: string }).id)
          .filter(Boolean);

        if (oldMessageIds.length > 0) {
          await supabase
            .from('chat_messages')
            .update({ is_compressed: true })
            .in('id', oldMessageIds);
        }
      }
    }

    // 组装上下文
    const systemPrompt = buildSessionSystemPrompt({
      jdText: session.jd_text,
      resumeText: session.resume_text,
      compressedSummary: currentSummary,
    });

    const chatMessages = buildChatContext({
      systemPrompt,
      compressedSummary: currentSummary,
      recentMessages: messages.filter((m) => !m.is_compressed),
    });

    // 流式响应
    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        let fullContent = '';

        try {
          for await (const chunk of streamChatResponse(chatMessages, {
            model: 'sonnet',
            system: systemPrompt,
            maxTokens: 4096,
          })) {
            fullContent += chunk;
            controller.enqueue(
              encoder.encode(`data: ${JSON.stringify({ type: 'chunk', content: chunk })}\n\n`)
            );
          }

          // 保存 AI 回复
          const assistantTokenCount = estimateTokens(fullContent);
          const { data: assistantMsg } = await supabase
            .from('chat_messages')
            .insert({
              session_id: sessionId,
              role: 'assistant',
              content: fullContent,
              token_count: assistantTokenCount,
            })
            .select('id')
            .single();

          // 更新 Session 的 token 总数和更新时间
          const totalTokens =
            messages.reduce((sum, m) => sum + m.token_count, 0) +
            userTokenCount +
            assistantTokenCount;
          await supabase
            .from('chat_sessions')
            .update({
              total_tokens: totalTokens,
              updated_at: new Date().toISOString(),
            })
            .eq('id', sessionId);

          controller.enqueue(
            encoder.encode(
              `data: ${JSON.stringify({
                type: 'done',
                message_id: assistantMsg?.id,
                compressed,
              })}\n\n`
            )
          );
        } catch (err) {
          console.error('Stream error:', err);
          controller.enqueue(
            encoder.encode(
              `data: ${JSON.stringify({ type: 'error', content: 'AI 回复生成失败' })}\n\n`
            )
          );
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
  } catch (error) {
    console.error('Chat API error:', error);
    return NextResponse.json({ error: '服务器内部错误', code: 'INTERNAL_ERROR' }, { status: 500 });
  }
}
