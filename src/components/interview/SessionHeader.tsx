'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

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
      <Card className="border-neutral-700 bg-neutral-800/50">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm text-neutral-300">背景信息</CardTitle>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsEditing(true)}
              className="text-xs text-neutral-400 hover:text-neutral-200"
            >
              {jdText || resumeText ? '编辑' : '+ 添加 JD / 简历'}
            </Button>
          </div>
        </CardHeader>
        {(jdText || resumeText) && (
          <CardContent className="pt-0">
            {jdText && (
              <div className="mb-2">
                <span className="text-xs text-neutral-500">JD：</span>
                <p className="mt-1 line-clamp-2 text-xs text-neutral-400">{jdText}</p>
              </div>
            )}
            {resumeText && (
              <div>
                <span className="text-xs text-neutral-500">简历：</span>
                <p className="mt-1 line-clamp-2 text-xs text-neutral-400">{resumeText}</p>
              </div>
            )}
          </CardContent>
        )}
      </Card>
    );
  }

  return (
    <Card className="border-neutral-700 bg-neutral-800/50">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm text-neutral-300">编辑背景信息</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 pt-0">
        <div>
          <label className="mb-1 block text-xs text-neutral-500">岗位 JD</label>
          <Textarea
            value={jd}
            onChange={(e) => setJd(e.target.value)}
            placeholder="粘贴目标岗位的 JD..."
            className="min-h-[80px] resize-none border-neutral-700 bg-neutral-900 text-sm text-neutral-200"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs text-neutral-500">个人简历</label>
          <Textarea
            value={resume}
            onChange={(e) => setResume(e.target.value)}
            placeholder="粘贴你的简历要点..."
            className="min-h-[80px] resize-none border-neutral-700 bg-neutral-900 text-sm text-neutral-200"
          />
        </div>
        <div className="flex gap-2">
          <Button
            size="sm"
            onClick={handleSave}
            disabled={isUpdating}
            className="bg-amber-600 text-neutral-950 hover:bg-amber-500"
          >
            {isUpdating ? '保存中...' : '保存'}
          </Button>
          <Button size="sm" variant="ghost" onClick={handleCancel} className="text-neutral-400">
            取消
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
