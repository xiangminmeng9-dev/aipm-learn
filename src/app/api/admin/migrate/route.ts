import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: '未登录' }, { status: 401 });
  }
  const serviceClient = createServiceClient();
  const results: { table: string; status: string; error?: string }[] = [];

  // Check which tables are missing
  const tablesToCheck = [
    'resume_versions',
    'resume_jobs',
    'assistant_qa_records',
    'notebook_notes',
    'notebook_tasks',
  ];

  for (const table of tablesToCheck) {
    const { error } = await serviceClient.from(table).select('id').limit(1);
    if (error && (error.code === 'PGRST205' || error.message?.includes('Could not find'))) {
      results.push({ table, status: 'MISSING' });
    } else if (error) {
      results.push({ table, status: 'ERROR', error: error.message });
    } else {
      results.push({ table, status: 'EXISTS' });
    }
  }

  const missing = results.filter(r => r.status === 'MISSING');
  if (missing.length === 0) {
    return NextResponse.json({ message: 'All tables exist', results });
  }

  // Generate SQL for missing tables
  const sqlParts: string[] = [];

  if (missing.some(r => r.table === 'resume_versions')) {
    sqlParts.push(`
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
`);
  }

  if (missing.some(r => r.table === 'resume_jobs')) {
    sqlParts.push(`
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
`);
  }

  if (missing.some(r => r.table === 'assistant_qa_records')) {
    sqlParts.push(`
-- Assistant QA records table
CREATE TABLE IF NOT EXISTS public.assistant_qa_records (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  question TEXT NOT NULL,
  category TEXT,
  answer TEXT NOT NULL DEFAULT '',
  evaluation JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_assistant_qa_records_user ON public.assistant_qa_records(user_id);
CREATE INDEX IF NOT EXISTS idx_assistant_qa_records_user_time ON public.assistant_qa_records(user_id, created_at DESC);

ALTER TABLE public.assistant_qa_records ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can manage own qa records" ON public.assistant_qa_records;
CREATE POLICY "Users can manage own qa records" ON public.assistant_qa_records
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
`);
  }

  if (missing.some(r => r.table === 'notebook_notes')) {
    sqlParts.push(`
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
`);
  }

  if (missing.some(r => r.table === 'notebook_tasks')) {
    sqlParts.push(`
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
`);
  }

  const sql = sqlParts.join('\n');

  // Try to execute SQL via Supabase RPC if pg_net is available
  // Otherwise, return the SQL for manual execution
  try {
    const { error: rpcError } = await serviceClient.rpc('exec_sql', { sql_query: sql });
    if (!rpcError) {
      // Verify tables were created
      const verifyResults: { table: string; status: string }[] = [];
      for (const table of missing.map(r => r.table)) {
        const { error: verifyError } = await serviceClient.from(table).select('id').limit(1);
        verifyResults.push({ table, status: verifyError ? 'STILL_MISSING' : 'CREATED' });
      }
      return NextResponse.json({ message: 'Migration executed', results, verifyResults });
    }
  } catch {
    // RPC not available, fall through
  }

  return NextResponse.json({
    message: 'Missing tables detected. Run the SQL below in Supabase SQL Editor (Dashboard → SQL Editor) to create them.',
    results,
    sql: sql.trim(),
    dashboardUrl: 'https://supabase.com/dashboard/project/jgtvzfmzzhpfzpvdgzgk/sql',
  });
}