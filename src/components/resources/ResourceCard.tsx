'use client';

import { useState } from 'react';
import { ExternalResource } from '@/types';
import { RESOURCE_TYPE_MAP, getResourceTypeIcon, getSubcategoryLabel } from './constants';

// 操作按钮
function ActionButtons({ onMove, onEdit, onDelete }: {
  onMove?: () => void; onEdit?: () => void; onDelete: () => void;
}) {
  return (
    <div className="absolute top-2 right-2 flex gap-1 opacity-0 transition group-hover:opacity-100">
      {onMove && (
        <button onClick={onMove} className="rounded-lg p-1.5 bg-white/80 text-muted-foreground hover:bg-blue-50 hover:text-blue-500" title="移动">
          <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M3 7.5L7.5 3m0 0L12 7.5M7.5 3v13.5m13.5 0L16.5 21m0 0L12 16.5m4.5 4.5V7.5" /></svg>
        </button>
      )}
      {onEdit && (
        <button onClick={onEdit} className="rounded-lg p-1.5 bg-white/80 text-muted-foreground hover:bg-indigo-50 hover:text-indigo-500" title="编辑">
          <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L6.832 19.82a4.5 4.5 0 0 1-1.897 1.13l-2.685.8.8-2.685a4.5 4.5 0 0 1 1.13-1.897L16.863 4.487Z" /></svg>
        </button>
      )}
      <button onClick={onDelete} className="rounded-lg p-1.5 bg-white/80 text-muted-foreground hover:bg-red-50 hover:text-red-500" title="删除">
        <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" /></svg>
      </button>
    </div>
  );
}

// 文件夹卡片
export function FolderCard({ folder, itemCount, onNavigate, onDelete, moduleTag }: {
  folder: ExternalResource; itemCount: number; onNavigate: () => void; onDelete: (id: string) => void; moduleTag?: string;
}) {
  return (
    <div
      onClick={onNavigate}
      className="group relative rounded-xl border border-dashed border-border bg-card p-4 transition hover:border-indigo-300 hover:shadow-md cursor-pointer"
    >
      <div className="flex items-center gap-3">
        <span className="text-2xl">📁</span>
        <div className="flex-1 min-w-0">
          <div className="text-sm font-medium text-foreground truncate">{folder.title}</div>
          <div className="text-xs text-muted-foreground">{itemCount} 个项目</div>
        </div>
      </div>
      {moduleTag && (
        <div className="mt-2"><span className="inline-block rounded-full bg-indigo-50 px-2 py-0.5 text-[10px] font-medium text-indigo-600">{moduleTag}</span></div>
      )}
      <button onClick={(e) => { e.stopPropagation(); onDelete(folder.id); }} className="absolute top-2 right-2 rounded-lg p-1.5 text-muted-foreground opacity-0 transition group-hover:opacity-100 hover:bg-red-50 hover:text-red-500">
        <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" /></svg>
      </button>
    </div>
  );
}

// 类型颜色映射
function getTypeAccent(type: string) {
  switch (type) {
    case 'paper': return { bar: 'bg-emerald-500', badge: 'bg-emerald-100 text-emerald-700', hover: 'hover:border-emerald-200' };
    case 'video': return { bar: 'bg-red-500', badge: 'bg-red-100 text-red-700', hover: 'hover:border-red-200' };
    case 'book': return { bar: 'bg-amber-500', badge: 'bg-amber-100 text-amber-700', hover: 'hover:border-amber-200' };
    case 'lark_doc': return { bar: 'bg-blue-500', badge: 'bg-blue-100 text-blue-700', hover: 'hover:border-blue-200' };
    case 'wechat': return { bar: 'bg-green-500', badge: 'bg-green-100 text-green-700', hover: 'hover:border-green-200' };
    default: return { bar: 'bg-indigo-500', badge: 'bg-indigo-100 text-indigo-700', hover: 'hover:border-indigo-200' };
  }
}

// 统一资源卡片 — 无缩略图，信息优先
function UnifiedResourceCard({ resource, onDelete, onEdit, onMove }: {
  resource: ExternalResource; onDelete: () => void; onEdit?: () => void; onMove?: () => void;
}) {
  const type = resource.resource_type || 'website';
  const accent = getTypeAccent(type);
  const typeDef = RESOURCE_TYPE_MAP[type];
  const subCat = resource.subcategory ? getSubcategoryLabel(type, resource.subcategory) : null;
  const isLocalFile = type === 'book' && (resource.local_path || (resource.url && (resource.url.startsWith('/') || resource.url.startsWith('file://'))));
  const [copied, setCopied] = useState(false);

  const handleClick = () => {
    if (isLocalFile) {
      const path = resource.local_path || resource.url;
      if (path) {
        navigator.clipboard.writeText(path).then(() => { setCopied(true); setTimeout(() => setCopied(false), 2000); });
      }
    }
  };

  return (
    <div className={`group relative rounded-xl border border-border bg-card transition ${accent.hover} hover:shadow-sm`}>
      {/* 左侧色条 */}
      <div className={`absolute left-0 top-3 bottom-3 w-1 rounded-r ${accent.bar}`} />
      <div className="pl-4 pr-3 py-3.5">
        {/* 标题行 */}
        <div className="flex items-start gap-2 min-w-0">
          {resource.url && !isLocalFile ? (
            <a href={resource.url} target="_blank" rel="noopener noreferrer"
              className="text-sm font-semibold text-foreground hover:text-indigo-600 transition line-clamp-2 flex-1">
              {resource.title}
            </a>
          ) : (
            <button onClick={handleClick}
              className="text-sm font-semibold text-foreground hover:text-amber-600 transition line-clamp-2 flex-1 text-left">
              {resource.title}
            </button>
          )}
        </div>

        {/* 作者/年份行 */}
        {resource.author && (
          <p className="mt-1 text-xs text-muted-foreground">
            {resource.author}{resource.year ? ` (${resource.year})` : ''}
          </p>
        )}

        {/* 描述 */}
        {resource.description && (
          <p className="mt-1.5 text-xs text-muted-foreground line-clamp-2">{resource.description}</p>
        )}

        {/* 标签行 */}
        <div className="mt-2 flex items-center gap-1.5 flex-wrap">
          <span className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${accent.badge}`}>
            {typeDef?.label || type}
          </span>
          {subCat && (
            <span className="px-1.5 py-0.5 rounded bg-muted text-muted-foreground text-[10px]">{subCat}</span>
          )}
          {resource.url?.includes('arxiv.org') && (
            <span className="px-1.5 py-0.5 rounded bg-orange-100 text-orange-700 text-[10px] font-bold">arXiv</span>
          )}
          {resource.platform && (
            <span className="px-1.5 py-0.5 rounded bg-muted text-muted-foreground text-[10px]">{resource.platform}</span>
          )}
          {resource.duration && (
            <span className="px-1.5 py-0.5 rounded bg-muted text-muted-foreground text-[10px]">{resource.duration}</span>
          )}
          {resource.source && !resource.platform && (
            <span className="text-[10px] text-muted-foreground">{resource.source}</span>
          )}
          {resource.related_module_name && (
            <span className="px-1.5 py-0.5 rounded bg-indigo-50 text-indigo-600 text-[10px] font-medium">🔗 {resource.related_module_name}</span>
          )}
          {isLocalFile && (
            <span className="px-1.5 py-0.5 rounded bg-amber-100 text-amber-700 text-[10px]">本地文件</span>
          )}
        </div>

        {copied && <p className="mt-1 text-xs text-emerald-600">路径已复制</p>}
        {isLocalFile && (resource.local_path || resource.url) && (
          <p className="mt-0.5 text-[10px] text-muted-foreground truncate">{resource.local_path || resource.url}</p>
        )}
      </div>
      <ActionButtons onMove={onMove} onEdit={onEdit} onDelete={onDelete} />
    </div>
  );
}

// 根据资源类型选择渲染器
export function ResourceCard({ resource, onDelete, onEdit, onMove }: {
  resource: ExternalResource;
  onDelete: (id: string) => void;
  onEdit?: (resource: ExternalResource) => void;
  onMove?: (resource: ExternalResource) => void;
}) {
  if (resource.type === 'folder') return null;

  const type = resource.resource_type || inferTypeFromLegacy(resource);
  const del = () => onDelete(resource.id);
  const edit = onEdit ? () => onEdit(resource) : undefined;
  const move = onMove ? () => onMove(resource) : undefined;
  const res = { ...resource, resource_type: type as ExternalResource['resource_type'] };

  return <UnifiedResourceCard resource={res} onDelete={del} onEdit={edit} onMove={move} />;
}

function inferTypeFromLegacy(resource: ExternalResource): string {
  if (resource.type === 'video') return 'video';
  if (resource.type === 'doc') return 'lark_doc';
  if (resource.type === 'folder') return 'website';
  return 'website';
}

function getFaviconUrl(url: string): string {
  try {
    if (!url) return '';
    const domain = new URL(url).hostname;
    return `https://www.google.com/s2/favicons?domain=${domain}&sz=64`;
  } catch {
    return '';
  }
}
