'use client';

import { useState, useRef, useEffect } from 'react';
import Markdown from '@/components/ui/markdown';
import type { SimulatorStageConfig } from '@/lib/simulator-config';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
}

interface InteractiveChatProps {
  stage: SimulatorStageConfig;
  sessionId: string | null;
  scenarioId: string;
  savedMessages?: { role: string; content: string }[];
  isLoadingHistory?: boolean;
  onEvaluationComplete: (result: { score: number; feedback: string }) => void;
}

export default function InteractiveChat({ stage, sessionId, scenarioId, savedMessages, isLoadingHistory, onEvaluationComplete }: InteractiveChatProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [evaluation, setEvaluation] = useState<{ passed: boolean; score: number; feedback: string } | null>(null);
  const [currentSessionId, setCurrentSessionId] = useState(sessionId);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const abortRef = useRef<AbortController | null>(null);
  const contentRef = useRef('');
  const msgIdCounter = useRef(0);
  const messagesRef = useRef<Message[]>([]);

  // Keep messagesRef in sync with state
  useEffect(() => { messagesRef.current = messages; }, [messages]);

  const nextMsgId = () => `msg-${++msgIdCounter.current}-${Date.now()}`;

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Load saved messages or opening message
  useEffect(() => {
    if (isLoadingHistory) return;

    if (savedMessages && savedMessages.length > 0) {
      // Restore from DB
      setMessages(savedMessages.map(m => ({ id: nextMsgId(), role: m.role as 'user' | 'assistant', content: m.content })));
    } else if (stage.openingMessage && messages.length === 0) {
      // Show NPC opening message
      setMessages([{ id: nextMsgId(), role: 'assistant', content: stage.openingMessage }]);
    }
  }, [savedMessages, isLoadingHistory, stage.openingMessage]);

  const sendMessage = async (isSubmission = false) => {
    const text = input.trim();
    if (!text || isStreaming || isSubmitting) return;

    const userMsg = { id: nextMsgId(), role: 'user' as const, content: text };
    setMessages(prev => [...prev, userMsg]);
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
        body: JSON.stringify({
          message: text,
          stage_id: stage.id,
          scenario_id: scenarioId,
          session_id: currentSessionId,
          is_submission: isSubmission,
          history: messagesRef.current.filter(m => m.role === 'user' || m.role === 'assistant'),
        }),
        signal: abortRef.current.signal,
      });

      if (isSubmission) {
        const data = await res.json();
        if (data.evaluation) {
          setEvaluation(data.evaluation);
          onEvaluationComplete({ score: data.evaluation.score, feedback: data.evaluation.feedback });
        }
        if (data.session_id) setCurrentSessionId(data.session_id);
        setIsSubmitting(false);
        return;
      }

      // SSE streaming
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
                if (data.type === 'done' && data.session_id) {
                  setCurrentSessionId(data.session_id);
                }
              } catch { /* ignore */ }
            }
          }
        }
      }
    } catch (err) {
      if (err instanceof Error && err.name !== 'AbortError') {
        setMessages(prev => [...prev, { id: nextMsgId(), role: 'assistant', content: '网络错误，请重试。' }]);
      }
    } finally {
      setIsStreaming(false);
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex h-full flex-col">
      {/* Evaluation banner */}
      {evaluation && (
        <div className={`shrink-0 border-b px-6 py-4 ${evaluation.passed ? 'border-emerald-200 bg-emerald-50' : 'border-rose-200 bg-rose-50'}`}>
          <div className="flex items-center gap-3">
            <span className="text-2xl">{evaluation.passed ? '🎉' : '💪'}</span>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <span className={`text-sm font-bold ${evaluation.passed ? 'text-emerald-700' : 'text-rose-700'}`}>
                  {evaluation.passed ? '通关成功！' : '未通过，再试试'}
                </span>
                <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                  evaluation.score >= 80 ? 'bg-emerald-100 text-emerald-700' : evaluation.score >= 60 ? 'bg-amber-100 text-amber-700' : 'bg-rose-100 text-rose-700'
                }`}>
                  {evaluation.score} 分
                </span>
              </div>
              <p className="mt-1 text-xs text-muted-foreground">{evaluation.feedback}</p>
            </div>
          </div>
        </div>
      )}

      {/* Loading history indicator */}
      {isLoadingHistory && (
        <div className="shrink-0 border-b border-border bg-muted/50 px-6 py-2 text-center text-xs text-muted-foreground">
          正在加载历史记录...
        </div>
      )}

      {/* Messages */}
      <div className="flex-1 space-y-4 overflow-y-auto p-4">
        {messages.map((msg) => (
          <div key={msg.id} className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : ''}`}>
            {msg.role === 'assistant' && (
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-teal-100 text-sm">
                {stage.npcAvatar}
              </div>
            )}
            <div className={`max-w-[75%] rounded-2xl px-4 py-3 ${
              msg.role === 'user'
                ? 'bg-indigo-600 text-white'
                : 'border border-border bg-card text-foreground'
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
        {(isStreaming || isSubmitting) && messages.length > 0 && messages[messages.length - 1].role === 'user' && !isStreaming && (
          <div className="flex gap-3">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-teal-100 text-sm">{stage.npcAvatar}</div>
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

      {/* Input */}
      <div className="shrink-0 border-t border-border bg-card p-4">
        <div className="flex gap-2">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={`和 ${stage.npcName} 对话...`}
            rows={2}
            className="flex-1 resize-none rounded-xl border border-border bg-muted px-4 py-2.5 text-sm text-foreground placeholder-muted-foreground focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
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
