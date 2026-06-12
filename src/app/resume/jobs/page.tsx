'use client';

import { useCallback } from 'react';
import JobListings from '@/components/resume/JobListings';
import { useRouter } from 'next/navigation';

export default function ResumeJobsPage() {
  const router = useRouter();

  const handleUseJd = useCallback((description: string) => {
    // Store JD text in sessionStorage so the main page can pick it up
    try {
      sessionStorage.setItem('resume-jd-text', description);
    } catch {}
    router.push('/resume');
  }, [router]);

  return (
    <div className="min-h-full p-6 md:p-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">AI PM 职位推荐</h1>
            <p className="mt-1 text-sm text-muted-foreground">发现适合你的 AI 产品经理岗位</p>
          </div>
          <button
            onClick={() => window.location.reload()}
            className="flex items-center gap-1.5 rounded-xl border border-border bg-card px-4 py-2 text-sm font-medium text-muted-foreground transition-all hover:scale-[1.02] hover:border-indigo-300 hover:text-indigo-600 active:scale-[0.98]"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182" />
            </svg>
            刷新
          </button>
        </div>
      </div>

      <JobListings onUseJd={handleUseJd} />
    </div>
  );
}
