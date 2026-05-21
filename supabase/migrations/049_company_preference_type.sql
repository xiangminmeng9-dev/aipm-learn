-- 049: Add company_type and company_preference to resume tables

-- resume_applications
ALTER TABLE resume_applications
  ADD COLUMN IF NOT EXISTS company_type text DEFAULT 'other'
    CHECK (company_type IN ('big_company','foreign','state_owned','startup','traditional','other'));

ALTER TABLE resume_applications
  ADD COLUMN IF NOT EXISTS company_preference text;

-- resume_repository
ALTER TABLE resume_repository
  ADD COLUMN IF NOT EXISTS company_type text DEFAULT 'other'
    CHECK (company_type IN ('big_company','foreign','state_owned','startup','traditional','other'));

ALTER TABLE resume_repository
  ADD COLUMN IF NOT EXISTS company_preference text;

-- Index for filtering by company type
CREATE INDEX IF NOT EXISTS idx_resume_applications_company_type
  ON resume_applications(user_id, company_type);
