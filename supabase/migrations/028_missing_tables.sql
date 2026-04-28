-- ============================================
-- 在 Supabase Dashboard SQL Editor 中执行此文件
-- Dashboard URL: https://supabase.com/dashboard/project/jgtvzfmzzhpfzpvdgzgk/sql/new
-- ============================================

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

ALTER TABLE public.resume_versions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can manage their own resume versions" ON public.resume_versions;
CREATE POLICY "Users can manage their own resume versions" ON public.resume_versions
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_resume_versions_user ON public.resume_versions(user_id, created_at DESC);

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

ALTER TABLE public.resume_jobs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can read job listings" ON public.resume_jobs;
CREATE POLICY "Anyone can read job listings" ON public.resume_jobs
  FOR SELECT USING (true);

CREATE INDEX IF NOT EXISTS idx_resume_jobs_fetched ON public.resume_jobs(fetched_at DESC);
CREATE INDEX IF NOT EXISTS idx_resume_jobs_published ON public.resume_jobs(published_at DESC);

-- Notebook notes table
CREATE TABLE IF NOT EXISTS public.notebook_notes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL DEFAULT '',
  content TEXT NOT NULL DEFAULT '',
  category TEXT DEFAULT 'problem',
  ai_analysis TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.notebook_notes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can manage own notes" ON public.notebook_notes;
CREATE POLICY "Users can manage own notes" ON public.notebook_notes
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_notebook_notes_user ON public.notebook_notes(user_id, created_at DESC);

-- Notebook tasks table
CREATE TABLE IF NOT EXISTS public.notebook_tasks (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT DEFAULT '',
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed')),
  priority TEXT DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high')),
  category TEXT DEFAULT 'daily',
  due_date DATE,
  start_time TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.notebook_tasks ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can manage own tasks" ON public.notebook_tasks;
CREATE POLICY "Users can manage own tasks" ON public.notebook_tasks
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_notebook_tasks_user ON public.notebook_tasks(user_id, created_at DESC);