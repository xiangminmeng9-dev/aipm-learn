-- Add resume matching fields to jd_analyses
ALTER TABLE jd_analyses ADD COLUMN IF NOT EXISTS resume_text text;
ALTER TABLE jd_analyses ADD COLUMN IF NOT EXISTS resume_match jsonb;