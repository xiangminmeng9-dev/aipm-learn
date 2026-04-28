'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';

export default function UserMenu() {
  const [user, setUser] = useState<{ email: string } | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data }) => {
      setUser(data.user ? { email: data.user.email ?? '' } : null);
    });

    const { data } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ? { email: session.user.email ?? '' } : null);
    });

    return () => data.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (!isOpen) return;
    const handleClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('click', handleClick);
    return () => document.removeEventListener('click', handleClick);
  }, [isOpen]);

  const handleSignOut = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    setUser(null);
    setIsOpen(false);
    window.location.href = '/login';
  };

  if (!user) {
    return (
      <Link
        href="/login"
        className="flex items-center gap-1.5 rounded-lg px-4 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-indigo-50 hover:text-indigo-600"
      >
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.73 0-5.297-.197-7.499-.632Z" />
        </svg>
        登录
      </Link>
    );
  }

  return (
    <div ref={menuRef} className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-secondary"
      >
        <div className="flex h-7 w-7 items-center justify-center rounded-full bg-indigo-100 text-xs font-bold text-indigo-600">
          {user.email.charAt(0).toUpperCase()}
        </div>
        <span className="hidden md:inline max-w-[120px] truncate">{user.email.split('@')[0]}</span>
        <svg className="h-3 w-3 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
        </svg>
      </button>

      {isOpen && (
        <div className="absolute right-0 top-full z-50 mt-1 w-56 overflow-hidden rounded-xl border border-border bg-card py-1 shadow-lg">
          <div className="border-b border-border px-4 py-3">
            <p className="text-sm font-medium text-foreground">{user.email.split('@')[0]}</p>
            <p className="mt-0.5 text-xs text-muted-foreground">{user.email}</p>
          </div>

          <Link
            href="/settings"
            onClick={() => setIsOpen(false)}
            className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9.594 3.94c.09-.32.163-.662.228-1.048C10.58 1.59 11.226 1 12 1s1.42.59 1.578 1.492c.065.386.138.728.228 1.048.265.848.65 1.612 1.138 2.264a9.6 9.6 0 0 0 2.716 2.716c.652.488 1.416.873 2.264 1.138.32.09.662.163 1.048.228C21.41 10.58 22 11.226 22 12s-.59 1.42-1.492 1.578c-.386.065-.728.138-1.048.228-.848.265-1.612.65-2.264 1.138a9.6 9.6 0 0 0-2.716 2.716c-.488.652-.873 1.416-1.138 2.264-.09.32-.163.662-.228 1.048C13.42 22.41 12.774 23 12 23s-1.42-.59-1.578-1.492c-.065-.386-.138-.728-.228-1.048-.265-.848-.65-1.612-1.138-2.264a9.6 9.6 0 0 0-2.716-2.716c-.652-.488-1.416-.873-2.264-1.138-.32-.09-.662-.163-1.048-.228C2.59 13.42 2 12.774 2 12s.59-1.42 1.492-1.578c.386-.065.728-.138 1.048-.228.848-.265 1.612-.65 2.264-1.138a9.6 9.6 0 0 0 2.716-2.716c.488-.652.873-1.416 1.138-2.264Z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
            </svg>
            设置
          </Link>

          <button
            onClick={handleSignOut}
            className="flex w-full items-center gap-2.5 px-4 py-2.5 text-sm text-rose-600 transition-colors hover:bg-rose-50"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0 0 13.5 3h-6a2.25 2.25 0 0 0-2.25 2.25v13.5A2.25 2.25 0 0 0 7.5 21h6a2.25 2.25 0 0 0 2.25-2.25V15m3 0 3-3m0 0-3-3m3 3H9" />
            </svg>
            退出登录
          </button>
        </div>
      )}
    </div>
  );
}
