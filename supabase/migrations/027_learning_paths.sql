-- 学习路径规划持久化
CREATE TABLE IF NOT EXISTS learning_paths (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  target_position text NOT NULL,
  current_level text NOT NULL DEFAULT '初级',
  time_budget text NOT NULL DEFAULT '3个月',
  path_data jsonb NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, target_position)
);

-- RLS
ALTER TABLE learning_paths ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own learning paths" ON learning_paths FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "Users can insert own learning paths" ON learning_paths FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "Users can update own learning paths" ON learning_paths FOR UPDATE USING (user_id = auth.uid());
CREATE POLICY "Users can delete own learning paths" ON learning_paths FOR DELETE USING (user_id = auth.uid());