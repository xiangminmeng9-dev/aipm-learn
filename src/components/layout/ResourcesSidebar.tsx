'use client';

import AppSidebar from './AppSidebar';

const navItems = [
  { label: '数据看板', href: '/resources', exact: true, icon: (
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
  return <AppSidebar title="学习资源库" themeKey="resources" navItems={navItems} />;
}
