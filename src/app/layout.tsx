import type { Metadata } from 'next';
import NextTopLoader from 'nextjs-toploader';
import { Providers } from '@/components/providers';
import './globals.css';

export const metadata: Metadata = {
  title: {
    default: 'AI PM 学习平台 — AI 产品经理全方位学习助手',
    template: '%s | AI PM 学习平台',
  },
  description: 'AI Coding 练习 · AI PM 技能学习 · 面试助手 · 模拟工作流 · 竞品分析 · 学习路径规划',
  keywords: ['AI PM', '产品经理', '面试', '技能学习', 'AI Coding', '竞品分析', '学习路径'],
  openGraph: {
    title: 'AI PM 学习平台',
    description: 'AI 产品经理全方位学习助手 — 技能树、面试练习、模拟工作流、竞品分析',
    type: 'website',
    locale: 'zh_CN',
    siteName: 'AI PM 学习平台',
  },
  twitter: {
    card: 'summary',
    title: 'AI PM 学习平台',
    description: 'AI 产品经理全方位学习助手',
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN" suppressHydrationWarning>
      <body className="bg-background text-foreground antialiased">
        <NextTopLoader color="#6366F1" showSpinner={false} height={2} shadow={false} />
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  );
}