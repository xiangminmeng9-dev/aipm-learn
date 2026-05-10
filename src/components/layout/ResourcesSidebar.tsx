'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ThemeToggle } from '@/components/ui/theme-toggle';

const navItems = [
  { label: '仪表盘', href: '/resources', exact: true, icon: (
    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 0 1 3 19.875v-6.75ZM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V8.625ZM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V4.125Z" />
    </svg>
  )},
  { label: '资源管理', href: '/resources/manage', exact: false, icon: (
    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12.75V12A2.25 2.25 0 0 1 4.5 9.75h15A2.25 2.25 0 0 1 21.75 12v.75m-8.69-6.44-2.12-2.12a.75.75 0 0 0-1.061 0L2.26 11.358a.75.75 0 0 0 0 1.06l2.12 2.12a.75.75 0 0 0 1.06 0l8.69-8.69a.75.75 0 0 0 0-1.06ZM12.182 15.918l-1.472-1.472a.75.75 0 0 0-1.06 0l-1.472 1.472a.75.75 0 0 0 0 1.06l1.472 1.472a.75.75 0 0 0 1.06 0l1.472-1.472a.75.75 0 0 0 0-1.06ZM16.5 19.5h-3v-3h3v3Z" />
    </svg>
  )},
  { label: '每日AI大事', href: '/resources/daily-ai-news', exact: false, icon: (
    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 7.5h1.5m-1.5 3h1.5m-7.5 3h7.5m-7.5 3h7.5m3-9h3.375c.621 0 1.125.504 1.125 1.125V18a2.25 2.25 0 0 1-2.25 2.25M16.5 7.5V18a2.25 2.25 0 0 0 2.25 2.25M16.5 7.5V4.875c0-.621-.504-1.125-1.125-1.125H4.125C3.504 3.75 3 4.254 3 4.875V18a2.25 2.25 0 0 0 2.25 2.25h13.5M6 7.5h3v3H6v-3Z" />
    </svg>
  )},
  { label: 'AI技术动态', href: '/resources/ai-tech', exact: false, icon: (
    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" />
    </svg>
  )},
  { label: 'AI PM文章', href: '/resources/ai-pm-articles', exact: false, icon: (
    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904 9 18.75l-.813-2.846a8.25 8.25 0 0 0-5.34-5.34L2 9.75l2.846-.813a8.25 8.25 0 0 0 5.34-5.34L9 1.5l.813 2.846a8.25 8.25 0 0 0 5.34 5.34L18.75 9l-2.846.813a8.25 8.25 0 0 0-5.34 5.34Z" />
    </svg>
  )},
];

export default function ResourcesSidebar() {
  const pathname = usePathname();

  return (
    <aside className="flex h-full flex-col border-r border-border bg-card">
      <div className="border-b border-border px-5 py-5">
        <Link href="/" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-primary">
          <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5 8.25 12l7.5-7.5" />
          </svg>
          返回首页
        </Link>
        <h2 className="mt-3 text-lg font-semibold text-foreground">学习资源库</h2>
      </div>
      <nav className="flex-1 space-y-1 px-3 py-4">
        {navItems.map((item) => {
          const isActive = item.exact ? pathname === item.href : (pathname === item.href || pathname.startsWith(item.href + '/'));
          return (
            <Link key={item.href} href={item.href}
              className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-base transition-all duration-200 ${
                isActive ? 'bg-indigo-50 text-indigo-600 font-medium' : 'text-muted-foreground hover:bg-secondary hover:text-foreground'
              }`}>
              <span className={isActive ? 'text-indigo-600' : 'text-muted-foreground'}>{item.icon}</span>
              <span>{item.label}</span>
              {isActive && <span className="ml-auto h-1.5 w-1.5 rounded-full bg-indigo-600" />}
            </Link>
          );
        })}
      </nav>
      <div className="border-t border-border px-5 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-sm text-muted-foreground">在线</span>
          </div>
          <ThemeToggle compact />
        </div>
      </div>
    </aside>
  );
}
