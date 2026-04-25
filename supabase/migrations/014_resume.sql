-- Resume versions table
CREATE TABLE IF NOT EXISTS public.resume_versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  original_resume_text TEXT NOT NULL,
  jd_text TEXT NOT NULL DEFAULT '',
  style_type TEXT NOT NULL DEFAULT 'standard' CHECK (style_type IN ('standard', 'big_company', 'industry_tech', 'industry_finance', 'industry_internet')),
  modified_resume TEXT,
  changes_summary TEXT,
  company_name TEXT,
  position_name TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Resume jobs (RSS cached) table
CREATE TABLE IF NOT EXISTS public.resume_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source TEXT NOT NULL DEFAULT 'rss',
  title TEXT NOT NULL,
  company TEXT NOT NULL,
  description TEXT,
  url TEXT,
  location TEXT,
  published_at TIMESTAMPTZ,
  fetched_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- RLS
ALTER TABLE public.resume_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.resume_jobs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own resume versions" ON public.resume_versions
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Anyone can read job listings" ON public.resume_jobs
  FOR SELECT USING (true);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_resume_versions_user ON public.resume_versions(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_resume_jobs_fetched ON public.resume_jobs(fetched_at DESC);
CREATE INDEX IF NOT EXISTS idx_resume_jobs_published ON public.resume_jobs(published_at DESC);