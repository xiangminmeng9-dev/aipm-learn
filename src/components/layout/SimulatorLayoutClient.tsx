'use client';

import { Suspense } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ThemeToggle } from '@/components/ui/theme-toggle';
import ActivityTracker from '@/components/tracking/ActivityTracker';
import { sidebarIcon as icon } from './sidebar-icon';

function PageLoader() {
  return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <div className="h-8 w-8 animate-spin rounded-full border-2 border-violet-500 border-t-transparent" />
    </div>
  );
}

const NAV_ITEMS = [
  { href: '/simulator/dashboard', label: '数据看板', icon: icon('M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z') },
  { href: '/simulator/workflow', label: '工作流程', icon: icon('M3.75 12h16.5m-16.5 3.75h16.5M3.75 19.5h16.5M5.625 4.5h12.75a1.875 1.875 0 010 3.75H5.625a1.875 1.875 0 010-3.75z') },
  { href: '/simulator/project', label: '项目实战沙盒', icon: icon('M12 21v-8.25M15.75 21v-8.25M8.25 21v-8.25M3 9l9-6 9 6m-1.5 12V10.332A48.36 48.36 0 0012 9.75c-2.551 0-5.056.2-7.5.582V21M3 21h18M12 6.75h.008v.008H12V6.75z') },
  { href: '/simulator/boss-1v1', label: 'Boss 1V1', icon: icon('M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z') },
];

export default function SimulatorLayoutClient({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const activeNav = NAV_ITEMS.find(item => {
    if (item.href === '/simulator/dashboard') return pathname === '/simulator/dashboard' || pathname === '/simulator';
    return pathname.startsWith(item.href);
  });

  return (
    <div className="flex h-screen bg-background">
      <ActivityTracker module="simulator" />
      <aside className="sticky top-0 hidden h-screen w-60 shrink-0 border-r bg-card lg:block" style={{ backgroundColor: 'var(--sidebar-simulator)', borderColor: 'var(--sidebar-simulator-border)' }}>
        <div className="flex h-full flex-col">
          <div className="border-b px-5 py-5" style={{ borderColor: 'var(--sidebar-simulator-border)' }}>
            <Link href="/" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-primary">
              <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5 8.25 12l7.5-7.5" />
              </svg>
              返回首页
            </Link>
            <h2 className="mt-3 text-lg font-semibold text-foreground">模拟器</h2>
          </div>
          <nav className="flex-1 space-y-1 px-3 py-4">
            {NAV_ITEMS.map((item) => {
              const isActive = activeNav?.href === item.href;
              return (
                <Link key={item.href} href={item.href}
                  className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-base transition-all duration-200 ${
                    isActive ? 'font-medium' : 'text-muted-foreground hover:bg-secondary hover:text-foreground'
                  }`}
                  style={isActive ? { backgroundColor: 'var(--sidebar-simulator-accent)', color: 'var(--sidebar-simulator-active)' } : {}}>
                  <span style={isActive ? { color: 'var(--sidebar-simulator-active)' } : {}}>{item.icon}</span>
                  <span>{item.label}</span>
                  {isActive && <span className="ml-auto h-1.5 w-1.5 rounded-full" style={{ backgroundColor: 'var(--sidebar-simulator-active)' }} />}
                </Link>
              );
            })}
          </nav>
          <div className="border-t px-5 py-4" style={{ borderColor: 'var(--sidebar-simulator-border)' }}>
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
        <div className="h-1 shrink-0 bg-gradient-to-r from-teal-600 via-emerald-500 to-teal-400" />
        <main className="flex-1 overflow-y-auto bg-background">
          <div className="border-b border-border bg-card px-6 py-3 lg:hidden">
            <h1 className="text-base font-bold text-foreground">模拟器</h1>
          </div>
          <Suspense fallback={<PageLoader />}>{children}</Suspense>
        </main>
      </div>
    </div>
  );
}
