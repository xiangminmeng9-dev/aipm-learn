import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { streamChatResponse } from '@/lib/ai/claude';
import { buildSessionSystemPrompt } from '@/lib/ai/prompts';
import { searchKnowledgeBase } from '@/lib/ai/knowledge-base';
import { getRealQuestionsContext } from '@/lib/ai/real-questions';
import {
  checkCompressionNeeded,
  compressMemory,
  buildChatContext,
  estimateTokens,
} from '@/lib/ai/memory';

// Allow up to 60s of streaming on Vercel
export const maxDuration = 60;

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

    // Parallel: fetch session meta + recent messages simultaneously
    const [sessionResult, messagesResult] = await Promise.all([
      supabase
        .from('chat_sessions')
        .select('id, jd_text, resume_text, compressed_summary, user_id')
        .eq('id', sessionId)
        .eq('user_id', user.id)
        .single(),
      supabase
        .from('chat_messages')
        .select('role, content, token_count, is_compressed')
        .eq('session_id', sessionId)
        .order('created_at', { ascending: true }),
    ]);

    const session = sessionResult.data;
    if (sessionResult.error || !session) {
      return NextResponse.json({ error: 'Session 不存在', code: 'NOT_FOUND' }, { status: 404 });
    }

    const userTokenCount = estimateTokens(message);
    const priorMessages = messagesResult.data ?? [];

    // Fire-and-forget: persist user message while we start streaming
    const userInsertPromise = supabase
      .from('chat_messages')
      .insert({
        session_id: sessionId,
        role: 'user',
        content: message.trim(),
        token_count: userTokenCount,
      });

    // Append new user message locally for context building (no extra roundtrip)
    const messagesWithNew: typeof priorMessages = [
      ...priorMessages,
      { role: 'user', content: message.trim(), token_count: userTokenCount, is_compressed: false },
    ];

    // Compression check is cheap (no network) — only heavy when it actually triggers
    let compressed = false;
    let currentSummary = session.compressed_summary;
    const needsCompression = checkCompressionNeeded(priorMessages, userTokenCount);

    if (needsCompression) {
      const { summary } = await compressMemory(messagesWithNew);
      if (summary) {
        currentSummary = summary;
        compressed = true;
        // DB side-effects (update summary flag + mark old messages compressed) can happen
        // asynchronously without blocking the stream — do it after we send the response.
      }
    }

    const systemPrompt = buildSessionSystemPrompt({
      jdText: session.jd_text,
      resumeText: session.resume_text,
      compressedSummary: currentSummary,
    });

    // Add knowledge base + real questions context
    const kbResults = searchKnowledgeBase(message, 2);
    const knowledgeContext = kbResults.length > 0
      ? '\n\n【知识库参考】\n' + kbResults.map((e, i) => `${i + 1}. ${e.title}\n${e.content}`).join('\n\n')
      : '';
    const realQuestionsContext = getRealQuestionsContext(undefined, 2);

    const fullSystemPrompt = systemPrompt + knowledgeContext + realQuestionsContext;

    const chatMessages = buildChatContext({
      systemPrompt,
      compressedSummary: currentSummary,
      recentMessages: messagesWithNew.filter((m) => !m.is_compressed),
    });

    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        let fullContent = '';
        let firstChunk = true;

        try {
          for await (const chunk of streamChatResponse(chatMessages, {
            model: 'sonnet',
            system: fullSystemPrompt,
            maxTokens: 2048,
          })) {
            if (firstChunk) {
              firstChunk = false;
              // Flush a tiny ping first so clients see TTFB immediately
              controller.enqueue(encoder.encode(`: ok\n\n`));
            }
            fullContent += chunk;
            controller.enqueue(
              encoder.encode(`data: ${JSON.stringify({ type: 'chunk', content: chunk })}\n\n`)
            );
          }

          // After streaming, do all DB writes in parallel (non-blocking to user)
          const assistantTokenCount = estimateTokens(fullContent);
          const totalTokens =
            priorMessages.reduce((sum, m) => sum + m.token_count, 0) +
            userTokenCount +
            assistantTokenCount;

          const [assistantInsert] = await Promise.all([
            supabase
              .from('chat_messages')
              .insert({
                session_id: sessionId,
                role: 'assistant',
                content: fullContent,
                token_count: assistantTokenCount,
              })
              .select('id')
              .single(),
            supabase
              .from('chat_sessions')
              .update({
                total_tokens: totalTokens,
                updated_at: new Date().toISOString(),
                ...(compressed
                  ? { compressed_summary: currentSummary, is_compressed: true }
                  : {}),
              })
              .eq('id', sessionId),
            userInsertPromise, // make sure user msg persisted
          ]);

          controller.enqueue(
            encoder.encode(
              `data: ${JSON.stringify({
                type: 'done',
                message_id: assistantInsert.data?.id,
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
        'Content-Type': 'text/event-stream; charset=utf-8',
        'Cache-Control': 'no-cache, no-transform',
        Connection: 'keep-alive',
        'X-Accel-Buffering': 'no',
      },
    });
  } catch (error) {
    console.error('Chat API error:', error);
    return NextResponse.json({ error: '服务器内部错误', code: 'INTERNAL_ERROR' }, { status: 500 });
  }
}
