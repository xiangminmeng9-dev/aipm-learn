'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { ExternalResource } from '@/types';
import { RESOURCE_TYPES, PRESET_RESOURCES, AI_PM_DIRECTIONS, getResourceTypeIcon, getSubcategoriesForType, getResourceTypeLabel, getSubcategoryLabel, getFoldersForType, getDirectChildrenCount, getFolderPath } from '@/components/resources/constants';
import { ResourceCard, FolderCard } from '@/components/resources/ResourceCard';
import GradientBackground from '@/components/ui/gradient-background';

type ResourceType = 'website' | 'paper' | 'blog' | 'lark_doc' | 'wechat' | 'video' | 'book';

const TYPE_HEADER_STYLES: Record<ResourceType, string> = {
  website:  'bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-indigo-600/40 dark:to-purple-600/40',
  paper:    'bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-600/40 dark:to-teal-600/40',
  blog:     'bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-600/40 dark:to-pink-600/40',
  lark_doc: 'bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-600/40 dark:to-cyan-600/40',
  wechat:   'bg-gradient-to-br from-green-50 to-lime-50 dark:from-green-600/40 dark:to-lime-600/40',
  video:    'bg-gradient-to-br from-red-50 to-orange-50 dark:from-red-600/40 dark:to-orange-600/40',
  book:     'bg-gradient-to-br from-amber-50 to-yellow-50 dark:from-amber-600/40 dark:to-yellow-600/40',
};

const TYPE_BORDERS: Record<ResourceType, string> = {
  website: 'hover:border-indigo-200',
  paper: 'hover:border-emerald-200',
  blog: 'hover:border-purple-200',
  lark_doc: 'hover:border-blue-200',
  wechat: 'hover:border-green-200',
  video: 'hover:border-red-200',
  book: 'hover:border-amber-200',
};

export default function ResourcesManagePage() {
  const [resources, setResources] = useState<ExternalResource[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState<ResourceType | 'overview'>('overview');
  const [activeSubcategory, setActiveSubcategory] = useState<string>('');
  const [currentFolderId, setCurrentFolderId] = useState<string | null>(null);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showFolderDialog, setShowFolderDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showMoveDialog, setShowMoveDialog] = useState(false);
  const [editingResource, setEditingResource] = useState<ExternalResource | null>(null);
  const [movingResource, setMovingResource] = useState<ExternalResource | null>(null);
  const [addForm, setAddForm] = useState({
    title: '', url: '', resource_type: 'website' as ResourceType,
    subcategory: '', thumbnail_url: '', local_path: '',
    author: '', year: '', platform: '', duration: '',
    source: '', description: '', notes: '', parent_id: '' as string,
  });
  const [folderForm, setFolderForm] = useState({ title: '', notes: '' });
  const [adding, setAdding] = useState(false);
  const [showPresets, setShowPresets] = useState(false);
  const [expandedDirection, setExpandedDirection] = useState<string | null>(null);

  const fetchResources = useCallback(async () => {
    try {
      const res = await fetch('/api/external-resources');
      if (res.ok) { const data = await res.json(); setResources(data.resources ?? []); }
    } finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchResources(); }, [fetchResources]);

  // Auto-migrate on first load
  useEffect(() => {
    fetch('/api/external-resources/migrate', { method: 'POST' }).catch(() => {});
  }, []);

  // 每种类型的资源数量（不含文件夹）
  const typeCounts = RESOURCE_TYPES.reduce<Record<string, number>>((acc, t) => {
    acc[t.value] = resources.filter(r => !r.type?.includes('folder') && (r.resource_type || inferType(r)) === t.value).length;
    return acc;
  }, {});

  // 每种类型下子分类的资源数量
  const subcategoryCounts = (type: ResourceType) => {
    const typeResources = resources.filter(r => !r.type?.includes('folder') && (r.resource_type || inferType(r)) === type);
    const counts: Record<string, number> = {};
    for (const r of typeResources) {
      const key = r.subcategory || '_none';
      counts[key] = (counts[key] || 0) + 1;
    }
    return counts;
  };

  const totalResources = resources.filter(r => !r.type?.includes('folder')).length;

  // 当前大类下的文件夹
  const currentFolders = activeTab !== 'overview'
    ? getFoldersForType(resources, activeTab).filter(f => f.parent_id === currentFolderId)
    : [];

  // 当前文件夹下的子文件夹和资源
  const filteredResources = activeTab !== 'overview'
    ? resources.filter(r => {
    const rType = r.resource_type || inferType(r);
    if (rType !== activeTab) return false;
    if (activeSubcategory === '_unclassified') {
      if (r.subcategory) return false;
    } else if (activeSubcategory && r.subcategory !== activeSubcategory) {
      return false;
    }
    if (r.parent_id !== currentFolderId) return false;
    if (search) {
      const q = search.toLowerCase();
      const match = (r.title?.toLowerCase().includes(q)) ||
        (r.url?.toLowerCase().includes(q)) ||
        (r.description?.toLowerCase().includes(q)) ||
        (r.author?.toLowerCase().includes(q));
      if (!match) return false;
    }
    return true;
  }) : [];

  // Separate folders and non-folder resources for rendering
  const displayFolders = filteredResources.filter(r => r.type === 'folder');
  const displayResources = filteredResources.filter(r => r.type !== 'folder');

  const currentSubcategories = activeTab !== 'overview' ? getSubcategoriesForType(activeTab as ResourceType) : [];

  // 文件夹路径（面包屑）
  const folderPath = currentFolderId ? getFolderPath(resources, currentFolderId) : [];

  // 当前大类下所有文件夹（用于下拉选择）
  const allFoldersForType = activeTab !== 'overview' ? getFoldersForType(resources, activeTab as ResourceType) : [];

  const doAdd = async () => {
    setAdding(true);
    try {
      const payload: Record<string, unknown> = {
        title: addForm.title,
        url: addForm.url || addForm.local_path || '',
        type: mapNewTypeToLegacy(addForm.resource_type),
        resource_type: addForm.resource_type,
        subcategory: addForm.subcategory === '_unclassified' || !addForm.subcategory ? null : addForm.subcategory,
        thumbnail_url: addForm.thumbnail_url || null,
        local_path: addForm.local_path || null,
        author: addForm.author || null,
        year: addForm.year ? parseInt(addForm.year) : null,
        platform: addForm.platform || null,
        duration: addForm.duration || null,
        source: addForm.source || 'manual',
        notes: addForm.notes || null,
        description: addForm.description || null,
        parent_id: addForm.parent_id || null,
      };
      const res = await fetch('/api/external-resources', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (res.ok) {
        await fetchResources();
        setShowAddDialog(false);
        resetAddForm();
      } else {
        const data = await res.json();
        alert(data.error || '添加失败');
      }
    } finally { setAdding(false); }
  };

  const resetAddForm = (defaultType: ResourceType = 'website') => {
    setAddForm({ title: '', url: '', resource_type: defaultType, subcategory: '', thumbnail_url: '', local_path: '', author: '', year: '', platform: '', duration: '', source: '', description: '', notes: '', parent_id: currentFolderId || '' });
  };

  const doAddFolder = async () => {
    if (!folderForm.title.trim() || activeTab === 'overview') return;
    setAdding(true);
    try {
      const res = await fetch('/api/external-resources', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: folderForm.title.trim(),
          type: 'folder',
          resource_type: activeTab as ResourceType,
          parent_id: currentFolderId || null,
          url: '',
          notes: folderForm.notes || null,
          source: 'manual',
        }),
      });
      if (res.ok) {
        await fetchResources();
        setShowFolderDialog(false);
        setFolderForm({ title: '', notes: '' });
      } else {
        const data = await res.json();
        alert(data.error || '创建文件夹失败');
      }
    } finally { setAdding(false); }
  };

  const doEdit = async () => {
    if (!editingResource) return;
    setAdding(true);
    try {
      const res = await fetch(`/api/external-resources/${editingResource.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: addForm.title.trim(),
          url: addForm.url,
          type: mapNewTypeToLegacy(addForm.resource_type),
          resource_type: addForm.resource_type,
          subcategory: addForm.subcategory === '_unclassified' || !addForm.subcategory ? null : addForm.subcategory,
          thumbnail_url: addForm.thumbnail_url || null,
          local_path: addForm.local_path || null,
          author: addForm.author || null,
          year: addForm.year ? parseInt(addForm.year) : null,
          platform: addForm.platform || null,
          duration: addForm.duration || null,
          source: addForm.source || null,
          notes: addForm.notes || null,
          description: addForm.description || null,
          parent_id: addForm.parent_id || null,
        }),
      });
      if (res.ok) {
        await fetchResources();
        setShowEditDialog(false);
        setEditingResource(null);
        resetAddForm();
      } else {
        const data = await res.json();
        alert(data.error || '更新失败');
      }
    } finally { setAdding(false); }
  };

  const doMove = async (targetFolderId: string | null) => {
    if (!movingResource) return;
    setAdding(true);
    try {
      const res = await fetch(`/api/external-resources/${movingResource.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ parent_id: targetFolderId }),
      });
      if (res.ok) {
        await fetchResources();
        setShowMoveDialog(false);
        setMovingResource(null);
      } else {
        const data = await res.json();
        alert(data.error || '移动失败');
      }
    } finally { setAdding(false); }
  };

  const doDelete = async (id: string) => {
    const r = resources.find(x => x.id === id);
    const childCount = resources.filter(x => x.parent_id === id).length;
    const msg = r?.type === 'folder' && childCount > 0
      ? `该文件夹内有 ${childCount} 个子项，删除后将一并移除。确认删除？`
      : '确认删除此资源？';
    if (!confirm(msg)) return;
    const res = await fetch(`/api/external-resources/${id}`, { method: 'DELETE' });
    if (res.ok) fetchResources();
  };

  const addPresets = async () => {
    setAdding(true);
    try {
      for (const p of PRESET_RESOURCES) {
        await fetch('/api/external-resources', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            title: p.name, url: p.url || '', type: mapNewTypeToLegacy(p.resource_type),
            resource_type: p.resource_type, subcategory: p.subcategory,
            author: p.author || null, year: p.year || null,
            platform: p.platform || null, description: p.description || null,
            source: 'preset',
          }),
        });
      }
      await fetchResources();
    } finally { setAdding(false); }
  };

  const openEditDialog = (resource: ExternalResource) => {
    setEditingResource(resource);
    setAddForm({
      title: resource.title,
      url: resource.url || '',
      resource_type: (resource.resource_type || inferType(resource)) as ResourceType,
      subcategory: resource.subcategory || (getSubcategoriesForType((resource.resource_type || inferType(resource)) as ResourceType).length > 0 ? '_unclassified' : ''),
      thumbnail_url: resource.thumbnail_url || '',
      local_path: resource.local_path || '',
      author: resource.author || '',
      year: resource.year?.toString() || '',
      platform: resource.platform || '',
      duration: resource.duration || '',
      source: resource.source || '',
      description: resource.description || '',
      notes: resource.notes || '',
      parent_id: resource.parent_id || '',
    });
    setShowEditDialog(true);
  };

  const openMoveDialog = (resource: ExternalResource) => {
    setMovingResource(resource);
    setShowMoveDialog(true);
  };

  if (loading) {
    return (
      <div className="relative p-8">
        <GradientBackground />
        <div className="relative z-10 flex justify-center py-16"><div className="h-8 w-8 animate-spin rounded-full border-2 border-indigo-500 border-t-transparent" /></div>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen p-6 md:p-8 space-y-5">
      <GradientBackground />

      {/* Header */}
      <div className="relative z-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-3xl font-semibold text-foreground">资源管理</h1>
          <p className="mt-1 text-base text-muted-foreground">AI PM 学习资源库 — 共 {totalResources} 个资源</p>
        </div>
        <div className="flex gap-2 flex-wrap">
          {activeTab !== 'overview' && (
            <>
              <button onClick={() => setShowPresets(!showPresets)} className="rounded-xl border border-border bg-card px-3 py-2 text-sm font-medium text-foreground transition hover:bg-muted">
                {showPresets ? '隐藏' : '📋'} 预设资源
              </button>
              <button onClick={() => setShowFolderDialog(true)} className="rounded-xl border border-border bg-card px-3 py-2 text-sm font-medium text-foreground transition hover:bg-muted">
                📁 新建文件夹
              </button>
              <button onClick={() => {
                resetAddForm(activeTab);
                setShowAddDialog(true);
              }} className="rounded-xl bg-indigo-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-indigo-700">
                + 添加资源
              </button>
            </>
          )}
        </div>
      </div>

      {/* AI PM 学习方向 */}
      <div className="relative z-10 grid gap-3 grid-cols-2 lg:grid-cols-4">
        {AI_PM_DIRECTIONS.map(dir => (
          <div
            key={dir.title}
            onClick={() => setExpandedDirection(expandedDirection === dir.title ? null : dir.title)}
            className={`cursor-pointer rounded-2xl border border-border bg-card overflow-hidden transition ${expandedDirection === dir.title ? 'ring-2 ring-indigo-300' : 'hover:shadow-md'}`}
          >
            <div className={`bg-gradient-to-r ${dir.color} px-4 py-3 flex items-center gap-2`}>
              <span className="text-xl">{dir.icon}</span>
              <span className="text-base font-semibold text-white">{dir.title}</span>
            </div>
            <div className="px-4 py-2.5 space-y-1">
              {dir.topics.map(topic => (
                <div key={topic} className="flex items-center gap-1.5 text-sm text-muted-foreground">
                  <span className="h-1.5 w-1.5 rounded-full bg-indigo-400 shrink-0" />
                  <span>{topic}</span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Search */}
      <div className="relative z-10">
        <svg className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" /></svg>
        <input
          value={search} onChange={(e) => setSearch(e.target.value)}
          placeholder="搜索资源名称、链接、作者..."
          className="w-full rounded-xl border border-border bg-card py-2.5 pl-10 pr-4 text-base text-foreground placeholder-[#9CA3AF] outline-none transition focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
        />
      </div>

      {/* Preset Resources Panel */}
      {showPresets && (
        <Card className="relative z-10 border-border bg-card">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg text-foreground">AI PM 推荐资源（一键导入）</CardTitle>
              <button onClick={addPresets} disabled={adding} className="rounded-lg bg-indigo-600 px-3 py-1.5 text-sm font-medium text-white transition hover:bg-indigo-700 disabled:opacity-50">
                {adding ? '导入中...' : '全部导入'}
              </button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
              {RESOURCE_TYPES.map(type => {
                const presets = PRESET_RESOURCES.filter(p => p.resource_type === type.value);
                if (presets.length === 0) return null;
                return (
                  <div key={type.value} className="space-y-1.5">
                    <div className="flex items-center gap-1.5 text-sm font-medium text-foreground">
                      <span>{type.icon}</span>
                      <span>{type.label}</span>
                      <span className="text-xs text-muted-foreground">({presets.length})</span>
                    </div>
                    {presets.map((p, i) => (
                      <div key={i} className="flex items-center gap-2 rounded-lg bg-muted px-2.5 py-1.5 text-sm">
                        <span className="text-xs truncate">{p.name}</span>
                      </div>
                    ))}
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Breadcrumb */}
      {activeTab !== 'overview' && (
        <div className="relative z-10 flex items-center gap-1.5 text-sm flex-wrap">
          <button onClick={() => { setActiveTab('overview'); setActiveSubcategory(''); setSearch(''); setCurrentFolderId(null); }} className="text-muted-foreground hover:text-indigo-600 transition">← 返回概览</button>
          <span className="text-muted-foreground">/</span>
          <span className="font-medium text-foreground">
            {getResourceTypeIcon(activeTab as ResourceType)} {getResourceTypeLabel(activeTab as ResourceType)}
          </span>
          {folderPath.map((fp, i) => (
            <span key={fp.id} className="contents">
              <span className="text-muted-foreground">/</span>
              {i < folderPath.length - 1 ? (
                <button onClick={() => setCurrentFolderId(fp.id)} className="text-muted-foreground hover:text-indigo-600 transition">{fp.title}</button>
              ) : (
                <span className="font-medium text-foreground">{fp.title}</span>
              )}
            </span>
          ))}
          <span className="text-muted-foreground ml-2 text-xs">({displayResources.length} 个资源{displayFolders.length > 0 ? `, ${displayFolders.length} 个文件夹` : ''})</span>
        </div>
      )}

      {/* === 概览视图：展示7个大类概览卡片 === */}
      {activeTab === 'overview' && (
        <div className="relative z-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {RESOURCE_TYPES.map(type => {
            const count = typeCounts[type.value] || 0;
            const subCounts = subcategoryCounts(type.value);
            const headerStyle = TYPE_HEADER_STYLES[type.value];
            const borderHover = TYPE_BORDERS[type.value];
            const folderCount = getFoldersForType(resources, type.value).length;
            return (
              <div
                key={type.value}
                onClick={() => { setActiveTab(type.value); setActiveSubcategory(''); setCurrentFolderId(null); }}
                className={`cursor-pointer rounded-2xl border border-border bg-card overflow-hidden transition hover:shadow-md ${borderHover}`}
              >
                <div className={`${headerStyle} px-5 py-6 flex items-center gap-3`}>
                  <span className="text-3xl">{type.icon}</span>
                  <div>
                    <div className="text-lg font-semibold text-foreground">{type.label}</div>
                    <div className="text-sm text-muted-foreground">{count} 个资源{folderCount > 0 ? ` · ${folderCount} 个文件夹` : ''}</div>
                  </div>
                </div>
                <div className="px-4 py-3 space-y-1.5">
                  {type.subcategories.map(sub => {
                    const subCount = subCounts[sub.value] || 0;
                    return (
                      <div key={sub.value} className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">{sub.label}</span>
                        <span className={`text-xs font-medium ${subCount > 0 ? 'text-foreground' : 'text-muted-foreground/50'}`}>{subCount}</span>
                      </div>
                    );
                  })}
                  {(subCounts['_none'] || 0) > 0 && (
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">未分类</span>
                      <span className="text-xs font-medium text-foreground">{subCounts['_none']}</span>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* === 具体类型视图：子分类筛选 + 文件夹 + 资源列表 === */}
      {activeTab !== 'overview' && (
        <>
          {/* Subcategory Filter */}
          {currentSubcategories.length > 0 && (
            <div className="relative z-10 flex gap-1.5 flex-wrap">
              {currentSubcategories.map(sub => (
                <button
                  key={sub.value}
                  onClick={() => setActiveSubcategory(activeSubcategory === sub.value ? '' : sub.value)}
                  className={`rounded-full px-3 py-1 text-xs font-medium transition ${activeSubcategory === sub.value ? 'bg-indigo-600 text-white' : 'bg-muted text-muted-foreground hover:text-foreground'}`}
                >
                  {sub.label}
                </button>
              ))}
              <button
                onClick={() => setActiveSubcategory(activeSubcategory === '_unclassified' ? '' : '_unclassified')}
                className={`rounded-full px-3 py-1 text-xs font-medium transition ${activeSubcategory === '_unclassified' ? 'bg-indigo-600 text-white' : 'bg-muted text-muted-foreground hover:text-foreground'}`}
              >
                未分类
              </button>
            </div>
          )}

          {/* Folders + Resources Grid */}
          {(displayFolders.length > 0 || displayResources.length > 0) ? (
            <div className="relative z-10 space-y-4">
              {/* Folders row */}
              {displayFolders.length > 0 && (
                <div className="grid gap-4 grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
                  {displayFolders.map(f => (
                    <FolderCard
                      key={f.id}
                      folder={f}
                      itemCount={getDirectChildrenCount(resources, f.id)}
                      onNavigate={() => setCurrentFolderId(f.id)}
                      onDelete={doDelete}
                    />
                  ))}
                </div>
              )}
              {/* Resources grid */}
              {displayResources.length > 0 && (
                <div>
                  {activeTab === 'book' ? (
                    <div className="grid gap-4 grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
                      {displayResources.map(r => <ResourceCard key={r.id} resource={r} onDelete={doDelete} onEdit={openEditDialog} onMove={openMoveDialog} />)}
                    </div>
                  ) : activeTab === 'paper' ? (
                    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                      {displayResources.map(r => <ResourceCard key={r.id} resource={r} onDelete={doDelete} onEdit={openEditDialog} onMove={openMoveDialog} />)}
                    </div>
                  ) : (
                    <div className="grid gap-4 grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
                      {displayResources.map(r => <ResourceCard key={r.id} resource={r} onDelete={doDelete} onEdit={openEditDialog} onMove={openMoveDialog} />)}
                    </div>
                  )}
                </div>
              )}
            </div>
          ) : (
            <div className="relative z-10 rounded-2xl border border-border bg-card py-16 text-center">
              <p className="text-lg text-muted-foreground">{currentFolderId ? '该文件夹下暂无内容' : '该分类下暂无资源'}</p>
              <p className="mt-1 text-sm text-muted-foreground">点击「添加资源」或「新建文件夹」开始</p>
            </div>
          )}
        </>
      )}

      {/* Add Resource Dialog */}
      {showAddDialog && (
        <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/40 pt-8 pb-8" onClick={() => setShowAddDialog(false)}>
          <div className="w-full max-w-2xl rounded-2xl bg-card p-6 shadow-xl" onClick={e => e.stopPropagation()}>
            <h3 className="text-xl font-semibold text-foreground">添加资源</h3>
            <div className="mt-4 space-y-3">
              {/* 资源类型选择 */}
              <div>
                <label className="mb-1 block text-sm font-medium text-foreground">资源类型</label>
                <div className="flex flex-wrap gap-1.5">
                  {RESOURCE_TYPES.map(t => (
                    <button
                      key={t.value}
                      onClick={() => setAddForm(f => ({ ...f, resource_type: t.value, subcategory: '', parent_id: '' }))}
                      className={`rounded-lg border px-2.5 py-1.5 text-xs font-medium transition ${addForm.resource_type === t.value ? 'border-indigo-300 bg-indigo-50 text-indigo-600' : 'border-border text-muted-foreground hover:bg-muted'}`}
                    >
                      {t.icon} {t.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* 子分类选择 */}
              {getSubcategoriesForType(addForm.resource_type).length > 0 && (
                <div>
                  <label className="mb-1 block text-sm font-medium text-foreground">子分类</label>
                  <div className="flex flex-wrap gap-1.5">
                    {getSubcategoriesForType(addForm.resource_type).map(sub => (
                      <button
                        key={sub.value}
                        onClick={() => setAddForm(f => ({ ...f, subcategory: f.subcategory === sub.value ? '' : sub.value }))}
                        className={`rounded-full px-2.5 py-1 text-xs font-medium transition ${addForm.subcategory === sub.value ? 'bg-indigo-600 text-white' : 'bg-muted text-muted-foreground hover:text-foreground'}`}
                      >
                        {sub.label}
                      </button>
                    ))}
                    <button
                      onClick={() => setAddForm(f => ({ ...f, subcategory: f.subcategory === '_unclassified' ? '' : '_unclassified' }))}
                      className={`rounded-full px-2.5 py-1 text-xs font-medium transition ${addForm.subcategory === '_unclassified' ? 'bg-indigo-600 text-white' : 'bg-muted text-muted-foreground hover:text-foreground'}`}
                    >
                      未分类
                    </button>
                  </div>
                </div>
              )}

              {/* 所属文件夹 */}
              {allFoldersForType.length > 0 && (
                <div>
                  <label className="mb-1 block text-sm font-medium text-foreground">所属文件夹（可选）</label>
                  <select
                    value={addForm.parent_id}
                    onChange={e => setAddForm(f => ({ ...f, parent_id: e.target.value }))}
                    className="w-full rounded-xl border border-border px-3 py-2 text-sm text-foreground outline-none transition focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
                  >
                    <option value="">根目录（不归属文件夹）</option>
                    {allFoldersForType.map(f => (
                      <option key={f.id} value={f.id}>{f.title}</option>
                    ))}
                  </select>
                </div>
              )}

              {/* 名称 + URL 并排 */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1 block text-sm font-medium text-foreground">名称</label>
                  <input
                    value={addForm.title}
                    onChange={e => setAddForm(f => ({ ...f, title: e.target.value }))}
                    placeholder="资源名称"
                    className="w-full rounded-xl border border-border px-3 py-2 text-sm text-foreground placeholder-[#9CA3AF] outline-none transition focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-foreground">
                    {addForm.resource_type === 'book' ? '在线链接（可选）' : '链接'}
                  </label>
                  <input
                    value={addForm.url}
                    onChange={e => setAddForm(f => ({ ...f, url: e.target.value }))}
                    placeholder={addForm.resource_type === 'book' ? 'https://... 或留空' : 'https://...'}
                    className="w-full rounded-xl border border-border px-3 py-2 text-sm text-foreground placeholder-[#9CA3AF] outline-none transition focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
                  />
                </div>
              </div>

              {/* 类型特有字段并排 */}
              <div className="grid grid-cols-2 gap-3">
                {addForm.resource_type === 'book' && (
                  <div>
                    <label className="mb-1 block text-sm font-medium text-foreground">本地文件路径</label>
                    <input
                      value={addForm.local_path}
                      onChange={e => setAddForm(f => ({ ...f, local_path: e.target.value }))}
                      placeholder="/Users/xxx/books/AI产品经理.pdf"
                      className="w-full rounded-xl border border-border px-3 py-2 text-sm text-foreground placeholder-[#9CA3AF] outline-none transition focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
                    />
                  </div>
                )}
                {['paper', 'book', 'blog'].includes(addForm.resource_type) && (
                  <div>
                    <label className="mb-1 block text-sm font-medium text-foreground">作者</label>
                    <input
                      value={addForm.author}
                      onChange={e => setAddForm(f => ({ ...f, author: e.target.value }))}
                      placeholder="作者姓名"
                      className="w-full rounded-xl border border-border px-3 py-2 text-sm text-foreground placeholder-[#9CA3AF] outline-none transition focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
                    />
                  </div>
                )}
                {addForm.resource_type === 'paper' && (
                  <div>
                    <label className="mb-1 block text-sm font-medium text-foreground">年份</label>
                    <input
                      value={addForm.year}
                      onChange={e => setAddForm(f => ({ ...f, year: e.target.value }))}
                      placeholder="2024"
                      type="number"
                      className="w-full rounded-xl border border-border px-3 py-2 text-sm text-foreground placeholder-[#9CA3AF] outline-none transition focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
                    />
                  </div>
                )}
                {addForm.resource_type === 'video' && (
                  <>
                    <div>
                      <label className="mb-1 block text-sm font-medium text-foreground">平台</label>
                      <input
                        value={addForm.platform}
                        onChange={e => setAddForm(f => ({ ...f, platform: e.target.value }))}
                        placeholder="B站 / YouTube / 极客时间"
                        className="w-full rounded-xl border border-border px-3 py-2 text-sm text-foreground placeholder-[#9CA3AF] outline-none transition focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
                      />
                    </div>
                    <div>
                      <label className="mb-1 block text-sm font-medium text-foreground">时长</label>
                      <input
                        value={addForm.duration}
                        onChange={e => setAddForm(f => ({ ...f, duration: e.target.value }))}
                        placeholder="1:30:00"
                        className="w-full rounded-xl border border-border px-3 py-2 text-sm text-foreground placeholder-[#9CA3AF] outline-none transition focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
                      />
                    </div>
                  </>
                )}
              </div>

              {/* 描述 + 备注 并排 */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1 block text-sm font-medium text-foreground">描述</label>
                  <textarea
                    value={addForm.description}
                    onChange={e => setAddForm(f => ({ ...f, description: e.target.value }))}
                    placeholder="资源简介..."
                    rows={2}
                    className="w-full rounded-xl border border-border px-3 py-2 text-sm text-foreground placeholder-[#9CA3AF] outline-none transition focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-foreground">备注</label>
                  <textarea
                    value={addForm.notes}
                    onChange={e => setAddForm(f => ({ ...f, notes: e.target.value }))}
                    placeholder="个人备注..."
                    rows={2}
                    className="w-full rounded-xl border border-border px-3 py-2 text-sm text-foreground placeholder-[#9CA3AF] outline-none transition focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
                  />
                </div>
              </div>

              {/* 略缩图 + 来源 并排 */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1 block text-sm font-medium text-foreground">略缩图/封面（可选）</label>
                  <input
                    value={addForm.thumbnail_url}
                    onChange={e => setAddForm(f => ({ ...f, thumbnail_url: e.target.value }))}
                    placeholder="图片URL"
                    className="w-full rounded-xl border border-border px-3 py-2 text-sm text-foreground placeholder-[#9CA3AF] outline-none transition focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-foreground">来源（可选）</label>
                  <input
                    value={addForm.source}
                    onChange={e => setAddForm(f => ({ ...f, source: e.target.value }))}
                    placeholder="知乎、B站、手动添加"
                    className="w-full rounded-xl border border-border px-3 py-2 text-sm text-foreground placeholder-[#9CA3AF] outline-none transition focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
                  />
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <button onClick={() => setShowAddDialog(false)} className="flex-1 rounded-xl border border-border py-2 text-sm font-medium text-foreground transition hover:bg-muted">
                  取消
                </button>
                <button
                  onClick={doAdd}
                  disabled={adding || !addForm.title.trim() || (addForm.resource_type !== 'book' && addForm.resource_type !== 'wechat' && !addForm.url.trim())}
                  className="flex-1 rounded-xl bg-indigo-600 py-2 text-sm font-medium text-white transition hover:bg-indigo-700 disabled:opacity-50"
                >
                  {adding ? '添加中...' : '确认添加'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Resource Dialog */}
      {showEditDialog && editingResource && (
        <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/40 pt-8 pb-8" onClick={() => { setShowEditDialog(false); setEditingResource(null); }}>
          <div className="w-full max-w-2xl rounded-2xl bg-card p-6 shadow-xl" onClick={e => e.stopPropagation()}>
            <h3 className="text-xl font-semibold text-foreground">编辑资源</h3>
            <div className="mt-4 space-y-3">
              {/* 资源类型选择 */}
              <div>
                <label className="mb-1 block text-sm font-medium text-foreground">资源类型</label>
                <div className="flex flex-wrap gap-1.5">
                  {RESOURCE_TYPES.map(t => (
                    <button
                      key={t.value}
                      onClick={() => setAddForm(f => ({ ...f, resource_type: t.value, subcategory: '', parent_id: '' }))}
                      className={`rounded-lg border px-2.5 py-1.5 text-xs font-medium transition ${addForm.resource_type === t.value ? 'border-indigo-300 bg-indigo-50 text-indigo-600' : 'border-border text-muted-foreground hover:bg-muted'}`}
                    >
                      {t.icon} {t.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* 子分类选择 */}
              {getSubcategoriesForType(addForm.resource_type).length > 0 && (
                <div>
                  <label className="mb-1 block text-sm font-medium text-foreground">子分类</label>
                  <div className="flex flex-wrap gap-1.5">
                    {getSubcategoriesForType(addForm.resource_type).map(sub => (
                      <button
                        key={sub.value}
                        onClick={() => setAddForm(f => ({ ...f, subcategory: f.subcategory === sub.value ? '' : sub.value }))}
                        className={`rounded-full px-2.5 py-1 text-xs font-medium transition ${addForm.subcategory === sub.value ? 'bg-indigo-600 text-white' : 'bg-muted text-muted-foreground hover:text-foreground'}`}
                      >
                        {sub.label}
                      </button>
                    ))}
                    <button
                      onClick={() => setAddForm(f => ({ ...f, subcategory: f.subcategory === '_unclassified' ? '' : '_unclassified' }))}
                      className={`rounded-full px-2.5 py-1 text-xs font-medium transition ${addForm.subcategory === '_unclassified' ? 'bg-indigo-600 text-white' : 'bg-muted text-muted-foreground hover:text-foreground'}`}
                    >
                      未分类
                    </button>
                  </div>
                </div>
              )}

              {/* 所属文件夹 */}
              {(() => {
                const editFolders = getFoldersForType(resources, addForm.resource_type);
                return editFolders.length > 0 && (
                <div>
                  <label className="mb-1 block text-sm font-medium text-foreground">所属文件夹</label>
                  <select
                    value={addForm.parent_id}
                    onChange={e => setAddForm(f => ({ ...f, parent_id: e.target.value }))}
                    className="w-full rounded-xl border border-border px-3 py-2 text-sm text-foreground outline-none transition focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
                  >
                    <option value="">根目录（不归属文件夹）</option>
                    {editFolders.map(f => (
                      <option key={f.id} value={f.id}>{f.title}</option>
                    ))}
                  </select>
                </div>
                );
              })()}

              {/* 名称 + 链接 并排 */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1 block text-sm font-medium text-foreground">名称</label>
                  <input
                    value={addForm.title}
                    onChange={e => setAddForm(f => ({ ...f, title: e.target.value }))}
                    className="w-full rounded-xl border border-border px-3 py-2 text-sm text-foreground outline-none transition focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-foreground">链接</label>
                  <input
                    value={addForm.url}
                    onChange={e => setAddForm(f => ({ ...f, url: e.target.value }))}
                    className="w-full rounded-xl border border-border px-3 py-2 text-sm text-foreground outline-none transition focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
                  />
                </div>
              </div>

              {/* 描述 + 备注 并排 */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1 block text-sm font-medium text-foreground">描述</label>
                  <textarea
                    value={addForm.description}
                    onChange={e => setAddForm(f => ({ ...f, description: e.target.value }))}
                    rows={2}
                    className="w-full rounded-xl border border-border px-3 py-2 text-sm text-foreground outline-none transition focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-foreground">备注</label>
                  <textarea
                    value={addForm.notes}
                    onChange={e => setAddForm(f => ({ ...f, notes: e.target.value }))}
                    rows={2}
                    className="w-full rounded-xl border border-border px-3 py-2 text-sm text-foreground outline-none transition focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
                  />
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <button onClick={() => { setShowEditDialog(false); setEditingResource(null); }} className="flex-1 rounded-xl border border-border py-2 text-sm font-medium text-foreground transition hover:bg-muted">
                  取消
                </button>
                <button
                  onClick={doEdit}
                  disabled={adding || !addForm.title.trim()}
                  className="flex-1 rounded-xl bg-indigo-600 py-2 text-sm font-medium text-white transition hover:bg-indigo-700 disabled:opacity-50"
                >
                  {adding ? '保存中...' : '保存修改'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Move to Folder Dialog */}
      {showMoveDialog && movingResource && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={() => { setShowMoveDialog(false); setMovingResource(null); }}>
          <div className="w-full max-w-sm rounded-2xl bg-card p-6 shadow-xl" onClick={e => e.stopPropagation()}>
            <h3 className="text-lg font-semibold text-foreground">移动到文件夹</h3>
            <p className="mt-1 text-sm text-muted-foreground">「{movingResource.title}」移动到：</p>
            <div className="mt-3 space-y-1.5 max-h-64 overflow-y-auto">
              <button
                onClick={() => doMove(null)}
                className="w-full text-left rounded-lg px-3 py-2 text-sm text-foreground hover:bg-muted transition"
              >
                📂 根目录（不归属文件夹）
              </button>
              {allFoldersForType.map(f => (
                <button
                  key={f.id}
                  onClick={() => doMove(f.id)}
                  disabled={f.id === movingResource.id}
                  className="w-full text-left rounded-lg px-3 py-2 text-sm text-foreground hover:bg-muted transition disabled:opacity-40"
                >
                  📁 {f.title}
                </button>
              ))}
            </div>
            <button onClick={() => { setShowMoveDialog(false); setMovingResource(null); }} className="mt-4 w-full rounded-xl border border-border py-2 text-sm font-medium text-foreground transition hover:bg-muted">
              取消
            </button>
          </div>
        </div>
      )}

      {/* New Folder Dialog */}
      {showFolderDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={() => setShowFolderDialog(false)}>
          <div className="w-full max-w-sm rounded-2xl bg-card p-6 shadow-xl" onClick={e => e.stopPropagation()}>
            <h3 className="text-lg font-semibold text-foreground">新建文件夹</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              在 {getResourceTypeIcon(activeTab as ResourceType)} {getResourceTypeLabel(activeTab as ResourceType)}
              {currentFolderId && ` / ${folderPath[folderPath.length - 1]?.title || ''}`} 内创建
            </p>
            <div className="mt-4 space-y-3">
              <div>
                <label className="mb-1 block text-sm font-medium text-foreground">文件夹名称</label>
                <input
                  value={folderForm.title}
                  onChange={e => setFolderForm(f => ({ ...f, title: e.target.value }))}
                  placeholder="文件夹名称"
                  autoFocus
                  className="w-full rounded-xl border border-border px-3 py-2 text-sm text-foreground placeholder-[#9CA3AF] outline-none transition focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-foreground">备注（可选）</label>
                <input
                  value={folderForm.notes}
                  onChange={e => setFolderForm(f => ({ ...f, notes: e.target.value }))}
                  placeholder="文件夹说明..."
                  className="w-full rounded-xl border border-border px-3 py-2 text-sm text-foreground placeholder-[#9CA3AF] outline-none transition focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
                />
              </div>
              <div className="flex gap-3 pt-2">
                <button onClick={() => setShowFolderDialog(false)} className="flex-1 rounded-xl border border-border py-2 text-sm font-medium text-foreground transition hover:bg-muted">
                  取消
                </button>
                <button
                  onClick={doAddFolder}
                  disabled={adding || !folderForm.title.trim()}
                  className="flex-1 rounded-xl bg-indigo-600 py-2 text-sm font-medium text-white transition hover:bg-indigo-700 disabled:opacity-50"
                >
                  {adding ? '创建中...' : '创建文件夹'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function inferType(r: ExternalResource): string {
  if (r.resource_type) return r.resource_type;
  if (r.type === 'video') return 'video';
  if (r.type === 'doc') return 'lark_doc';
  const url = (r.url || '').toLowerCase();
  const title = (r.title || '').toLowerCase();
  if (url.includes('mp.weixin.qq.com') || url.includes('wechat') || title.includes('公众号')) return 'wechat';
  if (url.includes('medium.com') || url.includes('substack.com') || url.includes('zhihu.com') || url.includes('csdn.net') || url.includes('juejin.cn')) return 'blog';
  if (url.includes('arxiv.org') || url.includes('paperswithcode') || title.includes('paper') || title.includes('论文') || title.includes('arxiv')) return 'paper';
  if (title.includes('book') || title.includes('书籍') || title.includes('手册') || title.includes('指南') || title.includes('pdf')) return 'book';
  if (url.includes('feishu') || url.includes('lark') || url.includes('yuque')) return 'lark_doc';
  if (r.local_path) return 'book';
  return 'website';
}

function mapNewTypeToLegacy(type: string): string {
  const map: Record<string, string> = {
    website: 'link', paper: 'doc', blog: 'link', lark_doc: 'doc',
    wechat: 'link', video: 'video', book: 'link',
  };
  return map[type] || 'link';
}
