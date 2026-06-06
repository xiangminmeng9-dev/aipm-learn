'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ThemeToggle } from '@/components/ui/theme-toggle';

export interface NavItem {
  label: string;
  href: string;
  icon: React.ReactNode;
  exact?: boolean;
}

interface AppSidebarProps {
  title: string;
  themeKey: string;
  navItems: NavItem[];
}

export default function AppSidebar({ title, themeKey, navItems }: AppSidebarProps) {
  const pathname = usePathname();

  const bg = `var(--sidebar-${themeKey})`;
  const border = `var(--sidebar-${themeKey}-border)`;
  const accent = `var(--sidebar-${themeKey}-accent)`;
  const active = `var(--sidebar-${themeKey}-active)`;

  return (
    <aside className="flex h-full flex-col border-r bg-sidebar" style={{ backgroundColor: bg, borderColor: border }}>
      <div className="border-b px-5 py-5" style={{ borderColor: border }}>
        <Link href="/" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-primary">
          <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5 8.25 12l7.5-7.5" />
          </svg>
          返回首页
        </Link>
        <h2 className="mt-3 text-lg font-semibold text-foreground">{title}</h2>
      </div>

      <nav className="flex-1 space-y-1 px-3 py-4">
        {navItems.map((item) => {
          const isActive = item.exact
            ? pathname === item.href
            : pathname === item.href || pathname.startsWith(item.href + '/');
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-base transition-all duration-200 ${
                isActive
                  ? 'font-medium'
                  : 'text-muted-foreground hover:bg-secondary hover:text-foreground'
              }`}
              style={isActive ? { backgroundColor: accent, color: active } : {}}
            >
              <span style={isActive ? { color: active } : {}}>{item.icon}</span>
              <span>{item.label}</span>
              {isActive && <span className="ml-auto h-1.5 w-1.5 rounded-full" style={{ backgroundColor: active }} />}
            </Link>
          );
        })}
      </nav>

      <div className="border-t px-5 py-4" style={{ borderColor: border }}>
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
