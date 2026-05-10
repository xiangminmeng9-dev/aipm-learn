-- ============================================================
-- 041_question_bookmarks.sql
-- 面试题收藏夹 — 用户可收藏面试题，标注掌握程度和笔记
-- ============================================================

CREATE TABLE IF NOT EXISTS public.user_question_bookmarks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  question_id UUID NOT NULL REFERENCES interview_questions(id) ON DELETE CASCADE,
  mastery_level TEXT NOT NULL DEFAULT 'learning' CHECK (mastery_level IN ('mastered', 'learning', 'review')),
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, question_id)
);

ALTER TABLE public.user_question_bookmarks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own bookmarks" ON public.user_question_bookmarks
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE INDEX idx_user_question_bookmarks_user ON user_question_bookmarks(user_id);
CREATE INDEX idx_user_question_bookmarks_mastery ON user_question_bookmarks(user_id, mastery_level);
