-- Spec Practice: AI Coding 实操练习
CREATE TABLE IF NOT EXISTS spec_practices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  question TEXT NOT NULL,
  question_category TEXT NOT NULL,
  user_spec TEXT NOT NULL CHECK (char_length(user_spec) >= 50),
  total_score INTEGER NOT NULL CHECK (total_score >= 0 AND total_score <= 100),
  dimension_scores JSONB NOT NULL DEFAULT '[]',
  suggestions JSONB NOT NULL DEFAULT '[]',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- RLS
ALTER TABLE spec_practices ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own spec practices"
  ON spec_practices FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Users can insert own spec practices"
  ON spec_practices FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own spec practices"
  ON spec_practices FOR UPDATE
  USING (user_id = auth.uid());

CREATE POLICY "Users can delete own spec practices"
  ON spec_practices FOR DELETE
  USING (user_id = auth.uid());

-- Indexes
CREATE INDEX idx_spec_practices_user_id ON spec_practices(user_id);
CREATE INDEX idx_spec_practices_created_at ON spec_practices(created_at DESC);
