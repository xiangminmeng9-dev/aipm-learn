'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import Link from 'next/link';
import { PROJECT_SCENARIOS } from '@/lib/project-scenarios';
import Markdown from '@/components/ui/markdown';

export default function ProjectDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const [projectId, setProjectId] = useState('');
  const [project, setProject] = useState<{ id: string; title: string; scenario_id: string; deliverables?: { name: string; description: string }[] } | null>(null);
  const [messages, setMessages] = useState<{ id: string; role: string; content: string }[]>([]);
  const [input, setInput] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef('');
  const msgIdCounter = useRef(0);

  const nextMsgId = () => `msg-${++msgIdCounter.current}-${Date.now()}`;

  useEffect(() => { params.then(p => setProjectId(p.id)); }, [params]);

  const fetchProject = useCallback(async () => {
    if (!projectId) return;
    try {
      const supabase = (await import('@/lib/supabase/client')).createClient();
      const { data } = await supabase.from('simulator_projects').select('*').eq('id', projectId).single();
      setProject(data);

      const { data: msgs } = await supabase.from('simulator_project_messages').select('*').eq('project_id', projectId).order('created_at');
      setMessages((msgs || []).map((m: { role: string; content: string }) => ({ id: nextMsgId(), role: m.role, content: m.content })));
    } catch { /* ignore */ }
  }, [projectId]);

  useEffect(() => { fetchProject(); }, [fetchProject]);
  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  const sendMessage = async () => {
    if (!input.trim() || isStreaming || !project) return;
    const text = input.trim();
    setInput('');
    setMessages(prev => [...prev, { id: nextMsgId(), role: 'user', content: text }]);
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
        contentRef.current = '';
        setMessages(prev => [...prev, { id: nextMsgId(), role: 'assistant', content: '' }]);
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
                  contentRef.current += data.content;
                  const currentContent = contentRef.current;
                  setMessages(prev => {
                    const copy = [...prev];
                    copy[copy.length - 1] = { ...copy[copy.length - 1], content: currentContent };
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
      <div className="flex items-center justify-center py-12">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-teal-500 border-t-transparent" />
      </div>
    );
  }

  const deliverables = project.deliverables || [];
  const scenario = PROJECT_SCENARIOS.find(s => s.id === project.scenario_id);

  return (
    <div className="flex h-[calc(100vh)] flex-col">
      <header className="shrink-0 border-b border-border bg-card px-6 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/simulator/project" className="text-sm text-teal-600 hover:underline">← 返回列表</Link>
            <span className="text-muted-foreground">|</span>
            <h1 className="text-base font-bold text-foreground">{project.title}</h1>
          </div>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* Deliverables sidebar */}
        <div className="hidden w-64 shrink-0 border-r border-border bg-card lg:block">
          <div className="p-4">
            <h3 className="text-sm font-semibold text-foreground mb-3">项目交付物</h3>
            <div className="space-y-2">
              {deliverables.map((d: { name: string; description: string }, i: number) => (
                <div key={i} className="rounded-xl border border-border bg-muted p-3">
                  <div className="text-sm font-medium text-foreground">{d.name}</div>
                  <div className="text-xs text-muted-foreground mt-0.5">{d.description}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Chat area */}
        <div className="flex flex-1 flex-col">
          <div className="flex-1 space-y-4 overflow-y-auto p-4">
            {messages.length === 0 && (
              <div className="py-12 text-center text-sm text-muted-foreground">
                开始和评审团队对话，逐步完成每个交付物...
              </div>
            )}
            {messages.map((msg) => (
              <div key={msg.id} className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : ''}`}>
                {msg.role === 'assistant' && (
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-teal-100 text-sm">🔍</div>
                )}
                <div className={`max-w-[75%] rounded-2xl px-4 py-3 ${
                  msg.role === 'user' ? 'bg-indigo-600 text-white' : 'border border-border bg-card text-foreground'
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
                <div className="rounded-2xl border border-border bg-card px-4 py-3">
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

          <div className="shrink-0 border-t border-border bg-card p-4">
            <div className="flex gap-2">
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="提交你的交付物或与评审团队讨论..."
                rows={3}
                className="flex-1 resize-none rounded-xl border border-border bg-muted px-4 py-2.5 text-sm focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
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