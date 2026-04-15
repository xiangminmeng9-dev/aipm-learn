'use client';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-neutral-950 px-4">
      <h1 className="mb-4 text-2xl font-bold text-neutral-50">出错了</h1>
      <p className="mb-6 max-w-md text-center text-sm text-neutral-400">
        {error.message || '发生了意外错误，请重试'}
      </p>
      <button
        onClick={reset}
        className="rounded-lg bg-amber-600 px-6 py-2 text-sm font-medium text-neutral-950 hover:bg-amber-500"
      >
        重试
      </button>
    </div>
  );
}
