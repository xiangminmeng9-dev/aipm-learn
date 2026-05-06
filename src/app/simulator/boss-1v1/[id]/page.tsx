'use client';

import { useState, useEffect, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { BOSS_TYPES } from '@/lib/boss-1v1-config';

interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
}

interface Evaluation {
  scores: { dimension: string; score: number; comment: string }[];
  total_score: number;
  overall_comment: string;
  improvement: string;
}

export default function Boss1v1ChatPage() {
  const params = useParams();
  const router = useRouter();
  const sessionId = params.id as string;

  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [bossInfo, setBossInfo] = useState<{ name: string; icon: string; bossName: string; bossRole: string; bossAvatar: string } | null>(null);
  const [sessionStatus, setSessionStatus] = useState<string>('active');
  const [evaluation, setEvaluation] = useState<Evaluation | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef('');
  const msgIdCounter = useRef(0);

  const nextMsgId = () => `msg-${++msgIdCounter.current}-${Date.now()}`;

  useEffect(() => {
    fetch(`/api/simulator/boss-1v1/${sessionId}`)
      .then((r) => r.ok ? r.json() : null)
      .then((data) => {
        if (data) {
          const msgs = (data.messages ?? []).filter((m: Message) => m.role !== 'system').map((m: Message) => ({ id: nextMsgId(), role: m.role, content: m.content }));
          setMessages(msgs);
          setBossInfo(data.bossConfig);
          setSessionStatus(data.session?.status ?? 'active');
          if (data.session?.status === 'completed' && data.session?.feedback) {
            setEvaluation(typeof data.session.feedback === 'string' ? JSON.parse(data.session.feedback) : data.session.feedback);
          }
        }
      })
      .catch(() => {})
      .finally(() => setIsLoading(false));
  }, [sessionId]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || isSending || sessionStatus === 'completed') return;
    const userMsg = input.trim();
    setInput('');
    setMessages((prev) => [...prev, { id: nextMsgId(), role: 'user', content: userMsg }]);
    setIsSending(true);

    try {
      const res = await fetch(`/api/simulator/boss-1v1/${sessionId}/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: userMsg }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        alert(err.error || '发送失败');
        setMessages((prev) => prev.slice(0, -1));
        setIsSending(false);
        return;
      }

      // SSE streaming
      const reader = res.body?.getReader();
      const decoder = new TextDecoder();
      contentRef.current = '';

      if (reader) {
        // Add placeholder for boss message
        setMessages((prev) => [...prev, { id: nextMsgId(), role: 'assistant', content: '' }]);

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const text = decoder.decode(value, { stream: true });
          const lines = text.split('\n');

          for (const line of lines) {
            if (!line.startsWith('data: ')) continue;
            try {
              const data = JSON.parse(line.slice(6));
              if (data.type === 'chunk') {
                contentRef.current += data.content;
                const currentContent = contentRef.current;
                setMessages((prev) => {
                  const updated = [...prev];
                  updated[updated.length - 1] = { ...updated[updated.length - 1], content: currentContent };
                  return updated;
                });
              } else if (data.type === 'error') {
                alert(data.error);
              }
            } catch { /* ignore parse errors */ }
          }
        }
      }
    } catch {
      alert('网络错误');
      setMessages((prev) => prev.slice(0, -1));
    } finally {
      setIsSending(false);
    }
  };

  const handleSubmit = async () => {
    if (isSubmitting || sessionStatus === 'completed') return;
    setIsSubmitting(true);

    try {
      const res = await fetch(`/api/simulator/boss-1v1/${sessionId}/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: '请对我的表现进行评价', is_submission: true }),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.evaluation) {
          setEvaluation(data.evaluation);
          setSessionStatus('completed');
        }
      } else {
        const err = await res.json().catch(() => ({}));
        alert(err.error || '提交失败');
      }
    } catch {
      alert('网络错误');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-teal-500 border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="flex items-center gap-3 border-b border-border px-6 py-3">
        <button onClick={() => router.push('/simulator/boss-1v1')} className="text-muted-foreground hover:text-foreground">
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
          </svg>
        </button>
        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-teal-100 text-lg">
          {bossInfo?.bossAvatar ?? '👔'}
        </div>
        <div>
          <div className="text-sm font-semibold text-foreground">{bossInfo?.bossName ?? 'Boss'}</div>
          <div className="text-xs text-muted-foreground">{bossInfo?.bossRole ?? ''}</div>
        </div>
        {sessionStatus === 'active' && (
          <div className="ml-auto rounded-lg bg-amber-50 px-2.5 py-1 text-xs font-medium text-amber-600">对话中</div>
        )}
        {sessionStatus === 'completed' && (
          <div className="ml-auto rounded-lg bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-600">已完成</div>
        )}
      </div>

      {/* Chat area */}
      <div className="flex-1 overflow-y-auto px-6 py-4">
        <div className="mx-auto max-w-2xl space-y-4">
          {messages.map((msg) => (
            <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`flex items-start gap-2 max-w-[80%] ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
                {msg.role === 'assistant' && (
                  <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-teal-100 text-sm">
                    {bossInfo?.bossAvatar ?? '👔'}
                  </div>
                )}
                <div className={`rounded-2xl px-4 py-2.5 text-sm whitespace-pre-line ${
                  msg.role === 'user'
                    ? 'bg-teal-600 text-white'
                    : 'bg-muted text-foreground'
                }`}>
                  {msg.content || (
                    <span className="inline-flex gap-1">
                      <span className="h-2 w-2 animate-bounce rounded-full bg-muted-foreground/50" style={{ animationDelay: '0ms' }} />
                      <span className="h-2 w-2 animate-bounce rounded-full bg-muted-foreground/50" style={{ animationDelay: '150ms' }} />
                      <span className="h-2 w-2 animate-bounce rounded-full bg-muted-foreground/50" style={{ animationDelay: '300ms' }} />
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))}
          <div ref={chatEndRef} />
        </div>
      </div>

      {/* Evaluation result */}
      {evaluation && (
        <div className="border-t border-border bg-card px-6 py-4">
          <div className="mx-auto max-w-2xl space-y-3">
            <div className={`rounded-xl border p-4 ${
              evaluation.total_score >= 80 ? 'border-emerald-200 bg-emerald-50' :
              evaluation.total_score >= 60 ? 'border-amber-200 bg-amber-50' :
              'border-rose-200 bg-rose-50'
            }`}>
              <div className="flex items-center gap-3">
                <span className="text-3xl font-bold">{evaluation.total_score}</span>
                <span className="text-sm text-muted-foreground">/ 100 分</span>
              </div>
              {evaluation.overall_comment && <p className="mt-2 text-sm">{evaluation.overall_comment}</p>}
            </div>
            {evaluation.scores?.length > 0 && (
              <div className="space-y-2">
                {evaluation.scores.map((s, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <span className="w-20 text-xs font-medium text-muted-foreground">{s.dimension}</span>
                    <div className="flex-1 rounded-full bg-secondary h-2">
                      <div className={`rounded-full h-2 ${
                        s.score >= 80 ? 'bg-emerald-500' : s.score >= 60 ? 'bg-amber-500' : 'bg-rose-500'
                      }`} style={{ width: `${s.score}%` }} />
                    </div>
                    <span className="text-xs font-medium text-foreground">{s.score}</span>
                  </div>
                ))}
              </div>
            )}
            {evaluation.improvement && (
              <div className="rounded-xl bg-indigo-50 p-3 text-sm text-indigo-700">
                <span className="font-medium">改进建议：</span>{evaluation.improvement}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Input area */}
      {sessionStatus === 'active' && (
        <div className="border-t border-border bg-card px-6 py-3">
          <div className="mx-auto max-w-2xl">
            <div className="flex gap-2">
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleSend()}
                placeholder="输入你的回答..."
                disabled={isSending}
                className="flex-1 rounded-xl border border-border bg-background px-4 py-2.5 text-sm text-foreground placeholder-muted-foreground focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500 disabled:opacity-50"
              />
              <button
                onClick={handleSend}
                disabled={isSending || !input.trim()}
                className="rounded-xl bg-teal-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-teal-700 disabled:opacity-50"
              >
                发送
              </button>
            </div>
            <div className="mt-2 flex justify-end">
              <button
                onClick={handleSubmit}
                disabled={isSubmitting || messages.length < 3}
                className="rounded-lg border border-teal-300 bg-teal-50 px-3 py-1.5 text-xs font-medium text-teal-700 hover:bg-teal-100 disabled:opacity-50"
              >
                {isSubmitting ? '评分中...' : '提交验收'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
