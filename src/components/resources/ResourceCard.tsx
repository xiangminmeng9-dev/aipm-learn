'use client';

import { useState } from 'react';
import { ExternalResource } from '@/types';
import { RESOURCE_TYPE_MAP, getResourceTypeIcon, getSubcategoryLabel } from './constants';

// 文件夹卡片
export function FolderCard({ folder, itemCount, onNavigate, onDelete }: {
  folder: ExternalResource;
  itemCount: number;
  onNavigate: () => void;
  onDelete: (id: string) => void;
}) {
  return (
    <div
      onClick={onNavigate}
      className="group relative rounded-xl border border-dashed border-border bg-card overflow-hidden transition hover:border-indigo-300 hover:shadow-md cursor-pointer"
    >
      <div className="h-28 bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-indigo-900/30 dark:to-purple-900/30 flex items-center justify-center">
        <div className="flex flex-col items-center gap-1">
          <span className="text-4xl">📁</span>
        </div>
      </div>
      <div className="p-3">
        <div className="text-sm font-medium text-foreground truncate">{folder.title}</div>
        <div className="mt-0.5 text-xs text-muted-foreground">{itemCount} 个项目</div>
        {folder.notes && <p className="mt-1 text-xs text-muted-foreground line-clamp-1">{folder.notes}</p>}
      </div>
      <button onClick={(e) => { e.stopPropagation(); onDelete(folder.id); }} className="absolute top-2 left-2 rounded-lg p-1.5 bg-white/80 text-muted-foreground opacity-0 transition group-hover:opacity-100 hover:bg-red-50 hover:text-red-500">
        <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" /></svg>
      </button>
    </div>
  );
}

// 网站略缩图卡片
function WebsiteCard({ resource, onDelete, onEdit, onMove }: { resource: ExternalResource; onDelete: () => void; onEdit?: () => void; onMove?: () => void }) {
  const faviconUrl = resource.thumbnail_url || getFaviconUrl(resource.url);
  const subCat = resource.subcategory ? getSubcategoryLabel(resource.resource_type || 'website', resource.subcategory) : null;

  return (
    <div className="group relative rounded-xl border border-border bg-card overflow-hidden transition hover:border-indigo-200 hover:shadow-md">
      <div className="relative h-28 bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-indigo-600/40 dark:to-purple-600/40 flex items-center justify-center overflow-hidden">
        {faviconUrl ? (
          <img src={faviconUrl} alt={resource.title} className="w-16 h-16 rounded-lg object-cover" onError={(e) => { (e.target as HTMLImageElement).src = ''; (e.target as HTMLImageElement).style.display = 'none'; }} />
        ) : (
          <span className="text-4xl">🌐</span>
        )}
        {subCat && (
          <span className="absolute top-2 right-2 px-2 py-0.5 rounded-full bg-indigo-600 text-white text-[10px] font-medium">{subCat}</span>
        )}
      </div>
      <div className="p-3">
        <div className="flex items-center gap-1.5">
          <span className="text-xs">{getResourceTypeIcon(resource.resource_type || 'website')}</span>
          <a href={resource.url} target="_blank" rel="noopener noreferrer" className="text-sm font-medium text-foreground truncate hover:text-indigo-600 transition">{resource.title}</a>
        </div>
        {resource.description && (
          <p className="mt-1 text-xs text-muted-foreground line-clamp-2">{resource.description}</p>
        )}
        {resource.source && (
          <span className="mt-1 inline-block text-[10px] text-muted-foreground">{resource.source}</span>
        )}
      </div>
      <div className="absolute top-2 left-2 flex gap-1 opacity-0 transition group-hover:opacity-100">
        {onMove && (
          <button onClick={onMove} className="rounded-lg p-1.5 bg-white/80 text-muted-foreground hover:bg-blue-50 hover:text-blue-500" title="移动到文件夹">
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
    </div>
  );
}

// 论文卡片
function PaperCard({ resource, onDelete, onEdit, onMove }: { resource: ExternalResource; onDelete: () => void; onEdit?: () => void; onMove?: () => void }) {
  const subCat = resource.subcategory ? getSubcategoryLabel('paper', resource.subcategory) : null;
  const isArxiv = resource.url?.includes('arxiv.org');

  return (
    <div className="group relative rounded-xl border border-border bg-card p-4 transition hover:border-emerald-200 hover:shadow-sm">
      <div className="flex items-start gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-sm">{getResourceTypeIcon('paper')}</span>
            {isArxiv && <span className="px-1.5 py-0.5 rounded bg-orange-100 text-orange-700 text-[10px] font-bold">arXiv</span>}
            {subCat && <span className="px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-700 text-[10px] font-medium">{subCat}</span>}
          </div>
          <a href={resource.url} target="_blank" rel="noopener noreferrer" className="mt-1.5 text-base font-medium text-foreground hover:text-emerald-600 transition line-clamp-2">{resource.title}</a>
          {resource.author && <p className="mt-1 text-xs text-muted-foreground">{resource.author} {resource.year ? `(${resource.year})` : ''}</p>}
          {resource.description && <p className="mt-1 text-xs text-muted-foreground line-clamp-2">{resource.description}</p>}
        </div>
      </div>
      <div className="absolute top-2 right-2 flex gap-1 opacity-0 transition group-hover:opacity-100">
        {onMove && (
          <button onClick={onMove} className="rounded-lg p-1.5 text-muted-foreground hover:bg-blue-50 hover:text-blue-500" title="移动">
            <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M3 7.5L7.5 3m0 0L12 7.5M7.5 3v13.5m13.5 0L16.5 21m0 0L12 16.5m4.5 4.5V7.5" /></svg>
          </button>
        )}
        {onEdit && (
          <button onClick={onEdit} className="rounded-lg p-1.5 text-muted-foreground hover:bg-indigo-50 hover:text-indigo-500" title="编辑">
            <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L6.832 19.82a4.5 4.5 0 0 1-1.897 1.13l-2.685.8.8-2.685a4.5 4.5 0 0 1 1.13-1.897L16.863 4.487Z" /></svg>
          </button>
        )}
        <button onClick={onDelete} className="rounded-lg p-1.5 text-muted-foreground hover:bg-red-50 hover:text-red-500" title="删除">
          <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" /></svg>
        </button>
      </div>
    </div>
  );
}

// 博客/飞书文档/公众号 - 文章卡片
function ArticleCard({ resource, onDelete, onEdit, onMove }: { resource: ExternalResource; onDelete: () => void; onEdit?: () => void; onMove?: () => void }) {
  const type = resource.resource_type || 'blog';
  const typeDef = RESOURCE_TYPE_MAP[type];
  const subCat = resource.subcategory ? getSubcategoryLabel(type, resource.subcategory) : null;
  const icon = getResourceTypeIcon(type);
  const platformBadge = resource.platform || resource.source || null;

  return (
    <div className="group relative rounded-xl border border-border bg-card p-4 transition hover:border-purple-200 hover:shadow-sm">
      <div className="flex items-start gap-3 min-w-0">
        <span className="text-lg shrink-0">{icon}</span>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            {typeDef && <span className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${type === 'lark_doc' ? 'bg-blue-100 text-blue-700' : type === 'wechat' ? 'bg-green-100 text-green-700' : 'bg-purple-100 text-purple-700'}`}>{typeDef.label}</span>}
            {subCat && <span className="px-1.5 py-0.5 rounded bg-muted text-muted-foreground text-[10px]">{subCat}</span>}
            {platformBadge && <span className="px-1.5 py-0.5 rounded bg-muted text-muted-foreground text-[10px]">{platformBadge}</span>}
          </div>
          {resource.url ? (
            <a href={resource.url} target="_blank" rel="noopener noreferrer" className="text-base font-medium text-foreground hover:text-indigo-600 transition line-clamp-2">{resource.title}</a>
          ) : (
            <span className="text-base font-medium text-foreground line-clamp-2">{resource.title}</span>
          )}
          {resource.description && <p className="mt-1 text-xs text-muted-foreground line-clamp-2">{resource.description}</p>}
          {resource.author && <p className="mt-0.5 text-[10px] text-muted-foreground">作者: {resource.author}</p>}
        </div>
      </div>
      <div className="absolute top-2 right-2 flex gap-1 opacity-0 transition group-hover:opacity-100">
        {onMove && (
          <button onClick={onMove} className="rounded-lg p-1.5 text-muted-foreground hover:bg-blue-50 hover:text-blue-500" title="移动">
            <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M3 7.5L7.5 3m0 0L12 7.5M7.5 3v13.5m13.5 0L16.5 21m0 0L12 16.5m4.5 4.5V7.5" /></svg>
          </button>
        )}
        {onEdit && (
          <button onClick={onEdit} className="rounded-lg p-1.5 text-muted-foreground hover:bg-indigo-50 hover:text-indigo-500" title="编辑">
            <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L6.832 19.82a4.5 4.5 0 0 1-1.897 1.13l-2.685.8.8-2.685a4.5 4.5 0 0 1 1.13-1.897L16.863 4.487Z" /></svg>
          </button>
        )}
        <button onClick={onDelete} className="rounded-lg p-1.5 text-muted-foreground hover:bg-red-50 hover:text-red-500" title="删除">
          <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" /></svg>
        </button>
      </div>
    </div>
  );
}

// 视频卡片
function VideoCard({ resource, onDelete, onEdit, onMove }: { resource: ExternalResource; onDelete: () => void; onEdit?: () => void; onMove?: () => void }) {
  const subCat = resource.subcategory ? getSubcategoryLabel('video', resource.subcategory) : null;
  const platformBadge = resource.platform || resource.source || null;

  return (
    <div className="group relative rounded-xl border border-border bg-card overflow-hidden transition hover:border-red-200 hover:shadow-md">
      <div className="relative h-32 bg-gradient-to-br from-red-50 to-orange-50 dark:from-red-600/40 dark:to-orange-600/40 flex items-center justify-center">
        {resource.thumbnail_url ? (
          <img src={resource.thumbnail_url} alt={resource.title} className="w-full h-full object-cover" onError={(e) => { (e.target as HTMLImageElement).src = ''; }} />
        ) : (
          <div className="flex items-center justify-center">
            <div className="w-12 h-12 rounded-full bg-red-600/20 flex items-center justify-center">
              <svg className="w-6 h-6 text-red-600" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>
            </div>
          </div>
        )}
        {resource.url && (
          <a href={resource.url} target="_blank" rel="noopener noreferrer" className="absolute inset-0 flex items-center justify-center opacity-0 transition hover:opacity-100 bg-black/30">
            <div className="w-14 h-14 rounded-full bg-white/90 flex items-center justify-center shadow-lg">
              <svg className="w-7 h-7 text-red-600" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>
            </div>
          </a>
        )}
        {subCat && <span className="absolute top-2 right-2 px-2 py-0.5 rounded-full bg-red-600 text-white text-[10px] font-medium">{subCat}</span>}
        {resource.duration && <span className="absolute bottom-2 right-2 px-1.5 py-0.5 rounded bg-black/60 text-white text-[10px]">{resource.duration}</span>}
      </div>
      <div className="p-3">
        <div className="flex items-center gap-1.5">
          <span className="text-xs">{getResourceTypeIcon('video')}</span>
          {resource.url ? (
            <a href={resource.url} target="_blank" rel="noopener noreferrer" className="text-sm font-medium text-foreground truncate hover:text-red-600 transition">{resource.title}</a>
          ) : (
            <span className="text-sm font-medium text-foreground truncate">{resource.title}</span>
          )}
        </div>
        {platformBadge && <span className="mt-1 inline-block px-1.5 py-0.5 rounded bg-red-100 text-red-700 text-[10px]">{platformBadge}</span>}
        {resource.description && <p className="mt-1 text-xs text-muted-foreground line-clamp-1">{resource.description}</p>}
      </div>
      <div className="absolute top-2 left-2 flex gap-1 opacity-0 transition group-hover:opacity-100">
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
    </div>
  );
}

// 书籍卡片
function BookCard({ resource, onDelete, onEdit, onMove }: { resource: ExternalResource; onDelete: () => void; onEdit?: () => void; onMove?: () => void }) {
  const subCat = resource.subcategory ? getSubcategoryLabel('book', resource.subcategory) : null;
  const isLocalFile = resource.local_path || (resource.url && (resource.url.startsWith('/') || resource.url.startsWith('file://')));
  const [copied, setCopied] = useState(false);

  const handleOpen = () => {
    const path = resource.local_path || resource.url;
    if (isLocalFile && path) {
      navigator.clipboard.writeText(path).then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      });
    } else if (resource.url) {
      window.open(resource.url, '_blank');
    }
  };

  return (
    <div className="group relative rounded-xl border border-border bg-card overflow-hidden transition hover:border-amber-200 hover:shadow-md">
      <div className="relative h-40 bg-gradient-to-br from-amber-50 to-yellow-50 dark:from-amber-600/40 dark:to-yellow-600/40 flex items-center justify-center">
        {resource.thumbnail_url ? (
          <img src={resource.thumbnail_url} alt={resource.title} className="w-28 h-36 object-contain rounded shadow" onError={(e) => { (e.target as HTMLImageElement).src = ''; }} />
        ) : (
          <div className="w-28 h-36 rounded shadow bg-amber-100 flex items-center justify-center border-2 border-amber-200">
            <span className="text-3xl">📚</span>
          </div>
        )}
        {subCat && <span className="absolute top-2 right-2 px-2 py-0.5 rounded-full bg-amber-600 text-white text-[10px] font-medium">{subCat}</span>}
        {isLocalFile && <span className="absolute bottom-2 left-2 px-1.5 py-0.5 rounded bg-amber-700/80 text-white text-[10px]">本地文件</span>}
      </div>
      <div className="p-3">
        <button onClick={handleOpen} className="text-sm font-medium text-foreground hover:text-amber-600 transition line-clamp-2 text-left">{resource.title}</button>
        {resource.author && <p className="mt-1 text-xs text-muted-foreground">{resource.author}</p>}
        {resource.description && <p className="mt-0.5 text-xs text-muted-foreground line-clamp-2">{resource.description}</p>}
        {copied && <p className="mt-1 text-xs text-emerald-600">路径已复制到剪贴板</p>}
        {isLocalFile && (resource.local_path || resource.url) && (
          <p className="mt-0.5 text-[10px] text-muted-foreground truncate">{resource.local_path || resource.url}</p>
        )}
      </div>
      <div className="absolute top-2 left-2 flex gap-1 opacity-0 transition group-hover:opacity-100">
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
  if (resource.type === 'folder') return null; // 文件夹由 FolderCard 单独渲染

  const type = resource.resource_type || inferTypeFromLegacy(resource);
  const del = () => onDelete(resource.id);
  const edit = onEdit ? () => onEdit(resource) : undefined;
  const move = onMove ? () => onMove(resource) : undefined;

  switch (type) {
    case 'website': return <WebsiteCard resource={resource} onDelete={del} onEdit={edit} onMove={move} />;
    case 'paper': return <PaperCard resource={resource} onDelete={del} onEdit={edit} onMove={move} />;
    case 'blog': return <ArticleCard resource={resource} onDelete={del} onEdit={edit} onMove={move} />;
    case 'lark_doc': return <ArticleCard resource={resource} onDelete={del} onEdit={edit} onMove={move} />;
    case 'wechat': return <ArticleCard resource={resource} onDelete={del} onEdit={edit} onMove={move} />;
    case 'video': return <VideoCard resource={resource} onDelete={del} onEdit={edit} onMove={move} />;
    case 'book': return <BookCard resource={resource} onDelete={del} onEdit={edit} onMove={move} />;
    default: return <WebsiteCard resource={resource} onDelete={del} onEdit={edit} onMove={move} />;
  }
}

// 旧类型推断
function inferTypeFromLegacy(resource: ExternalResource): string {
  if (resource.type === 'video') return 'video';
  if (resource.type === 'doc') return 'lark_doc';
  if (resource.type === 'folder') return 'website';
  return 'website';
}

// Google Favicon API 获取网站图标
function getFaviconUrl(url: string): string {
  try {
    if (!url) return '';
    const domain = new URL(url).hostname;
    return `https://www.google.com/s2/favicons?domain=${domain}&sz=64`;
  } catch {
    return '';
  }
}