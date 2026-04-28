-- ============================================
-- 合并建表 SQL — 在 Supabase Dashboard SQL Editor 中执行
-- Dashboard URL: https://supabase.com/dashboard/project/jgtvzfmzzhpfzpvdgzgk/sql/new
-- ============================================

-- ==========================================
-- 1. daily_challenges 表
-- ==========================================
CREATE TABLE IF NOT EXISTS public.daily_challenges (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  question TEXT NOT NULL,
  category TEXT DEFAULT 'general',
  difficulty TEXT DEFAULT 'medium' CHECK (difficulty IN ('easy', 'medium', 'hard')),
  perfect_answer TEXT,
  scoring_rubric JSONB DEFAULT '[]',
  date DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.daily_challenges ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Anyone can read challenges" ON public.daily_challenges;
CREATE POLICY "Anyone can read challenges" ON public.daily_challenges
  FOR SELECT USING (true);

CREATE INDEX IF NOT EXISTS idx_daily_challenges_date ON public.daily_challenges(date DESC);

-- ==========================================
-- 2. daily_challenge_submissions 表
-- ==========================================
CREATE TABLE IF NOT EXISTS public.daily_challenge_submissions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  challenge_id UUID NOT NULL REFERENCES public.daily_challenges(id) ON DELETE CASCADE,
  answer TEXT NOT NULL,
  score INTEGER DEFAULT 0,
  feedback JSONB,
  time_spent INTEGER DEFAULT 0,
  submitted_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, challenge_id)
);

ALTER TABLE public.daily_challenge_submissions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can manage own submissions" ON public.daily_challenge_submissions;
CREATE POLICY "Users can manage own submissions" ON public.daily_challenge_submissions
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_daily_submissions_user ON public.daily_challenge_submissions(user_id, submitted_at DESC);

-- ==========================================
-- 3. flashcards 表
-- ==========================================
CREATE TABLE IF NOT EXISTS public.flashcards (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  front TEXT NOT NULL,
  back TEXT NOT NULL,
  category TEXT DEFAULT 'general',
  difficulty TEXT DEFAULT 'medium',
  next_review TIMESTAMPTZ NOT NULL DEFAULT now(),
  review_count INTEGER DEFAULT 0,
  correct_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.flashcards ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can manage own flashcards" ON public.flashcards;
CREATE POLICY "Users can manage own flashcards" ON public.flashcards
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_flashcards_user ON public.flashcards(user_id, next_review ASC);

-- ==========================================
-- 4. daily_tech_articles 表
-- ==========================================
CREATE TABLE IF NOT EXISTS public.daily_tech_articles (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  summary TEXT,
  original_url TEXT,
  category TEXT DEFAULT 'ai',
  published_at TIMESTAMPTZ,
  fetched_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.daily_tech_articles ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Anyone can read tech articles" ON public.daily_tech_articles;
CREATE POLICY "Anyone can read tech articles" ON public.daily_tech_articles
  FOR SELECT USING (true);

CREATE INDEX IF NOT EXISTS idx_daily_tech_fetched ON public.daily_tech_articles(fetched_at DESC);

-- ==========================================
-- 5. learning_paths 增加 jd_text 列
-- ==========================================
ALTER TABLE learning_paths ADD COLUMN IF NOT EXISTS jd_text TEXT NOT NULL DEFAULT '';
ALTER TABLE learning_paths DROP CONSTRAINT IF EXISTS learning_paths_user_id_target_position_key;

-- ==========================================
-- 6. user_skill_modules 增加 prerequisites 列
-- ==========================================
ALTER TABLE user_skill_modules ADD COLUMN IF NOT EXISTS prerequisites uuid[] NOT NULL DEFAULT '{}';
