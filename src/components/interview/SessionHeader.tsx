'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';

interface SessionHeaderProps {
  jdText: string | null;
  resumeText: string | null;
  onUpdate: (data: { jd_text?: string; resume_text?: string }) => void;
  isUpdating: boolean;
}

export default function SessionHeader({
  jdText,
  resumeText,
  onUpdate,
  isUpdating,
}: SessionHeaderProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [jd, setJd] = useState(jdText ?? '');
  const [resume, setResume] = useState(resumeText ?? '');

  const handleSave = () => {
    onUpdate({ jd_text: jd, resume_text: resume });
    setIsEditing(false);
  };

  const handleCancel = () => {
    setJd(jdText ?? '');
    setResume(resumeText ?? '');
    setIsEditing(false);
  };

  if (!isEditing) {
    return (
      <div className="mt-2 flex flex-wrap items-center gap-2">
        {/* JD Badge */}
        {jdText ? (
          <span className="inline-flex items-center gap-1 rounded-full bg-sky-50 px-2.5 py-1 text-xs font-medium text-sky-700 border border-sky-200">
            <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 18 7.125v-1.5a1.125 1.125 0 0 0-1.125-1.125M3.75 14.25h16.5M3.75 9.75h16.5M3.75 5.25h16.5" />
            </svg>
            JD 已设置
          </span>
        ) : null}

        {/* Resume Badge */}
        {resumeText ? (
          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-700 border border-emerald-200">
            <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.762 0-5.399-.258-7.499-.632Z" />
            </svg>
            简历已设置
          </span>
        ) : null}

        {/* Edit Button */}
        <button
          onClick={() => setIsEditing(true)}
          className="inline-flex items-center gap-1 rounded-full bg-secondary px-2.5 py-1 text-xs font-medium text-muted-foreground transition hover:bg-indigo-50 hover:text-indigo-600"
        >
          <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0 1 15.75 21H5.25A2.25 2.25 0 0 1 3 18.75V8.25A2.25 2.25 0 0 1 5.25 6H10" />
          </svg>
          {jdText || resumeText ? '编辑' : '添加 JD / 简历'}
        </button>
      </div>
    );
  }

  return (
    <div className="mt-3 space-y-3 rounded-xl border border-border bg-card p-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-foreground">编辑背景信息</h3>
        <button onClick={handleCancel} className="text-xs text-muted-foreground hover:text-muted-foreground">取消</button>
      </div>
      <div>
        <label className="mb-1 block text-xs font-medium text-muted-foreground">岗位 JD</label>
        <Textarea
          value={jd}
          onChange={(e) => setJd(e.target.value)}
          placeholder="粘贴目标岗位的 JD..."
          className="min-h-[80px] resize-none border-border bg-muted text-sm text-foreground"
        />
      </div>
      <div>
        <label className="mb-1 block text-xs font-medium text-muted-foreground">个人简历</label>
        <Textarea
          value={resume}
          onChange={(e) => setResume(e.target.value)}
          placeholder="粘贴你的简历要点..."
          className="min-h-[80px] resize-none border-border bg-muted text-sm text-foreground"
        />
      </div>
      <Button
        size="sm"
        onClick={handleSave}
        disabled={isUpdating}
        className="bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-50"
      >
        {isUpdating ? '保存中...' : '保存'}
      </Button>
    </div>
  );
}
