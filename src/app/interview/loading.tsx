export default function InterviewLoading() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-neutral-950">
      <div className="text-center">
        <div className="mx-auto mb-4 h-10 w-10 animate-spin rounded-full border-2 border-amber-600 border-t-transparent" />
        <p className="text-sm text-neutral-400">加载中...</p>
      </div>
    </div>
  );
}
