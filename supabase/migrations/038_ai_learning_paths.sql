-- AI 生成个人学习路径（基于弱项分析）
CREATE TABLE IF NOT EXISTS ai_learning_paths (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  weakness_summary TEXT NOT NULL,
  recommended_modules JSONB NOT NULL DEFAULT '[]',
  total_estimated_hours INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- RLS
ALTER TABLE ai_learning_paths ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own ai learning paths"
  ON ai_learning_paths FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Users can insert own ai learning paths"
  ON ai_learning_paths FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can delete own ai learning paths"
  ON ai_learning_paths FOR DELETE
  USING (user_id = auth.uid());

-- Indexes
CREATE INDEX idx_ai_learning_paths_user_id ON ai_learning_paths(user_id);
CREATE INDEX idx_ai_learning_paths_created_at ON ai_learning_paths(created_at DESC);
