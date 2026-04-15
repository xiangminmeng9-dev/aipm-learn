import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-neutral-950 px-4">
      <h1 className="mb-2 text-6xl font-bold text-amber-600">404</h1>
      <p className="mb-6 text-neutral-400">页面不存在</p>
      <Link
        href="/"
        className="rounded-lg bg-amber-600 px-6 py-2 text-sm font-medium text-neutral-950 hover:bg-amber-500"
      >
        返回首页
      </Link>
    </div>
  );
}
