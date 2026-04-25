'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import ResumeUploader from '@/components/resume/ResumeUploader';
import JdInput from '@/components/resume/JdInput';
import VersionSelector from '@/components/resume/VersionSelector';
import ResumeResult from '@/components/resume/ResumeResult';

interface AnalysisData {
  match_score: number;
  gaps: string[];
  strengths: string[];
  suggestions: string[];
}

export default function ResumePage() {
  const [resumeText, setResumeText] = useState('');
  const [jdText, setJdText] = useState('');
  const [style, setStyle] = useState('standard');

  // Pick up JD text from jobs page via sessionStorage
  useEffect(() => {
    try {
      const stored = sessionStorage.getItem('resume-jd-text');
      if (stored) {
        setJdText(stored);
        sessionStorage.removeItem('resume-jd-text');
      }
    } catch {}
  }, []);

  // Analysis state
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysis, setAnalysis] = useState<AnalysisData | null>(null);
  const [analysisError, setAnalysisError] = useState('');

  // Generation state
  const [isGenerating, setIsGenerating] = useState(false);
  const [modifiedResume, setModifiedResume] = useState('');
  const [changesSummary, setChangesSummary] = useState('');
  const [generateError, setGenerateError] = useState('');

  const canAnalyze = resumeText.trim().length > 0 && jdText.trim().length > 0;
  const canGenerate = analysis !== null && !isGenerating;

  const handleAnalyze = useCallback(async () => {
    if (!canAnalyze) return;
    setIsAnalyzing(true);
    setAnalysisError('');
    setAnalysis(null);
    setModifiedResume('');
    setChangesSummary('');

    try {
      const res = await fetch('/api/resume/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ resume_text: resumeText, jd_text: jdText }),
      });
      const data = await res.json();
      if (!res.ok) {
        setAnalysisError(data.error || '分析失败');
        return;
      }
      setAnalysis(data);
    } catch {
      setAnalysisError('网络错误，请重试');
    } finally {
      setIsAnalyzing(false);
    }
  }, [resumeText, jdText, canAnalyze]);

  const handleGenerate = useCallback(async () => {
    if (!canGenerate) return;
    setIsGenerating(true);
    setGenerateError('');

    try {
      const res = await fetch('/api/resume/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          resume_text: resumeText,
          jd_text: jdText,
          style_type: style,
          analysis,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setGenerateError(data.error || '生成失败');
        return;
      }
      setModifiedResume(data.modified_resume || '');
      setChangesSummary(data.changes_summary || '');
    } catch {
      setGenerateError('网络错误，请重试');
    } finally {
      setIsGenerating(false);
    }
  }, [resumeText, jdText, style, analysis, canGenerate]);

  return (
    <div className="min-h-full p-6 md:p-8">
      {/* Header banner */}
      <div
        className="relative mb-8 overflow-hidden rounded-2xl"
        style={{
          backgroundImage: `url('https://images.unsplash.com/photo-1586281380349-632531db7ed4?w=1600&q=80&auto=format')`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      >
        <div className="absolute inset-0 bg-gradient-to-r from-amber-900/75 via-orange-800/55 to-rose-900/70" />
        <div className="absolute inset-0 bg-white/5" />
        <div className="relative z-10 px-8 py-8">
          <h1 className="mb-1 text-2xl font-bold text-white drop-shadow-sm">AI 简历修改助手</h1>
          <p className="text-sm text-white/80">上传简历 + 粘贴 JD，AI 帮你量身优化简历</p>
        </div>
      </div>

      {/* Two-column layout */}
      <div className="grid gap-8 lg:grid-cols-2">
        {/* Left column: Inputs */}
        <div className="space-y-6">
          {/* Resume upload */}
          <div className="rounded-xl border border-[#E5E7EB] bg-white p-5">
            <h2 className="mb-3 flex items-center gap-2 text-base font-semibold text-[#1F2937]">
              <span className="flex h-6 w-6 items-center justify-center rounded-md bg-indigo-50 text-xs text-indigo-600">1</span>
              上传简历
            </h2>
            <ResumeUploader onTextExtracted={setResumeText} />
            {resumeText && (
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="mt-2 text-xs text-emerald-600"
              >
                已提取 {resumeText.length} 字符
              </motion.p>
            )}
          </div>

          {/* JD input */}
          <div className="rounded-xl border border-[#E5E7EB] bg-white p-5">
            <h2 className="mb-3 flex items-center gap-2 text-base font-semibold text-[#1F2937]">
              <span className="flex h-6 w-6 items-center justify-center rounded-md bg-indigo-50 text-xs text-indigo-600">2</span>
              职位描述
            </h2>
            <JdInput value={jdText} onChange={setJdText} />
          </div>

          {/* Analyze button */}
          <button
            onClick={handleAnalyze}
            disabled={!canAnalyze || isAnalyzing}
            className="app-btn-primary w-full rounded-xl px-6 py-3 text-base font-medium disabled:opacity-50"
          >
            {isAnalyzing ? (
              <span className="flex items-center justify-center gap-2">
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                分析中...
              </span>
            ) : (
              '分析匹配度'
            )}
          </button>

          {/* Analysis error */}
          <AnimatePresence>
            {analysisError && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="rounded-xl border border-rose-200 bg-rose-50/30 p-4 text-sm text-rose-600"
              >
                {analysisError}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Analysis loading */}
          <AnimatePresence>
            {isAnalyzing && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex items-center justify-center rounded-xl border border-[#E5E7EB] bg-white py-10"
              >
                <div className="h-8 w-8 animate-spin rounded-full border-2 border-indigo-500 border-t-transparent" />
                <span className="ml-3 text-sm text-[#6B7280]">AI 正在分析匹配度...</span>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Analysis results */}
          <AnimatePresence>
            {analysis && !isAnalyzing && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="space-y-4"
              >
                {/* Match score */}
                <div className="rounded-xl border border-[#E5E7EB] bg-white p-5">
                  <div className="mb-4 flex items-center justify-between">
                    <h3 className="text-base font-semibold text-[#1F2937]">匹配度分析</h3>
                    <span className={`rounded-full px-3 py-1 text-sm font-bold ${
                      analysis.match_score >= 70
                        ? 'bg-emerald-50 text-emerald-600'
                        : analysis.match_score >= 40
                        ? 'bg-amber-50 text-amber-600'
                        : 'bg-rose-50 text-rose-600'
                    }`}>
                      {analysis.match_score}%
                    </span>
                  </div>

                  {/* Score bar */}
                  <div className="h-2.5 overflow-hidden rounded-full bg-gray-100">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${analysis.match_score}%` }}
                      transition={{ duration: 0.8, ease: 'easeOut' }}
                      className={`h-full rounded-full ${
                        analysis.match_score >= 70
                          ? 'bg-gradient-to-r from-emerald-400 to-emerald-500'
                          : analysis.match_score >= 40
                          ? 'bg-gradient-to-r from-amber-400 to-amber-500'
                          : 'bg-gradient-to-r from-rose-400 to-rose-500'
                      }`}
                    />
                  </div>
                </div>

                {/* Strengths */}
                {analysis.strengths?.length > 0 && (
                  <div className="rounded-xl border border-emerald-200 bg-emerald-50/30 p-5">
                    <h4 className="mb-2 flex items-center gap-1.5 text-sm font-semibold text-emerald-700">
                      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      匹配优势
                    </h4>
                    <ul className="space-y-1">
                      {analysis.strengths.map((s, i) => (
                        <li key={i} className="text-sm text-emerald-600">{s}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Gaps */}
                {analysis.gaps?.length > 0 && (
                  <div className="rounded-xl border border-amber-200 bg-amber-50/30 p-5">
                    <h4 className="mb-2 flex items-center gap-1.5 text-sm font-semibold text-amber-700">
                      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
                      </svg>
                      差距分析
                    </h4>
                    <ul className="space-y-1">
                      {analysis.gaps.map((g, i) => (
                        <li key={i} className="text-sm text-amber-600">{g}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Suggestions */}
                {analysis.suggestions?.length > 0 && (
                  <div className="rounded-xl border border-indigo-200 bg-indigo-50/30 p-5">
                    <h4 className="mb-2 flex items-center gap-1.5 text-sm font-semibold text-indigo-700">
                      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 18v-5.25m0 0a6.01 6.01 0 001.5-.189m-1.5.189a6.01 6.01 0 01-1.5-.189m3.75 7.478a12.06 12.06 0 01-4.5 0m3.75 2.383a14.406 14.406 0 01-3 0M14.25 18v-.192c0-.983.658-1.823 1.508-2.316a7.5 7.5 0 10-7.517 0c.85.493 1.509 1.333 1.509 2.316V18" />
                      </svg>
                      修改建议
                    </h4>
                    <ul className="space-y-1">
                      {analysis.suggestions.map((s, i) => (
                        <li key={i} className="text-sm text-indigo-600">{s}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Style selector + Generate button */}
                <div className="rounded-xl border border-[#E5E7EB] bg-white p-5 space-y-4">
                  <h3 className="flex items-center gap-2 text-base font-semibold text-[#1F2937]">
                    <span className="flex h-6 w-6 items-center justify-center rounded-md bg-indigo-50 text-xs text-indigo-600">3</span>
                    选择风格
                  </h3>
                  <VersionSelector value={style} onChange={setStyle} />

                  <button
                    onClick={handleGenerate}
                    disabled={!canGenerate || isGenerating}
                    className="app-btn-primary w-full rounded-xl px-6 py-3 text-base font-medium disabled:opacity-50"
                  >
                    {isGenerating ? (
                      <span className="flex items-center justify-center gap-2">
                        <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                        生成中...
                      </span>
                    ) : (
                      '生成修改版'
                    )}
                  </button>
                </div>

                {/* Generate error */}
                <AnimatePresence>
                  {generateError && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="rounded-xl border border-rose-200 bg-rose-50/30 p-4 text-sm text-rose-600"
                    >
                      {generateError}
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Right column: Result */}
        <div className="space-y-6">
          {/* Generate loading */}
          <AnimatePresence>
            {isGenerating && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex items-center justify-center rounded-xl border border-[#E5E7EB] bg-white py-16"
              >
                <div className="h-8 w-8 animate-spin rounded-full border-2 border-indigo-500 border-t-transparent" />
                <span className="ml-3 text-sm text-[#6B7280]">AI 正在生成修改版简历...</span>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Result display */}
          <AnimatePresence>
            {modifiedResume && !isGenerating && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
              >
                <ResumeResult
                  modifiedResume={modifiedResume}
                  changesSummary={changesSummary}
                />
              </motion.div>
            )}
          </AnimatePresence>

          {/* Empty state */}
          {!modifiedResume && !isGenerating && (
            <div className="rounded-xl border border-[#E5E7EB] bg-white p-12 text-center">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-indigo-50">
                <svg className="h-8 w-8 text-indigo-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
                </svg>
              </div>
              <h3 className="text-sm font-medium text-[#6B7280]">修改后的简历将显示在这里</h3>
              <p className="mt-1 text-xs text-[#9CA3AF]">上传简历并分析匹配度后，选择风格生成修改版</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
