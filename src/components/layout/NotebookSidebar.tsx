'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const navItems = [
  { label: '笔记', href: '/notebook', icon: '📝' },
  { label: '每日任务', href: '/notebook/tasks', icon: '✅' },
  { label: 'AI 分析', href: '/notebook/ai', icon: '🧠' },
];

export default function NotebookSidebar() {
  const pathname = usePathname();

  return (
    <aside className="flex w-60 flex-col border-r border-gray-200 bg-white">
      <div className="p-5">
        <Link href="/" className="text-xs text-gray-400 hover:text-gray-600 transition-colors">
          ← 返回首页
        </Link>
        <h2 className="mt-3 text-lg font-semibold text-gray-800">AI PM 笔记本</h2>
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
                  ? 'bg-indigo-50 text-indigo-600 border border-indigo-200'
                  : 'text-gray-500 hover:bg-gray-50 hover:text-gray-700 border border-transparent'
              }`}
            >
              <span>{item.icon}</span>
              <span>{item.label}</span>
              {isActive && <span className="ml-auto h-1.5 w-1.5 rounded-full bg-indigo-500" />}
            </Link>
          );
        })}
      </nav>

      <div className="flex items-center gap-2 border-t border-gray-200 p-4 text-xs text-gray-400">
        <span className="h-2 w-2 rounded-full bg-emerald-500" />
        在线
      </div>
    </aside>
  );
}
