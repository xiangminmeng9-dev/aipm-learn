'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import Markdown from '@/components/ui/markdown';

interface ResumeVersion {
  id: string;
  style_type: string;
  company_name: string | null;
  position_name: string | null;
  created_at: string;
  changes_summary: string;
  modified_resume: string;
  original_resume_text: string;
  jd_text: string;
}

const STYLE_LABELS: Record<string, string> = {
  standard: '通用标准',
  big_company: '大厂风格',
  industry_tech: '科技行业',
  industry_finance: '金融行业',
  industry_internet: '互联网行业',
};

const STYLE_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  standard: { bg: 'bg-muted', text: 'text-muted-foreground', border: 'border-border' },
  big_company: { bg: 'bg-indigo-50', text: 'text-indigo-600', border: 'border-indigo-200' },
  industry_tech: { bg: 'bg-sky-50', text: 'text-sky-600', border: 'border-sky-200' },
  industry_finance: { bg: 'bg-amber-50', text: 'text-amber-600', border: 'border-amber-200' },
  industry_internet: { bg: 'bg-emerald-50', text: 'text-emerald-600', border: 'border-emerald-200' },
};

export default function ResumeVersionsPage() {
  const router = useRouter();
  const [versions, setVersions] = useState<ResumeVersion[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());

  const fetchVersions = useCallback(async () => {
    setIsLoading(true);
    setError('');
    try {
      const res = await fetch('/api/resume/versions');
      if (!res.ok) throw new Error('获取版本失败');
      const data = await res.json();
      setVersions(data.versions || []);
    } catch {
      setError('获取历史版本失败');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchVersions();
  }, [fetchVersions]);

  const handleDelete = async (id: string) => {
    if (!confirm('确定删除此版本？')) return;
    setDeletingId(id);
    try {
      const res = await fetch(`/api/resume/versions?id=${id}`, { method: 'DELETE' });
      if (res.ok) {
        setVersions((prev) => prev.filter((v) => v.id !== id));
      }
    } catch {
      // Silently fail
    } finally {
      setDeletingId(null);
    }
  };

  const toggleExpand = (id: string) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleRestore = (version: ResumeVersion) => {
    try {
      localStorage.setItem('resume-editor-state', JSON.stringify({
        resumeText: version.original_resume_text || '',
        jdText: version.jd_text || '',
        style: version.style_type,
        analysis: null,
        modifiedResume: version.modified_resume || '',
        changesSummary: version.changes_summary || '',
        companyName: version.company_name || '',
        positionName: version.position_name || '',
        savedAt: Date.now(),
      }));
    } catch { /* ignore */ }
    router.push('/resume');
  };

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-indigo-500 border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="min-h-full p-6 md:p-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-foreground">历史版本</h1>
        <p className="mt-1 text-sm text-muted-foreground">每次生成修改版简历都会自动保存，点击「继续编辑」可恢复到编辑器</p>
      </div>

      {/* Error */}
      {error && (
        <div className="mb-6 rounded-xl border border-rose-200 bg-rose-50/30 p-4 text-sm text-rose-600">
          {error}
          <button onClick={fetchVersions} className="ml-3 text-xs font-medium text-rose-500 hover:text-rose-700">
            重试
          </button>
        </div>
      )}

      {/* Empty state */}
      {versions.length === 0 && !error && (
        <div className="rounded-xl border border-border bg-card p-12 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-muted">
            <svg className="h-8 w-8 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h3 className="text-sm font-medium text-muted-foreground">暂无历史版本</h3>
          <p className="mt-1 text-xs text-muted-foreground">修改简历后，版本将自动保存到这里</p>
        </div>
      )}

      {/* Versions list - always show full content */}
      <div className="space-y-6">
        <AnimatePresence>
          {versions.map((version, index) => {
            const styleLabel = STYLE_LABELS[version.style_type] || version.style_type;
            const styleColor = STYLE_COLORS[version.style_type] || STYLE_COLORS.standard;
            const isDeleting = deletingId === version.id;

            return (
              <motion.div
                key={version.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ delay: index * 0.03 }}
                className="overflow-hidden rounded-xl border border-border bg-card"
              >
                {/* Header row - clickable to toggle */}
                <div
                  className="flex items-center justify-between border-b border-border px-5 py-4 cursor-pointer select-none hover:bg-muted/30 transition-colors"
                  onClick={() => toggleExpand(version.id)}
                >
                  <div className="flex items-center gap-3">
                    <svg
                      className={`h-4 w-4 text-muted-foreground transition-transform ${expandedIds.has(version.id) ? 'rotate-90' : ''}`}
                      fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                    </svg>
                    <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${styleColor.bg} ${styleColor.text} border ${styleColor.border}`}>
                      {styleLabel}
                    </span>
                    <span className="text-sm font-semibold text-foreground">
                      {version.company_name || version.position_name
                        ? `${version.company_name || '未指定'} · ${version.position_name || '未指定'}`
                        : '简历修改版'}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {new Date(version.created_at).toLocaleString('zh-CN')}
                    </span>
                  </div>
                  <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                    <button
                      onClick={() => handleRestore(version)}
                      className="rounded-lg bg-indigo-50 px-3 py-1.5 text-xs font-medium text-indigo-600 transition-colors hover:bg-indigo-100"
                    >
                      继续编辑
                    </button>
                    <button
                      onClick={() => handleDelete(version.id)}
                      disabled={isDeleting}
                      className="rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-rose-50 hover:text-rose-500 disabled:opacity-50"
                    >
                      {isDeleting ? (
                        <span className="h-4 w-4 animate-spin rounded-full border-2 border-rose-400 border-t-transparent" />
                      ) : (
                        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                        </svg>
                      )}
                    </button>
                  </div>
                </div>

                {/* Content - collapsible */}
                <AnimatePresence>
                  {expandedIds.has(version.id) && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className="overflow-hidden"
                    >
                      <div className="p-5">
                        {/* Changes summary */}
                        {version.changes_summary && (
                          <div className="mb-4 rounded-lg border border-indigo-100 bg-indigo-50/30 p-3">
                            <h4 className="mb-1 text-xs font-semibold text-indigo-700">修改摘要</h4>
                            <Markdown content={version.changes_summary} />
                          </div>
                        )}

                        {/* Modified resume content */}
                        {version.modified_resume
                          ? <Markdown content={version.modified_resume} />
                          : <p className="text-sm text-muted-foreground">（简历内容为空，可能是生成时 AI 返回格式异常）</p>
                        }
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </div>
  );
}