'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ThemeToggle } from '@/components/ui/theme-toggle';
import ActivityTracker from '@/components/tracking/ActivityTracker';
import { sidebarIcon as icon } from './sidebar-icon';

const NAV_ITEMS = [
  { href: '/daily-challenge', label: '今日挑战', icon: icon('M12 18v-5.25m0 0a6.01 6.01 0 001.5-.189m-1.5.189a6.01 6.01 0 01-1.5-.189m3.75 7.478a12.06 12.06 0 01-4.5 0m3.75 2.383a14.406 14.406 0 01-3 0M14.25 18v-.192c0-.983.658-1.823 1.508-2.316a7.5 7.5 0 10-7.517 0c.85.493 1.509 1.333 1.509 2.316V18') },
  { href: '/daily-challenge/history', label: '答题记录', icon: icon('M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z') },
  { href: '/daily-challenge/flashcards', label: '知识闪卡', icon: icon('M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5') },
  { href: '/daily-challenge/wrong', label: '错题本', icon: icon('M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z') },
  { href: '/daily-challenge/tech', label: '每日 AI 技术', icon: icon('M11.42 15.17l-4.273-4.273a1.875 1.875 0 012.653-2.653l1.62 1.62m0 0l1.62-1.62a1.875 1.875 0 012.653 2.653l-4.273 4.273m-2.653-2.653l2.653 2.653m0 0L15.17 11.42m-2.653 2.653l-2.653-2.653') },
];

export default function DailyChallengeLayoutClient({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="flex h-screen bg-background">
      <ActivityTracker module="daily-challenge" />
      <aside className="sticky top-0 hidden h-screen w-60 shrink-0 border-r bg-card lg:block" style={{ backgroundColor: 'var(--sidebar-daily)', borderColor: 'var(--sidebar-daily-border)' }}>
        <div className="flex h-full flex-col">
          <div className="border-b px-5 py-5" style={{ borderColor: 'var(--sidebar-daily-border)' }}>
            <Link href="/" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-primary">
              <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5 8.25 12l7.5-7.5" />
              </svg>
              返回首页
            </Link>
            <h2 className="mt-3 text-lg font-semibold text-foreground">每日挑战</h2>
          </div>
          <nav className="flex-1 space-y-1 px-3 py-4">
            {NAV_ITEMS.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link key={item.href} href={item.href}
                  className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-base transition-all duration-200 ${
                    isActive ? 'font-medium' : 'text-muted-foreground hover:bg-secondary hover:text-foreground'
                  }`}
                  style={isActive ? { backgroundColor: 'var(--sidebar-daily-accent)', color: 'var(--sidebar-daily-active)' } : {}}>
                  <span style={isActive ? { color: 'var(--sidebar-daily-active)' } : {}}>{item.icon}</span>
                  <span>{item.label}</span>
                  {isActive && <span className="ml-auto h-1.5 w-1.5 rounded-full" style={{ backgroundColor: 'var(--sidebar-daily-active)' }} />}
                </Link>
              );
            })}
          </nav>
          <div className="border-t px-5 py-4" style={{ borderColor: 'var(--sidebar-daily-border)' }}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-sm text-muted-foreground">在线</span>
              </div>
              <ThemeToggle compact />
            </div>
          </div>
        </div>
      </aside>
      <div className="flex flex-1 flex-col overflow-hidden">
        <div className="h-1 shrink-0 bg-gradient-to-r from-amber-600 via-yellow-500 to-amber-400" />
        <main className="flex-1 overflow-y-auto bg-background">
          <div className="border-b border-border bg-card px-6 py-3 lg:hidden">
            <h1 className="text-base font-bold text-foreground">每日挑战</h1>
          </div>
          {children}
        </main>
      </div>
    </div>
  );
}
