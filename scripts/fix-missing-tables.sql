-- ============================================================
-- 修复缺失的 assistant_qa_records 表
-- 在 Supabase SQL Editor 中运行此脚本
-- ============================================================

-- 1. 创建 assistant_qa_records 表
CREATE TABLE IF NOT EXISTS assistant_qa_records (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  question TEXT NOT NULL,
  category TEXT,
  answer TEXT NOT NULL DEFAULT '',
  resume_text TEXT,
  jd_text TEXT,
  evaluation JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 2. 创建索引
CREATE INDEX IF NOT EXISTS idx_assistant_qa_records_user ON assistant_qa_records(user_id);
CREATE INDEX IF NOT EXISTS idx_assistant_qa_records_user_time ON assistant_qa_records(user_id, created_at DESC);

-- 3. 启用 RLS
ALTER TABLE assistant_qa_records ENABLE ROW LEVEL SECURITY;

-- 4. 创建 RLS 策略
DROP POLICY IF EXISTS "Users can manage own qa records" ON assistant_qa_records;
CREATE POLICY "Users can manage own qa records" ON assistant_qa_records
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- 5. 给 interview_questions 添加频率字段（如果不存在）
DO $$ BEGIN
  ALTER TABLE interview_questions ADD COLUMN IF NOT EXISTS frequency TEXT CHECK (frequency IN ('高频', '中频', '低频'));
EXCEPTION WHEN duplicate_column THEN NULL;
END $$;

-- 6. 给 trending_questions 添加频率字段（如果不存在）
DO $$ BEGIN
  ALTER TABLE trending_questions ADD COLUMN IF NOT EXISTS frequency TEXT CHECK (frequency IN ('高频', '中频', '低频'));
EXCEPTION WHEN duplicate_column THEN NULL;
END $$;

-- 7. 给 daily_tech_cache 添加 INSERT/UPDATE RLS 策略（允许 service role 写入）
-- 注意：service role 不受 RLS 限制，但普通用户需要这些策略
-- 当前只有 SELECT 策略，添加 INSERT 和 UPDATE 策略
DROP POLICY IF EXISTS "Service role can insert tech cache" ON daily_tech_cache;
DROP POLICY IF EXISTS "Service role can update tech cache" ON daily_tech_cache;
CREATE POLICY "Service role can insert tech cache" ON daily_tech_cache
  FOR INSERT WITH CHECK (true);
CREATE POLICY "Service role can update tech cache" ON daily_tech_cache
  FOR UPDATE USING (true) WITH CHECK (true);
