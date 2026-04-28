'use client';

import { useState, useEffect, useCallback } from 'react';
import { X, Plus, Trash2, ExternalLink, Video, FileText, Loader2, Folder, ChevronRight, FolderOpen } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

interface ExternalResource {
  id: string;
  parent_id: string | null;
  title: string;
  url: string;
  type: 'link' | 'video' | 'doc' | 'folder';
  source: string;
  notes: string | null;
  related_module_name: string | null;
  sort_order: number;
  created_at: string;
}

const TYPE_CONFIG: { value: 'link' | 'video' | 'doc'; label: string; icon: typeof ExternalLink }[] = [
  { value: 'link', label: '链接', icon: ExternalLink },
  { value: 'video', label: '视频', icon: Video },
  { value: 'doc', label: '文档', icon: FileText },
];

const TYPE_COLORS: Record<string, string> = {
  link: 'bg-indigo-50 text-indigo-600',
  video: 'bg-[#ff3b30]/10 text-[#ff3b30]',
  doc: 'bg-[#34c759]/10 text-[#34c759]',
  folder: 'bg-amber-50 text-amber-600',
};

const TYPE_ICONS: Record<string, string> = { link: '🔗', video: '🎬', doc: '📄', folder: '📁' };

export default function ExternalResourcesPanel() {
  const [resources, setResources] = useState<ExternalResource[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentFolder, setCurrentFolder] = useState<string | null>(null);
  const [showAdd, setShowAdd] = useState(false);
  const [addType, setAddType] = useState<'link' | 'video' | 'doc' | 'folder'>('link');
  const [title, setTitle] = useState('');
  const [url, setUrl] = useState('');
  const [source, setSource] = useState('');
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const fetchResources = useCallback(async () => {
    try {
      const res = await fetch('/api/external-resources');
      if (res.ok) {
        const data = await res.json();
        setResources(data.resources ?? []);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchResources(); }, [fetchResources]);

  // Build folder path for breadcrumb
  const getFolderPath = useCallback((folderId: string | null): { id: string | null; title: string }[] => {
    if (!folderId) return [{ id: null, title: '全部资源' }];
    const path: { id: string | null; title: string }[] = [{ id: null, title: '全部资源' }];
    let current: string | null = folderId;
    while (current) {
      const folder = resources.find((r) => r.id === current);
      if (folder) {
        path.push({ id: folder.id, title: folder.title });
        current = folder.parent_id ?? null;
      } else break;
    }
    return path;
  }, [resources]);

  const folderPath = getFolderPath(currentFolder);

  // Items in current folder
  const currentItems = resources.filter((r) => r.parent_id === currentFolder);
  const folders = currentItems.filter((r) => r.type === 'folder');
  const files = currentItems.filter((r) => r.type !== 'folder');
  const sortedItems = [...folders, ...files];

  const handleAdd = async () => {
    if (!title.trim()) return;
    if (addType !== 'folder' && !url.trim()) return;
    setSubmitting(true);
    try {
      const res = await fetch('/api/external-resources', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: title.trim(),
          url: addType === 'folder' ? '' : url.trim(),
          type: addType,
          source: source.trim(),
          notes: notes.trim() || null,
          parent_id: currentFolder,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        setResources((prev) => [data.resource, ...prev]);
        setTitle(''); setUrl(''); setSource(''); setNotes(''); setAddType('link');
        setShowAdd(false);
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    // Check if folder has children
    const hasChildren = resources.some((r) => r.parent_id === id);
    if (hasChildren && !confirm('此文件夹内有资源，删除后内部资源也会一并删除。确定删除？')) return;
    if (!hasChildren && !confirm('确定删除？')) return;
    const res = await fetch(`/api/external-resources/${id}`, { method: 'DELETE' });
    if (res.ok) {
      // Remove deleted item and all its descendants
      const getDescendants = (parentId: string): string[] => {
        const children = resources.filter((r) => r.parent_id === parentId).map((r) => r.id);
        return [parentId, ...children.flatMap(getDescendants)];
      };
      const toRemove = new Set(getDescendants(id));
      setResources((prev) => prev.filter((r) => !toRemove.has(r.id)));
    }
  };

  return (
    <div>
      {/* Breadcrumb */}
      <div className="mb-4 flex items-center gap-1 text-sm">
        {folderPath.map((p, i) => (
          <span key={p.id ?? 'root'} className="flex items-center gap-1">
            {i > 0 && <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />}
            <button
              onClick={() => setCurrentFolder(p.id)}
              className={`transition-colors ${i === folderPath.length - 1 ? 'font-medium text-foreground' : 'text-muted-foreground hover:text-indigo-600'}`}
            >
              {i === 0 && <span className="mr-1">📚</span>}
              {p.title}
            </button>
          </span>
        ))}
      </div>

      {/* Action buttons */}
      <div className="mb-4 flex items-center gap-2">
        <button
          onClick={() => { setAddType('folder'); setShowAdd(true); }}
          className="flex items-center gap-1 rounded-lg border border-border bg-card px-3 py-1.5 text-sm font-medium text-muted-foreground transition-colors hover:border-amber-300 hover:bg-amber-50 hover:text-amber-600"
        >
          <Folder className="h-4 w-4" />
          新建文件夹
        </button>
        <button
          onClick={() => { setAddType('link'); setShowAdd(true); }}
          className="flex items-center gap-1 rounded-lg bg-indigo-50 px-3 py-1.5 text-sm font-medium text-indigo-600 transition-colors hover:bg-indigo-100"
        >
          <Plus className="h-4 w-4" />
          添加资源
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center py-8">
          <Loader2 className="h-5 w-5 animate-spin text-indigo-500" />
        </div>
      ) : sortedItems.length === 0 ? (
        <p className="py-6 text-center text-sm text-muted-foreground">暂无资源，点击上方按钮添加</p>
      ) : (
        <div className="space-y-2">
          {sortedItems.map((r) => (
            <div
              key={r.id}
              className="group flex items-start gap-3 rounded-xl border border-border bg-card px-4 py-3 transition-colors hover:border-indigo-200 hover:bg-indigo-50/30"
            >
              {r.type === 'folder' ? (
                <button
                  onClick={() => setCurrentFolder(r.id)}
                  className="flex min-w-0 flex-1 items-start gap-3 text-left"
                >
                  <span className={`shrink-0 rounded-md px-1.5 py-0.5 text-sm font-medium ${TYPE_COLORS.folder}`}>
                    📁
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-base font-medium text-foreground">{r.title}</span>
                      <span className="rounded-full bg-amber-50 px-2 py-0.5 text-xs text-amber-600">
                        {resources.filter((c) => c.parent_id === r.id).length} 项
                      </span>
                    </div>
                    {r.notes && <p className="mt-0.5 text-sm text-muted-foreground truncate">{r.notes}</p>}
                  </div>
                </button>
              ) : (
                <div className="flex min-w-0 flex-1 items-start gap-3">
                  <span className={`shrink-0 rounded-md px-1.5 py-0.5 text-sm font-medium ${TYPE_COLORS[r.type] ?? TYPE_COLORS.link}`}>
                    {TYPE_ICONS[r.type] ?? '🔗'} {TYPE_CONFIG.find((t) => t.value === r.type)?.label ?? '链接'}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <a href={r.url} target="_blank" rel="noopener noreferrer" className="truncate text-base font-medium text-foreground hover:text-indigo-600 hover:underline">
                        {r.title}
                      </a>
                      {r.related_module_name && (
                        <span className="shrink-0 rounded-full bg-indigo-50 px-2 py-0.5 text-xs text-indigo-600">{r.related_module_name}</span>
                      )}
                    </div>
                    <div className="mt-0.5 flex items-center gap-2 text-sm text-muted-foreground">
                      {r.source && <span>{r.source}</span>}
                      {r.notes && <span className="truncate">— {r.notes}</span>}
                    </div>
                  </div>
                </div>
              )}
              <button
                onClick={() => handleDelete(r.id)}
                className="shrink-0 text-muted-foreground opacity-0 transition-opacity hover:text-[#ff3b30] group-hover:opacity-100"
                title="删除"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Add dialog */}
      {showAdd && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/40" onClick={() => setShowAdd(false)}>
          <div className="w-full max-w-md rounded-2xl bg-card p-6 shadow-xl" onClick={(e) => e.stopPropagation()}>
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-foreground">
                {addType === 'folder' ? '新建文件夹' : '添加学习资源'}
              </h3>
              <button onClick={() => setShowAdd(false)} className="text-muted-foreground hover:text-muted-foreground">
                <X className="h-5 w-5" />
              </button>
            </div>

            {addType !== 'folder' && (
              <div className="mb-4">
                <label className="mb-1.5 block text-sm font-medium text-foreground">类型</label>
                <div className="flex gap-2">
                  {TYPE_CONFIG.map((tc) => {
                    const Icon = tc.icon;
                    return (
                      <button
                        key={tc.value}
                        onClick={() => setAddType(tc.value)}
                        className={`flex items-center gap-1.5 rounded-lg border px-3 py-2 text-sm transition-colors ${
                          addType === tc.value ? 'border-indigo-300 bg-indigo-50 text-indigo-600' : 'border-border text-muted-foreground hover:border-border'
                        }`}
                      >
                        <Icon className="h-4 w-4" />
                        {tc.label}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            <div className="mb-3">
              <label className="mb-1.5 block text-sm font-medium text-foreground">
                {addType === 'folder' ? '文件夹名称' : '标题'} *
              </label>
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder={addType === 'folder' ? '文件夹名称' : '资源名称'}
                className="border-border"
              />
            </div>

            {addType !== 'folder' && (
              <>
                <div className="mb-3">
                  <label className="mb-1.5 block text-sm font-medium text-foreground">链接 *</label>
                  <Input value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://..." type="url" className="border-border" />
                </div>
                <div className="mb-3">
                  <label className="mb-1.5 block text-sm font-medium text-foreground">来源</label>
                  <Input value={source} onChange={(e) => setSource(e.target.value)} placeholder="如：微信公众号、B站、知乎..." className="border-border" />
                </div>
              </>
            )}

            <div className="mb-5">
              <label className="mb-1.5 block text-sm font-medium text-foreground">备注</label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder={addType === 'folder' ? '文件夹描述...' : '学习笔记、心得...'}
                rows={2}
                className="w-full rounded-lg border border-border px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:border-indigo-300 focus:outline-none focus:ring-2 focus:ring-indigo-100"
              />
            </div>

            <div className="flex justify-end gap-2">
              <Button variant="ghost" onClick={() => setShowAdd(false)}>取消</Button>
              <Button
                onClick={handleAdd}
                disabled={submitting || !title.trim() || (addType !== 'folder' && !url.trim())}
                className="bg-indigo-600 hover:bg-indigo-700"
              >
                {submitting ? <Loader2 className="mr-1 h-4 w-4 animate-spin" /> : null}
                {addType === 'folder' ? '创建' : '添加'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
