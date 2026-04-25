import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-[#F5F7FA] px-4">
      <h1 className="mb-2 text-6xl font-bold gradient-text">404</h1>
      <p className="mb-6 text-[#6B7280]">页面不存在</p>
      <Link
        href="/"
        className="app-btn-primary rounded-lg px-6 py-2 text-sm font-medium"
      >
        返回首页
      </Link>
    </div>
  );
}
