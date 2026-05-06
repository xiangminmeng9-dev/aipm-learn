'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function RegisterForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    if (password !== confirmPassword) { setError('两次输入的密码不一致'); return; }
    if (password.length < 6) { setError('密码至少需要 6 个字符'); return; }
    setLoading(true);
    const supabase = createClient();
    const { error } = await supabase.auth.signUp({ email, password });
    if (error) { setError(error.message); setLoading(false); return; }
    router.push('/interview/qa');
    router.refresh();
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="w-full max-w-sm">
        <div className="rounded-2xl border border-border bg-card p-8 shadow-sm">
          <h1 className="mb-1 text-2xl font-semibold text-foreground">注册</h1>
          <p className="mb-6 text-sm text-muted-foreground">创建 AI 产品经理学习平台账号</p>
          <form onSubmit={handleRegister} className="space-y-4">
            <input type="email" placeholder="邮箱地址" value={email} onChange={(e) => setEmail(e.target.value)} required className="app-input w-full rounded-lg px-4 py-3 text-sm" />
            <input type="password" placeholder="密码（至少 6 个字符）" value={password} onChange={(e) => setPassword(e.target.value)} required className="app-input w-full rounded-lg px-4 py-3 text-sm" />
            <input type="password" placeholder="确认密码" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required className="app-input w-full rounded-lg px-4 py-3 text-sm" />
            {error && <p className="text-sm text-[#EF4444]">{error}</p>}
            <button type="submit" disabled={loading} className="app-btn-primary w-full rounded-lg py-3 text-sm font-medium disabled:opacity-50">
              {loading ? '注册中...' : '注册'}
            </button>
          </form>
          <p className="mt-4 text-center text-sm text-muted-foreground">
            已有账号？ <Link href="/login" className="text-indigo-600 hover:underline">登录</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
