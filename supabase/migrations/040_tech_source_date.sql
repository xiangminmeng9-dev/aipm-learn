-- Add source_published_at to daily_tech_cache for freshness verification
ALTER TABLE daily_tech_cache ADD COLUMN IF NOT EXISTS source_published_at TIMESTAMPTZ;