// Script to create missing tables in Supabase
// Run with: node scripts/create-missing-tables.js

const { createClient } = require('@supabase/supabase-js');

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !key) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const client = createClient(url, key);

async function run() {
  // Create assistant_qa_records table
  console.log('Creating assistant_qa_records...');

  // We can't run raw SQL via the REST API, but we can create an RPC function
  // that executes SQL, then call it, then delete it.
  // However, creating a function also requires SQL execution.

  // Alternative: use the Supabase SQL editor API
  // The Supabase dashboard uses a special endpoint for SQL execution

  // Let's try the approach of creating the table via the pg_net extension
  // or by using a migration function

  // Actually, the simplest approach is to use the Supabase Management API
  // with a personal access token. But we don't have one.

  // Let's try another approach: use the Supabase client to create the table
  // by inserting a record into it - this won't work because the table doesn't exist.

  // The real solution: we need to run the SQL migration manually.
  // Let's output the SQL that needs to be run.

  console.log('\n=== SQL to run in Supabase SQL Editor ===\n');

  const sql = `
-- Migration 018: assistant_qa_records
CREATE TABLE IF NOT EXISTS assistant_qa_records (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  question TEXT NOT NULL,
  category TEXT,
  answer TEXT NOT NULL DEFAULT '',
  evaluation JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_assistant_qa_records_user ON assistant_qa_records(user_id);
CREATE INDEX IF NOT EXISTS idx_assistant_qa_records_user_time ON assistant_qa_records(user_id, created_at DESC);

ALTER TABLE assistant_qa_records ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own qa records" ON assistant_qa_records
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Add frequency columns if they don't exist
DO $$ BEGIN
  ALTER TABLE interview_questions ADD COLUMN IF NOT EXISTS frequency TEXT CHECK (frequency IN ('高频', '中频', '低频'));
EXCEPTION WHEN duplicate_column THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE trending_questions ADD COLUMN IF NOT EXISTS frequency TEXT CHECK (frequency IN ('高频', '中频', '低频'));
EXCEPTION WHEN duplicate_column THEN NULL;
END $$;
`;

  console.log(sql);

  // Verify the table doesn't exist
  const { error } = await client.from('assistant_qa_records').select('id').limit(1);
  if (error) {
    console.log('\n=== Verification: assistant_qa_records table is MISSING ===');
    console.log('Error:', error.message);
    console.log('\nPlease run the SQL above in the Supabase SQL Editor (Dashboard > SQL Editor)');
  } else {
    console.log('\n=== Table already exists! ===');
  }
}

run().catch(console.error);