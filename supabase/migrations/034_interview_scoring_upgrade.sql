-- Upgrade interview_answers to support 0-100 scoring with dimensions and thinking framework

-- 1. Expand score range from 0-10 to 0-100
ALTER TABLE interview_answers DROP CONSTRAINT IF EXISTS interview_answers_score_check;
ALTER TABLE interview_answers ALTER COLUMN score TYPE numeric(5,1);
ALTER TABLE interview_answers ADD CONSTRAINT interview_answers_score_check CHECK (score >= 0 AND score <= 100);

-- 2. Add thinking_framework column
ALTER TABLE interview_answers ADD COLUMN IF NOT EXISTS thinking_framework text;

-- 3. Add dimensions column (JSON array of {name, score, comment})
ALTER TABLE interview_answers ADD COLUMN IF NOT EXISTS dimensions jsonb;
