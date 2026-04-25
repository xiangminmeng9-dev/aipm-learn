'use client';

import { useState, useEffect, useCallback } from 'react';
import ModeSelector from '@/components/coding/ModeSelector';
import CodingQuestionInput from '@/components/coding/CodingQuestionInput';
import DevFlowResult from '@/components/coding/DevFlowResult';
import type { DevMode } from '@/types';

export default function CodingPracticePage() {
  const [modes, setModes] = useState<DevMode[]>([]);
  const [selectedMode, setSelectedMode] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<Record<string, unknown> | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    fetch('/api/coding/dev-modes')
      .then((r) => r.json())
      .then((data) => setModes(data.modes ?? []))
      .catch(() => {});

    // 恢复最近一次开发流程
    fetch('/api/coding/generate')
      .then((r) => r.json())
      .then((data) => {
        if (data.result) {
          setResult(data.result);
          setSelectedMode(data.result.mode?.id ?? null);
        }
      })
      .catch(() => {});
  }, []);

  const handleGenerate = useCallback(async (question: string) => {
    if (!selectedMode) return;
    setIsLoading(true); setError(''); setResult(null);
    try {
      const res = await fetch('/api/coding/generate', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ question, mode_id: selectedMode }) });
      const data = await res.json();
      if (!res.ok) { setError(data.error ?? '生成失败'); return; }
      setResult(data);
    } catch { setError('网络错误，请重试'); } finally { setIsLoading(false); }
  }, [selectedMode]);

  const handleReset = useCallback(() => { setResult(null); setError(''); setSelectedMode(null); }, []);

  return (
    <div className="p-8 space-y-8">
      <div>
        <h1 className="text-3xl font-semibold text-[#1F2937]">AI Coding 练习</h1>
        <p className="mt-2 text-[#6B7280]">输入面试题目，选择开发模式，获取思考链开发流程</p>
      </div>

      {!result && (
        <>
          <ModeSelector modes={modes} selected={selectedMode} onSelect={setSelectedMode} />
          <CodingQuestionInput onSubmit={handleGenerate} isLoading={isLoading} hasMode={!!selectedMode} />
        </>
      )}

      {error && (
        <div className="rounded-2xl border border-[#ff3b30]/20 bg-[#ff3b30]/5 p-4 text-sm text-[#ff3b30]">{error}</div>
      )}

      {isLoading && (
        <div className="flex items-center justify-center rounded-2xl bg-white border border-[#E5E7EB] py-12">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-indigo-500 border-t-transparent" />
          <span className="ml-3 text-[#6B7280]">AI 正在生成开发流程...</span>
        </div>
      )}

      {result && !isLoading && (
        <>
          <DevFlowResult result={result as Parameters<typeof DevFlowResult>[0]['result']} />
          <div className="flex justify-center">
            <button onClick={handleReset} className="app-btn-outline rounded-xl px-6 py-2.5 text-sm">再来一题</button>
          </div>
        </>
      )}
    </div>
  );
}
