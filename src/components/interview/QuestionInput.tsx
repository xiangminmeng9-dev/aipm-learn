'use client';

import { useState, useCallback, useRef } from 'react';

interface QuestionInputProps {
  onSubmit: (question: string) => void;
  isLoading: boolean;
  initialValue?: string;
}

export default function QuestionInput({ onSubmit, isLoading, initialValue = '' }: QuestionInputProps) {
  const [value, setValue] = useState(initialValue);
  const [error, setError] = useState('');
  const [focused, setFocused] = useState(false);
  const taRef = useRef<HTMLTextAreaElement>(null);

  const handleSubmit = useCallback(() => {
    const trimmed = value.trim();
    if (trimmed.length < 5) { setError('问题内容至少 5 个字符'); return; }
    if (trimmed.length > 5000) { setError('问题内容不能超过 5000 字符'); return; }
    setError(''); onSubmit(trimmed);
  }, [value, onSubmit]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) { e.preventDefault(); handleSubmit(); }
  };

  return (
    <div
      onClick={() => taRef.current?.focus()}
      className={`group relative cursor-text overflow-hidden rounded-2xl border-2 bg-card p-5 transition-all duration-200 ${
        focused
          ? 'border-indigo-500 shadow-[0_8px_24px_rgba(79,70,229,0.18)]'
          : error
            ? 'border-rose-300'
            : 'border-border hover:border-indigo-200 hover:shadow-md'
      }`}
    >
      {/* Top accent bar */}
      <div
        className={`absolute inset-x-0 top-0 h-1 transition-opacity ${
          focused ? 'opacity-100' : 'opacity-0'
        }`}
        style={{ background: 'linear-gradient(90deg, #4F46E5, #8B5CF6, #EC4899)' }}
      />

      {/* Header label with icon */}
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-indigo-500 to-purple-500 text-white shadow-sm">
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9.879 7.519c1.171-1.025 3.071-1.025 4.242 0 1.172 1.025 1.172 2.687 0 3.712-.203.179-.43.326-.67.442-.745.361-1.45.999-1.45 1.827v.75M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9 5.25h.008v.008H12v-.008z" />
            </svg>
          </div>
          <div>
            <div className="text-sm font-semibold text-foreground">提出你的面试问题</div>
            <div className="text-xs text-muted-foreground">AI 将基于 PM 方法论给出深度解析</div>
          </div>
        </div>
      </div>

      <textarea
        ref={taRef}
        value={value}
        onChange={(e) => { setValue(e.target.value); if (error) setError(''); }}
        onKeyDown={handleKeyDown}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        placeholder="例如：如何评估一个 AI 功能的效果？"
        className="w-full min-h-[140px] resize-none border-0 bg-transparent text-base text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-0"
        disabled={isLoading}
      />

      {error && (
        <div className="mt-2 flex items-center gap-1.5 rounded-lg bg-rose-50 px-3 py-2">
          <svg className="h-4 w-4 text-rose-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
          </svg>
          <p className="text-sm text-rose-600">{error}</p>
        </div>
      )}

      <div className="mt-3 flex items-center justify-between border-t border-[#F3F4F6] pt-3">
        <div className="flex items-center gap-3 text-xs text-muted-foreground">
          <span className={value.length > 4500 ? 'text-amber-600 font-medium' : ''}>{value.length} / 5000</span>
          <span className="hidden sm:inline-flex items-center gap-1">
            <kbd className="rounded border border-border bg-muted px-1.5 py-0.5 text-[10px] font-mono">Ctrl</kbd>
            +
            <kbd className="rounded border border-border bg-muted px-1.5 py-0.5 text-[10px] font-mono">Enter</kbd>
            提交
          </span>
        </div>
        <button
          onClick={(e) => { e.stopPropagation(); handleSubmit(); }}
          disabled={isLoading || !value.trim()}
          className="app-btn-primary rounded-xl px-6 py-2.5 text-sm font-semibold disabled:opacity-50"
        >
          {isLoading ? '分析中...' : '✨ 深度分析'}
        </button>
      </div>
    </div>
  );
}
