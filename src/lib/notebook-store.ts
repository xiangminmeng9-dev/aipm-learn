// Notebook store — Supabase-backed with localStorage fallback and user notification
import { createClient } from '@/lib/supabase/client';

type Listener = (offline: boolean) => void;

export interface Note {
  id: string;
  title: string;
  content: string;
  category: string;
  tags: string[];
  pinned: boolean;
  created_at: string;
  updated_at: string;
}

export interface Task {
  id: string;
  title: string;
  description: string;
  date: string;
  start_time: string;
  duration: string;
  status: string;
  sort_order: number;
  from_template: boolean;
  is_fixed: boolean;
  created_at: string;
  updated_at: string;
}

export interface FixedTaskTemplate {
  id: string;
  title: string;
  description: string;
  start_time: string;
  duration: string;
  sort_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Todo {
  id: string;
  title: string;
  description: string;
  priority: 'high' | 'medium' | 'low';
  status: 'pending' | 'in_progress' | 'completed';
  category: string;
  due_date: string | null;
  sort_order: number;
  completed_at: string | null;
  created_at: string;
  updated_at: string;
}

class NotebookStore {
  private _offline = false;
  private _listeners: Listener[] = [];

  get isOffline() { return this._offline; }

  onChange(fn: Listener) {
    this._listeners.push(fn);
    return () => { this._listeners = this._listeners.filter((l) => l !== fn); };
  }

  private _notifyOffline() {
    if (!this._offline) {
      this._offline = true;
      this._listeners.forEach((l) => l(true));
    }
  }

  private _notifyOnline() {
    if (this._offline) {
      this._offline = false;
      this._listeners.forEach((l) => l(false));
    }
  }

  private _localKey(userId: string, key: string) {
    return `nb:${userId}:${key}`;
  }

  private _saveLocal(key: string, value: string) {
    try { localStorage.setItem(key, value); } catch { /* quota exceeded */ }
  }

  private _loadLocal(key: string): string | null {
    try { return localStorage.getItem(key); } catch { return null; }
  }

  async save(userId: string, key: string, value: string): Promise<void> {
    this._saveLocal(this._localKey(userId, key), value);
    try {
      const supabase = createClient();
      const { error } = await supabase
        .from('notebook_entries')
        .upsert({ user_id: userId, entry_key: key, content: value }, { onConflict: 'user_id,entry_key' });
      if (error) throw error;
      this._notifyOnline();
    } catch (err) {
      console.warn('API 不可用，数据仅保存在本地，登录后可同步:', err);
      this._notifyOffline();
    }
  }

  async load(userId: string, key: string): Promise<string | null> {
    try {
      const supabase = createClient();
      const { data, error } = await supabase
        .from('notebook_entries')
        .select('content')
        .eq('user_id', userId)
        .eq('entry_key', key)
        .maybeSingle();
      if (error) throw error;
      if (data?.content) {
        this._notifyOnline();
        return data.content;
      }
    } catch {
      this._notifyOffline();
    }
    return this._loadLocal(this._localKey(userId, key));
  }

  async remove(userId: string, key: string): Promise<void> {
    this._saveLocal(this._localKey(userId, key), '');
    try {
      const supabase = createClient();
      await supabase.from('notebook_entries').delete().eq('user_id', userId).eq('entry_key', key);
      this._notifyOnline();
    } catch {
      this._notifyOffline();
    }
  }

  async listKeys(userId: string): Promise<string[]> {
    try {
      const supabase = createClient();
      const { data, error } = await supabase
        .from('notebook_entries')
        .select('entry_key')
        .eq('user_id', userId);
      if (error) throw error;
      this._notifyOnline();
      return (data || []).map((d) => d.entry_key);
    } catch {
      this._notifyOffline();
      const prefix = `nb:${userId}:`;
      const keys: string[] = [];
      try {
        for (let i = 0; i < localStorage.length; i++) {
          const k = localStorage.key(i);
          if (k?.startsWith(prefix)) keys.push(k.slice(prefix.length));
        }
      } catch { /* ignore */ }
      return keys;
    }
  }
}

export const notebookStore = new NotebookStore();

// --- Notes API wrappers ---

export async function getNotes(category?: string): Promise<{ notes: Note[]; authed: boolean }> {
  try {
    const params = new URLSearchParams();
    if (category) params.set('category', category);
    const res = await fetch(`/api/notebook/notes?${params}`);
    if (!res.ok) throw new Error('Failed');
    const json = await res.json();
    return { notes: json.data || [], authed: true };
  } catch {
    return { notes: [], authed: false };
  }
}

export async function createNote(title: string, category: string, content = '', tags: string[] = []): Promise<{ note: Note | null }> {
  try {
    const res = await fetch('/api/notebook/notes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title, content, category, tags }),
    });
    if (!res.ok) throw new Error('Failed');
    const json = await res.json();
    return { note: json.note || null };
  } catch {
    return { note: null };
  }
}

export async function updateNote(id: string, updates: Partial<Pick<Note, 'title' | 'content' | 'category' | 'tags' | 'pinned'>>): Promise<{ note: Note | null }> {
  try {
    const res = await fetch(`/api/notebook/notes/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates),
    });
    if (!res.ok) throw new Error('Failed');
    const json = await res.json();
    return { note: json.note || null };
  } catch {
    return { note: null };
  }
}

export async function deleteNote(id: string): Promise<boolean> {
  try {
    const res = await fetch(`/api/notebook/notes/${id}`, { method: 'DELETE' });
    return res.ok;
  } catch {
    return false;
  }
}

// --- Tasks API wrappers ---

export async function getTasks(date?: string): Promise<{ tasks: Task[]; authed: boolean }> {
  try {
    const params = new URLSearchParams();
    if (date) params.set('date', date);
    const res = await fetch(`/api/notebook/tasks?${params}`);
    if (!res.ok) throw new Error('Failed');
    const json = await res.json();
    return { tasks: json.tasks || [], authed: true };
  } catch {
    return { tasks: [], authed: false };
  }
}

export async function createTask(task: Partial<Task> & { title: string }): Promise<{ tasks: Task[] }> {
  try {
    const res = await fetch('/api/notebook/tasks', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(task),
    });
    if (!res.ok) throw new Error('Failed');
    const json = await res.json();
    return { tasks: json.tasks || [] };
  } catch {
    return { tasks: [] };
  }
}

export async function createTasksBatch(items: (Partial<Task> & { title: string })[]): Promise<boolean> {
  try {
    const res = await fetch('/api/notebook/tasks', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ tasks: items }),
    });
    return res.ok;
  } catch {
    return false;
  }
}

export async function updateTask(id: string, updates: Partial<Pick<Task, 'title' | 'description' | 'start_time' | 'duration' | 'status' | 'sort_order' | 'is_fixed'>>): Promise<{ task: Task | null }> {
  try {
    const res = await fetch(`/api/notebook/tasks/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates),
    });
    if (!res.ok) throw new Error('Failed');
    const json = await res.json();
    return { task: json.task || null };
  } catch {
    return { task: null };
  }
}

export async function deleteTask(id: string): Promise<boolean> {
  try {
    const res = await fetch(`/api/notebook/tasks/${id}`, { method: 'DELETE' });
    return res.ok;
  } catch {
    return false;
  }
}

// --- Todos API wrappers ---

export async function getTodos(): Promise<{ todos: Todo[]; authed: boolean }> {
  try {
    const res = await fetch('/api/notebook/todos');
    if (!res.ok) throw new Error('Failed');
    const json = await res.json();
    return { todos: json.todos || [], authed: true };
  } catch {
    return { todos: [], authed: false };
  }
}

export async function createTodo(todo: { title: string; description?: string; priority?: string; due_date?: string | null }): Promise<{ todo: Todo | null }> {
  try {
    const res = await fetch('/api/notebook/todos', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(todo),
    });
    if (!res.ok) throw new Error('Failed');
    const json = await res.json();
    return { todo: json.todo || null };
  } catch {
    return { todo: null };
  }
}

export async function updateTodo(id: string, updates: Partial<Pick<Todo, 'title' | 'description' | 'priority' | 'status' | 'due_date' | 'sort_order'>>): Promise<{ todo: Todo | null }> {
  try {
    const res = await fetch('/api/notebook/todos', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, ...updates }),
    });
    if (!res.ok) throw new Error('Failed');
    const json = await res.json();
    return { todo: json.todo || null };
  } catch {
    return { todo: null };
  }
}

export async function deleteTodo(id: string): Promise<boolean> {
  try {
    const res = await fetch(`/api/notebook/todos?id=${id}`, { method: 'DELETE' });
    return res.ok;
  } catch {
    return false;
  }
}

// --- Fixed Task Templates API wrappers ---

export async function getFixedTaskTemplates(): Promise<{ templates: FixedTaskTemplate[]; authed: boolean }> {
  try {
    const res = await fetch('/api/notebook/fixed-tasks');
    if (!res.ok) throw new Error('Failed');
    const json = await res.json();
    return { templates: json.templates || [], authed: true };
  } catch {
    return { templates: [], authed: false };
  }
}

export async function createFixedTaskTemplate(template: {
  title: string;
  description?: string;
  start_time?: string;
  duration?: string;
}): Promise<{ template: FixedTaskTemplate | null }> {
  try {
    const res = await fetch('/api/notebook/fixed-tasks', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(template),
    });
    if (!res.ok) throw new Error('Failed');
    const json = await res.json();
    return { template: json.template || null };
  } catch {
    return { template: null };
  }
}

export async function updateFixedTaskTemplate(
  id: string,
  updates: Partial<Pick<FixedTaskTemplate, 'title' | 'description' | 'start_time' | 'duration' | 'sort_order' | 'is_active'>>
): Promise<{ template: FixedTaskTemplate | null }> {
  try {
    const res = await fetch(`/api/notebook/fixed-tasks/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates),
    });
    if (!res.ok) throw new Error('Failed');
    const json = await res.json();
    return { template: json.template || null };
  } catch {
    return { template: null };
  }
}

export async function deleteFixedTaskTemplate(id: string): Promise<boolean> {
  try {
    const res = await fetch(`/api/notebook/fixed-tasks/${id}`, { method: 'DELETE' });
    return res.ok;
  } catch {
    return false;
  }
}

export async function restoreFixedTaskForDate(templateId: string, date: string): Promise<{ task: Task | null }> {
  try {
    const res = await fetch('/api/notebook/fixed-tasks/skips', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ template_id: templateId, date }),
    });
    if (!res.ok) throw new Error('Failed');
    const json = await res.json();
    return { task: json.task || null };
  } catch {
    return { task: null };
  }
}
