'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ThemeToggle } from '@/components/ui/theme-toggle';

const navItems = [
  { label: '笔记', href: '/notebook', icon: '📝' },
  { label: '每日任务', href: '/notebook/tasks', icon: '✅' },
  { label: 'AI 分析', href: '/notebook/ai', icon: '🧠' },
];

export default function NotebookSidebar() {
  const pathname = usePathname();

  return (
    <aside className="flex h-full flex-col border-r border-border bg-card">
      <div className="p-5">
        <Link href="/" className="text-xs text-muted-foreground hover:text-muted-foreground transition-colors">
          ← 返回首页
        </Link>
        <h2 className="mt-3 text-lg font-semibold text-foreground">AI PM 笔记本</h2>
      </div>

      <nav className="flex-1 space-y-1 px-3">
        {navItems.map((item) => {
          const isActive =
            item.href === '/notebook'
              ? pathname === '/notebook'
              : pathname === item.href || pathname.startsWith(item.href + '/');
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm font-medium transition-all ${
                isActive
                  ? 'bg-indigo-50 text-indigo-600 border border-indigo-200 dark:bg-indigo-950/40 dark:text-indigo-400 dark:border-indigo-800'
                  : 'text-muted-foreground hover:bg-muted hover:text-foreground border border-transparent'
              }`}
            >
              <span>{item.icon}</span>
              <span>{item.label}</span>
              {isActive && <span className="ml-auto h-1.5 w-1.5 rounded-full bg-indigo-500" />}
            </Link>
          );
        })}
      </nav>

      <div className="flex items-center justify-between border-t border-border p-4">
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <span className="h-2 w-2 rounded-full bg-emerald-500" />
          在线
        </div>
        <ThemeToggle compact />
      </div>
    </aside>
  );
}
