'use client';

import { useState, useCallback, useRef } from 'react';

interface CodingQuestionInputProps {
  onSubmit: (question: string) => void;
  isLoading: boolean;
  hasMode: boolean;
}

export default function CodingQuestionInput({ onSubmit, isLoading, hasMode }: CodingQuestionInputProps) {
  const [value, setValue] = useState('');
  const [error, setError] = useState('');
  const [focused, setFocused] = useState(false);
  const taRef = useRef<HTMLTextAreaElement>(null);

  const handleSubmit = useCallback(() => {
    const trimmed = value.trim();
    if (trimmed.length < 5) { setError('题目内容至少 5 个字符'); return; }
    if (trimmed.length > 5000) { setError('题目内容不能超过 5000 字符'); return; }
    if (!hasMode) { setError('请先选择开发模式'); return; }
    setError(''); onSubmit(trimmed);
  }, [value, hasMode, onSubmit]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) { e.preventDefault(); handleSubmit(); }
  };

  return (
    <div
      onClick={() => taRef.current?.focus()}
      className={`group relative cursor-text overflow-hidden rounded-2xl border-2 bg-card p-5 transition-all duration-200 ${
        focused
          ? 'border-emerald-500 shadow-[0_8px_24px_rgba(16,185,129,0.18)]'
          : error
            ? 'border-rose-300'
            : 'border-border hover:border-emerald-200 hover:shadow-md'
      }`}
    >
      <div
        className={`absolute inset-x-0 top-0 h-1 transition-opacity ${focused ? 'opacity-100' : 'opacity-0'}`}
        style={{ background: 'linear-gradient(90deg, #10B981, #06B6D4, #4F46E5)' }}
      />

      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-emerald-500 to-cyan-500 text-white shadow-sm">
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M17.25 6.75L22.5 12l-5.25 5.25m-10.5 0L1.5 12l5.25-5.25m7.5-3l-4.5 16.5" />
            </svg>
          </div>
          <div>
            <div className="text-sm font-semibold text-foreground">输入 AI Coding 面试题目</div>
            <div className="text-xs text-muted-foreground">AI 将生成完整开发流程与技术方案</div>
          </div>
        </div>
        {!hasMode && (
          <span className="rounded-full bg-amber-50 px-2.5 py-0.5 text-xs font-medium text-amber-700 border border-amber-200">
            请先选择开发模式
          </span>
        )}
      </div>

      <textarea
        ref={taRef}
        value={value}
        onChange={(e) => { setValue(e.target.value); if (error) setError(''); }}
        onKeyDown={handleKeyDown}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        placeholder="例如：用 Claude Code 开发一个实时协作白板应用"
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
          disabled={isLoading || !value.trim() || !hasMode}
          className="rounded-xl bg-gradient-to-r from-emerald-500 to-cyan-500 px-6 py-2.5 text-sm font-semibold text-white shadow-sm transition-all hover:shadow-[0_4px_16px_rgba(16,185,129,0.3)] hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-50 disabled:hover:translate-y-0 disabled:hover:shadow-sm"
        >
          {isLoading ? '生成中...' : '⚡ 生成流程'}
        </button>
      </div>
    </div>
  );
}
