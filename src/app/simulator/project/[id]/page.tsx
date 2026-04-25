'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import Link from 'next/link';
import Markdown from '@/components/ui/markdown';

export default function ProjectDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const [projectId, setProjectId] = useState('');
  const [project, setProject] = useState<any>(null);
  const [messages, setMessages] = useState<{ role: string; content: string }[]>([]);
  const [input, setInput] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => { params.then(p => setProjectId(p.id)); }, [params]);

  const fetchProject = useCallback(async () => {
    if (!projectId) return;
    try {
      const supabase = (await import('@/lib/supabase/client')).createClient();
      const { data } = await supabase.from('simulator_projects').select('*').eq('id', projectId).single();
      setProject(data);

      const { data: msgs } = await supabase.from('simulator_project_messages').select('*').eq('project_id', projectId).order('created_at');
      setMessages((msgs || []).map((m: any) => ({ role: m.role, content: m.content })));
    } catch { /* ignore */ }
  }, [projectId]);

  useEffect(() => { fetchProject(); }, [fetchProject]);
  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  const sendMessage = async () => {
    if (!input.trim() || isStreaming || !project) return;
    const text = input.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: text }]);
    setIsStreaming(true);

    try {
      const res = await fetch(`/api/simulator/project/${projectId}/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: text }),
      });

      const reader = res.body?.getReader();
      const decoder = new TextDecoder();
      if (reader) {
        let buffer = '';
        let assistantContent = '';
        setMessages(prev => [...prev, { role: 'assistant', content: '' }]);
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split('\n');
          buffer = lines.pop() || '';
          for (const line of lines) {
            if (line.startsWith('data: ')) {
              try {
                const data = JSON.parse(line.slice(6));
                if (data.type === 'chunk') {
                  assistantContent += data.content;
                  setMessages(prev => {
                    const copy = [...prev];
                    copy[copy.length - 1] = { role: 'assistant', content: assistantContent };
                    return copy;
                  });
                }
              } catch { /* ignore */ }
            }
          }
        }
      }
    } catch { /* ignore */ } finally { setIsStreaming(false); }
  };

  if (!project) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-teal-500 border-t-transparent" />
      </div>
    );
  }

  const deliverables = project.deliverables || [];

  return (
    <div className="flex min-h-screen flex-col bg-[#F8F9FB]">
      <header className="sticky top-0 z-40 border-b border-gray-200 bg-white/80 backdrop-blur">
        <div className="flex items-center justify-between px-6 py-3">
          <div className="flex items-center gap-3">
            <Link href="/simulator/project" className="text-sm text-gray-500 hover:text-gray-900">
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5 8.25 12l7.5-7.5" />
              </svg>
            </Link>
            <h1 className="text-base font-bold text-gray-900">{project.title}</h1>
          </div>
        </div>
      </header>

      <div className="flex flex-1">
        {/* Deliverables sidebar */}
        <div className="hidden w-64 shrink-0 border-r border-gray-200 bg-white lg:block">
          <div className="p-4">
            <h3 className="text-sm font-semibold text-gray-700 mb-3">项目交付物</h3>
            <div className="space-y-2">
              {deliverables.map((d: any, i: number) => (
                <div key={i} className="rounded-xl border border-gray-100 bg-gray-50 p-3">
                  <div className="text-sm font-medium text-gray-800">{d.name}</div>
                  <div className="text-xs text-gray-500 mt-0.5">{d.description}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Chat area */}
        <div className="flex flex-1 flex-col">
          <div className="flex-1 space-y-4 overflow-y-auto p-4">
            {messages.length === 0 && (
              <div className="py-12 text-center text-sm text-gray-400">
                开始和评审团队对话，逐步完成每个交付物...
              </div>
            )}
            {messages.map((msg, i) => (
              <div key={i} className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : ''}`}>
                {msg.role === 'assistant' && (
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-teal-100 text-sm">🔍</div>
                )}
                <div className={`max-w-[75%] rounded-2xl px-4 py-3 ${
                  msg.role === 'user' ? 'bg-indigo-600 text-white' : 'border border-gray-200 bg-white text-gray-800'
                }`}>
                  {msg.role === 'assistant' ? (
                    <div className="prose prose-sm max-w-none">
                      <Markdown content={msg.content || '...'} />
                    </div>
                  ) : (
                    <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                  )}
                </div>
              </div>
            ))}
            {isStreaming && messages[messages.length - 1]?.role === 'user' && (
              <div className="flex gap-3">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-teal-100 text-sm">🔍</div>
                <div className="rounded-2xl border border-gray-200 bg-white px-4 py-3">
                  <div className="flex gap-1">
                    <span className="h-2 w-2 animate-bounce rounded-full bg-gray-400" style={{ animationDelay: '0ms' }} />
                    <span className="h-2 w-2 animate-bounce rounded-full bg-gray-400" style={{ animationDelay: '150ms' }} />
                    <span className="h-2 w-2 animate-bounce rounded-full bg-gray-400" style={{ animationDelay: '300ms' }} />
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          <div className="shrink-0 border-t border-gray-200 bg-white p-4">
            <div className="flex gap-2">
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="提交你的交付物或与评审团队讨论..."
                rows={3}
                className="flex-1 resize-none rounded-xl border border-gray-300 bg-gray-50 px-4 py-2.5 text-sm focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
                disabled={isStreaming}
                onKeyDown={(e) => { if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) sendMessage(); }}
              />
              <button
                onClick={sendMessage}
                disabled={isStreaming || !input.trim()}
                className="rounded-xl bg-teal-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-teal-700 disabled:opacity-50"
              >
                {isStreaming ? '...' : '发送'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}