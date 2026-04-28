'use client';

import { useState, useEffect } from 'react';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';

interface CustomModuleDialogProps {
  level: number;
  levelName: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onModuleCreated: () => void;
  existingModules?: { id: string; name: string; level: number }[];
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
  existingModules = [],
}: CustomModuleDialogProps) {
  const [description, setDescription] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [preview, setPreview] = useState<GeneratedPreview | null>(null);
  const [error, setError] = useState('');
  const [selectedPrereqs, setSelectedPrereqs] = useState<string[]>([]);

  // Fetch modules for prerequisite selection
  const [availableModules, setAvailableModules] = useState<{ id: string; name: string; level: number }[]>(existingModules);
  useEffect(() => {
    if (open && existingModules.length === 0) {
      fetch('/api/skills/modules')
        .then((r) => r.json())
        .then((data) => {
          const mods = (data.modules ?? []).filter((m: { id: string }) => m.id !== '__jd_gaps__' && m.id !== '__bookmarked_tech__');
          setAvailableModules(mods.map((m: { id: string; name: string; level: number }) => ({ id: m.id, name: m.name, level: m.level })));
        })
        .catch(() => {});
    }
  }, [open, existingModules.length]);

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
        body: JSON.stringify({ description: description.trim(), level, prerequisites: selectedPrereqs }),
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
    setSelectedPrereqs([]);
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
      setSelectedPrereqs([]);
      onOpenChange(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={handleClose}>
      <div
        className="w-full max-w-lg rounded-2xl border-border bg-card p-6 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-foreground">
            添加自定义技能 · {levelName}
          </h2>
          <button onClick={handleClose} className="text-muted-foreground hover:text-foreground transition-colors">
            ✕
          </button>
        </div>

        {!preview ? (
          <>
            <p className="mb-3 text-base text-muted-foreground">
              描述你想学习的技能，AI 会自动生成学习模块、任务和资源
            </p>
            <Textarea
              value={description}
              onChange={(e) => { setDescription(e.target.value); if (error) setError(''); }}
              placeholder="例如：我想学习如何设计 AI Agent 的记忆系统..."
              className="min-h-[100px] resize-none border-border bg-card text-base text-foreground placeholder:text-muted-foreground"
              disabled={isGenerating}
            />

            {/* Prerequisite selector */}
            <div className="mt-3">
              <label className="mb-1.5 block text-sm font-medium text-foreground">
                前置技能
                <span className="ml-1 text-xs font-normal text-muted-foreground">（选填）</span>
              </label>
              <div className="max-h-28 overflow-y-auto rounded-lg border border-border p-2 space-y-0.5">
                {availableModules.length === 0 && (
                  <div className="px-2 py-1 text-xs text-muted-foreground">暂无可选模块</div>
                )}
                {availableModules.map((m) => (
                  <label key={m.id} className="flex items-center gap-2 rounded-md px-2 py-1 hover:bg-muted/50 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={selectedPrereqs.includes(m.id)}
                      onChange={(e) => {
                        setSelectedPrereqs((prev) =>
                          e.target.checked ? [...prev, m.id] : prev.filter((id) => id !== m.id)
                        );
                      }}
                      className="rounded border-border"
                    />
                    <span className="text-xs text-foreground">{m.name}</span>
                    <span className="text-[10px] text-muted-foreground">L{m.level}</span>
                  </label>
                ))}
              </div>
              {selectedPrereqs.length > 0 && (
                <div className="mt-1 text-xs text-muted-foreground">已选 {selectedPrereqs.length} 个前置模块</div>
              )}
            </div>

            {error && <p className="mt-2 text-sm text-[#ff3b30]">{error}</p>}

            {isGenerating ? (
              <div className="mt-4 flex items-center justify-center py-4">
                <div className="h-6 w-6 animate-spin rounded-full border-2 border-indigo-500 border-t-transparent" />
                <span className="ml-3 text-base text-muted-foreground">AI 正在设计学习模块...</span>
              </div>
            ) : (
              <div className="mt-4 flex justify-end gap-2">
                <Button variant="ghost" onClick={handleClose} className="text-muted-foreground">
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
            <div className="mb-4 rounded-xl border-border bg-card p-4">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-2xl">{preview.icon}</span>
                <h3 className="text-base font-semibold text-foreground">{preview.name}</h3>
              </div>
              <p className="text-sm text-muted-foreground">{preview.description}</p>
            </div>

            <div className="mb-4">
              <p className="mb-2 text-sm font-medium text-muted-foreground">
                学习任务（{preview.tasks.length} 个）
              </p>
              <div className="space-y-2 max-h-[200px] overflow-y-auto">
                {preview.tasks.map((t, i) => (
                  <div key={i} className="flex gap-2 text-sm">
                    <span className="shrink-0 text-indigo-600">{i + 1}.</span>
                    <div>
                      <span className="text-foreground">{t.title}</span>
                      <p className="text-xs text-muted-foreground">{t.objective}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex justify-end gap-2">
              <Button variant="ghost" onClick={handleRegenerate} className="text-muted-foreground">
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
