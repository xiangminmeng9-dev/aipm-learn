'use client';

import { useState, useRef, useEffect } from 'react';
import Markdown from '@/components/ui/markdown';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

interface InteractiveChatProps {
  npcName: string;
  npcAvatar: string;
  sessionId: string;
  stageId: string;
  initialMessages?: Message[];
  onEvaluation: (evaluation: { passed: boolean; score: number; feedback: string }) => void;
}

export default function InteractiveChat({ npcName, npcAvatar, sessionId, stageId, initialMessages, onEvaluation }: InteractiveChatProps) {
  const [messages, setMessages] = useState<Message[]>(initialMessages || []);
  const [input, setInput] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = async (isSubmission = false) => {
    const text = input.trim();
    if (!text || isStreaming || isSubmitting) return;

    setMessages(prev => [...prev, { role: 'user', content: text }]);
    setInput('');

    if (isSubmission) {
      setIsSubmitting(true);
    } else {
      setIsStreaming(true);
    }

    abortRef.current = new AbortController();

    try {
      const res = await fetch('/api/simulator/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ session_id: sessionId, stage_id: stageId, message: text, is_submission: isSubmission }),
        signal: abortRef.current.signal,
      });

      if (isSubmission) {
        const data = await res.json();
        if (data.evaluation) {
          onEvaluation(data.evaluation);
        }
        setIsSubmitting(false);
        return;
      }

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
    } catch (err) {
      if (err instanceof Error && err.name !== 'AbortError') {
        setMessages(prev => [...prev, { role: 'assistant', content: '网络错误，请重试。' }]);
      }
    } finally {
      setIsStreaming(false);
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex h-full flex-col">
      <div className="flex-1 space-y-4 overflow-y-auto p-4">
        {messages.length === 0 && (
          <div className="py-12 text-center text-sm text-gray-400">
            开始和 {npcAvatar} {npcName} 对话吧...
          </div>
        )}
        {messages.map((msg, i) => (
          <div key={i} className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : ''}`}>
            {msg.role === 'assistant' && (
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-teal-100 text-sm">
                {npcAvatar}
              </div>
            )}
            <div className={`max-w-[75%] rounded-2xl px-4 py-3 ${
              msg.role === 'user'
                ? 'bg-indigo-600 text-white'
                : 'border border-gray-200 bg-white text-gray-800'
            }`}>
              {msg.role === 'assistant' ? (
                <div className="prose prose-sm max-w-none">
                  <Markdown content={msg.content || '...'} enableECharts={stageId === 'stage-14-dashboard'} />
                </div>
              ) : (
                <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
              )}
            </div>
          </div>
        ))}
        {(isStreaming || isSubmitting) && messages.length > 0 && messages[messages.length - 1].role === 'user' && !isStreaming && (
          <div className="flex gap-3">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-teal-100 text-sm">{npcAvatar}</div>
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
            placeholder="输入你的回复..."
            rows={2}
            className="flex-1 resize-none rounded-xl border border-gray-300 bg-gray-50 px-4 py-2.5 text-sm text-gray-900 placeholder-gray-400 focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
            disabled={isStreaming || isSubmitting}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) sendMessage();
            }}
          />
          <div className="flex flex-col gap-1.5">
            <button
              onClick={() => sendMessage(false)}
              disabled={isStreaming || isSubmitting || !input.trim()}
              className="rounded-xl bg-teal-600 px-4 py-2 text-xs font-medium text-white hover:bg-teal-700 disabled:opacity-50"
            >
              {isStreaming ? '...' : '发送'}
            </button>
            <button
              onClick={() => sendMessage(true)}
              disabled={isStreaming || isSubmitting || !input.trim()}
              className="rounded-xl bg-amber-500 px-4 py-2 text-xs font-medium text-white hover:bg-amber-600 disabled:opacity-50"
            >
              {isSubmitting ? '评估中...' : '提交验收'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
