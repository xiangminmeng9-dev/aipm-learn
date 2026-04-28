import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// GET: Load messages for a specific stage within a session
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const session_id = searchParams.get('session_id');
    const stage_id = searchParams.get('stage_id');

    if (!session_id) return NextResponse.json({ messages: [] });

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ messages: [] });

    // Verify session ownership
    const { data: session } = await supabase
      .from('simulator_sessions')
      .select('id')
      .eq('id', session_id)
      .eq('user_id', user.id)
      .maybeSingle();

    if (!session) return NextResponse.json({ messages: [] });

    // Load all messages for this session
    const { data: messages } = await supabase
      .from('simulator_messages')
      .select('role, content, created_at')
      .eq('session_id', session_id)
      .order('created_at', { ascending: true });

    if (!messages || messages.length === 0) return NextResponse.json({ messages: [] });

    // Split messages by stage_start markers
    // Collect messages between the target stage_start and the next stage_start
    const stageMessages: { role: string; content: string }[] = [];
    let inTargetStage = false;
    let hasAnyMarker = false;

    for (const msg of messages) {
      if (msg.role === 'system') {
        try {
          const parsed = JSON.parse(msg.content);
          if (parsed.type === 'stage_start') {
            hasAnyMarker = true;
            // If we were in target stage and hit a new stage_start, we're done
            if (inTargetStage) break;
            // Check if this is our target stage
            inTargetStage = parsed.stage_id === stage_id;
          }
          // Include evaluation results for this stage
          if (inTargetStage && parsed.type === 'evaluation' && parsed.stage_id === stage_id) {
            // Don't include in chat display, but note it exists
          }
        } catch { /* not JSON, skip */ }
        continue; // Skip all system messages from display
      }

      // user/assistant messages
      if (hasAnyMarker) {
        if (inTargetStage) {
          stageMessages.push({ role: msg.role, content: msg.content });
        }
      } else {
        // No stage markers (legacy data), return all user/assistant messages
        stageMessages.push({ role: msg.role, content: msg.content });
      }
    }

    return NextResponse.json({ messages: stageMessages });
  } catch (err) {
    console.error('Load messages error:', err);
    return NextResponse.json({ messages: [] });
  }
}