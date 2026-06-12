-- Prompt Practice: AI Prompt Engineering 练习
CREATE TABLE IF NOT EXISTS prompt_practices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  question TEXT NOT NULL,
  question_category TEXT NOT NULL,
  difficulty TEXT NOT NULL CHECK (difficulty IN ('入门', '进阶', '实战')),
  user_prompt TEXT NOT NULL CHECK (char_length(user_prompt) >= 20),
  total_score INTEGER NOT NULL CHECK (total_score >= 0 AND total_score <= 100),
  dimension_scores JSONB NOT NULL DEFAULT '[]',
  differences JSONB NOT NULL DEFAULT '[]',
  optimizations JSONB NOT NULL DEFAULT '[]',
  ideal_answer TEXT NOT NULL DEFAULT '',
  overall_feedback TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- RLS
ALTER TABLE prompt_practices ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own prompt practices"
  ON prompt_practices FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Users can insert own prompt practices"
  ON prompt_practices FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own prompt practices"
  ON prompt_practices FOR UPDATE
  USING (user_id = auth.uid());

CREATE POLICY "Users can delete own prompt practices"
  ON prompt_practices FOR DELETE
  USING (user_id = auth.uid());

-- Indexes
CREATE INDEX idx_prompt_practices_user_id ON prompt_practices(user_id);
CREATE INDEX idx_prompt_practices_created_at ON prompt_practices(created_at DESC);
