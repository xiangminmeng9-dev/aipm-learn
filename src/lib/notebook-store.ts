// Notebook store — Supabase-backed with localStorage fallback and user notification
import { createClient } from '@/lib/supabase/client';

type Listener = (offline: boolean) => void;

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
