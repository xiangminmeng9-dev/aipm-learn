-- ============================================================
-- 042_community_questions.sql
-- 面试题库社区 — 用户提交共享题目 + 投票
-- ============================================================

CREATE TABLE IF NOT EXISTS public.community_questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  text TEXT NOT NULL CHECK (char_length(text) >= 5),
  type_id UUID REFERENCES question_types(id) ON DELETE SET NULL,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'removed')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.community_questions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read active community questions" ON public.community_questions
  FOR SELECT USING (status = 'active');

CREATE POLICY "Users can insert own community questions" ON public.community_questions
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can delete own community questions" ON public.community_questions
  FOR DELETE USING (user_id = auth.uid());

CREATE INDEX idx_community_questions_created ON community_questions(created_at DESC);
CREATE INDEX idx_community_questions_type ON community_questions(type_id);

-- 投票表
CREATE TABLE IF NOT EXISTS public.community_question_votes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  question_id UUID NOT NULL REFERENCES community_questions(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  vote INTEGER NOT NULL CHECK (vote IN (1, -1)),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, question_id)
);

ALTER TABLE public.community_question_votes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read votes" ON public.community_question_votes
  FOR SELECT USING (true);

CREATE POLICY "Users can manage own votes" ON public.community_question_votes
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE INDEX idx_community_votes_question ON community_question_votes(question_id);
