'use client';

import { useState } from 'react';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';

interface CustomModuleDialogProps {
  level: number;
  levelName: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onModuleCreated: () => void;
}

interface GeneratedPreview {
  name: string;
  description: string;
  icon: string;
  tasks: { title: string; objective: string }[];
}

export default function CustomModuleDialog({
  level,
  levelName,
  open,
  onOpenChange,
  onModuleCreated,
}: CustomModuleDialogProps) {
  const [description, setDescription] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [preview, setPreview] = useState<GeneratedPreview | null>(null);
  const [error, setError] = useState('');

  if (!open) return null;

  const handleGenerate = async () => {
    if (description.trim().length < 5) {
      setError('请输入至少 5 个字符的描述');
      return;
    }

    setIsGenerating(true);
    setError('');
    setPreview(null);

    try {
      const res = await fetch('/api/skills/custom-modules/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ description: description.trim(), level }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? '生成失败');
        return;
      }

      // 生成成功，显示预览
      setPreview({
        name: data.module.name,
        description: data.module.description,
        icon: data.module.icon,
        tasks: (data.tasks ?? []).map((t: { title: string; objective: string }) => ({
          title: t.title,
          objective: t.objective,
        })),
      });
    } catch {
      setError('网络错误，请重试');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleConfirm = () => {
    setDescription('');
    setPreview(null);
    setError('');
    onOpenChange(false);
    onModuleCreated();
  };

  const handleRegenerate = () => {
    setPreview(null);
    setError('');
  };

  const handleClose = () => {
    if (!isGenerating) {
      setDescription('');
      setPreview(null);
      setError('');
      onOpenChange(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={handleClose}>
      <div
        className="w-full max-w-lg rounded-2xl border-[#E5E7EB] bg-white p-6 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-[#1F2937]">
            添加自定义技能 · {levelName}
          </h2>
          <button onClick={handleClose} className="text-[#6B7280] hover:text-[#1F2937] transition-colors">
            ✕
          </button>
        </div>

        {!preview ? (
          <>
            <p className="mb-3 text-base text-[#6B7280]">
              描述你想学习的技能，AI 会自动生成学习模块、任务和资源
            </p>
            <Textarea
              value={description}
              onChange={(e) => { setDescription(e.target.value); if (error) setError(''); }}
              placeholder="例如：我想学习如何设计 AI Agent 的记忆系统..."
              className="min-h-[100px] resize-none border-[#E5E7EB] bg-white text-base text-[#1F2937] placeholder:text-[#9CA3AF]"
              disabled={isGenerating}
            />
            {error && <p className="mt-2 text-sm text-[#ff3b30]">{error}</p>}

            {isGenerating ? (
              <div className="mt-4 flex items-center justify-center py-4">
                <div className="h-6 w-6 animate-spin rounded-full border-2 border-indigo-500 border-t-transparent" />
                <span className="ml-3 text-base text-[#6B7280]">AI 正在设计学习模块...</span>
              </div>
            ) : (
              <div className="mt-4 flex justify-end gap-2">
                <Button variant="ghost" onClick={handleClose} className="text-[#6B7280]">
                  取消
                </Button>
                <Button onClick={handleGenerate} disabled={description.trim().length < 5} className="app-btn-primary">
                  生成模块
                </Button>
              </div>
            )}
          </>
        ) : (
          <>
            <div className="mb-4 rounded-xl border-[#E5E7EB] bg-white p-4">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-2xl">{preview.icon}</span>
                <h3 className="text-base font-semibold text-[#1F2937]">{preview.name}</h3>
              </div>
              <p className="text-sm text-[#9CA3AF]">{preview.description}</p>
            </div>

            <div className="mb-4">
              <p className="mb-2 text-sm font-medium text-[#6B7280]">
                学习任务（{preview.tasks.length} 个）
              </p>
              <div className="space-y-2 max-h-[200px] overflow-y-auto">
                {preview.tasks.map((t, i) => (
                  <div key={i} className="flex gap-2 text-sm">
                    <span className="shrink-0 text-indigo-600">{i + 1}.</span>
                    <div>
                      <span className="text-[#1F2937]">{t.title}</span>
                      <p className="text-xs text-[#6B7280]">{t.objective}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex justify-end gap-2">
              <Button variant="ghost" onClick={handleRegenerate} className="text-[#6B7280]">
                重新生成
              </Button>
              <Button onClick={handleConfirm} className="app-btn-primary">
                确认添加
              </Button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
