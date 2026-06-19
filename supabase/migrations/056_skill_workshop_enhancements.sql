-- Skill Workshop enhancements: add template_type, validation fields, improvement fields
-- Migration: 056

-- Add template_type, validation_status, validation_errors to user_skill_drafts
ALTER TABLE user_skill_drafts
  ADD COLUMN IF NOT EXISTS template_type text NOT NULL DEFAULT 'basic',
  ADD COLUMN IF NOT EXISTS validation_status text NOT NULL DEFAULT 'unknown',
  ADD COLUMN IF NOT EXISTS validation_errors jsonb;

-- Add improved_content, improvement_applied to skill_workshop_analyses
ALTER TABLE skill_workshop_analyses
  ADD COLUMN IF NOT EXISTS improved_content text,
  ADD COLUMN IF NOT EXISTS improvement_applied boolean NOT NULL DEFAULT false;

-- Add comment for documentation
COMMENT ON COLUMN user_skill_drafts.template_type IS 'Skill template type: basic, agent, workflow, pm-specialist';
COMMENT ON COLUMN user_skill_drafts.validation_status IS 'SKILL.md validation status: unknown, valid, invalid';
COMMENT ON COLUMN user_skill_drafts.validation_errors IS 'Array of validation error messages';
COMMENT ON COLUMN skill_workshop_analyses.improved_content IS 'AI-improved SKILL.md content from one-click improve';
COMMENT ON COLUMN skill_workshop_analyses.improvement_applied IS 'Whether the improvement has been applied by the user';
