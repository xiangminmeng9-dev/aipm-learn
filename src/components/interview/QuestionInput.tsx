'use client';

import { useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';

interface QuestionInputProps {
  onSubmit: (question: string) => void;
  isLoading: boolean;
  initialValue?: string;
}

export default function QuestionInput({
  onSubmit,
  isLoading,
  initialValue = '',
}: QuestionInputProps) {
  const [value, setValue] = useState(initialValue);
  const [error, setError] = useState('');

  const handleSubmit = useCallback(() => {
    const trimmed = value.trim();
    if (trimmed.length < 5) {
      setError('问题内容至少 5 个字符');
      return;
    }
    if (trimmed.length > 5000) {
      setError('问题内容不能超过 5000 字符');
      return;
    }
    setError('');
    onSubmit(trimmed);
  }, [value, onSubmit]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <div className="space-y-3">
      <Textarea
        value={value}
        onChange={(e) => {
          setValue(e.target.value);
          if (error) setError('');
        }}
        onKeyDown={handleKeyDown}
        placeholder="输入你的面试问题，例如：如何评估一个 AI 功能的效果？"
        className="min-h-[120px] resize-none border-neutral-700 bg-neutral-800 text-neutral-100 placeholder:text-neutral-500 focus-visible:ring-amber-600"
        disabled={isLoading}
      />
      {error && <p className="text-sm text-red-400">{error}</p>}
      <div className="flex items-center justify-between">
        <span className="text-xs text-neutral-500">{value.length}/5000 · Ctrl+Enter 提交</span>
        <Button
          onClick={handleSubmit}
          disabled={isLoading || !value.trim()}
          className="bg-amber-600 text-neutral-950 hover:bg-amber-500 disabled:opacity-50"
        >
          {isLoading ? '分析中...' : '深度分析'}
        </Button>
      </div>
    </div>
  );
}
