-- ============================================================
-- 038_competitive_methodologies.sql
-- Create competitive_methodologies table for 竞品分析方法论
-- ============================================================

CREATE TABLE IF NOT EXISTS competitive_methodologies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  framework text NOT NULL DEFAULT '',
  key_steps jsonb NOT NULL DEFAULT '[]',
  typical_cases jsonb NOT NULL DEFAULT '[]',
  common_pitfalls jsonb NOT NULL DEFAULT '[]',
  scoring_insights jsonb NOT NULL DEFAULT '[]',
  source_count integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id)
);

-- RLS
ALTER TABLE competitive_methodologies ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own competitive methodology" ON competitive_methodologies
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Service can manage competitive methodology" ON competitive_methodologies
  FOR ALL USING (auth.role() = 'service_role');