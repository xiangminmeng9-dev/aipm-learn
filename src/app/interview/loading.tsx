export default function InterviewLoading() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[#F5F7FA]">
      <div className="text-center">
        <div className="mx-auto mb-4 h-10 w-10 animate-spin rounded-full border-2 border-indigo-500 border-t-transparent" />
        <p className="text-sm text-[#6B7280]">加载中...</p>
      </div>
    </div>
  );
}
