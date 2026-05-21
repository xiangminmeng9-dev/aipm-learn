'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { getTodos, createTodo, updateTodo, deleteTodo, Todo } from '@/lib/notebook-store';
import GradientBackground from '@/components/ui/gradient-background';

type Filter = 'all' | 'pending' | 'completed';

const PRIORITY_COLORS: Record<string, { bg: string; text: string; dot: string }> = {
  high: { bg: 'bg-red-100 dark:bg-red-900/30', text: 'text-red-700 dark:text-red-300', dot: '#EF4444' },
  medium: { bg: 'bg-amber-100 dark:bg-amber-900/30', text: 'text-amber-700 dark:text-amber-300', dot: '#F59E0B' },
  low: { bg: 'bg-gray-100 dark:bg-gray-800/30', text: 'text-gray-600 dark:text-gray-400', dot: '#9CA3AF' },
};

const PRIORITY_LABELS: Record<string, string> = { high: '高', medium: '中', low: '低' };

function formatTime(dateStr: string | null): string {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  if (diffMin < 1) return '刚刚';
  if (diffMin < 60) return `${diffMin}分钟前`;
  const diffH = Math.floor(diffMin / 60);
  if (diffH < 24) return `${diffH}小时前`;
  const diffD = Math.floor(diffH / 24);
  if (diffD < 7) return `${diffD}天前`;
  return `${d.getMonth() + 1}/${d.getDate()}`;
}

export default function TodosPage() {
  const [todos, setTodos] = useState<Todo[]>([]);
  const [filter, setFilter] = useState<Filter>('all');
  const [quickAdd, setQuickAdd] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const inputRef = useRef<HTMLInputElement>(null);

  const loadTodos = useCallback(async () => {
    const { todos: data } = await getTodos();
    setTodos(data);
    setLoading(false);
  }, []);

  useEffect(() => { loadTodos(); }, [loadTodos]);

  // Quick add
  const handleQuickAdd = useCallback(async () => {
    const title = quickAdd.trim();
    if (!title) return;
    setQuickAdd('');
    inputRef.current?.focus();

    // Optimistic: add locally first
    const tempId = crypto.randomUUID();
    const optimisticTodo: Todo = {
      id: tempId,
      title,
      description: '',
      priority: 'medium',
      status: 'pending',
      category: 'todo',
      due_date: null,
      sort_order: 0,
      completed_at: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    setTodos(prev => [optimisticTodo, ...prev]);

    // Sync to server
    const { todo: saved } = await createTodo({ title });
    if (saved) {
      setTodos(prev => prev.map(t => t.id === tempId ? saved : t));
    }
  }, [quickAdd, todos.length]);

  // Toggle status
  const handleToggle = useCallback(async (todo: Todo) => {
    const nextStatus = todo.status === 'pending' ? 'in_progress'
      : todo.status === 'in_progress' ? 'completed' : 'pending';

    // Optimistic update
    setTodos(prev => prev.map(t =>
      t.id === todo.id
        ? { ...t, status: nextStatus, completed_at: nextStatus === 'completed' ? new Date().toISOString() : null }
        : t
    ));

    await updateTodo(todo.id, { status: nextStatus });
  }, []);

  // Cycle priority
  const handleCyclePriority = useCallback(async (todo: Todo) => {
    const next = todo.priority === 'low' ? 'medium' : todo.priority === 'medium' ? 'high' : 'low';
    setTodos(prev => prev.map(t => t.id === todo.id ? { ...t, priority: next } : t));
    await updateTodo(todo.id, { priority: next });
  }, []);

  // Inline title edit
  const startEdit = useCallback((todo: Todo) => {
    setEditingId(todo.id);
    setEditTitle(todo.title);
  }, []);

  const saveEdit = useCallback(async (todo: Todo) => {
    const newTitle = editTitle.trim();
    if (!newTitle || newTitle === todo.title) {
      setEditingId(null);
      return;
    }
    setTodos(prev => prev.map(t => t.id === todo.id ? { ...t, title: newTitle } : t));
    setEditingId(null);
    await updateTodo(todo.id, { title: newTitle });
  }, [editTitle]);

  // Delete
  const handleDelete = useCallback(async (id: string) => {
    setTodos(prev => prev.filter(t => t.id !== id));
    if (expandedId === id) setExpandedId(null);
    if (editingId === id) setEditingId(null);
    await deleteTodo(id);
  }, [expandedId, editingId]);

  // Update due date
  const handleDueDate = useCallback(async (todo: Todo, date: string) => {
    setTodos(prev => prev.map(t => t.id === todo.id ? { ...t, due_date: date || null } : t));
    await updateTodo(todo.id, { due_date: date || null });
  }, []);

  // Update description
  const handleDescription = useCallback(async (todo: Todo, desc: string) => {
    setTodos(prev => prev.map(t => t.id === todo.id ? { ...t, description: desc } : t));
    await updateTodo(todo.id, { description: desc });
  }, []);

  const filteredTodos = filter === 'all' ? todos
    : filter === 'pending' ? todos.filter(t => t.status !== 'completed')
    : todos.filter(t => t.status === 'completed');

  const pendingCount = todos.filter(t => t.status !== 'completed').length;
  const completedCount = todos.filter(t => t.status === 'completed').length;

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-indigo-500 border-t-transparent" />
      </div>
    );
  }

  return (
    <>
      <GradientBackground />
      <div className="relative z-10 p-6 space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">待办事项</h1>
          <p className="mt-1 text-sm text-muted-foreground">管理你的任务清单，快速添加、即时完成</p>
        </div>

        {/* Stats */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 rounded-xl bg-muted px-3 py-2">
            <span className="text-sm font-semibold text-foreground">{pendingCount}</span>
            <span className="text-xs text-muted-foreground">待办</span>
          </div>
          <div className="flex items-center gap-2 rounded-xl bg-muted px-3 py-2">
            <span className="text-sm font-semibold text-emerald-600">{completedCount}</span>
            <span className="text-xs text-muted-foreground">已完成</span>
          </div>
          {todos.length > 0 && (
            <div className="flex items-center gap-2">
              <div className="h-2 w-24 rounded-full bg-muted overflow-hidden">
                <div className="h-full rounded-full bg-emerald-500 transition-all" style={{ width: `${Math.round((completedCount / todos.length) * 100)}%` }} />
              </div>
              <span className="text-xs text-muted-foreground">{Math.round((completedCount / todos.length) * 100)}%</span>
            </div>
          )}
        </div>

        {/* Quick Add */}
        <div className="flex gap-2">
          <input
            ref={inputRef}
            value={quickAdd}
            onChange={(e) => setQuickAdd(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') handleQuickAdd(); }}
            placeholder="添加待办事项，按 Enter 创建..."
            className="flex-1 rounded-xl border-2 border-border bg-card px-4 py-2.5 text-sm text-foreground placeholder-muted-foreground transition-colors focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-[#4F46E5]/20"
          />
          <button
            onClick={handleQuickAdd}
            disabled={!quickAdd.trim()}
            className="rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-indigo-700 disabled:opacity-40"
          >
            添加
          </button>
        </div>

        {/* Filter Tabs */}
        <div className="flex gap-1 rounded-lg bg-muted p-1">
          {(['all', 'pending', 'completed'] as Filter[]).map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`rounded-md px-4 py-1.5 text-xs font-semibold transition-colors ${
                filter === f ? 'bg-indigo-600 text-white' : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              {f === 'all' ? `全部 (${todos.length})` : f === 'pending' ? `待办 (${pendingCount})` : `已完成 (${completedCount})`}
            </button>
          ))}
        </div>

        {/* Todo List */}
        {filteredTodos.length === 0 ? (
          <div className="py-16 text-center">
            <p className="text-muted-foreground">{filter === 'completed' ? '还没有已完成的任务' : '还没有待办事项'}</p>
            <p className="mt-1 text-sm text-muted-foreground">在上方输入框添加你的第一个待办</p>
          </div>
        ) : (
          <div className="space-y-2">
            {filteredTodos.map(todo => {
              const isCompleted = todo.status === 'completed';
              const isInProgress = todo.status === 'in_progress';
              const pri = PRIORITY_COLORS[todo.priority] || PRIORITY_COLORS.medium;

              return (
                <div
                  key={todo.id}
                  className={`group rounded-xl border bg-card px-4 py-3 transition-all ${
                    isCompleted ? 'border-border/50 opacity-60' : 'border-border'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    {/* Checkbox */}
                    <button
                      onClick={() => handleToggle(todo)}
                      className={`shrink-0 h-5 w-5 rounded-full border-2 transition-all ${
                        isCompleted ? 'border-emerald-500 bg-emerald-500' : isInProgress ? 'border-indigo-500 bg-indigo-500/30' : 'border-border hover:border-indigo-400'
                      }`}
                    >
                      {isCompleted && (
                        <svg className="h-3 w-3 mx-auto text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                        </svg>
                      )}
                      {isInProgress && (
                        <div className="h-2 w-2 mx-auto rounded-full bg-indigo-500" />
                      )}
                    </button>

                    {/* Title */}
                    {editingId === todo.id ? (
                      <input
                        value={editTitle}
                        onChange={(e) => setEditTitle(e.target.value)}
                        onKeyDown={(e) => { if (e.key === 'Enter') saveEdit(todo); if (e.key === 'Escape') setEditingId(null); }}
                        onBlur={() => saveEdit(todo)}
                        autoFocus
                        className="flex-1 rounded-lg border border-indigo-300 bg-transparent px-2 py-0.5 text-sm text-foreground outline-none"
                      />
                    ) : (
                      <span
                        onDoubleClick={() => startEdit(todo)}
                        className={`flex-1 text-sm cursor-text ${isCompleted ? 'line-through text-muted-foreground' : 'text-foreground'}`}
                      >
                        {todo.title}
                      </span>
                    )}

                    {/* Priority badge */}
                    <button
                      onClick={() => handleCyclePriority(todo)}
                      className={`shrink-0 rounded-md px-1.5 py-0.5 text-[10px] font-semibold ${pri.bg} ${pri.text} transition-colors`}
                    >
                      {PRIORITY_LABELS[todo.priority]}
                    </button>

                    {/* Due date */}
                    {todo.due_date && (
                      <span className="shrink-0 text-[10px] text-muted-foreground">
                        {new Date(todo.due_date).toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' })}
                      </span>
                    )}

                    {/* Timestamp */}
                    <span className="shrink-0 text-[10px] text-muted-foreground">
                      {isCompleted ? `完成于 ${formatTime(todo.completed_at)}` : formatTime(todo.created_at)}
                    </span>

                    {/* Expand toggle */}
                    <button
                      onClick={() => setExpandedId(expandedId === todo.id ? null : todo.id)}
                      className="shrink-0 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <svg className={`h-4 w-4 text-muted-foreground transition-transform ${expandedId === todo.id ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
                      </svg>
                    </button>

                    {/* Delete */}
                    <button
                      onClick={() => handleDelete(todo.id)}
                      className="shrink-0 opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-red-500"
                    >
                      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>

                  {/* Expanded detail */}
                  {expandedId === todo.id && (
                    <div className="mt-3 pt-3 border-t border-border space-y-3">
                      {/* Description */}
                      <div>
                        <label className="text-xs font-medium text-muted-foreground mb-1">备注</label>
                        <textarea
                          value={todo.description}
                          onChange={(e) => handleDescription(todo, e.target.value)}
                          placeholder="添加备注..."
                          rows={2}
                          className="w-full rounded-lg border border-border bg-muted/50 px-3 py-2 text-sm text-foreground placeholder-muted-foreground resize-none focus:border-indigo-500 focus:outline-none"
                        />
                      </div>

                      {/* Due date */}
                      <div className="flex items-center gap-2">
                        <label className="text-xs font-medium text-muted-foreground">截止日期</label>
                        <input
                          type="date"
                          value={todo.due_date || ''}
                          onChange={(e) => handleDueDate(todo, e.target.value)}
                          className="rounded-lg border border-border bg-muted/50 px-2 py-1 text-xs text-foreground focus:border-indigo-500 focus:outline-none"
                        />
                        {todo.due_date && (
                          <button
                            onClick={() => handleDueDate(todo, '')}
                            className="text-xs text-muted-foreground hover:text-red-500"
                          >
                            清除
                          </button>
                        )}
                      </div>

                      {/* Timestamps */}
                      <div className="flex items-center gap-4 text-[10px] text-muted-foreground">
                        <span>创建: {new Date(todo.created_at).toLocaleString('zh-CN')}</span>
                        {todo.completed_at && <span>完成: {new Date(todo.completed_at).toLocaleString('zh-CN')}</span>}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </>
  );
}