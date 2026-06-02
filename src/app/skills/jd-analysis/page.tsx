'use client';

import { useState, useEffect, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import GradientBackground from '@/components/ui/gradient-background';

interface ExtractedSkill {
  skill_name: string;
  category: string;
  importance: string;
}

interface SkillMatch {
  skill_name: string;
  module_id: string | null;
  module_name: string;
  match_score: number;
}

interface Gap {
  skill_name: string;
  category: string;
  suggestion: string;
  related_module_id: string | null;
  related_module_name: string | null;
}

interface ResumeGap {
  skill_name: string;
  detail: string;
  suggestion: string;
}

interface ResumeMatch {
  match_score: number;
  strengths: string[];
  resume_gaps: ResumeGap[];
  improvement_suggestions: string[];
  apply_recommendation?: {
    should_apply: boolean;
    confidence: 'high' | 'medium' | 'low';
    reason: string;
    key_actions: string[];
  } | null;
}

interface JdAnalysis {
  id: string;
  jd_text: string;
  company_name: string | null;
  position_name: string;
  extracted_skills: ExtractedSkill[];
  skill_module_matches?: SkillMatch[];
  gaps?: Gap[];
  resume_match?: ResumeMatch | null;
  created_at: string;
}

const importanceColors: Record<string, string> = {
  high: 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300',
  medium: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300',
  low: 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300',
};

const importanceLabels: Record<string, string> = {
  high: '高',
  medium: '中',
  low: '低',
};

export default function JdAnalysisPage() {
  const [jdText, setJdText] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<JdAnalysis | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [history, setHistory] = useState<JdAnalysis[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  const [addingSkill, setAddingSkill] = useState<string | null>(null);
  const [addedSkills, setAddedSkills] = useState<Set<string>>(new Set());
  const [selectedCompany, setSelectedCompany] = useState<string | null>(null);
  const [companyReport, setCompanyReport] = useState<string | null>(null);
  const [companyLoading, setCompanyLoading] = useState(false);
  const [backfilling, setBackfilling] = useState(false);
  const [companyTopSkills, setCompanyTopSkills] = useState<{ name: string; count: number; positions: string[] }[]>([]);
  const [resumeFile, setResumeFile] = useState<File | null>(null);
  const [resumeText, setResumeText] = useState<string | null>(() => {
    try { return localStorage.getItem('jd-resume-text') || null; } catch { return null; }
  });
  const [resumeParsing, setResumeParsing] = useState(false);
  const [selectedHistoryId, setSelectedHistoryId] = useState<string | null>(null);

  // Persist resumeText to localStorage whenever it changes
  useEffect(() => {
    try {
      if (resumeText) localStorage.setItem('jd-resume-text', resumeText);
      else localStorage.removeItem('jd-resume-text');
    } catch {}
  }, [resumeText]);

  const supabase = createClient();

  const fetchHistory = useCallback(async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;
      const res = await fetch('/api/jd/analyze');
      if (res.ok) {
        const data = await res.json();
        setHistory(data.analyses || []);
      }
    } catch {
      // ignore
    }
  }, [supabase]);

  const handleDelete = useCallback(async (id: string) => {
    if (!confirm('确定删除这条记录吗？')) return;
    try {
      const res = await fetch('/api/jd/analyze', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      });
      if (res.ok) {
        setHistory(prev => prev.filter(h => h.id !== id));
        if (result?.id === id) setResult(null);
      }
    } catch { /* ignore */ }
  }, [result]);

  useEffect(() => { fetchHistory(); }, [fetchHistory]);

  // 按公司分组历史记录
  const companyGroups = history.reduce((acc, h) => {
    const company = h.company_name || '未指定公司';
    if (!acc[company]) acc[company] = [];
    acc[company].push(h);
    return acc;
  }, {} as Record<string, JdAnalysis[]>);

  // 公司分析
  const handleCompanyAnalysis = async (companyName: string) => {
    if (selectedCompany === companyName && companyReport) {
      setSelectedCompany(null);
      setCompanyReport(null);
      setCompanyTopSkills([]);
      return;
    }

    setSelectedCompany(companyName);
    setCompanyReport(null);
    setCompanyLoading(true);

    try {
      const res = await fetch('/api/jd/company-analysis', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ companyName }),
      });
      const data = await res.json();
      if (res.ok) {
        setCompanyReport(data.report);
        setCompanyTopSkills(data.topSkills || []);
      } else {
        setCompanyReport(`分析失败: ${data.error}`);
      }
    } catch {
      setCompanyReport('网络错误，请重试');
    } finally {
      setCompanyLoading(false);
    }
  };

  const handleBackfillRecommendation = async () => {
    setBackfilling(true);
    try {
      const res = await fetch('/api/jd/backfill-recommendation', { method: 'POST' });
      const data = await res.json();
      if (res.ok) {
        alert(`补全完成：成功 ${data.updated} 条，失败 ${data.failed} 条`);
        fetchHistory();
      } else {
        alert(`补全失败: ${data.error}`);
      }
    } catch {
      alert('网络错误，请重试');
    } finally {
      setBackfilling(false);
    }
  };

  const handleAnalyzeWithResume = async () => {
    if (!jdText.trim() || !displayResult?.id) return;
    setLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/jd/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jdText,
          companyName,
          resumeText,
          existingId: displayResult.id,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || '分析失败');
      } else {
        setResult(data);
        setSelectedHistoryId(data.id || null);
        fetchHistory();
      }
    } catch {
      setError('网络错误，请重试');
    } finally {
      setLoading(false);
    }
  };

  const handleAnalyze = async () => {
    if (!jdText.trim()) return;
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const res = await fetch('/api/jd/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ jdText: jdText.trim(), companyName: companyName.trim() || undefined, resumeText: resumeText || undefined }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || '分析失败');
      } else {
        setResult(data);
        setSelectedHistoryId(data.id || null);
        setHistory(prev => [data, ...prev]);
      }
    } catch {
      setError('网络错误，请重试');
    } finally {
      setLoading(false);
    }
  };

  const handleAddToSkillTree = async (skill: Gap) => {
    setAddingSkill(skill.skill_name);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        alert('请先登录');
        return;
      }

      const { data: existingTask } = await supabase
        .from('user_custom_tasks')
        .select('id')
        .eq('user_id', session.user.id)
        .eq('title', skill.skill_name)
        .maybeSingle();

      if (existingTask) {
        alert('该技能已添加到技能树');
        setAddedSkills(prev => new Set(prev).add(skill.skill_name));
        return;
      }

      const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      let moduleId: string | null = null;
      let matchedModuleName: string | null = null;
      const skillKeywords = skill.skill_name.toLowerCase();

      if (skill.related_module_id && uuidPattern.test(skill.related_module_id)) {
        moduleId = skill.related_module_id;
        matchedModuleName = skill.related_module_name;
      }

      if (!moduleId) {
        const { data: exactMatch } = await supabase
          .from('skill_modules')
          .select('id, name')
          .eq('name', skill.related_module_name || skill.skill_name)
          .maybeSingle();

        if (exactMatch) {
          moduleId = exactMatch.id;
          matchedModuleName = exactMatch.name;
        } else {
          const { data: fuzzyMatch } = await supabase
            .from('skill_modules')
            .select('id, name, description')
            .or(`name.ilike.%${skillKeywords}%,description.ilike.%${skillKeywords}%`)
            .limit(1)
            .maybeSingle();

          if (fuzzyMatch) {
            moduleId = fuzzyMatch.id;
            matchedModuleName = fuzzyMatch.name;
          }
        }
      }

      if (!moduleId) {
        const { data: userModuleMatch } = await supabase
          .from('user_skill_modules')
          .select('id, name, description')
          .eq('user_id', session.user.id)
          .or(`name.ilike.%${skillKeywords}%,description.ilike.%${skillKeywords}%`)
          .limit(1)
          .maybeSingle();

        if (userModuleMatch) {
          moduleId = userModuleMatch.id;
          matchedModuleName = userModuleMatch.name;
        }
      }

      if (!moduleId) {
        const { data: taskMatch } = await supabase
          .from('learning_tasks')
          .select('id, module_id, title, skill_modules(name)')
          .ilike('title', `%${skillKeywords}%`)
          .limit(1)
          .maybeSingle();

        if (taskMatch && taskMatch.module_id) {
          moduleId = taskMatch.module_id;
          const mod = taskMatch.skill_modules as unknown as { name: string } | null;
          matchedModuleName = mod?.name || '对应模块';
        }
      }

      if (!moduleId) {
        const { data: userTaskMatch } = await supabase
          .from('user_module_tasks')
          .select('id, module_id, title, user_skill_modules(name)')
          .eq('user_id', session.user.id)
          .ilike('title', `%${skillKeywords}%`)
          .limit(1)
          .maybeSingle();

        if (userTaskMatch && userTaskMatch.module_id) {
          moduleId = userTaskMatch.module_id;
          const mod = userTaskMatch.user_skill_modules as unknown as { name: string } | null;
          matchedModuleName = mod?.name || '对应模块';
        }
      }

      const insertData: Record<string, unknown> = {
        user_id: session.user.id,
        module_id: moduleId,
        title: skill.skill_name,
        objective: skill.suggestion || `针对岗位要求，深入学习 ${skill.skill_name}`,
        resources: [],
        status: 'not_started',
      };

      if (displayResult?.id && uuidPattern.test(displayResult.id)) {
        insertData.source_jd_id = displayResult.id;
      }

      const { error } = await supabase.from('user_custom_tasks').insert(insertData);

      if (error) {
        console.error('Add to skill tree failed:', error);
        alert('添加失败：' + error.message);
        return;
      }

      setAddedSkills(prev => new Set(prev).add(skill.skill_name));

      if (moduleId) {
        alert(`已添加到模块「${matchedModuleName || skill.related_module_name || '对应模块'}」`);
      } else {
        alert('已添加到「岗位差距」，可在技能树总览中查看');
      }
    } catch (err) {
      console.error('Add to skill tree failed:', err);
      alert('添加失败，请重试');
    } finally {
      setAddingSkill(null);
    }
  };

  const displayResult = result || (selectedHistoryId ? history.find(h => h.id === selectedHistoryId) || null : null);

  // 检查已添加的技能状态
  useEffect(() => {
    if (!displayResult?.gaps) return;
    const checkAddedSkills = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;
      const skillNames = displayResult.gaps?.map(g => g.skill_name) || [];
      if (skillNames.length === 0) return;
      const { data: existingTasks } = await supabase
        .from('user_custom_tasks')
        .select('title')
        .eq('user_id', session.user.id)
        .in('title', skillNames);
      const addedSet = new Set((existingTasks || []).map(t => t.title));
      setAddedSkills(addedSet);
    };
    checkAddedSkills();
  }, [displayResult?.id, displayResult?.gaps, supabase]);

  return (
    <div className="flex h-full flex-col bg-background">
      <GradientBackground />
      {/* Header */}
      <div className="relative z-10 shrink-0 border-b border-border bg-card px-6 py-4">
        <h1 className="text-lg font-semibold text-foreground">岗位分析</h1>
        <p className="text-xs text-muted-foreground">粘贴 JD 内容，AI 自动提取技能要求并匹配技能树</p>
      </div>

      {/* Content */}
      <div className="relative z-10 flex-1 overflow-y-auto p-6">
        {/* JD Input */}
        <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
          {/* 简历上传（选填） */}
          <div className="mb-4">
            <label className="mb-2 block text-sm font-medium text-foreground">上传简历（选填）</label>
            <p className="mb-2 text-xs text-muted-foreground">上传简历后，AI 将额外分析简历与岗位的匹配度</p>
            {resumeFile ? (
              <div className="flex items-center gap-3 rounded-xl border-2 border-indigo-200 bg-indigo-50/50 px-4 py-2.5 dark:border-indigo-800 dark:bg-indigo-950/40">
                <svg className="h-5 w-5 text-indigo-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
                </svg>
                <span className="text-sm font-medium text-foreground">{resumeFile.name}</span>
                {resumeParsing && <span className="text-xs text-muted-foreground">解析中...</span>}
                <button
                  onClick={() => { setResumeFile(null); setResumeText(null); }}
                  className="ml-auto rounded-lg p-1 text-muted-foreground hover:bg-rose-100 hover:text-rose-600 dark:hover:bg-rose-900/40 dark:hover:text-rose-300 transition-colors"
                  title="移除简历"
                >
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            ) : (
              <div
                onClick={() => {
                  const input = document.createElement('input');
                  input.type = 'file';
                  input.accept = '.pdf,.docx,.txt,.md';
                  input.onchange = async (e) => {
                    const file = (e.target as HTMLInputElement).files?.[0];
                    if (!file) return;
                    if (file.size > 5 * 1024 * 1024) {
                      alert('文件大小不能超过5MB');
                      return;
                    }
                    setResumeFile(file);
                    setResumeParsing(true);
                    try {
                      if (file.name.endsWith('.txt') || file.name.endsWith('.md')) {
                        const text = await file.text();
                        setResumeText(text);
                      } else {
                        const formData = new FormData();
                        formData.append('file', file);
                        const res = await fetch('/api/resume/parse', { method: 'POST', body: formData });
                        if (res.ok) {
                          const data = await res.json();
                          setResumeText(data.text || '');
                        } else {
                          alert('简历解析失败，请尝试粘贴简历文本');
                          setResumeFile(null);
                        }
                      }
                    } catch {
                      alert('简历解析失败');
                      setResumeFile(null);
                    } finally {
                      setResumeParsing(false);
                    }
                  };
                  input.click();
                }}
                className="cursor-pointer rounded-xl border-2 border-dashed border-border bg-muted px-4 py-4 text-center transition-colors hover:border-indigo-300 hover:bg-indigo-50/30 dark:hover:border-indigo-700 dark:hover:bg-indigo-950/30"
              >
                <svg className="mx-auto h-8 w-8 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
                </svg>
                <p className="mt-2 text-sm text-muted-foreground">点击上传简历文件</p>
                <p className="text-xs text-muted-foreground">支持 PDF、DOCX、TXT、MD（最大5MB）</p>
              </div>
            )}
          </div>
          {/* 公司名称输入 */}
          <div className="mb-4">
            <label className="mb-2 block text-sm font-medium text-foreground">公司名称（选填）</label>
            <input
              type="text"
              value={companyName}
              onChange={(e) => setCompanyName(e.target.value)}
              placeholder="输入公司名称，用于数据看板按公司统计"
              className="w-full rounded-xl border-2 border-border bg-muted px-4 py-2.5 text-sm text-foreground placeholder-muted-foreground transition-colors focus:border-indigo-500 focus:bg-card focus:outline-none focus:ring-2 focus:ring-[#4F46E5]/20"
            />
          </div>
          <label className="mb-2 block text-sm font-medium text-foreground">粘贴岗位描述（JD）</label>
          <textarea
            value={jdText}
            onChange={(e) => setJdText(e.target.value)}
            placeholder="请粘贴完整的岗位描述内容，包括职位要求、技能要求、工作职责等..."
            className="w-full rounded-xl border-2 border-border bg-muted px-4 py-3 text-sm text-foreground placeholder-muted-foreground transition-colors focus:border-indigo-500 focus:bg-card focus:outline-none focus:ring-2 focus:ring-[#4F46E5]/20"
            rows={8}
          />
          <div className="mt-4 flex items-center justify-between">
            <span className="text-xs text-muted-foreground">{jdText.length} 字</span>
            <button
              onClick={handleAnalyze}
              disabled={loading || !jdText.trim()}
              className="rounded-xl bg-[#4F46E5] px-6 py-2.5 text-sm font-medium text-white transition-all hover:bg-[#4338CA] disabled:cursor-not-allowed disabled:opacity-50"
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>
                  分析中...
                </span>
              ) : '开始分析'}
            </button>
          </div>
        </div>

        {error && (
          <div className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-800 dark:bg-red-900/30 dark:text-red-300">{error}</div>
        )}

        {/* History toggle button */}
        {history.length > 0 && !showHistory && (
          <div className="mt-6">
            <button
              onClick={() => setShowHistory(true)}
              className="flex items-center gap-2 text-sm font-medium text-primary hover:text-[#4338CA]"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
              </svg>
              历史分析记录（{history.length}）
            </button>
          </div>
        )}

        {/* Three-column layout: History list + Detail + Company analysis */}
        {history.length > 0 && showHistory && (
          <div className="mt-6 flex gap-4 items-start">
            {/* Left column: History list — sticky */}
            <div className="w-96 shrink-0 sticky top-6 flex flex-col rounded-2xl border border-border bg-card shadow-sm" style={{ maxHeight: 'calc(100vh - 120px)' }}>
              <div className="shrink-0 flex items-center justify-between border-b border-border px-4 py-3">
                <h3 className="text-sm font-semibold text-foreground">历史记录（{history.length}）</h3>
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleBackfillRecommendation}
                    disabled={backfilling}
                    className="rounded-lg px-2 py-1 text-[10px] font-medium text-primary hover:bg-[#4F46E5]/10 transition-colors disabled:opacity-50"
                    title="为历史记录补全投递建议"
                  >
                    {backfilling ? '补全中...' : '补全投递建议'}
                  </button>
                  <button
                    onClick={() => setShowHistory(false)}
                    className="rounded-lg p-1 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
                    title="收起"
                  >
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                    </svg>
                  </button>
                </div>
              </div>
              <div className="flex-1 overflow-y-auto p-2 space-y-0.5">
                {Object.entries(companyGroups).map(([company, items]) => (
                  <div key={company}>
                    {/* Company header with analysis button */}
                    <div className="flex items-center gap-1.5 px-2 pt-2 pb-1">
                      <span className="text-xs font-semibold text-primary truncate">{company}</span>
                      <span className="shrink-0 rounded bg-indigo-100 px-1 py-0.5 text-[10px] font-medium text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300">{items.length}</span>
                      {items.length >= 2 && (
                        <button
                          onClick={() => handleCompanyAnalysis(company)}
                          className={`ml-auto shrink-0 rounded-md px-2 py-0.5 text-[10px] font-medium transition-colors ${
                            selectedCompany === company
                              ? 'bg-[#4F46E5] text-white'
                              : 'bg-muted text-muted-foreground hover:bg-[#4F46E5]/10 hover:text-[#4F46E5]'
                          }`}
                          title="分析该公司招聘偏好"
                        >
                          {companyLoading && selectedCompany === company ? '分析中...' : '公司画像'}
                        </button>
                      )}
                    </div>
                    {/* Position items under this company */}
                    {items.map((h) => (
                      <div
                        key={h.id}
                        onClick={() => { setResult(h); setSelectedHistoryId(h.id); setJdText(h.jd_text || ''); setCompanyName(h.company_name || ''); }}
                        className={`cursor-pointer rounded-xl border px-3 py-2 text-sm transition-colors ml-2 ${
                          displayResult?.id === h.id ? 'border-[#4F46E5] bg-indigo-50 dark:bg-indigo-900/30' : 'border-transparent hover:bg-muted'
                        }`}
                      >
                        <div className="flex items-center justify-between gap-2">
                          <span className="font-medium text-foreground truncate">{h.position_name}</span>
                          <button
                            onClick={(e) => { e.stopPropagation(); handleDelete(h.id); }}
                            className="shrink-0 rounded-lg p-1 text-muted-foreground hover:bg-rose-100 hover:text-rose-600 dark:hover:bg-rose-900/40 dark:hover:text-rose-300 transition-colors"
                            title="删除"
                          >
                            <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                            </svg>
                          </button>
                        </div>
                        <div className="flex items-center gap-2 mt-0.5">
                          {!h.resume_match && resumeText && (
                            <span className="rounded bg-amber-100 px-1 py-0.5 text-[10px] font-medium text-amber-700 dark:bg-amber-900/40 dark:text-amber-300 shrink-0">未匹配简历</span>
                          )}
                          <span className="text-xs text-muted-foreground ml-auto shrink-0">{new Date(h.created_at).toLocaleDateString()}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            </div>

            {/* Middle: Analysis detail */}
            <div className="flex-1 min-w-0 rounded-2xl border border-border bg-card/50 p-5 shadow-sm">
            {displayResult ? (
              <div className="space-y-5">
                {/* Header Card */}
                <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#4F46E5]/10 text-lg">📋</div>
                    <div>
                      <h2 className="text-lg font-semibold text-foreground">{displayResult.position_name}</h2>
                      {displayResult.company_name && <p className="text-sm text-muted-foreground">{displayResult.company_name}</p>}
                    </div>
                  </div>
                  {displayResult.jd_text && (
                    <div className="mt-4 rounded-xl border border-border bg-muted p-4">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-medium text-muted-foreground">岗位描述</span>
                        <button
                          onClick={() => setJdText(displayResult.jd_text || '')}
                          className="text-xs text-primary hover:text-[#4338CA]"
                        >
                          加载到输入框
                        </button>
                      </div>
                      <p className="text-xs text-muted-foreground line-clamp-4 whitespace-pre-wrap">{displayResult.jd_text}</p>
                    </div>
                  )}
                </div>

                {displayResult.resume_match === null && resumeText && (
                  <div className="rounded-2xl border-2 border-amber-200 bg-amber-50/30 p-4 shadow-sm dark:border-amber-800 dark:bg-amber-950/30">
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-amber-700 dark:text-amber-400">此分析未包含简历匹配</span>
                      <button
                        onClick={() => handleAnalyzeWithResume()}
                        disabled={loading}
                        className="ml-auto rounded-lg bg-[#4F46E5] px-3 py-1.5 text-xs font-medium text-white hover:bg-[#4338CA] disabled:opacity-50 transition-colors"
                      >
                        {loading ? '分析中...' : '带简历重新分析'}
                      </button>
                    </div>
                    <p className="mt-2 text-xs text-muted-foreground">点击后将补充简历匹配度分析</p>
                  </div>
                )}

                {/* Resume Match Card */}
                {displayResult.resume_match && (
                  <div className="rounded-2xl border-2 border-indigo-200 bg-indigo-50/30 p-6 shadow-sm dark:border-indigo-800 dark:bg-indigo-950/30">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#4F46E5]/10 text-lg">🎯</div>
                      <h3 className="text-base font-semibold text-foreground">简历匹配度</h3>
                      <div className="ml-auto flex items-center gap-2">
                        <span className="text-3xl font-bold text-[#4F46E5] dark:text-indigo-400">{displayResult.resume_match.match_score}</span>
                        <span className="text-sm text-muted-foreground">/ 100</span>
                      </div>
                    </div>
                    <div className="h-3 overflow-hidden rounded-full bg-muted mb-5">
                      <div
                        className={`h-full rounded-full transition-all ${
                          displayResult.resume_match.match_score >= 70 ? 'bg-emerald-500' :
                          displayResult.resume_match.match_score >= 40 ? 'bg-amber-500' : 'bg-red-500'
                        }`}
                        style={{ width: `${displayResult.resume_match.match_score}%` }}
                      />
                    </div>
                    {displayResult.resume_match.apply_recommendation && (
                      <div className={`mb-5 rounded-xl border-2 px-4 py-3 ${
                        displayResult.resume_match.apply_recommendation.should_apply
                          ? 'border-emerald-300 bg-emerald-50/60 dark:border-emerald-700 dark:bg-emerald-900/20'
                          : 'border-red-300 bg-red-50/60 dark:border-red-700 dark:bg-red-900/20'
                      }`}>
                        <div className="flex items-center gap-2 mb-1.5">
                          <span className="text-base">{displayResult.resume_match.apply_recommendation.should_apply ? '✅' : '⛔'}</span>
                          <h4 className={`text-sm font-bold ${
                            displayResult.resume_match.apply_recommendation.should_apply
                              ? 'text-emerald-700 dark:text-emerald-400'
                              : 'text-red-700 dark:text-red-400'
                          }`}>
                            {displayResult.resume_match.apply_recommendation.should_apply ? '建议投递' : '不建议投递'}
                          </h4>
                          {displayResult.resume_match.apply_recommendation.confidence && (
                            <span className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${
                              displayResult.resume_match.apply_recommendation.confidence === 'high'
                                ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300'
                                : displayResult.resume_match.apply_recommendation.confidence === 'medium'
                                ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300'
                                : 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400'
                            }`}>
                              {displayResult.resume_match.apply_recommendation.confidence === 'high' ? '高信心' : displayResult.resume_match.apply_recommendation.confidence === 'medium' ? '中信心' : '低信心'}
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-foreground mb-2">{displayResult.resume_match.apply_recommendation.reason}</p>
                        {displayResult.resume_match.apply_recommendation.key_actions?.length > 0 && (
                          <div className="space-y-1">
                            {displayResult.resume_match.apply_recommendation.key_actions.map((a, i) => (
                              <div key={i} className="flex items-center gap-1.5 text-xs text-muted-foreground">
                                <span className="text-[10px]">→</span>
                                <span>{a}</span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                    {displayResult.resume_match.strengths.length > 0 && (
                      <div className="mb-4">
                        <h4 className="mb-2 text-sm font-medium text-emerald-700 dark:text-emerald-400">匹配优势</h4>
                        <div className="space-y-1.5">
                          {displayResult.resume_match.strengths.map((s, i) => (
                            <div key={i} className="flex items-center gap-2 rounded-lg bg-emerald-50 px-3 py-1.5 dark:bg-emerald-900/30">
                              <svg className="h-4 w-4 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                              </svg>
                              <span className="text-sm text-foreground">{s}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    {displayResult.resume_match.resume_gaps.length > 0 && (
                      <div className="mb-4">
                        <h4 className="mb-2 text-sm font-medium text-amber-700 dark:text-amber-400">简历差距</h4>
                        <div className="space-y-2">
                          {displayResult.resume_match.resume_gaps.map((g, i) => (
                            <div key={i} className="rounded-xl border border-amber-200 bg-amber-50/50 px-4 py-3 dark:border-amber-800 dark:bg-amber-900/20">
                              <div className="flex items-center gap-2">
                                <span className="text-sm font-medium text-foreground">{g.skill_name}</span>
                              </div>
                              {g.detail && <p className="mt-1 text-xs text-muted-foreground">{g.detail}</p>}
                              {g.suggestion && <p className="mt-1 text-xs text-primary">{g.suggestion}</p>}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    {displayResult.resume_match.improvement_suggestions.length > 0 && (
                      <div>
                        <h4 className="mb-2 text-sm font-medium text-indigo-700 dark:text-indigo-400">简历提升建议</h4>
                        <div className="space-y-1.5">
                          {displayResult.resume_match.improvement_suggestions.map((s, i) => (
                            <div key={i} className="flex items-center gap-2 rounded-lg bg-indigo-50 px-3 py-1.5 dark:bg-indigo-900/30">
                              <svg className="h-4 w-4 text-indigo-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                              </svg>
                              <span className="text-sm text-foreground">{s}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Extracted Skills — grouped by module */}
                {displayResult.skill_module_matches && displayResult.skill_module_matches.length > 0 ? (
                  (() => {
                    const moduleGroups = new Map<string, { module_name: string; skills: { skill: ExtractedSkill; match: SkillMatch; isGap: boolean }[] }>();
                    const unmatchedSkills: { skill: ExtractedSkill; isGap: boolean }[] = [];

                    for (const skill of displayResult.extracted_skills || []) {
                      const match = displayResult.skill_module_matches.find(m => m.skill_name === skill.skill_name);
                      const gap = displayResult.gaps?.find(g => g.skill_name === skill.skill_name);
                      const isGap = !!gap;
                      if (match && match.module_name) {
                        const key = match.module_name;
                        if (!moduleGroups.has(key)) {
                          moduleGroups.set(key, { module_name: match.module_name, skills: [] });
                        }
                        moduleGroups.get(key)!.skills.push({ skill, match, isGap });
                      } else {
                        unmatchedSkills.push({ skill, isGap });
                      }
                    }

                    const sortedGroups = Array.from(moduleGroups.entries())
                      .sort((a, b) => b[1].skills.length - a[1].skills.length);

                    return (
                      <div className="space-y-4">
                        {sortedGroups.map(([key, group]) => (
                          <div key={key} className="rounded-2xl border border-border bg-card p-5 shadow-sm">
                            <div className="flex items-center gap-2 mb-3">
                              <span className="text-sm font-semibold text-primary">{group.module_name}</span>
                              <span className="rounded bg-indigo-100 px-1.5 py-0.5 text-[10px] font-medium text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300">{group.skills.length} 项技能</span>
                            </div>
                            <div className="space-y-2">
                              {group.skills.map(({ skill, match, isGap }) => (
                                <div key={skill.skill_name} className="flex items-center gap-2 rounded-xl border border-border px-3 py-2">
                                  <span className="text-sm font-medium text-foreground">{skill.skill_name}</span>
                                  <span className={`rounded px-1.5 py-0.5 text-[10px] font-medium ${importanceColors[skill.importance] || importanceColors.medium}`}>
                                    {importanceLabels[skill.importance] || '中'}
                                  </span>
                                  {isGap && (
                                    <span className="rounded bg-amber-100 px-1.5 py-0.5 text-[10px] font-medium text-amber-700 dark:bg-amber-900/40 dark:text-amber-300">差距</span>
                                  )}
                                  <div className="ml-auto flex items-center gap-2">
                                    <div className="h-2 w-16 overflow-hidden rounded-full bg-[#E5E7EB] dark:bg-gray-700">
                                      <div
                                        className={`h-full rounded-full ${match.match_score >= 70 ? 'bg-emerald-500' : match.match_score >= 40 ? 'bg-amber-500' : 'bg-red-500'}`}
                                        style={{ width: `${Math.min(100, Math.max(0, match.match_score))}%` }}
                                      />
                                    </div>
                                    <span className={`text-[10px] font-medium ${match.match_score >= 70 ? 'text-emerald-600 dark:text-emerald-400' : match.match_score >= 40 ? 'text-amber-600 dark:text-amber-400' : 'text-red-500 dark:text-red-400'}`}>
                                      {match.match_score}%
                                    </span>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        ))}
                        {unmatchedSkills.length > 0 && (
                          <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
                            <div className="flex items-center gap-2 mb-3">
                              <span className="text-sm font-semibold text-foreground">未匹配模块</span>
                              <span className="rounded bg-amber-100 px-1.5 py-0.5 text-[10px] font-medium text-amber-700 dark:bg-amber-900/40 dark:text-amber-300">{unmatchedSkills.length} 项技能</span>
                            </div>
                            <div className="space-y-2">
                              {unmatchedSkills.map(({ skill, isGap }) => (
                                <div key={skill.skill_name} className="flex items-center gap-2 rounded-xl border border-border px-3 py-2">
                                  <span className="text-sm font-medium text-foreground">{skill.skill_name}</span>
                                  <span className={`rounded px-1.5 py-0.5 text-[10px] font-medium ${importanceColors[skill.importance] || importanceColors.medium}`}>
                                    {importanceLabels[skill.importance] || '中'}
                                  </span>
                                  <span className="text-[10px] text-muted-foreground">{skill.category}</span>
                                  {isGap && (
                                    <span className="rounded bg-amber-100 px-1.5 py-0.5 text-[10px] font-medium text-amber-700 dark:bg-amber-900/40 dark:text-amber-300">差距</span>
                                  )}
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })()
                ) : (
                  <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
                    <h3 className="mb-4 text-base font-semibold text-foreground">提取的技能要求</h3>
                    <div className="space-y-2">
                      {displayResult.extracted_skills?.map((skill, i) => (
                        <div key={i} className="flex items-center gap-2 rounded-xl border border-border px-3 py-2">
                          <span className="text-sm font-medium text-foreground">{skill.skill_name}</span>
                          <span className={`rounded px-1.5 py-0.5 text-[10px] font-medium ${importanceColors[skill.importance] || importanceColors.medium}`}>
                            {importanceLabels[skill.importance] || '中'}
                          </span>
                          <span className="text-[10px] text-muted-foreground">{skill.category}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Skill Gaps */}
                <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
                  <h3 className="mb-4 text-base font-semibold text-foreground">技能差距</h3>
                  {displayResult.gaps && displayResult.gaps.length > 0 ? (
                    <div className="space-y-3">
                      {displayResult.gaps.map((gap, i) => (
                        <div key={i} className="rounded-xl border border-amber-200 bg-amber-50/50 px-4 py-3 dark:border-amber-800 dark:bg-amber-900/20">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-2">
                                <span className="text-sm font-medium text-foreground">{gap.skill_name}</span>
                                <span className="rounded bg-amber-100 px-1.5 py-0.5 text-[10px] text-amber-700 dark:bg-amber-900/40 dark:text-amber-300">{gap.category}</span>
                              </div>
                              {gap.suggestion && <p className="mt-1 text-xs text-muted-foreground">{gap.suggestion}</p>}
                              {gap.related_module_name && (
                                <p className="mt-1 text-xs text-primary">相关模块：{gap.related_module_name}</p>
                              )}
                            </div>
                            <button
                              onClick={() => handleAddToSkillTree(gap)}
                              disabled={addingSkill === gap.skill_name || addedSkills.has(gap.skill_name)}
                              className={`ml-3 shrink-0 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
                                addedSkills.has(gap.skill_name)
                                  ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300'
                                  : 'bg-[#4F46E5] text-white hover:bg-[#4338CA] disabled:opacity-50'
                              }`}
                            >
                              {addedSkills.has(gap.skill_name) ? '已添加' : addingSkill === gap.skill_name ? '添加中...' : '添加到技能树'}
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">所有提取的技能均有模块覆盖，暂无明显差距</p>
                  )}
                </div>
              </div>
            ) : (
              <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
                点击左侧记录查看分析详情
              </div>
            )}
            </div>

            {/* Right column: Company analysis panel — rightmost */}
            {selectedCompany && companyReport && (
              <div className="w-[420px] shrink-0 sticky top-6 rounded-2xl border-2 border-[#4F46E5]/30 bg-gradient-to-b from-indigo-50/80 to-card p-5 shadow-sm dark:from-indigo-950/40 dark:to-card overflow-y-auto" style={{ maxHeight: 'calc(100vh - 120px)' }}>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <span className="text-base">🏢</span>
                    <h3 className="text-sm font-bold text-foreground">{selectedCompany} 招聘画像</h3>
                  </div>
                  <button
                    onClick={() => { setSelectedCompany(null); setCompanyReport(null); setCompanyTopSkills([]); }}
                    className="rounded-lg p-1 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
                    title="关闭"
                  >
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
                {/* Top skills bar */}
                {companyTopSkills.length > 0 && (
                  <div className="mb-3 flex flex-wrap gap-1">
                    {companyTopSkills.slice(0, 8).map(s => (
                      <span key={s.name} className="rounded-full bg-[#4F46E5]/10 px-2 py-0.5 text-[10px] font-medium text-[#4F46E5] dark:text-indigo-300">
                        {s.name} {s.count}
                      </span>
                    ))}
                  </div>
                )}
                {/* Report */}
                <div className="text-sm text-foreground leading-relaxed whitespace-pre-wrap">{companyReport}</div>
              </div>
            )}

            {/* Company analysis loading */}
            {selectedCompany && companyLoading && !companyReport && (
              <div className="w-[420px] shrink-0 sticky top-6 rounded-2xl border-2 border-[#4F46E5]/30 bg-gradient-to-b from-indigo-50/80 to-card p-5 shadow-sm dark:from-indigo-950/40 dark:to-card flex items-center justify-center" style={{ maxHeight: 'calc(100vh - 120px)' }}>
                <span className="flex items-center gap-2 text-sm text-muted-foreground">
                  <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>
                  正在分析{selectedCompany}招聘偏好...
                </span>
              </div>
            )}
          </div>
        )}

        {/* No history: show inline result */}
        {!history.length && displayResult && (
          <div className="mt-8 space-y-6">
            <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#4F46E5]/10 text-lg">📋</div>
                <div>
                  <h2 className="text-lg font-semibold text-foreground">{displayResult.position_name}</h2>
                  {displayResult.company_name && <p className="text-sm text-muted-foreground">{displayResult.company_name}</p>}
                </div>
              </div>
              {displayResult.jd_text && (
                <div className="mt-4 rounded-xl border border-border bg-muted p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-medium text-muted-foreground">岗位描述</span>
                    <button
                      onClick={() => setJdText(displayResult.jd_text || '')}
                      className="text-xs text-primary hover:text-[#4338CA]"
                    >
                      加载到输入框
                    </button>
                  </div>
                  <p className="text-xs text-muted-foreground line-clamp-4 whitespace-pre-wrap">{displayResult.jd_text}</p>
                </div>
              )}
            </div>

            {displayResult.resume_match && (
              <div className="rounded-2xl border-2 border-indigo-200 bg-indigo-50/30 p-6 shadow-sm dark:border-indigo-800 dark:bg-indigo-950/30">
                <div className="flex items-center gap-3 mb-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#4F46E5]/10 text-lg">🎯</div>
                  <h3 className="text-base font-semibold text-foreground">简历匹配度</h3>
                  <div className="ml-auto flex items-center gap-2">
                    <span className="text-3xl font-bold text-[#4F46E5] dark:text-indigo-400">{displayResult.resume_match.match_score}</span>
                    <span className="text-sm text-muted-foreground">/ 100</span>
                  </div>
                </div>
                <div className="h-3 overflow-hidden rounded-full bg-muted mb-5">
                  <div
                    className={`h-full rounded-full transition-all ${
                      displayResult.resume_match.match_score >= 70 ? 'bg-emerald-500' :
                      displayResult.resume_match.match_score >= 40 ? 'bg-amber-500' : 'bg-red-500'
                    }`}
                    style={{ width: `${displayResult.resume_match.match_score}%` }}
                  />
                </div>
                {displayResult.resume_match.apply_recommendation && (
                  <div className={`mb-5 rounded-xl border-2 px-4 py-3 ${
                    displayResult.resume_match.apply_recommendation.should_apply
                      ? 'border-emerald-300 bg-emerald-50/60 dark:border-emerald-700 dark:bg-emerald-900/20'
                      : 'border-red-300 bg-red-50/60 dark:border-red-700 dark:bg-red-900/20'
                  }`}>
                    <div className="flex items-center gap-2 mb-1.5">
                      <span className="text-base">{displayResult.resume_match.apply_recommendation.should_apply ? '✅' : '⛔'}</span>
                      <h4 className={`text-sm font-bold ${
                        displayResult.resume_match.apply_recommendation.should_apply
                          ? 'text-emerald-700 dark:text-emerald-400'
                          : 'text-red-700 dark:text-red-400'
                      }`}>
                        {displayResult.resume_match.apply_recommendation.should_apply ? '建议投递' : '不建议投递'}
                      </h4>
                      {displayResult.resume_match.apply_recommendation.confidence && (
                        <span className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${
                          displayResult.resume_match.apply_recommendation.confidence === 'high'
                            ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300'
                            : displayResult.resume_match.apply_recommendation.confidence === 'medium'
                            ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300'
                            : 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400'
                        }`}>
                          {displayResult.resume_match.apply_recommendation.confidence === 'high' ? '高信心' : displayResult.resume_match.apply_recommendation.confidence === 'medium' ? '中信心' : '低信心'}
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-foreground mb-2">{displayResult.resume_match.apply_recommendation.reason}</p>
                    {displayResult.resume_match.apply_recommendation.key_actions?.length > 0 && (
                      <div className="space-y-1">
                        {displayResult.resume_match.apply_recommendation.key_actions.map((a, i) => (
                          <div key={i} className="flex items-center gap-1.5 text-xs text-muted-foreground">
                            <span className="text-[10px]">→</span>
                            <span>{a}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
                {displayResult.resume_match.strengths.length > 0 && (
                  <div className="mb-4">
                    <h4 className="mb-2 text-sm font-medium text-emerald-700 dark:text-emerald-400">匹配优势</h4>
                    <div className="space-y-1.5">
                      {displayResult.resume_match.strengths.map((s, i) => (
                        <div key={i} className="flex items-center gap-2 rounded-lg bg-emerald-50 px-3 py-1.5 dark:bg-emerald-900/30">
                          <svg className="h-4 w-4 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                          </svg>
                          <span className="text-sm text-foreground">{s}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                {displayResult.resume_match.resume_gaps.length > 0 && (
                  <div className="mb-4">
                    <h4 className="mb-2 text-sm font-medium text-amber-700 dark:text-amber-400">简历差距</h4>
                    <div className="space-y-2">
                      {displayResult.resume_match.resume_gaps.map((g, i) => (
                        <div key={i} className="rounded-xl border border-amber-200 bg-amber-50/50 px-4 py-3 dark:border-amber-800 dark:bg-amber-900/20">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium text-foreground">{g.skill_name}</span>
                          </div>
                          {g.detail && <p className="mt-1 text-xs text-muted-foreground">{g.detail}</p>}
                          {g.suggestion && <p className="mt-1 text-xs text-primary">{g.suggestion}</p>}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                {displayResult.resume_match.improvement_suggestions.length > 0 && (
                  <div>
                    <h4 className="mb-2 text-sm font-medium text-indigo-700 dark:text-indigo-400">简历提升建议</h4>
                    <div className="space-y-1.5">
                      {displayResult.resume_match.improvement_suggestions.map((s, i) => (
                        <div key={i} className="flex items-center gap-2 rounded-lg bg-indigo-50 px-3 py-1.5 dark:bg-indigo-900/30">
                          <svg className="h-4 w-4 text-indigo-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                          </svg>
                          <span className="text-sm text-foreground">{s}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {displayResult.skill_module_matches && displayResult.skill_module_matches.length > 0 ? (
              (() => {
                const moduleGroups = new Map<string, { module_name: string; skills: { skill: ExtractedSkill; match: SkillMatch; isGap: boolean }[] }>();
                const unmatchedSkills: { skill: ExtractedSkill; isGap: boolean }[] = [];

                for (const skill of displayResult.extracted_skills || []) {
                  const match = displayResult.skill_module_matches.find(m => m.skill_name === skill.skill_name);
                  const gap = displayResult.gaps?.find(g => g.skill_name === skill.skill_name);
                  const isGap = !!gap;
                  if (match && match.module_name) {
                    const key = match.module_name;
                    if (!moduleGroups.has(key)) {
                      moduleGroups.set(key, { module_name: match.module_name, skills: [] });
                    }
                    moduleGroups.get(key)!.skills.push({ skill, match, isGap });
                  } else {
                    unmatchedSkills.push({ skill, isGap });
                  }
                }

                const sortedGroups = Array.from(moduleGroups.entries())
                  .sort((a, b) => b[1].skills.length - a[1].skills.length);

                return (
                  <div className="space-y-4">
                    {sortedGroups.map(([key, group]) => (
                      <div key={key} className="rounded-2xl border border-border bg-card p-5 shadow-sm">
                        <div className="flex items-center gap-2 mb-3">
                          <span className="text-sm font-semibold text-primary">{group.module_name}</span>
                          <span className="rounded bg-indigo-100 px-1.5 py-0.5 text-[10px] font-medium text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300">{group.skills.length} 项技能</span>
                        </div>
                        <div className="space-y-2">
                          {group.skills.map(({ skill, match, isGap }) => (
                            <div key={skill.skill_name} className="flex items-center gap-2 rounded-xl border border-border px-3 py-2">
                              <span className="text-sm font-medium text-foreground">{skill.skill_name}</span>
                              <span className={`rounded px-1.5 py-0.5 text-[10px] font-medium ${importanceColors[skill.importance] || importanceColors.medium}`}>
                                {importanceLabels[skill.importance] || '中'}
                              </span>
                              {isGap && (
                                <span className="rounded bg-amber-100 px-1.5 py-0.5 text-[10px] font-medium text-amber-700 dark:bg-amber-900/40 dark:text-amber-300">差距</span>
                              )}
                              <div className="ml-auto flex items-center gap-2">
                                <div className="h-2 w-16 overflow-hidden rounded-full bg-[#E5E7EB] dark:bg-gray-700">
                                  <div
                                    className={`h-full rounded-full ${match.match_score >= 70 ? 'bg-emerald-500' : match.match_score >= 40 ? 'bg-amber-500' : 'bg-red-500'}`}
                                    style={{ width: `${Math.min(100, Math.max(0, match.match_score))}%` }}
                                  />
                                </div>
                                <span className={`text-[10px] font-medium ${match.match_score >= 70 ? 'text-emerald-600 dark:text-emerald-400' : match.match_score >= 40 ? 'text-amber-600 dark:text-amber-400' : 'text-red-500 dark:text-red-400'}`}>
                                  {match.match_score}%
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                    {unmatchedSkills.length > 0 && (
                      <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
                        <div className="flex items-center gap-2 mb-3">
                          <span className="text-sm font-semibold text-foreground">未匹配模块</span>
                          <span className="rounded bg-amber-100 px-1.5 py-0.5 text-[10px] font-medium text-amber-700 dark:bg-amber-900/40 dark:text-amber-300">{unmatchedSkills.length} 项技能</span>
                        </div>
                        <div className="space-y-2">
                          {unmatchedSkills.map(({ skill, isGap }) => (
                            <div key={skill.skill_name} className="flex items-center gap-2 rounded-xl border border-border px-3 py-2">
                              <span className="text-sm font-medium text-foreground">{skill.skill_name}</span>
                              <span className={`rounded px-1.5 py-0.5 text-[10px] font-medium ${importanceColors[skill.importance] || importanceColors.medium}`}>
                                {importanceLabels[skill.importance] || '中'}
                              </span>
                              <span className="text-[10px] text-muted-foreground">{skill.category}</span>
                              {isGap && (
                                <span className="rounded bg-amber-100 px-1.5 py-0.5 text-[10px] font-medium text-amber-700 dark:bg-amber-900/40 dark:text-amber-300">差距</span>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })()
            ) : (
              <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
                <h3 className="mb-4 text-base font-semibold text-foreground">提取的技能要求</h3>
                <div className="space-y-2">
                  {displayResult.extracted_skills?.map((skill, i) => (
                    <div key={i} className="flex items-center gap-2 rounded-xl border border-border px-3 py-2">
                      <span className="text-sm font-medium text-foreground">{skill.skill_name}</span>
                      <span className={`rounded px-1.5 py-0.5 text-[10px] font-medium ${importanceColors[skill.importance] || importanceColors.medium}`}>
                        {importanceLabels[skill.importance] || '中'}
                      </span>
                      <span className="text-[10px] text-muted-foreground">{skill.category}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
              <h3 className="mb-4 text-base font-semibold text-foreground">技能差距</h3>
              {displayResult.gaps && displayResult.gaps.length > 0 ? (
                <div className="space-y-3">
                  {displayResult.gaps.map((gap, i) => (
                    <div key={i} className="rounded-xl border border-amber-200 bg-amber-50/50 px-4 py-3 dark:border-amber-800 dark:bg-amber-900/20">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium text-foreground">{gap.skill_name}</span>
                            <span className="rounded bg-amber-100 px-1.5 py-0.5 text-[10px] text-amber-700 dark:bg-amber-900/40 dark:text-amber-300">{gap.category}</span>
                          </div>
                          {gap.suggestion && <p className="mt-1 text-xs text-muted-foreground">{gap.suggestion}</p>}
                          {gap.related_module_name && (
                            <p className="mt-1 text-xs text-primary">相关模块：{gap.related_module_name}</p>
                          )}
                        </div>
                        <button
                          onClick={() => handleAddToSkillTree(gap)}
                          disabled={addingSkill === gap.skill_name || addedSkills.has(gap.skill_name)}
                          className={`ml-3 shrink-0 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
                            addedSkills.has(gap.skill_name)
                              ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300'
                              : 'bg-[#4F46E5] text-white hover:bg-[#4338CA] disabled:opacity-50'
                          }`}
                        >
                          {addedSkills.has(gap.skill_name) ? '已添加' : addingSkill === gap.skill_name ? '添加中...' : '添加到技能树'}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">所有提取的技能均有模块覆盖，暂无明显差距</p>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
