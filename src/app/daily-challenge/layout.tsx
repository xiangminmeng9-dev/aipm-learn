'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ThemeToggle } from '@/components/ui/theme-toggle';

const NAV_ITEMS = [
  { href: '/daily-challenge', label: '今日挑战', icon: '🎯' },
  { href: '/daily-challenge/history', label: '答题记录', icon: '📋' },
  { href: '/daily-challenge/flashcards', label: '知识闪卡', icon: '🃏' },
  { href: '/daily-challenge/wrong', label: '错题本', icon: '❌' },
  { href: '/daily-challenge/tech', label: '每日 AI 技术', icon: '🔬' },
];

export default function DailyChallengeLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="flex min-h-screen bg-background">
      <aside className="sticky top-0 hidden h-screen w-56 shrink-0 border-r border-border bg-card lg:block">
        <div className="flex h-full flex-col">
          <div className="border-b border-border px-5 py-5">
            <Link href="/" className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5 8.25 12l7.5-7.5" />
              </svg>
              返回首页
            </Link>
            <h1 className="mt-2 text-lg font-bold text-foreground">每日挑战</h1>
            <p className="text-xs text-muted-foreground">每天一道题，养成学习习惯</p>
          </div>
          <nav className="flex-1 space-y-1 px-3 py-4">
            {NAV_ITEMS.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm transition-colors ${
                    isActive
                      ? 'bg-amber-50 font-semibold text-amber-700'
                      : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                  }`}
                >
                  <span className="text-base">{item.icon}</span>
                  {item.label}
                </Link>
              );
            })}
          </nav>
          <div className="border-t border-border px-3 py-3">
            <div className="flex items-center justify-between">
              <ThemeToggle compact />
            </div>
          </div>
        </div>
      </aside>
      <main className="flex-1 overflow-y-auto">
        <div className="border-b border-border bg-card px-6 py-3 lg:hidden">
          <div className="flex items-center gap-3">
            <Link href="/" className="text-sm text-muted-foreground hover:text-foreground">
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5 8.25 12l7.5-7.5" />
              </svg>
            </Link>
            <h1 className="text-base font-bold text-foreground">每日挑战</h1>
          </div>
          <div className="mt-2 flex gap-2">
            {NAV_ITEMS.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`rounded-lg px-3 py-1.5 text-xs transition-colors ${
                    isActive ? 'bg-amber-50 font-semibold text-amber-700' : 'text-muted-foreground hover:bg-muted'
                  }`}
                >
                  {item.icon} {item.label}
                </Link>
              );
            })}
          </div>
        </div>
        {children}
      </main>
    </div>
  );
}
