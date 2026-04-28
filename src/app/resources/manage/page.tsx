'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { ExternalResource } from '@/types';
import { TYPE_CONFIG, TYPE_COLORS, TYPE_ICONS, AI_PM_DIRECTIONS } from '@/components/resources/constants';

export default function ResourcesManagePage() {
  const [resources, setResources] = useState<ExternalResource[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [currentFolderId, setCurrentFolderId] = useState<string | null>(null);
  const [breadcrumb, setBreadcrumb] = useState<{ id: string | null; title: string }[]>([{ id: null, title: '全部资源' }]);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [addType, setAddType] = useState<'link' | 'video' | 'doc' | 'folder'>('link');
  const [addTitle, setAddTitle] = useState('');
  const [addUrl, setAddUrl] = useState('');
  const [addSource, setAddSource] = useState('');
  const [addNotes, setAddNotes] = useState('');
  const [adding, setAdding] = useState(false);
  const [expandedDirection, setExpandedDirection] = useState<string | null>(null);

  const fetchResources = useCallback(async () => {
    try {
      const res = await fetch('/api/external-resources');
      if (res.ok) { const data = await res.json(); setResources(data.resources ?? []); }
    } finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchResources(); }, [fetchResources]);

  const navigateToFolder = (folderId: string | null, folderTitle?: string) => {
    if (folderId === null) {
      setCurrentFolderId(null);
      setBreadcrumb([{ id: null, title: '全部资源' }]);
      return;
    }
    const folder = resources.find((r) => r.id === folderId);
    if (!folder) return;
    const idx = breadcrumb.findIndex((b) => b.id === folderId);
    if (idx >= 0) {
      setBreadcrumb(breadcrumb.slice(0, idx + 1));
    } else {
      setBreadcrumb([...breadcrumb, { id: folderId, title: folderTitle ?? folder.title }]);
    }
    setCurrentFolderId(folderId);
  };

  const doAdd = async (payload: { title: string; url?: string; type: string; source?: string; notes?: string; parent_id?: string | null }) => {
    setAdding(true);
    try {
      const res = await fetch('/api/external-resources', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...payload, parent_id: payload.parent_id ?? currentFolderId }),
      });
      if (res.ok) {
        await fetchResources();
        setShowAddDialog(false);
        setAddTitle(''); setAddUrl(''); setAddSource(''); setAddNotes('');
      }
    } finally { setAdding(false); }
  };

  const doDelete = async (id: string) => {
    if (!confirm('确认删除？')) return;
    const res = await fetch(`/api/external-resources/${id}`, { method: 'DELETE' });
    if (res.ok) fetchResources();
  };

  const addDirectionResources = async (directionId: string) => {
    const dir = AI_PM_DIRECTIONS.find((d) => d.id === directionId);
    if (!dir) return;
    setAdding(true);
    try {
      for (const tpl of dir.templates) {
        await fetch('/api/external-resources', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ title: tpl.title, url: tpl.url, type: tpl.type, source: tpl.source, parent_id: currentFolderId }),
        });
      }
      await fetchResources();
    } finally { setAdding(false); }
  };

  const addSingleTemplate = async (tpl: { title: string; url: string; type: string; source: string }) => {
    setAdding(true);
    try {
      await fetch('/api/external-resources', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: tpl.title, url: tpl.url, type: tpl.type, source: tpl.source, parent_id: currentFolderId }),
      });
      await fetchResources();
    } finally { setAdding(false); }
  };

  const currentItems = resources
    .filter((r) => r.parent_id === currentFolderId)
    .filter((r) => !search || r.title.toLowerCase().includes(search.toLowerCase()));
  const folders = currentItems.filter((r) => r.type === 'folder');
  const files = currentItems.filter((r) => r.type !== 'folder');

  if (loading) {
    return (
      <div className="p-8">
        <div className="flex justify-center py-16"><div className="h-8 w-8 animate-spin rounded-full border-2 border-indigo-500 border-t-transparent" /></div>
      </div>
    );
  }

  return (
    <div className="p-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-semibold text-foreground">资源管理</h1>
          <p className="mt-2 text-lg text-muted-foreground">管理学习资源与文件夹</p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => { setAddType('folder'); setAddTitle(''); setShowAddDialog(true); }}
            className="rounded-xl border border-border bg-card px-4 py-2.5 text-base font-medium text-foreground transition hover:bg-muted"
          >
            📁 新建文件夹
          </button>
          <button
            onClick={() => { setAddType('link'); setAddTitle(''); setAddUrl(''); setAddSource(''); setAddNotes(''); setShowAddDialog(true); }}
            className="rounded-xl bg-indigo-600 px-4 py-2.5 text-base font-medium text-white transition hover:bg-indigo-700"
          >
            + 添加资源
          </button>
        </div>
      </div>

      {/* Breadcrumb */}
      <div className="flex items-center gap-1.5 text-base">
        {breadcrumb.map((b, i) => (
          <span key={i} className="flex items-center gap-1.5">
            {i > 0 && <span className="text-muted-foreground">/</span>}
            {i === breadcrumb.length - 1 ? (
              <span className="font-medium text-foreground">{b.title}</span>
            ) : (
              <button onClick={() => navigateToFolder(b.id)} className="text-muted-foreground hover:text-indigo-600 transition">
                {b.title}
              </button>
            )}
          </span>
        ))}
      </div>

      {/* Search */}
      <div className="relative">
        <svg className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
        </svg>
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="搜索资源..."
          className="w-full rounded-xl border border-border bg-card py-2.5 pl-10 pr-4 text-base text-foreground placeholder-[#9CA3AF] outline-none transition focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
        />
      </div>

      {/* AI PM Learning Directions */}
      <Card className="border-border bg-card">
        <CardHeader>
          <CardTitle className="text-xl text-foreground">AI PM 学习方向快速创建</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {AI_PM_DIRECTIONS.map((dir) => (
              <div key={dir.id} className="rounded-xl border border-border p-4 transition hover:border-indigo-200 hover:shadow-sm">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-xl">{dir.icon}</span>
                    <div>
                      <div className="text-base font-medium text-foreground">{dir.label}</div>
                      <div className="text-sm text-muted-foreground">{dir.description}</div>
                    </div>
                  </div>
                  <button
                    onClick={() => setExpandedDirection(expandedDirection === dir.id ? null : dir.id)}
                    className="rounded-lg p-1.5 text-muted-foreground transition hover:bg-secondary hover:text-foreground"
                  >
                    <svg className={`h-4 w-4 transition ${expandedDirection === dir.id ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
                    </svg>
                  </button>
                </div>
                {expandedDirection === dir.id && (
                  <div className="mt-3 space-y-2">
                    {dir.templates.map((tpl, ti) => (
                      <div key={ti} className="flex items-center justify-between rounded-lg bg-muted px-3 py-2">
                        <div className="flex items-center gap-2 min-w-0">
                          <span className="text-base">{TYPE_ICONS[tpl.type]}</span>
                          <span className="truncate text-base text-foreground">{tpl.title}</span>
                        </div>
                        <button
                          onClick={() => addSingleTemplate(tpl)}
                          disabled={adding}
                          className="shrink-0 rounded-lg bg-indigo-50 px-2.5 py-1 text-sm font-medium text-indigo-600 transition hover:bg-indigo-100 disabled:opacity-50"
                        >
                          添加
                        </button>
                      </div>
                    ))}
                    <button
                      onClick={() => addDirectionResources(dir.id)}
                      disabled={adding}
                      className="w-full rounded-lg bg-indigo-600 py-2 text-base font-medium text-white transition hover:bg-indigo-700 disabled:opacity-50"
                    >
                      全部添加
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Folders */}
      {folders.length > 0 && (
        <div>
          <h3 className="mb-3 text-base font-medium text-muted-foreground">文件夹</h3>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {folders.map((f) => {
              const childCount = resources.filter((r) => r.parent_id === f.id).length;
              return (
                <div
                  key={f.id}
                  onClick={() => navigateToFolder(f.id, f.title)}
                  className="group flex cursor-pointer items-center justify-between rounded-xl border border-border bg-card p-4 transition hover:border-amber-200 hover:shadow-sm"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">📁</span>
                    <div>
                      <div className="text-base font-medium text-foreground">{f.title}</div>
                      <div className="text-sm text-muted-foreground">{childCount} 个项目</div>
                    </div>
                  </div>
                  <button
                    onClick={(e) => { e.stopPropagation(); doDelete(f.id); }}
                    className="rounded-lg p-1.5 text-muted-foreground opacity-0 transition group-hover:opacity-100 hover:bg-red-50 hover:text-red-500"
                  >
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
                    </svg>
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Resources */}
      {files.length > 0 ? (
        <div>
          <h3 className="mb-3 text-base font-medium text-muted-foreground">资源</h3>
          <div className="space-y-2">
            {files.map((r) => (
              <div
                key={r.id}
                className="group flex items-center justify-between rounded-xl border border-border bg-card px-4 py-3 transition hover:border-indigo-100 hover:shadow-sm"
              >
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  <span className={`inline-flex items-center rounded-lg border px-2.5 py-1 text-sm font-medium ${TYPE_COLORS[r.type] ?? TYPE_COLORS.link}`}>
                    {TYPE_ICONS[r.type] ?? '🔗'} {r.type === 'link' ? '链接' : r.type === 'video' ? '视频' : r.type === 'doc' ? '文档' : '链接'}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-base font-medium text-foreground">
                      {r.url ? (
                        <a href={r.url} target="_blank" rel="noopener noreferrer" className="hover:text-indigo-600 transition">
                          {r.title}
                        </a>
                      ) : (
                        r.title
                      )}
                    </div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      {r.source && <span>{r.source}</span>}
                      <span>{new Date(r.created_at).toLocaleDateString('zh-CN')}</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  {r.url && (
                    <a
                      href={r.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="rounded-lg p-2 text-muted-foreground transition hover:bg-indigo-50 hover:text-indigo-600"
                    >
                      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 6H5.25A2.25 2.25 0 0 0 3 8.25v10.5A2.25 2.25 0 0 0 5.25 21h10.5A2.25 2.25 0 0 0 18 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25" />
                      </svg>
                    </a>
                  )}
                  <button
                    onClick={() => doDelete(r.id)}
                    className="rounded-lg p-2 text-muted-foreground opacity-0 transition group-hover:opacity-100 hover:bg-red-50 hover:text-red-500"
                  >
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
                    </svg>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : folders.length === 0 ? (
        <div className="rounded-2xl border border-border bg-card py-16 text-center">
          <p className="text-lg text-muted-foreground">暂无资源</p>
          <p className="mt-1 text-base text-muted-foreground">点击上方按钮添加资源或新建文件夹</p>
        </div>
      ) : null}

      {/* Add Dialog */}
      {showAddDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={() => setShowAddDialog(false)}>
          <div className="w-full max-w-md rounded-2xl bg-card p-6 shadow-xl" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-xl font-semibold text-foreground">
              {addType === 'folder' ? '新建文件夹' : '添加资源'}
            </h3>
            <div className="mt-4 space-y-4">
              {addType !== 'folder' && (
                <div className="flex gap-2">
                  {TYPE_CONFIG.map((t) => (
                    <button
                      key={t.value}
                      onClick={() => setAddType(t.value)}
                      className={`rounded-lg border px-3 py-1.5 text-base font-medium transition ${
                        addType === t.value
                          ? 'border-indigo-300 bg-indigo-50 text-indigo-600'
                          : 'border-border text-muted-foreground hover:bg-muted'
                      }`}
                    >
                      {t.icon} {t.label}
                    </button>
                  ))}
                </div>
              )}
              <div>
                <label className="mb-1 block text-base font-medium text-foreground">
                  {addType === 'folder' ? '文件夹名称' : '标题'}
                </label>
                <input
                  value={addTitle}
                  onChange={(e) => setAddTitle(e.target.value)}
                  placeholder={addType === 'folder' ? '输入文件夹名称' : '输入资源标题'}
                  className="w-full rounded-xl border border-border px-3 py-2.5 text-base text-foreground placeholder-[#9CA3AF] outline-none transition focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
                />
              </div>
              {addType !== 'folder' && (
                <>
                  <div>
                    <label className="mb-1 block text-base font-medium text-foreground">链接</label>
                    <input
                      value={addUrl}
                      onChange={(e) => setAddUrl(e.target.value)}
                      placeholder="https://..."
                      className="w-full rounded-xl border border-border px-3 py-2.5 text-base text-foreground placeholder-[#9CA3AF] outline-none transition focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-base font-medium text-foreground">来源</label>
                    <input
                      value={addSource}
                      onChange={(e) => setAddSource(e.target.value)}
                      placeholder="如：知乎、B站、Coursera"
                      className="w-full rounded-xl border border-border px-3 py-2.5 text-base text-foreground placeholder-[#9CA3AF] outline-none transition focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-base font-medium text-foreground">备注</label>
                    <textarea
                      value={addNotes}
                      onChange={(e) => setAddNotes(e.target.value)}
                      placeholder="可选备注..."
                      rows={2}
                      className="w-full rounded-xl border border-border px-3 py-2.5 text-base text-foreground placeholder-[#9CA3AF] outline-none transition focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
                    />
                  </div>
                </>
              )}
              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => setShowAddDialog(false)}
                  className="flex-1 rounded-xl border border-border py-2.5 text-base font-medium text-foreground transition hover:bg-muted"
                >
                  取消
                </button>
                <button
                  onClick={() => doAdd({ title: addTitle, url: addUrl, type: addType, source: addSource, notes: addNotes })}
                  disabled={adding || !addTitle.trim() || (addType !== 'folder' && !addUrl.trim())}
                  className="flex-1 rounded-xl bg-indigo-600 py-2.5 text-base font-medium text-white transition hover:bg-indigo-700 disabled:opacity-50"
                >
                  {adding ? '添加中...' : '确认'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
