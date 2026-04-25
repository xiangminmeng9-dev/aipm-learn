'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
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

function relativeTime(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return '刚刚';
  if (mins < 60) return `${mins} 分钟前`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours} 小时前`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days} 天前`;
  return new Date(dateStr).toLocaleDateString('zh-CN');
}

export default function SessionsPage() {
  const [sessions, setSessions] = useState<SessionListItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [newTitle, setNewTitle] = useState('');

  useEffect(() => { fetchSessions(); }, []);

  const fetchSessions = async () => {
    try {
      const res = await fetch('/api/interview/sessions');
      if (res.ok) {
        const data = await res.json();
        setSessions(data.sessions ?? []);
      }
    } catch {} finally { setIsLoading(false); }
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
    } catch {} finally { setIsCreating(false); }
  }, [newTitle]);

  const handleDelete = useCallback(async (id: string) => {
    if (!confirm('确定删除此对话？')) return;
    try {
      const res = await fetch(`/api/interview/sessions/${id}`, { method: 'DELETE' });
      if (res.ok) setSessions((prev) => prev.filter((s) => s.id !== id));
    } catch {}
  }, []);

  return (
    <div className="p-8">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-[#1F2937]">对话 Session</h1>
          <p className="mt-1 text-base text-[#6B7280]">多轮对话，支持 JD/简历背景</p>
        </div>
        <Dialog>
          <DialogTrigger className="app-btn-primary rounded-lg px-4 py-2 text-base font-medium">
            + 新对话
          </DialogTrigger>
          <DialogContent className="border-[#E5E7EB] bg-white">
            <DialogHeader>
              <DialogTitle className="text-[#1F2937]">创建新对话</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-2">
              <Input
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                placeholder="对话标题（可选）"
                className="app-input"
              />
              <Button onClick={handleCreate} disabled={isCreating} className="w-full app-btn-primary">
                {isCreating ? '创建中...' : '创建'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-16">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-indigo-500 border-t-transparent" />
        </div>
      ) : sessions.length === 0 ? (
        <div className="rounded-xl border border-dashed border-[#D1D5DB] bg-white py-16 text-center">
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-gray-100">
            <svg className="h-6 w-6 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 8.511c.884.284 1.5 1.128 1.5 2.097v4.286c0 1.136-.847 2.1-1.98 2.193-.34.027-.68.052-1.02.072v3.091l-3-3c-1.354 0-2.694-.055-4.02-.163a2.115 2.115 0 0 1-.825-.242m9.345-8.334a2.126 2.126 0 0 0-.476-.095 48.64 48.64 0 0 0-8.048 0c-1.131.094-1.976 1.057-1.976 2.192v4.286c0 .837.46 1.58 1.155 1.951m9.345-8.334V6.637c0-1.621-1.152-3.026-2.76-3.235A48.455 48.455 0 0 0 11.25 3c-2.115 0-4.198.137-6.24.402-1.608.209-2.76 1.614-2.76 3.235v6.226c0 1.621 1.152 3.026 2.76 3.235.577.075 1.157.14 1.74.194V21l4.155-4.155" />
            </svg>
          </div>
          <p className="text-sm font-medium text-[#6B7280]">还没有对话</p>
          <p className="mt-1 text-xs text-[#9CA3AF]">点击&ldquo;新对话&rdquo;开始</p>
        </div>
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          <AnimatePresence mode="popLayout">
            {sessions.map((session, index) => {
              const accentColor = session.has_jd && session.has_resume
                ? 'border-l-violet-400'
                : session.has_jd
                  ? 'border-l-indigo-400'
                  : 'border-l-sky-300';
              return (
                <motion.div
                  key={session.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.2, delay: index * 0.05 }}
                  className={`group overflow-hidden rounded-xl border border-[#E5E7EB] border-l-4 bg-white shadow-sm transition-shadow hover:shadow-md ${accentColor}`}
                >
                  {/* Top row: title + meta */}
                  <div className="px-4 pt-4 pb-3">
                    <h3 className="mb-2 text-base font-semibold text-[#1F2937] line-clamp-2">
                      {session.title}
                    </h3>
                    <div className="flex flex-wrap items-center gap-1.5">
                      {session.has_jd && (
                        <span className="inline-flex items-center rounded-md bg-indigo-50 px-1.5 py-0.5 text-[10px] font-medium text-indigo-600">JD</span>
                      )}
                      {session.has_resume && (
                        <span className="inline-flex items-center rounded-md bg-violet-50 px-1.5 py-0.5 text-[10px] font-medium text-violet-600">简历</span>
                      )}
                      <span className="text-[11px] text-[#9CA3AF]">{relativeTime(session.updated_at)}</span>
                    </div>
                  </div>

                  {/* Bottom row: count + actions */}
                  <div className="flex items-center justify-between border-t border-[#F3F4F6] px-4 py-3">
                    <span className="text-xs text-[#6B7280]">{session.message_count} 条消息</span>
                    <div className="flex items-center gap-1.5">
                      <Link href={`/interview/sessions/${session.id}`}>
                        <Button variant="outline" size="sm" className="h-7 text-xs app-btn-outline hover:border-indigo-400 hover:text-indigo-600">
                          进入
                        </Button>
                      </Link>
                      <button
                        onClick={() => handleDelete(session.id)}
                        className="rounded-md px-2 py-1 text-[11px] text-[#9CA3AF] transition-colors hover:bg-rose-50 hover:text-rose-500"
                      >
                        删除
                      </button>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}
