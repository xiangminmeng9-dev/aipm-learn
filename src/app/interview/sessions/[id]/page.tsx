import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import SessionHeaderClientWrapper from '@/components/interview/SessionHeaderClientWrapper';
import ChatSession from '@/components/interview/ChatSession';

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function SessionDetailPage({ params }: PageProps) {
  const { id } = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  const { data: session } = await supabase
    .from('chat_sessions')
    .select('id, title, jd_text, resume_text, compressed_summary, is_compressed')
    .eq('id', id)
    .eq('user_id', user.id)
    .single();

  if (!session) {
    redirect('/interview/sessions');
  }

  const { data: messages } = await supabase
    .from('chat_messages')
    .select('id, role, content, created_at')
    .eq('session_id', id)
    .order('created_at', { ascending: true });

  return (
    <div className="flex h-full flex-col">
      {/* 顶部标题和背景信息 */}
      <div className="border-b border-neutral-800 px-4 py-3">
        <div className="mx-auto max-w-3xl">
          <h1 className="text-lg font-semibold text-neutral-100">{session.title}</h1>
          <SessionHeaderClientWrapper
            sessionId={session.id}
            jdText={session.jd_text}
            resumeText={session.resume_text}
          />
        </div>
      </div>

      {/* 对话区域 */}
      <ChatSession
        sessionId={session.id}
        initialMessages={messages ?? []}
        isCompressed={session.is_compressed}
      />
    </div>
  );
}
