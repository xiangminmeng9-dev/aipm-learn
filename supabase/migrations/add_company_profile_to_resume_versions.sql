-- Add company profile fields to resume_versions for profile-based resume generation
ALTER TABLE resume_versions ADD COLUMN IF NOT EXISTS company_type text DEFAULT 'other';
ALTER TABLE resume_versions ADD COLUMN IF NOT EXISTS company_preference text;

-- Make jd_text optional (profile-only mode doesn't require JD)
ALTER TABLE resume_versions ALTER COLUMN jd_text DROP NOT NULL;
ALTER TABLE resume_versions ALTER COLUMN jd_text SET DEFAULT '';
