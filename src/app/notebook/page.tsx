'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { type Note, getNotes, createNote, updateNote, deleteNote } from '@/lib/notebook-store';

/* ──────────────────────────── Config ──────────────────────────── */

const CATEGORY_CONFIG: Record<string, { label: string; icon: string; color: string; bg: string; border: string; accent: string; gradient: string }> = {
  problem: { label: '问题', icon: '🔥', color: 'text-rose-600', bg: 'bg-rose-50', border: 'border-rose-200', accent: '#f43f5e', gradient: 'from-rose-400 to-orange-400' },
  insight: { label: '洞察', icon: '💡', color: 'text-amber-600', bg: 'bg-amber-50', border: 'border-amber-200', accent: '#f59e0b', gradient: 'from-amber-400 to-yellow-400' },
  meeting: { label: '会议', icon: '📋', color: 'text-sky-600', bg: 'bg-sky-50', border: 'border-sky-200', accent: '#0ea5e9', gradient: 'from-sky-400 to-blue-400' },
  general: { label: '通用', icon: '📝', color: 'text-violet-600', bg: 'bg-violet-50', border: 'border-violet-200', accent: '#8b5cf6', gradient: 'from-violet-400 to-purple-400' },
};

/* ──────────────────────────── Glass Button ──────────────────────────── */

function GlassButton({
  children,
  onClick,
  className = '',
  color = 'indigo',
  size = 'sm',
}: {
  children: React.ReactNode;
  onClick?: () => void;
  className?: string;
  color?: string;
  size?: 'sm' | 'md';
}) {
  const colorMap: Record<string, string> = {
    indigo: 'bg-indigo-500/15 hover:bg-indigo-500/25 text-indigo-600 border-indigo-200/60',
    rose: 'bg-rose-500/15 hover:bg-rose-500/25 text-rose-600 border-rose-200/60',
    emerald: 'bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-600 border-emerald-200/60',
    amber: 'bg-amber-500/15 hover:bg-amber-500/25 text-amber-600 border-amber-200/60',
    gray: 'bg-secondary hover:bg-gray-200/80 text-muted-foreground border-border',
  };
  const sizeClass = size === 'sm' ? 'px-3 py-1.5 text-xs' : 'px-4 py-2 text-sm';

  return (
    <button
      onClick={onClick}
      className={`rounded-xl border backdrop-blur-sm shadow-sm transition-all duration-200 active:scale-95 ${colorMap[color] || colorMap.indigo} ${sizeClass} ${className}`}
    >
      {children}
    </button>
  );
}

/* ──────────────────────────── Note Card (rectangular) ──────────────────────────── */

function NoteCard({
  note,
  onOpen,
  onPin,
  onDelete,
}: {
  note: Note;
  onOpen: () => void;
  onPin: () => void;
  onDelete: () => void;
}) {
  const cc = CATEGORY_CONFIG[note.category] || CATEGORY_CONFIG.general;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      whileHover={{ y: -3 }}
      className="group relative"
    >
      <div
        className={`relative w-full cursor-pointer overflow-hidden rounded-2xl border ${cc.border} bg-card transition-all duration-300 group-hover:shadow-lg`}
        onClick={onOpen}
      >
        {/* Color accent bar at top */}
        <div className={`h-1.5 w-full bg-gradient-to-r ${cc.gradient}`} />

        <div className="p-4">
          {/* Top row: icon + category + pin */}
          <div className="mb-2 flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <span className="text-sm">{cc.icon}</span>
              <span className={`rounded-md px-2 py-0.5 text-[10px] font-semibold ${cc.color} ${cc.bg}`}>
                {cc.label}
              </span>
            </div>
            {note.pinned && <span className="text-xs">📌</span>}
          </div>

          {/* Title */}
          <h3 className="mb-1 line-clamp-2 text-sm font-bold text-foreground">{note.title}</h3>

          {/* Content preview */}
          {note.content && (
            <p className="line-clamp-2 text-xs leading-relaxed text-muted-foreground font-mono">{note.content.slice(0, 100)}</p>
          )}

          {/* Date */}
          <p className="mt-3 text-[10px] text-muted-foreground">{new Date(note.created_at).toLocaleDateString('zh-CN')}</p>
        </div>

        {/* Hover actions */}
        <div className="absolute inset-0 flex items-center justify-center gap-2 rounded-2xl bg-black/5 opacity-0 transition-opacity duration-200 group-hover:opacity-100">
          <button
            onClick={(e) => { e.stopPropagation(); onPin(); }}
            className="rounded-lg bg-white/90 px-3 py-1.5 text-xs font-medium text-muted-foreground shadow-sm hover:bg-white"
          >
            {note.pinned ? '取消置顶' : '📌 置顶'}
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); onDelete(); }}
            className="rounded-lg bg-rose-50 px-3 py-1.5 text-xs font-medium text-rose-500 shadow-sm hover:bg-rose-100"
          >
            删除
          </button>
        </div>
      </div>
    </motion.div>
  );
}

/* ──────────────────────────── Note Editor ──────────────────────────── */

function NoteEditor({
  note,
  onSave,
  onClose,
}: {
  note: Note;
  onSave: (id: string, updates: Partial<Note>) => void;
  onClose: () => void;
}) {
  const [title, setTitle] = useState(note.title);
  const [content, setContent] = useState(note.content);
  const [category, setCategory] = useState(note.category);
  const [showPreview, setShowPreview] = useState(false);
  const cc = CATEGORY_CONFIG[category] || CATEGORY_CONFIG.general;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-4 z-50 flex items-center justify-center p-4 md:inset-8"
      onClick={onClose}
    >
      <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" />
      <motion.div
        initial={{ y: 30, scale: 0.95 }}
        animate={{ y: 0, scale: 1 }}
        exit={{ y: 30, scale: 0.95 }}
        className="relative z-10 flex w-full max-w-3xl flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Accent bar */}
        <div className={`h-1.5 w-full bg-gradient-to-r ${cc.gradient}`} />

        {/* Header */}
        <div className="flex items-center justify-between border-b border-border px-6 py-4">
          <div className="flex items-center gap-3">
            <span className="text-lg">{cc.icon}</span>
            <span className={`rounded-lg px-2.5 py-1 text-xs font-semibold ${cc.color} ${cc.bg} border ${cc.border}`}>{cc.label}</span>
            <h2 className="text-lg font-bold text-foreground">{title || '未命名笔记'}</h2>
          </div>
          <div className="flex items-center gap-2">
            <GlassButton onClick={() => setShowPreview(!showPreview)} color="gray">{showPreview ? '编辑' : '预览'}</GlassButton>
            <GlassButton onClick={onClose} color="gray">关闭</GlassButton>
          </div>
        </div>

        {/* Editor */}
        <div className="flex-1 overflow-y-auto p-6">
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="笔记标题..."
            className="mb-4 w-full bg-transparent text-xl font-bold text-foreground placeholder:text-muted-foreground focus:outline-none"
          />
          <div className="mb-4 flex items-center gap-2">
            {Object.entries(CATEGORY_CONFIG).map(([k, v]) => (
              <button
                key={k}
                onClick={() => setCategory(k)}
                className={`flex items-center gap-1 rounded-lg px-3 py-1.5 text-xs font-medium transition-all ${
                  category === k ? `${v.color} ${v.bg} border ${v.border}` : 'text-muted-foreground hover:text-muted-foreground border border-transparent'
                }`}
              >
                <span>{v.icon}</span>{v.label}
              </button>
            ))}
          </div>

          {showPreview ? (
            <div className="min-h-[300px] rounded-xl border border-border bg-muted p-5">
              <div className="prose prose-sm max-w-none">
                <ReactMarkdown remarkPlugins={[remarkGfm]}>{content || '*暂无内容*'}</ReactMarkdown>
              </div>
            </div>
          ) : (
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="支持 Markdown 语法..."
              className="min-h-[300px] w-full resize-none rounded-xl border border-border bg-muted p-5 font-mono text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-indigo-300"
            />
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between border-t border-border px-6 py-3">
          <p className="text-[10px] text-muted-foreground">最后编辑: {new Date(note.updated_at).toLocaleString('zh-CN')}</p>
          <GlassButton onClick={() => onSave(note.id, { title, content, category })} color="indigo" size="md">保存</GlassButton>
        </div>
      </motion.div>
    </motion.div>
  );
}

/* ──────────────────────────── Page ──────────────────────────── */

export default function NotesPage() {
  const [notes, setNotes] = useState<Note[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthed, setIsAuthed] = useState(false);
  const [editingNote, setEditingNote] = useState<Note | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newCategory, setNewCategory] = useState('general');
  const [filterCategory, setFilterCategory] = useState<string | null>(null);

  const fetchNotes = useCallback(async () => {
    const { notes: n, authed } = await getNotes(filterCategory ?? undefined);
    setNotes(n);
    setIsAuthed(authed);
    setIsLoading(false);
  }, [filterCategory]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const { notes: n, authed } = await getNotes(filterCategory ?? undefined);
      if (cancelled) return;
      setNotes(n);
      setIsAuthed(authed);
      setIsLoading(false);
    })();
    return () => { cancelled = true; };
  }, [filterCategory]);

  const handleCreate = async () => {
    if (!newTitle.trim()) return;
    const { note } = await createNote(newTitle.trim(), newCategory);
    setNewTitle('');
    setIsCreating(false);
    setEditingNote(note);
    fetchNotes();
  };

  const handleUpdate = async (id: string, updates: Partial<Note>) => {
    const { note } = await updateNote(id, updates);
    setEditingNote(note);
    fetchNotes();
  };

  const handleDelete = async (id: string) => {
    if (!confirm('确定删除此笔记？')) return;
    await deleteNote(id);
    if (editingNote?.id === id) setEditingNote(null);
    fetchNotes();
  };

  const handlePin = async (id: string) => {
    const note = notes.find((n) => n.id === id);
    if (note) await updateNote(id, { pinned: !note.pinned });
    fetchNotes();
  };

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-indigo-500 border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="min-h-full p-6 md:p-8">
      {/* Header */}
      <div
        className="relative mb-8 overflow-hidden rounded-2xl"
        style={{
          backgroundImage: `url('https://images.unsplash.com/photo-1527236438218-d82077ae1f85?w=1600&q=80&auto=format')`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      >
        <div className="absolute inset-0 bg-gradient-to-r from-emerald-900/75 via-teal-800/55 to-green-900/70" />
        <div className="absolute inset-0 bg-white/5" />
        <div className="relative z-10 px-8 py-8">
          <h1 className="mb-1 text-2xl font-bold text-white drop-shadow-sm">📝 AI PM 笔记本</h1>
          <p className="text-sm text-white/80">记录工作中遇到的问题与洞察，沉淀产品思维</p>
          {!isAuthed && (
            <p className="mt-2 text-xs text-white/40">数据保存在本地 · <a href="/login" className="underline hover:text-white/60">登录</a>后可同步至云端</p>
          )}
        </div>
      </div>

      {/* Category filter - big buttons */}
      <div className="mb-5 flex flex-wrap items-center gap-2">
        <button
          onClick={() => setFilterCategory(null)}
          className={`flex items-center gap-1.5 rounded-xl px-4 py-2 text-sm font-medium transition-all ${
            filterCategory === null
              ? 'bg-gray-800 text-white shadow-sm'
              : 'bg-card text-muted-foreground border border-border hover:bg-muted'
          }`}
        >
          📚 全部
        </button>
        {Object.entries(CATEGORY_CONFIG).map(([k, v]) => (
          <button
            key={k}
            onClick={() => setFilterCategory(filterCategory === k ? null : k)}
            className={`flex items-center gap-1.5 rounded-xl px-4 py-2 text-sm font-medium transition-all ${
              filterCategory === k
                ? `${v.bg} ${v.color} border ${v.border} shadow-sm`
                : 'bg-card text-muted-foreground border border-border hover:bg-muted'
            }`}
          >
            <span>{v.icon}</span>{v.label}
          </button>
        ))}
        <div className="ml-auto flex items-center gap-2">
          <span className="text-xs text-muted-foreground">{notes.length} 条笔记</span>
          <GlassButton onClick={() => setIsCreating(true)} color="indigo" size="md">+ 新建笔记</GlassButton>
        </div>
      </div>

      {/* Create note form */}
      <AnimatePresence>
        {isCreating && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="mb-6 overflow-hidden"
          >
            <div className="rounded-2xl border border-indigo-200 bg-indigo-50/50 p-5">
              <input
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
                placeholder="笔记标题..."
                className="mb-3 w-full rounded-xl border border-border bg-card px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-indigo-300"
                autoFocus
              />
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {Object.entries(CATEGORY_CONFIG).map(([k, v]) => (
                    <button
                      key={k}
                      onClick={() => setNewCategory(k)}
                      className={`flex items-center gap-1 rounded-lg px-3 py-1.5 text-xs font-medium transition-all ${
                        newCategory === k ? `${v.color} ${v.bg} border ${v.border}` : 'text-muted-foreground hover:text-muted-foreground border border-transparent'
                      }`}
                    >
                      <span>{v.icon}</span>{v.label}
                    </button>
                  ))}
                </div>
                <div className="flex gap-2">
                  <GlassButton onClick={() => setIsCreating(false)} color="gray">取消</GlassButton>
                  <GlassButton onClick={handleCreate} color="indigo">创建</GlassButton>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Notes grid - rectangular cards */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
        <AnimatePresence mode="popLayout">
          {notes.map((note) => (
            <NoteCard
              key={note.id}
              note={note}
              onOpen={() => setEditingNote(note)}
              onPin={() => handlePin(note.id)}
              onDelete={() => handleDelete(note.id)}
            />
          ))}
        </AnimatePresence>
      </div>

      {notes.length === 0 && !isCreating && (
        <div className="py-16 text-center">
          <p className="text-sm text-muted-foreground">暂无笔记</p>
          <p className="mt-1 text-xs text-muted-foreground">点击「+ 新建笔记」开始</p>
        </div>
      )}

      {/* Editor modal */}
      <AnimatePresence>
        {editingNote && (
          <NoteEditor
            note={editingNote}
            onSave={handleUpdate}
            onClose={() => { setEditingNote(null); fetchNotes(); }}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
