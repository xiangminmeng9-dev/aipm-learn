-- Add jd_text column to learning_paths
ALTER TABLE learning_paths ADD COLUMN IF NOT EXISTS jd_text TEXT NOT NULL DEFAULT '';

-- Drop unique constraint to allow multiple paths per target_position
ALTER TABLE learning_paths DROP CONSTRAINT IF EXISTS learning_paths_user_id_target_position_key;
