'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const tabs = [
  { label: '浏览技能', href: '/skills/workshop/browse' },
  { label: 'AI 分析', href: '/skills/workshop/analyze' },
  { label: '编写技能', href: '/skills/workshop/write' },
  { label: '发布管理', href: '/skills/workshop/publish' },
];

export default function WorkshopTabs() {
  const pathname = usePathname();
  return (
    <div className="mt-3 flex gap-1 rounded-lg bg-muted p-1">
      {tabs.map((t) => {
        const active = pathname === t.href || pathname.startsWith(t.href + '/');
        return (
          <Link
            key={t.href}
            href={t.href}
            className={`rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
              active
                ? 'bg-background text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            {t.label}
          </Link>
        );
      })}
    </div>
  );
}
