import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { PROJECT_SCENARIOS } from '@/lib/project-scenarios';
import { withTimeout, AI_TIMEOUT_MS } from '@/lib/ai/with-timeout';

export const maxDuration = 60;

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: '请先登录' }, { status: 401 });

    const { id } = await params;
    const { message } = await request.json();

    const { data: project } = await supabase
      .from('simulator_projects')
      .select('*')
      .eq('id', id)
      .eq('user_id', user.id)
      .single();

    if (!project) return NextResponse.json({ error: '项目不存在' }, { status: 404 });

    const scenario = PROJECT_SCENARIOS.find(s => s.id === project.scenario_id);
    if (!scenario) return NextResponse.json({ error: '场景不存在' }, { status: 400 });

    // Save user message
    await supabase.from('simulator_project_messages').insert({
      project_id: id,
      role: 'user',
      content: message,
    });

    // Fetch recent messages
    const { data: recentMessages } = await supabase
      .from('simulator_project_messages')
      .select('role, content')
      .eq('project_id', id)
      .order('created_at', { ascending: true })
      .limit(20);

    const chatHistory = (recentMessages || []).map((m: { role: string; content: string }) => ({
      role: m.role as 'user' | 'assistant',
      content: m.content,
    }));

    const { streamChatResponse } = await import('@/lib/ai/claude');

    const stream = streamChatResponse(chatHistory, {
      system: scenario.systemPrompt,
      maxTokens: 4096,
    });

    const encoder = new TextEncoder();
    const readable = new ReadableStream({
      start(controller) {
        const streamPromise = (async () => {
          let fullContent = '';
          for await (const chunk of stream) {
            fullContent += chunk;
            controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'chunk', content: chunk })}\n\n`));
          }
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'done' })}\n\n`));
          controller.close();

          // Save assistant message
          await supabase.from('simulator_project_messages').insert({
            project_id: id,
            role: 'assistant',
            content: fullContent,
          });
        })();

        withTimeout(streamPromise, AI_TIMEOUT_MS).catch((err) => {
          console.error('Project chat stream error:', err);
          try {
            controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'error', message: err instanceof Error ? err.message : '对话超时或失败' })}\n\n`));
            controller.close();
          } catch { /* controller already closed */ }
        });
      },
    });

    return new NextResponse(readable, {
      headers: { 'Content-Type': 'text/event-stream', 'Cache-Control': 'no-cache' },
    });
  } catch (err) {
    console.error('Project chat error:', err);
    return NextResponse.json({ error: '对话失败' }, { status: 500 });
  }
}