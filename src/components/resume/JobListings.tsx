'use client';

import { useState, useEffect } from 'react';
import { MotionDiv } from '@/components/ui/lazy-motion';
import { apiFetch } from '@/lib/api/fetch';

interface JobListing {
  id?: string;
  company: string;
  title: string;
  location: string;
  published_at: string;
  description: string;
}

interface JobListingsProps {
  onUseJd: (description: string) => void;
}

export default function JobListings({ onUseJd }: JobListingsProps) {
  const [jobs, setJobs] = useState<JobListing[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchJobs();
  }, []);

  const fetchJobs = async () => {
    setIsLoading(true);
    setError('');
    try {
      const res = await apiFetch('/api/resume/jobs');
      if (!res.ok) throw new Error('获取职位失败');
      const data = await res.json();
      setJobs(data.jobs || []);
    } catch {
      setError('获取职位列表失败，请重试');
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-indigo-500 border-t-transparent" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-xl border border-rose-200 bg-rose-50/30 p-6 text-center">
        <p className="text-sm text-rose-600">{error}</p>
        <button
          onClick={fetchJobs}
          className="mt-3 rounded-lg bg-rose-500 px-4 py-1.5 text-xs font-medium text-white hover:bg-rose-600 transition-colors"
        >
          重试
        </button>
      </div>
    );
  }

  if (jobs.length === 0) {
    return (
      <div className="rounded-xl border border-border bg-card p-8 text-center">
        <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-secondary">
          <svg className="h-6 w-6 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 14.15v4.25c0 1.094-.787 2.036-1.872 2.18-2.087.277-4.216.42-6.378.42s-4.291-.143-6.378-.42c-1.085-.144-1.872-1.086-1.872-2.18v-4.25m16.5 0a2.18 2.18 0 00.75-1.661V8.706c0-1.081-.768-2.015-1.837-2.175a48.114 48.114 0 00-3.413-.387m4.5 8.006c-.194.165-.42.295-.673.38A23.978 23.978 0 0112 15.75c-2.648 0-5.195-.429-7.577-1.22a2.016 2.016 0 01-.673-.38m0 0A2.18 2.18 0 013 12.489V8.706c0-1.081.768-2.015 1.837-2.175a48.111 48.111 0 013.413-.387m7.5 0V5.25A2.25 2.25 0 0013.5 3h-3a2.25 2.25 0 00-2.25 2.25v.894m7.5 0a48.667 48.667 0 00-7.5 0" />
          </svg>
        </div>
        <p className="text-sm text-muted-foreground">暂无推荐职位</p>
        <p className="mt-1 text-xs text-muted-foreground">稍后再来看看</p>
      </div>
    );
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2">
      {jobs.map((job, index) => (
        <MotionDiv
          key={job.id || `${job.company}-${job.title}-${index}`}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.05 }}
          className="group rounded-xl border border-border bg-card p-5 transition-all duration-200 hover:shadow-md hover:border-indigo-200"
        >
          <div className="mb-3 flex items-start justify-between">
            <div>
              <h3 className="text-sm font-semibold text-foreground line-clamp-1">{job.title}</h3>
              <p className="mt-0.5 text-sm text-muted-foreground">{job.company}</p>
            </div>
            <span className="rounded-full bg-indigo-50 px-2.5 py-0.5 text-xs font-medium text-indigo-600 shrink-0">
              {job.location}
            </span>
          </div>

          <div className="mb-3 flex items-center gap-1.5 text-xs text-muted-foreground">
            <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
            </svg>
            <span>{new Date(job.published_at).toLocaleDateString('zh-CN')}</span>
          </div>

          <button
            onClick={() => onUseJd(job.description)}
            className="w-full rounded-lg bg-indigo-50 px-3 py-2 text-xs font-medium text-indigo-600 transition-all hover:bg-indigo-100 active:scale-[0.98]"
          >
            使用此 JD
          </button>
        </MotionDiv>
      ))}
    </div>
  );
}
