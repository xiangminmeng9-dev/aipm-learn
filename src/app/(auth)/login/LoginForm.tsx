'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import Link from 'next/link';

export default function LoginForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const supabase = createClient();
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) {
        console.error('[Login] signInWithPassword error:', error);
        setError(error.message);
        setLoading(false);
        return;
      }
      console.log('[Login] signInWithPassword success, session:', !!data.session);
      // Wait for cookie to be fully written (Safari ITP needs this)
      await new Promise((r) => setTimeout(r, 300));
      window.location.href = '/interview/qa';
    } catch (err) {
      console.error('[Login] unexpected error:', err);
      setError('登录失败，请重试');
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="w-full max-w-sm">
        <div className="rounded-2xl border border-border bg-card p-8 shadow-sm">
          <h1 className="mb-1 text-2xl font-semibold text-foreground">登录</h1>
          <p className="mb-6 text-sm text-muted-foreground">登录 AI 产品经理学习平台</p>
          <form onSubmit={handleLogin} className="space-y-4">
            <input
              type="email" placeholder="邮箱地址" value={email} onChange={(e) => setEmail(e.target.value)} required
              className="app-input w-full rounded-lg px-4 py-3 text-sm"
            />
            <input
              type="password" placeholder="密码" value={password} onChange={(e) => setPassword(e.target.value)} required
              className="app-input w-full rounded-lg px-4 py-3 text-sm"
            />
            {error && <p className="text-sm text-[#EF4444]">{error}</p>}
            <button type="submit" disabled={loading} className="app-btn-primary w-full rounded-lg py-3 text-sm font-medium disabled:opacity-50">
              {loading ? '登录中...' : '登录'}
            </button>
          </form>
          <p className="mt-4 text-center text-sm text-muted-foreground">
            还没有账号？ <Link href="/register" className="text-indigo-600 hover:underline">注册</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
