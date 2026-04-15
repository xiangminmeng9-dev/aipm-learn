'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';

interface SessionListItem {
  id: string;
  title: string;
  has_jd: boolean;
  has_resume: boolean;
  message_count: number;
  updated_at: string;
}

export default function SessionsPage() {
  const [sessions, setSessions] = useState<SessionListItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [newTitle, setNewTitle] = useState('');

  useEffect(() => {
    fetchSessions();
  }, []);

  const fetchSessions = async () => {
    try {
      const res = await fetch('/api/interview/sessions');
      if (res.ok) {
        const data = await res.json();
        setSessions(data.sessions ?? []);
      }
    } catch {
      // 静默失败
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreate = useCallback(async () => {
    setIsCreating(true);
    try {
      const res = await fetch('/api/interview/sessions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: newTitle.trim() || undefined }),
      });

      if (res.ok) {
        const data = await res.json();
        window.location.href = `/interview/sessions/${data.id}`;
      }
    } catch {
      // 静默失败
    } finally {
      setIsCreating(false);
    }
  }, [newTitle]);

  const handleDelete = useCallback(async (id: string) => {
    if (!confirm('确定删除此对话？')) return;
    try {
      const res = await fetch(`/api/interview/sessions/${id}`, { method: 'DELETE' });
      if (res.ok) {
        setSessions((prev) => prev.filter((s) => s.id !== id));
      }
    } catch {
      // 静默失败
    }
  }, []);

  return (
    <div className="mx-auto max-w-4xl p-6">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-neutral-50">对话 Session</h1>
          <p className="mt-1 text-sm text-neutral-400">多轮对话，支持 JD/简历背景</p>
        </div>
        <Dialog>
          <DialogTrigger className="rounded-lg bg-amber-600 px-4 py-2 text-sm font-medium text-neutral-950 hover:bg-amber-500">
            + 新对话
          </DialogTrigger>
          <DialogContent className="border-neutral-700 bg-neutral-900">
            <DialogHeader>
              <DialogTitle className="text-neutral-100">创建新对话</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-2">
              <Input
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                placeholder="对话标题（可选）"
                className="border-neutral-700 bg-neutral-800 text-neutral-200"
              />
              <Button
                onClick={handleCreate}
                disabled={isCreating}
                className="w-full bg-amber-600 text-neutral-950 hover:bg-amber-500"
              >
                {isCreating ? '创建中...' : '创建'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-amber-600 border-t-transparent" />
        </div>
      ) : sessions.length === 0 ? (
        <div className="py-16 text-center">
          <p className="text-neutral-500">还没有对话</p>
          <p className="mt-1 text-sm text-neutral-600">点击&ldquo;新对话&rdquo;开始</p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {sessions.map((session) => (
            <Card
              key={session.id}
              className="border-neutral-700 bg-neutral-800/50 transition-colors hover:border-amber-600/50"
            >
              <CardHeader className="pb-2">
                <CardTitle className="text-base text-neutral-200">{session.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="mb-3 flex items-center gap-2 text-xs text-neutral-500">
                  <span>{session.message_count} 条消息</span>
                  {session.has_jd && <span>· 有 JD</span>}
                  {session.has_resume && <span>· 有简历</span>}
                </div>
                <div className="flex gap-2">
                  <Link href={`/interview/sessions/${session.id}`} className="flex-1">
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full border-neutral-600 text-neutral-300 hover:border-amber-600 hover:text-amber-400"
                    >
                      进入对话
                    </Button>
                  </Link>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDelete(session.id)}
                    className="text-neutral-500 hover:text-red-400"
                  >
                    删除
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
