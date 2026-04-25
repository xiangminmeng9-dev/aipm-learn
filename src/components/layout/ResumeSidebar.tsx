'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const navItems = [
  { label: '简历修改', href: '/resume', icon: (
    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 18 7.125v-1.5a1.125 1.125 0 0 0-1.125-1.125M3.75 14.25h16.5M3.75 9.75h16.5M3.75 5.25h16.5" />
    </svg>
  )},
  { label: '历史版本', href: '/resume/versions', icon: (
    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
    </svg>
  )},
  { label: '职位推荐', href: '/resume/jobs', icon: (
    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 18 7.125v-1.5a1.125 1.125 0 0 0-1.125-1.125M3.75 14.25h16.5M3.75 9.75h16.5" />
    </svg>
  )},
];

export default function ResumeSidebar() {
  const pathname = usePathname();

  return (
    <aside className="flex w-60 shrink-0 flex-col border-r border-[#E5E7EB] bg-white">
      <div className="border-b border-[#E5E7EB] px-5 py-5">
        <Link href="/" className="inline-flex items-center gap-1.5 text-sm text-[#6B7280] transition-colors hover:text-[#4F46E5]">
          <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5 8.25 12l7.5-7.5" />
          </svg>
          返回首页
        </Link>
        <h2 className="mt-3 text-lg font-semibold text-[#1F2937]">简历修改助手</h2>
      </div>

      <nav className="flex-1 space-y-1 px-3 py-4">
        {navItems.map((item) => {
          const isActive = pathname === item.href || (item.href !== '/resume' && pathname.startsWith(item.href));
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-base transition-all duration-200 ${
                isActive
                  ? 'bg-indigo-50 text-indigo-600 font-medium'
                  : 'text-[#6B7280] hover:bg-[#F3F4F6] hover:text-[#1F2937]'
              }`}
            >
              <span className={isActive ? 'text-indigo-600' : 'text-[#9CA3AF]'}>{item.icon}</span>
              <span>{item.label}</span>
              {isActive && <span className="ml-auto h-1.5 w-1.5 rounded-full bg-indigo-600" />}
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-[#E5E7EB] px-5 py-4">
        <div className="flex items-center gap-2">
          <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-sm text-[#6B7280]">在线</span>
        </div>
      </div>
    </aside>
  );
}
