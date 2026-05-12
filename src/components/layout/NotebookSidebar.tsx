'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ThemeToggle } from '@/components/ui/theme-toggle';
import { sidebarIcon as icon } from './sidebar-icon';

const navItems = [
  { label: '笔记', href: '/notebook', icon: icon('M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10') },
  { label: '每日任务', href: '/notebook/tasks', icon: icon('M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z') },
  { label: 'AI 分析', href: '/notebook/ai', icon: icon('M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z') },
];

export default function NotebookSidebar() {
  const pathname = usePathname();

  return (
    <aside className="flex h-full flex-col border-r bg-sidebar" style={{ backgroundColor: 'var(--sidebar-notebook)', borderColor: 'var(--sidebar-notebook-border)' }}>
      <div className="border-b px-5 py-5" style={{ borderColor: 'var(--sidebar-notebook-border)' }}>
        <Link href="/" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-primary">
          <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5 8.25 12l7.5-7.5" />
          </svg>
          返回首页
        </Link>
        <h2 className="mt-3 text-lg font-semibold text-foreground">AI PM 笔记本</h2>
      </div>

      <nav className="flex-1 space-y-1 px-3 py-4">
        {navItems.map((item) => {
          const isActive = item.href === '/notebook' ? pathname === '/notebook' : pathname === item.href || pathname.startsWith(item.href + '/');
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-base transition-all duration-200 ${
                isActive ? 'font-medium' : 'text-muted-foreground hover:bg-secondary hover:text-foreground'
              }`}
              style={isActive ? { backgroundColor: 'var(--sidebar-notebook-accent)', color: 'var(--sidebar-notebook-active)' } : {}}
            >
              <span style={isActive ? { color: 'var(--sidebar-notebook-active)' } : {}}>{item.icon}</span>
              <span>{item.label}</span>
              {isActive && <span className="ml-auto h-1.5 w-1.5 rounded-full" style={{ backgroundColor: 'var(--sidebar-notebook-active)' }} />}
            </Link>
          );
        })}
      </nav>

      <div className="border-t px-5 py-4" style={{ borderColor: 'var(--sidebar-notebook-border)' }}>
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
