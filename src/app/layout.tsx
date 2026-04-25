import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'AI PM 学习平台',
  description: 'AI Coding 练习 · AI PM 技能学习 · AI PM 面试助手',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN" className="h-full antialiased">
      <body className="min-h-full flex flex-col bg-[#F5F7FA] text-[#1F2937]" style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", "SF Pro Display", "PingFang SC", "Helvetica Neue", Arial, sans-serif' }}>{children}</body>
    </html>
  );
}
