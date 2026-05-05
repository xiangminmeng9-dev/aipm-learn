-- Competitive Analysis: 竞品分析助手
CREATE TABLE IF NOT EXISTS competitive_analyses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  product_name TEXT NOT NULL CHECK (char_length(product_name) >= 2),
  market_position TEXT NOT NULL,
  feature_comparison TEXT NOT NULL,
  strengths_weaknesses TEXT NOT NULL,
  differentiation_strategy TEXT NOT NULL,
  total_score INTEGER NOT NULL CHECK (total_score >= 0 AND total_score <= 100),
  dimension_scores JSONB NOT NULL DEFAULT '[]',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- RLS
ALTER TABLE competitive_analyses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own competitive analyses"
  ON competitive_analyses FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Users can insert own competitive analyses"
  ON competitive_analyses FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own competitive analyses"
  ON competitive_analyses FOR UPDATE
  USING (user_id = auth.uid());

CREATE POLICY "Users can delete own competitive analyses"
  ON competitive_analyses FOR DELETE
  USING (user_id = auth.uid());

-- Indexes
CREATE INDEX idx_competitive_analyses_user_id ON competitive_analyses(user_id);
CREATE INDEX idx_competitive_analyses_created_at ON competitive_analyses(created_at DESC);
