'use client';

import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  created_at: string;
}

interface ChatSessionProps {
  sessionId: string;
  initialMessages: Message[];
  isCompressed: boolean;
}

export default function ChatSession({
  sessionId,
  initialMessages,
  isCompressed,
}: ChatSessionProps) {
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [input, setInput] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamingContent, setStreamingContent] = useState('');
  const [wasCompressed, setWasCompressed] = useState(isCompressed);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, streamingContent]);

  const handleSend = async () => {
    const trimmed = input.trim();
    if (!trimmed || isStreaming) return;

    setInput('');
    setIsStreaming(true);
    setStreamingContent('');

    // 乐观添加用户消息
    const tempUserMsg: Message = {
      id: `temp-${Date.now()}`,
      role: 'user',
      content: trimmed,
      created_at: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, tempUserMsg]);

    try {
      const res = await fetch(`/api/interview/sessions/${sessionId}/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: trimmed }),
      });

      if (!res.ok) {
        const data = await res.json();
        setMessages((prev) =>
          prev.map((m) =>
            m.id === tempUserMsg.id ? { ...m, content: `发送失败: ${data.error}` } : m
          )
        );
        return;
      }

      const reader = res.body?.getReader();
      const decoder = new TextDecoder();
      let fullContent = '';
      let messageId = '';

      if (reader) {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const text = decoder.decode(value, { stream: true });
          const lines = text.split('\n');

          for (const line of lines) {
            if (line.startsWith('data: ')) {
              try {
                const data = JSON.parse(line.slice(6));
                if (data.type === 'chunk') {
                  fullContent += data.content;
                  setStreamingContent(fullContent);
                } else if (data.type === 'done') {
                  messageId = data.message_id;
                  if (data.compressed) {
                    setWasCompressed(true);
                  }
                }
              } catch {
                // 忽略解析错误
              }
            }
          }
        }
      }

      // 添加 AI 回复到消息列表
      const assistantMsg: Message = {
        id: messageId || `msg-${Date.now()}`,
        role: 'assistant',
        content: fullContent,
        created_at: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, assistantMsg]);
      setStreamingContent('');
    } catch {
      setMessages((prev) =>
        prev.map((m) => (m.id === tempUserMsg.id ? { ...m, content: '网络错误，请重试' } : m))
      );
    } finally {
      setIsStreaming(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="flex h-full flex-col">
      {/* 消息列表 */}
      <div className="flex-1 overflow-y-auto px-4 py-6">
        <div className="mx-auto max-w-3xl space-y-4">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={cn('flex', msg.role === 'user' ? 'justify-end' : 'justify-start')}
            >
              <div
                className={cn(
                  'max-w-[80%] rounded-lg px-4 py-3',
                  msg.role === 'user'
                    ? 'bg-amber-600/20 text-amber-100'
                    : 'bg-neutral-800 text-neutral-200'
                )}
              >
                <p className="whitespace-pre-wrap text-sm leading-relaxed">{msg.content}</p>
              </div>
            </div>
          ))}

          {/* 流式内容 */}
          {streamingContent && (
            <div className="flex justify-start">
              <div className="max-w-[80%] rounded-lg bg-neutral-800 px-4 py-3 text-neutral-200">
                <p className="whitespace-pre-wrap text-sm leading-relaxed">{streamingContent}</p>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* 输入区域 */}
      <div className="border-t border-neutral-800 bg-neutral-900 px-4 py-3">
        <div className="mx-auto max-w-3xl">
          {wasCompressed && (
            <Badge variant="secondary" className="mb-2 bg-blue-600/20 text-blue-400 text-xs">
              历史对话已压缩
            </Badge>
          )}
          <div className="flex gap-2">
            <Textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="输入你的问题..."
              className="min-h-[44px] max-h-[120px] resize-none border-neutral-700 bg-neutral-800 text-neutral-100 placeholder:text-neutral-500"
              disabled={isStreaming}
              rows={1}
            />
            <Button
              onClick={handleSend}
              disabled={isStreaming || !input.trim()}
              className="shrink-0 bg-amber-600 text-neutral-950 hover:bg-amber-500 disabled:opacity-50"
            >
              {isStreaming ? '...' : '发送'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
