'use client';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-[#F5F7FA] px-4">
      <h1 className="mb-4 text-2xl font-bold text-[#1F2937]">出错了</h1>
      <p className="mb-6 max-w-md text-center text-sm text-[#6B7280]">
        {error.message || '发生了意外错误，请重试'}
      </p>
      <button
        onClick={reset}
        className="app-btn-primary rounded-lg px-6 py-2 text-sm font-medium"
      >
        重试
      </button>
    </div>
  );
}
