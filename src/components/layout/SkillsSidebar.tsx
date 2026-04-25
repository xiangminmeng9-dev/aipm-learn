'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const navItems = [
  { label: '技能树总览', href: '/skills/tree', icon: '🌳' },
  { label: '学习路径', href: '/skills/learning-path', icon: '🗺️' },
  { label: '岗位分析', href: '/skills/jd-analysis', icon: '🔍' },
  { label: '面试统计', href: '/interview/stats', icon: '📊' },
];

export default function SkillsSidebar() {
  const pathname = usePathname();

  return (
    <aside className="flex w-60 shrink-0 flex-col border-r border-[#E5E7EB] bg-white">
      <div className="border-b border-[#E5E7EB] px-5 py-5">
        <Link href="/" className="inline-flex items-center gap-1.5 text-xs text-[#6B7280] transition-colors hover:text-[#4F46E5]">
          <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5 8.25 12l7.5-7.5" />
          </svg>
          返回首页
        </Link>
        <h2 className="mt-3 text-lg font-semibold text-[#1F2937]">AI PM 技能学习</h2>
      </div>
      <nav className="flex-1 space-y-1 px-3 py-4">
        {navItems.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition-all duration-200 ${
                isActive
                  ? 'bg-indigo-50 text-indigo-600 font-medium'
                  : 'text-[#6B7280] hover:bg-[#F3F4F6] hover:text-[#1F2937]'
              }`}
            >
              <span>{item.icon}</span>
              <span>{item.label}</span>
              {isActive && <span className="ml-auto h-1.5 w-1.5 rounded-full bg-indigo-600" />}
            </Link>
          );
        })}
      </nav>
      <div className="border-t border-[#E5E7EB] px-5 py-4">
        <div className="flex items-center gap-2">
          <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-xs text-[#6B7280]">在线</span>
        </div>
      </div>
    </aside>
  );
}
