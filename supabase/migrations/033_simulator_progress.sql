-- Add stage_scores column to simulator_sessions for progress persistence
ALTER TABLE simulator_sessions
ADD COLUMN IF NOT EXISTS stage_scores JSONB DEFAULT '{}';

-- Add scenario_id column if not exists
ALTER TABLE simulator_sessions
ADD COLUMN IF NOT EXISTS scenario_id TEXT;

-- Add current_stage column if not exists
ALTER TABLE simulator_sessions
ADD COLUMN IF NOT EXISTS current_stage TEXT;
