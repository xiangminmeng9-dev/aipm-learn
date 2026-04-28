-- Add prerequisites column to user_skill_modules for dependency tracking
ALTER TABLE user_skill_modules ADD COLUMN IF NOT EXISTS prerequisites uuid[] NOT NULL DEFAULT '{}';