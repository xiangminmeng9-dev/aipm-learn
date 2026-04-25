'use client';

import { useState } from 'react';
import { X, Loader2, FileText, Video, BookOpen, StickyNote } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import type { UserResourceType, UserTaskType } from '@/types';

interface AddResourceDialogProps {
  taskId: string;
  taskType: UserTaskType;
  open: boolean;
  onClose: () => void;
  onAdded: (resource: unknown) => void;
}

const RESOURCE_TYPES: { value: UserResourceType; label: string; icon: typeof FileText }[] = [
  { value: 'article', label: '文章', icon: FileText },
  { value: 'video', label: '视频', icon: Video },
  { value: 'book', label: '书籍', icon: BookOpen },
  { value: 'note', label: '笔记', icon: StickyNote },
];

export default function AddResourceDialog({
  taskId,
  taskType,
  open,
  onClose,
  onAdded,
}: AddResourceDialogProps) {
  const [type, setType] = useState<UserResourceType>('article');
  const [title, setTitle] = useState('');
  const [url, setUrl] = useState('');
  const [source, setSource] = useState('');
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);

  if (!open) return null;

  const handleSubmit = async () => {
    if (!title.trim() || (type !== 'note' && !url.trim())) return;
    setSubmitting(true);
    try {
      const res = await fetch('/api/skills/resources', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          task_id: taskId,
          task_type: taskType,
          type,
          title: title.trim(),
          url: url.trim(),
          source: source.trim(),
          notes: notes.trim() || null,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        onAdded(data.resource);
        setTitle('');
        setUrl('');
        setSource('');
        setNotes('');
        setType('article');
        onClose();
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={onClose}>
      <div
        className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-lg font-semibold text-[#1F2937]">添加学习资源</h3>
          <button onClick={onClose} className="text-[#9CA3AF] hover:text-[#6B7280]">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* 类型选择 */}
        <div className="mb-4">
          <label className="mb-1.5 block text-sm font-medium text-[#374151]">类型</label>
          <div className="flex gap-2">
            {RESOURCE_TYPES.map((rt) => {
              const Icon = rt.icon;
              return (
                <button
                  key={rt.value}
                  onClick={() => setType(rt.value)}
                  className={`flex items-center gap-1.5 rounded-lg border px-3 py-2 text-sm transition-colors ${
                    type === rt.value
                      ? 'border-indigo-300 bg-indigo-50 text-indigo-600'
                      : 'border-[#E5E7EB] text-[#6B7280] hover:border-[#D1D5DB]'
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  {rt.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* 标题 */}
        <div className="mb-3">
          <label className="mb-1.5 block text-sm font-medium text-[#374151]">标题 *</label>
          <Input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="资源名称"
            className="border-[#E5E7EB]"
          />
        </div>

        {/* 链接（笔记类型隐藏） */}
        {type !== 'note' && (
          <div className="mb-3">
            <label className="mb-1.5 block text-sm font-medium text-[#374151]">链接 *</label>
            <Input
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://..."
              type="url"
              className="border-[#E5E7EB]"
            />
          </div>
        )}

        {/* 来源 */}
        <div className="mb-3">
          <label className="mb-1.5 block text-sm font-medium text-[#374151]">来源</label>
          <Input
            value={source}
            onChange={(e) => setSource(e.target.value)}
            placeholder="如：微信公众号、B站、知乎..."
            className="border-[#E5E7EB]"
          />
        </div>

        {/* 备注 */}
        <div className="mb-5">
          <label className="mb-1.5 block text-sm font-medium text-[#374151]">备注</label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="你的学习笔记、心得..."
            rows={3}
            className="w-full rounded-lg border border-[#E5E7EB] px-3 py-2 text-sm text-[#374151] placeholder:text-[#9CA3AF] focus:border-indigo-300 focus:outline-none focus:ring-2 focus:ring-indigo-100"
          />
        </div>

        {/* 按钮 */}
        <div className="flex justify-end gap-2">
          <Button variant="ghost" onClick={onClose}>
            取消
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={submitting || !title.trim() || (type !== 'note' && !url.trim())}
            className="bg-indigo-600 hover:bg-indigo-700"
          >
            {submitting ? <Loader2 className="mr-1 h-4 w-4 animate-spin" /> : null}
            添加
          </Button>
        </div>
      </div>
    </div>
  );
}