'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import Link from 'next/link';

export default function RegisterForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault();
    setError('');

    if (password !== confirmPassword) {
      setError('两次输入的密码不一致');
      return;
    }

    if (password.length < 6) {
      setError('密码至少需要 6 个字符');
      return;
    }

    setLoading(true);

    const { error } = await supabase.auth.signUp({ email, password });

    if (error) {
      setError(error.message);
      setLoading(false);
      return;
    }

    router.push('/interview/qa');
    router.refresh();
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-neutral-950 px-4">
      <Card className="w-full max-w-md border-neutral-800 bg-neutral-900">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl text-neutral-50">注册</CardTitle>
          <CardDescription className="text-neutral-400">
            创建 AI 产品经理学习平台账号
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleRegister} className="space-y-4">
            <Input
              type="email"
              placeholder="邮箱地址"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="border-neutral-700 bg-neutral-800 text-neutral-50 placeholder:text-neutral-500"
            />
            <Input
              type="password"
              placeholder="密码（至少 6 个字符）"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="border-neutral-700 bg-neutral-800 text-neutral-50 placeholder:text-neutral-500"
            />
            <Input
              type="password"
              placeholder="确认密码"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              className="border-neutral-700 bg-neutral-800 text-neutral-50 placeholder:text-neutral-500"
            />
            {error && <p className="text-sm text-red-400">{error}</p>}
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? '注册中...' : '注册'}
            </Button>
          </form>
          <p className="mt-4 text-center text-sm text-neutral-400">
            已有账号？{' '}
            <Link href="/login" className="text-amber-400 hover:text-amber-300">
              登录
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
