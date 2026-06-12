'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { MotionDiv, MotionP, AnimatePresence } from '@/components/ui/lazy-motion';
import ResumeUploader from '@/components/resume/ResumeUploader';
import JdInput from '@/components/resume/JdInput';
import VersionSelector from '@/components/resume/VersionSelector';
import ResumeResult from '@/components/resume/ResumeResult';
import CompanyProfileCard from '@/components/resume/CompanyProfileCard';
import { useCompanyProfile } from '@/lib/hooks/useCompanyProfile';
import type { CompanyPreference } from '@/components/resume/CompanyProfileCard';
import dynamic from 'next/dynamic';
import { apiFetch } from '@/lib/api/fetch';

const ResumePDFExportButton = dynamic(() => import('@/components/resume/ResumePDFExportButton'), { ssr: false });

interface AtsDimension {
  name: string;
  score: number;
  comment: string;
}

interface AtsAnalysis {
  overall_score: number;
  dimensions: AtsDimension[];
  improvement: string;
}

interface AnalysisData {
  match_score: number;
  gaps: string[];
  strengths: string[];
  suggestions: string[];
  ats_analysis: AtsAnalysis;
}

interface PersistedState {
  resumeText: string;
  jdText: string;
  style: string;
  analysis: AnalysisData | null;
  modifiedResume: string;
  changesSummary: string;
  companyName: string;
  positionName: string;
  companyType: string | null;
  companyPreferenceData: string | null; // JSON-serialized
  savedAt: number;
}

const STORAGE_KEY = 'resume-editor-state';

function loadState(): Partial<PersistedState> | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const state = JSON.parse(raw) as PersistedState;
    // Expire after 24h
    if (Date.now() - state.savedAt > 24 * 60 * 60 * 1000) {
      localStorage.removeItem(STORAGE_KEY);
      return null;
    }
    return state;
  } catch {
    return null;
  }
}

function saveState(state: Partial<PersistedState>) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...state, savedAt: Date.now() }));
  } catch { /* quota exceeded */ }
}

function clearState() {
  try { localStorage.removeItem(STORAGE_KEY); } catch {}
}

function ScoreBadge({ score, label }: { score: number; label?: string }) {
  const color = score >= 70 ? 'text-emerald-600' : score >= 40 ? 'text-amber-600' : 'text-rose-600';
  const bg = score >= 70 ? 'bg-emerald-50' : score >= 40 ? 'bg-amber-50' : 'bg-rose-50';
  return (
    <span className={`rounded-full px-3 py-1 text-sm font-bold ${bg} ${color}`}>
      {label}{score}%
    </span>
  );
}

function ScoreBar({ score, className = '' }: { score: number; className?: string }) {
  const gradient = score >= 70
    ? 'bg-gradient-to-r from-emerald-400 to-emerald-500'
    : score >= 40
    ? 'bg-gradient-to-r from-amber-400 to-amber-500'
    : 'bg-gradient-to-r from-rose-400 to-rose-500';
  return (
    <div className={`h-2.5 overflow-hidden rounded-full bg-secondary ${className}`}>
      <MotionDiv
        initial={{ width: 0 }}
        animate={{ width: `${score}%` }}
        transition={{ duration: 0.8, ease: 'easeOut' }}
        className={`h-full rounded-full ${gradient}`}
      />
    </div>
  );
}

export default function ResumePage() {
  const [initialized, setInitialized] = useState(false);
  const [resumeText, setResumeText] = useState('');
  const [jdText, setJdText] = useState('');
  const [style, setStyle] = useState('standard');
  const [companyName, setCompanyName] = useState('');
  const [positionName, setPositionName] = useState('');
  const [companyType, setCompanyType] = useState<string | null>(null);
  const [companyPreference, setCompanyPreference] = useState<CompanyPreference | null>(null);

  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysis, setAnalysis] = useState<AnalysisData | null>(null);
  const [analysisError, setAnalysisError] = useState('');

  const [isGenerating, setIsGenerating] = useState(false);
  const [modifiedResume, setModifiedResume] = useState('');
  const [changesSummary, setChangesSummary] = useState('');
  const [generateError, setGenerateError] = useState('');
  const [profileWeight, setProfileWeight] = useState<'strong' | 'moderate' | 'light'>('strong');

  const persistRef = useRef(false);

  // Company profile hook
  const { profile: companyProfile, isLoading: profileLoading, error: profileError } = useCompanyProfile(companyName);

  // Sync profile data to local state
  useEffect(() => {
    if (companyProfile) {
      setCompanyType(companyProfile.companyType);
      setCompanyPreference(companyProfile.preference);
    } else if (!companyName || companyName.trim().length < 2) {
      setCompanyType(null);
      setCompanyPreference(null);
    }
  }, [companyProfile, companyName]);

  // Restore from localStorage on mount
  useEffect(() => {
    const saved = loadState();
    if (saved) {
      if (saved.resumeText) setResumeText(saved.resumeText);
      if (saved.jdText) setJdText(saved.jdText);
      if (saved.style) setStyle(saved.style);
      if (saved.analysis) setAnalysis(saved.analysis);
      if (saved.modifiedResume) setModifiedResume(saved.modifiedResume);
      if (saved.changesSummary) setChangesSummary(saved.changesSummary);
      if (saved.companyName) setCompanyName(saved.companyName);
      if (saved.positionName) setPositionName(saved.positionName);
      if (saved.companyType) setCompanyType(saved.companyType);
      if (saved.companyPreferenceData) {
        try {
          setCompanyPreference(JSON.parse(saved.companyPreferenceData));
        } catch {}
      }
    }
    // Also check sessionStorage for JD passed from other pages
    try {
      const stored = sessionStorage.getItem('resume-jd-text');
      if (stored) {
        setJdText(stored);
        sessionStorage.removeItem('resume-jd-text');
      }
    } catch {}
    setInitialized(true);
  }, []);

  // Persist to localStorage on changes (debounced)
  useEffect(() => {
    if (!initialized) return;
    persistRef.current = true;
    const timer = setTimeout(() => {
      saveState({
        resumeText, jdText, style, analysis, modifiedResume, changesSummary,
        companyName, positionName,
        companyType,
        companyPreferenceData: companyPreference ? JSON.stringify(companyPreference) : null,
      });
    }, 500);
    return () => clearTimeout(timer);
  }, [resumeText, jdText, style, analysis, modifiedResume, changesSummary, companyName, positionName, companyType, companyPreference, initialized]);

  const hasJd = jdText.trim().length >= 20;
  const hasCompany = companyName.trim().length >= 2;
  const canAnalyze = resumeText.trim().length > 0 && (hasJd || hasCompany);
  const canGenerate = analysis !== null && !isGenerating;

  const handleAnalyze = useCallback(async () => {
    if (!canAnalyze) return;
    setIsAnalyzing(true);
    setAnalysisError('');
    setAnalysis(null);
    setModifiedResume('');
    setChangesSummary('');

    try {
      const res = await apiFetch('/api/resume/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          resume_text: resumeText,
          jd_text: jdText || '',
          company_name: companyName,
          company_type: companyType,
          company_preference: companyPreference ? JSON.stringify(companyPreference) : '',
        }),
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
  }, [resumeText, jdText, companyName, companyType, companyPreference, canAnalyze]);

  const handleGenerate = useCallback(async () => {
    if (!canGenerate) return;
    setIsGenerating(true);
    setGenerateError('');

    try {
      const res = await apiFetch('/api/resume/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          resume_text: resumeText,
          jd_text: jdText || '',
          style_type: style,
          company_name: companyName,
          position_name: positionName,
          company_type: companyType || undefined,
          company_preference: companyPreference ? JSON.stringify(companyPreference) : undefined,
          profile_weight: profileWeight,
          analysis_gaps: analysis?.gaps || [],
          analysis_strengths: analysis?.strengths || [],
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
  }, [resumeText, jdText, style, analysis, companyName, positionName, companyType, companyPreference, canGenerate]);

  const handleRestoreVersion = useCallback(async (versionId: string) => {
    try {
      const res = await apiFetch(`/api/resume/versions?id=${versionId}`);
      if (!res.ok) return;
      const data = await res.json();
      const v = data.version;
      if (!v) return;
      if (v.original_resume_text) setResumeText(v.original_resume_text);
      if (v.jd_text) setJdText(v.jd_text);
      if (v.style_type) setStyle(v.style_type);
      if (v.modified_resume) setModifiedResume(v.modified_resume);
      if (v.changes_summary) setChangesSummary(v.changes_summary);
      if (v.company_name) setCompanyName(v.company_name);
      if (v.position_name) setPositionName(v.position_name);
      setAnalysis(null);
    } catch { /* ignore */ }
  }, []);

  const handleClear = useCallback(() => {
    setResumeText('');
    setJdText('');
    setStyle('standard');
    setCompanyName('');
    setPositionName('');
    setCompanyType(null);
    setCompanyPreference(null);
    setAnalysis(null);
    setAnalysisError('');
    setModifiedResume('');
    setChangesSummary('');
    setGenerateError('');
    clearState();
  }, []);

  const ats = analysis?.ats_analysis;

  // Determine analyze button label
  const analyzeButtonLabel = !hasJd && hasCompany
    ? '基于公司画像分析'
    : '分析匹配度';

  if (!initialized) {
    return (
      <div className="flex min-h-full items-center justify-center p-8">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-indigo-500 border-t-transparent" />
      </div>
    );
  }

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
        <div className="relative z-10 flex items-center justify-between px-8 py-8">
          <div>
            <h1 className="mb-1 text-2xl font-bold text-white drop-shadow-sm">AI 简历修改助手</h1>
            <p className="text-sm text-white/80">上传简历 + 输入公司名或粘贴 JD，AI 帮你量身优化简历 + 大厂 ATS 评分</p>
          </div>
          {(resumeText || jdText || analysis) && (
            <button
              onClick={handleClear}
              className="rounded-lg border border-white/30 px-3 py-1.5 text-xs text-white/80 transition-colors hover:bg-white/10"
            >
              清空重置
            </button>
          )}
        </div>
      </div>

      {/* Two-column layout */}
      <div className="grid gap-8 lg:grid-cols-2">
        {/* Left column: Inputs */}
        <div className="space-y-6">
          {/* Resume upload */}
          <div className="rounded-xl border border-border bg-card p-5">
            <h2 className="mb-3 flex items-center gap-2 text-base font-semibold text-foreground">
              <span className="flex h-6 w-6 items-center justify-center rounded-md bg-indigo-50 text-xs text-indigo-600">1</span>
              上传简历
            </h2>
            <ResumeUploader onTextExtracted={setResumeText} />
            {resumeText && (
              <MotionP initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mt-2 text-xs text-emerald-600">
                已提取 {resumeText.length} 字符
              </MotionP>
            )}
          </div>

          {/* Company & Position */}
          <div className="rounded-xl border border-border bg-card p-5">
            <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold text-foreground">
              <span className="flex h-6 w-6 items-center justify-center rounded-md bg-indigo-50 text-xs text-indigo-600">2</span>
              目标公司
            </h2>
            <div className="grid grid-cols-2 gap-3">
              <input
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                placeholder="公司名（如字节跳动）"
                className="rounded-lg border border-border bg-card px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
              <input
                value={positionName}
                onChange={(e) => setPositionName(e.target.value)}
                placeholder="岗位名（如产品经理）"
                className="rounded-lg border border-border bg-card px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
            </div>
            <p className="mt-1.5 text-xs text-muted-foreground">输入公司名即可自动匹配公司画像，无需JD也可优化简历</p>

            {/* Company Profile Card */}
            <div className="mt-3">
              <CompanyProfileCard
                companyName={companyName}
                companyType={companyType}
                companyPreference={companyPreference}
                isLoading={profileLoading}
                error={profileError}
                fixedPersona={companyProfile?.fixedPersona}
                preferenceSource={companyProfile?.preferenceSource}
              />
            </div>
          </div>

          {/* JD input */}
          <div className="rounded-xl border border-border bg-card p-5">
            <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold text-foreground">
              <span className="flex h-5 w-5 items-center justify-center rounded-md bg-muted text-xs text-muted-foreground">选填</span>
              职位描述（JD）
            </h2>
            <JdInput value={jdText} onChange={setJdText} />
            <p className="mt-1.5 text-xs text-muted-foreground">
              {hasJd ? '✓ 已输入JD，将结合JD和公司画像优化' : '不填则仅基于公司画像优化简历'}
            </p>
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
              analyzeButtonLabel
            )}
          </button>

          {/* Analysis error */}
          <AnimatePresence>
            {analysisError && (
              <MotionDiv
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="rounded-xl border border-rose-200 bg-rose-50/30 p-4 text-sm text-rose-600"
              >
                {analysisError}
              </MotionDiv>
            )}
          </AnimatePresence>

          {/* Analysis loading */}
          <AnimatePresence>
            {isAnalyzing && (
              <MotionDiv
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex items-center justify-center rounded-xl border border-border bg-card py-10"
              >
                <div className="h-8 w-8 animate-spin rounded-full border-2 border-indigo-500 border-t-transparent" />
                <span className="ml-3 text-sm text-muted-foreground">
                  {hasJd ? 'AI 正在分析匹配度 + ATS 评分...' : 'AI 正在基于公司画像分析 + ATS 评分...'}
                </span>
              </MotionDiv>
            )}
          </AnimatePresence>

          {/* Analysis results */}
          <AnimatePresence>
            {analysis && !isAnalyzing && (
              <MotionDiv
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="space-y-4"
              >
                {/* Match score */}
                <div className="rounded-xl border border-border bg-card p-5">
                  <div className="mb-4 flex items-center justify-between">
                    <h3 className="text-base font-semibold text-foreground">
                      {hasJd ? '匹配度分析' : '公司画像匹配分析'}
                    </h3>
                    <ScoreBadge score={analysis.match_score} />
                  </div>
                  <ScoreBar score={analysis.match_score} />
                </div>

                {/* ATS Score */}
                {ats && ats.overall_score > 0 && (
                  <div className="rounded-xl border border-border bg-card p-5">
                    <div className="mb-4 flex items-center justify-between">
                      <h3 className="flex items-center gap-2 text-base font-semibold text-foreground">
                        <svg className="h-5 w-5 text-indigo-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.955 11.955 0 0112 2.944c-2.5 0-4.865 1.1-6.5 2.964m6.5-2.964a11.955 11.955 0 006.5 2.964m-3 7.036A11.955 11.955 0 0012 21.056c2.5 0-4.865-1.1-6.5-2.964m6.5 2.964a11.955 11.955 0 01-6.5-2.964" />
                        </svg>
                        大厂 ATS 评分
                      </h3>
                      <ScoreBadge score={ats.overall_score} />
                    </div>
                    <ScoreBar score={ats.overall_score} />

                    {ats.dimensions && ats.dimensions.length > 0 && (
                      <div className="mt-5 space-y-3">
                        {ats.dimensions.map((d, i) => (
                          <div key={i}>
                            <div className="mb-1 flex items-center justify-between">
                              <span className="text-xs font-medium text-foreground">{d.name}</span>
                              <span className={`text-xs font-bold ${
                                d.score >= 70 ? 'text-emerald-600' : d.score >= 40 ? 'text-amber-600' : 'text-rose-600'
                              }`}>{d.score}</span>
                            </div>
                            <div className="h-1.5 overflow-hidden rounded-full bg-secondary">
                              <MotionDiv
                                initial={{ width: 0 }}
                                animate={{ width: `${d.score}%` }}
                                transition={{ duration: 0.6, ease: 'easeOut', delay: i * 0.1 }}
                                className={`h-full rounded-full ${
                                  d.score >= 70 ? 'bg-emerald-500' : d.score >= 40 ? 'bg-amber-500' : 'bg-rose-500'
                                }`}
                              />
                            </div>
                            <p className="mt-0.5 text-xs text-muted-foreground">{d.comment}</p>
                          </div>
                        ))}
                      </div>
                    )}

                    {ats.improvement && (
                      <div className="mt-4 rounded-lg bg-muted p-3 text-xs text-muted-foreground">
                        <span className="font-medium text-foreground">改进建议：</span>{ats.improvement}
                      </div>
                    )}
                  </div>
                )}

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
                <div className="rounded-xl border border-border bg-card p-5 space-y-4">
                  <h3 className="flex items-center gap-2 text-base font-semibold text-foreground">
                    <span className="flex h-6 w-6 items-center justify-center rounded-md bg-indigo-50 text-xs text-indigo-600">3</span>
                    选择风格
                  </h3>
                  <VersionSelector value={style} onChange={setStyle} />

                  {/* Profile weight selector — only show when company profile exists */}
                  {companyPreference && (
                    <div className="space-y-2">
                      <label className="text-xs font-medium text-muted-foreground">画像融入强度</label>
                      <div className="flex gap-2">
                        {([
                          { value: 'strong' as const, label: '强融入', desc: '画像为核心驱动，强制融入每个技能' },
                          { value: 'moderate' as const, label: '适中', desc: '画像作为重要参考，适度融入' },
                          { value: 'light' as const, label: '轻度', desc: '画像作为辅助参考，少量融入' },
                        ]).map(opt => (
                          <button
                            key={opt.value}
                            onClick={() => setProfileWeight(opt.value)}
                            title={opt.desc}
                            className={`flex-1 rounded-lg border px-3 py-2 text-xs font-medium transition-colors ${
                              profileWeight === opt.value
                                ? 'border-indigo-400 bg-indigo-50 text-indigo-700 dark:border-indigo-600 dark:bg-indigo-950/40 dark:text-indigo-300'
                                : 'border-border bg-card text-muted-foreground hover:border-indigo-200 hover:text-foreground dark:hover:border-indigo-800'
                            }`}
                          >
                            {opt.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

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
                      hasJd ? '生成修改版' : '基于公司画像生成修改版'
                    )}
                  </button>
                </div>

                {/* Generate error */}
                <AnimatePresence>
                  {generateError && (
                    <MotionDiv
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="rounded-xl border border-rose-200 bg-rose-50/30 p-4 text-sm text-rose-600"
                    >
                      {generateError}
                    </MotionDiv>
                  )}
                </AnimatePresence>
              </MotionDiv>
            )}
          </AnimatePresence>
        </div>

        {/* Right column: Result */}
        <div className="space-y-6">
          {/* Generate loading */}
          <AnimatePresence>
            {isGenerating && (
              <MotionDiv
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex items-center justify-center rounded-xl border border-border bg-card py-16"
              >
                <div className="h-8 w-8 animate-spin rounded-full border-2 border-indigo-500 border-t-transparent" />
                <span className="ml-3 text-sm text-muted-foreground">AI 正在生成修改版简历...</span>
              </MotionDiv>
            )}
          </AnimatePresence>

          {/* Result display */}
          <AnimatePresence>
            {modifiedResume && !isGenerating && (
              <MotionDiv
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
              >
                <ResumePDFExportButton
                  modifiedResume={modifiedResume}
                  analysis={analysis}
                  changesSummary={changesSummary}
                  companyName={companyName}
                  positionName={positionName}
                  resumeData={null}
                />
                <ResumeResult modifiedResume={modifiedResume} changesSummary={changesSummary} />
                {/* Debug button: show raw markdown in an alert-style modal */}
                <button
                  onClick={() => {
                    const el = document.createElement('textarea');
                    el.value = modifiedResume;
                    el.style.cssText = 'position:fixed;top:0;left:0;width:100vw;height:100vh;z-index:99999;font-size:12px;padding:16px;border:none;background:#1e1e1e;color:#d4d4d4;font-family:monospace;resize:none';
                    document.body.appendChild(el);
                    el.select();
                    el.addEventListener('keydown', (e) => { if (e.key === 'Escape') document.body.removeChild(el); });
                    const hint = document.createElement('div');
                    hint.style.cssText = 'position:fixed;top:8px;right:16px;z-index:100000;background:#6366F1;color:white;padding:8px 16px;border-radius:8px;font-size:14px;font-family:sans-serif;cursor:pointer';
                    hint.textContent = '按 ESC 关闭 | 点击复制';
                    hint.onclick = () => { el.select(); document.execCommand('copy'); hint.textContent = '已复制！'; setTimeout(() => document.body.removeChild(el), 1000); };
                    document.body.appendChild(hint);
                  }}
                  className="mt-3 w-full rounded-lg border-2 border-dashed border-indigo-300 bg-indigo-50 px-4 py-2 text-sm font-medium text-indigo-700 hover:bg-indigo-100 transition-colors"
                >
                  🔍 查看 AI 生成的简历源码
                </button>
              </MotionDiv>
            )}
          </AnimatePresence>

          {/* Empty state */}
          {!modifiedResume && !isGenerating && (
            <div className="rounded-xl border border-border bg-card p-12 text-center">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-indigo-50">
                <svg className="h-8 w-8 text-indigo-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
                </svg>
              </div>
              <h3 className="text-sm font-medium text-muted-foreground">修改后的简历将显示在这里</h3>
              <p className="mt-1 text-xs text-muted-foreground">上传简历并输入公司名或分析匹配度后，选择风格生成修改版</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
