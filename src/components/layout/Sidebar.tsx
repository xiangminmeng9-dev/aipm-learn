'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';

const navItems = [
  { label: '面试问答', href: '/interview/qa', icon: '💬' },
  { label: '对话 Session', href: '/interview/sessions', icon: '📝' },
  { label: '模拟面试', href: '/interview/mock', icon: '🎤' },
  { label: '方法论', href: '/interview/methodology', icon: '📖' },
  { label: '练习统计', href: '/interview/stats', icon: '📊' },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="flex w-56 flex-col border-r border-neutral-800 bg-neutral-900">
      <div className="border-b border-neutral-800 px-4 py-4">
        <Link href="/" className="text-sm text-neutral-400 hover:text-neutral-200">
          ← 返回首页
        </Link>
        <h2 className="mt-2 text-lg font-semibold text-neutral-50">面试助手</h2>
      </div>
      <nav className="flex-1 space-y-1 px-2 py-3">
        {navItems.map((item) => {
          const isActive =
            pathname === item.href || pathname.startsWith(item.href + '/');
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors',
                isActive
                  ? 'bg-amber-600/10 text-amber-400'
                  : 'text-neutral-400 hover:bg-neutral-800 hover:text-neutral-200'
              )}
            >
              <span>{item.icon}</span>
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
