'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ThemeToggle } from '@/components/ui/theme-toggle';
import { sidebarIcon as icon } from './sidebar-icon';

const navItems = [
  { label: '技能树总览', href: '/skills/tree', icon: icon('M4.26 10.147a60.438 60.438 0 00-.491 6.347A48.62 48.62 0 0112 20.904a48.62 48.62 0 018.232-4.41 60.46 60.46 0 00-.491-6.347m-15.482 0a50.636 50.636 0 00-2.658-.813A59.906 59.906 0 0112 3.493a59.903 59.903 0 0110.399 5.84c-.896.248-1.783.52-2.658.814m-15.482 0A50.717 50.717 0 0112 13.489a50.702 50.702 0 017.74-3.342') },
  { label: '学习路径', href: '/skills/learning-path', icon: icon('M9 6.75V15m6-6v8.25m.503 3.498l4.875-2.437c.381-.19.622-.58.622-1.006V4.82c0-.836-.88-1.38-1.628-1.006l-3.869 1.934c-.317.159-.69.159-1.006 0L9.503 3.252a1.125 1.125 0 00-1.006 0L3.622 5.689C3.24 5.88 3 6.27 3 6.695V19.18c0 .836.88 1.38 1.628 1.006l3.869-1.934c.317-.159.69-.159 1.006 0l4.994 2.497c.317.158.69.158 1.006 0z') },
  { label: 'AI 学习路径', href: '/skills/ai-learning-path', icon: icon('M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z') },
  { label: '学习计划', href: '/skills/learning-plan', icon: icon('M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5') },
  { label: '路径历史', href: '/skills/path-history', icon: icon('M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z') },
  { label: '岗位分析', href: '/skills/jd-analysis', icon: icon('M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607zM10.5 7.5v6m3-3h-6') },
  { label: 'JD差距分析', href: '/skills/jd-gaps', icon: icon('M3 4.5h14.25M3 9h9.75M3 13.5h5.25m5.25-.75L17.25 9m0 0L21 12.75M17.25 9v12') },
  { label: '收藏技术', href: '/skills/bookmarked-tech', icon: icon('M17.593 3.322c1.1.128 1.907 1.077 1.907 2.185V21L12 17.25 4.5 21V5.507c0-1.108.806-2.057 1.907-2.185a48.507 48.507 0 0111.186 0z') },
];

export default function SkillsSidebar() {
  const pathname = usePathname();

  return (
    <aside className="flex h-full flex-col border-r bg-sidebar" style={{ backgroundColor: 'var(--sidebar-skills)', borderColor: 'var(--sidebar-skills-border)' }}>
      <div className="border-b px-5 py-5" style={{ borderColor: 'var(--sidebar-skills-border)' }}>
        <Link href="/" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-primary">
          <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5 8.25 12l7.5-7.5" />
          </svg>
          返回首页
        </Link>
        <h2 className="mt-3 text-lg font-semibold text-foreground">AI PM 技能学习</h2>
      </div>
      <nav className="flex-1 space-y-1 px-3 py-4">
        {navItems.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
          return (
            <Link key={item.href} href={item.href}
              className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-base transition-all duration-200 ${
                isActive ? 'font-medium' : 'text-muted-foreground hover:bg-secondary hover:text-foreground'
              }`}
              style={isActive ? { backgroundColor: 'var(--sidebar-skills-accent)', color: 'var(--sidebar-skills-active)' } : {}}>
              <span style={isActive ? { color: 'var(--sidebar-skills-active)' } : {}}>{item.icon}</span>
              <span>{item.label}</span>
              {isActive && <span className="ml-auto h-1.5 w-1.5 rounded-full" style={{ backgroundColor: 'var(--sidebar-skills-active)' }} />}
            </Link>
          );
        })}
      </nav>
      <div className="border-t px-5 py-4" style={{ borderColor: 'var(--sidebar-skills-border)' }}>
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
