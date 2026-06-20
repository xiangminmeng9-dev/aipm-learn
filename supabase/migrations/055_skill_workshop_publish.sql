-- Skill Workshop tables (Phase 4: publish management)
-- Migration: 055_skill_workshop_publish

-- User skill drafts
CREATE TABLE IF NOT EXISTS public.user_skill_drafts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  content TEXT NOT NULL,
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'published')),
  clawhub_slug TEXT,
  clawhub_url TEXT,
  skillssh_slug TEXT,
  skillssh_url TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.user_skill_drafts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own skill drafts" ON public.user_skill_drafts FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Skill workshop analyses
CREATE TABLE IF NOT EXISTS public.skill_workshop_analyses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  skill_name TEXT,
  skill_slug TEXT,
  skill_source TEXT,
  skill_content TEXT NOT NULL,
  analysis_result JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.skill_workshop_analyses ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own analyses" ON public.skill_workshop_analyses FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- External platform API tokens
CREATE TABLE IF NOT EXISTS public.user_external_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  provider TEXT NOT NULL,
  token TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, provider)
);

ALTER TABLE public.user_external_tokens ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own external tokens" ON public.user_external_tokens FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_user_skill_drafts_user ON public.user_skill_drafts(user_id, updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_skill_workshop_analyses_user ON public.skill_workshop_analyses(user_id, created_at DESC);
