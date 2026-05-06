import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: '未登录' }, { status: 401 });
  }
  const serviceClient = createServiceClient();

  // Check if columns already exist by trying to select them
  const { error: checkError } = await serviceClient
    .from('interview_answers')
    .select('id, thinking_framework, dimensions')
    .limit(1);

  if (!checkError) {
    // Columns already exist, just need to update the score constraint
    const { error: rpcError } = await serviceClient.rpc('exec_sql', {
      sql_query: `
        ALTER TABLE interview_answers DROP CONSTRAINT IF EXISTS interview_answers_score_check;
        ALTER TABLE interview_answers ALTER COLUMN score TYPE numeric(5,1);
        ALTER TABLE interview_answers ADD CONSTRAINT interview_answers_score_check CHECK (score >= 0 AND score <= 100);
      `,
    });
    if (!rpcError) {
      return NextResponse.json({ message: 'Score constraint updated to 0-100', status: 'done' });
    }
    return NextResponse.json({
      message: 'Columns exist. Run this SQL in Supabase SQL Editor to update score range:',
      sql: `ALTER TABLE interview_answers DROP CONSTRAINT IF EXISTS interview_answers_score_check;
ALTER TABLE interview_answers ALTER COLUMN score TYPE numeric(5,1);
ALTER TABLE interview_answers ADD CONSTRAINT interview_answers_score_check CHECK (score >= 0 AND score <= 100);`,
      dashboardUrl: 'https://supabase.com/dashboard/project/jgtvzfmzzhpfzpvdgzgk/sql',
    });
  }

  // Try to execute full migration via RPC
  const { error: rpcError } = await serviceClient.rpc('exec_sql', {
    sql_query: `
      ALTER TABLE interview_answers DROP CONSTRAINT IF EXISTS interview_answers_score_check;
      ALTER TABLE interview_answers ALTER COLUMN score TYPE numeric(5,1);
      ALTER TABLE interview_answers ADD CONSTRAINT interview_answers_score_check CHECK (score >= 0 AND score <= 100);
      ALTER TABLE interview_answers ADD COLUMN IF NOT EXISTS thinking_framework text;
      ALTER TABLE interview_answers ADD COLUMN IF NOT EXISTS dimensions jsonb;
    `,
  });

  if (!rpcError) {
    return NextResponse.json({ message: 'Migration executed successfully', status: 'done' });
  }

  return NextResponse.json({
    message: 'Run this SQL in Supabase SQL Editor:',
    sql: `ALTER TABLE interview_answers DROP CONSTRAINT IF EXISTS interview_answers_score_check;
ALTER TABLE interview_answers ALTER COLUMN score TYPE numeric(5,1);
ALTER TABLE interview_answers ADD CONSTRAINT interview_answers_score_check CHECK (score >= 0 AND score <= 100);
ALTER TABLE interview_answers ADD COLUMN IF NOT EXISTS thinking_framework text;
ALTER TABLE interview_answers ADD COLUMN IF NOT EXISTS dimensions jsonb;`,
    dashboardUrl: 'https://supabase.com/dashboard/project/jgtvzfmzzhpfzpvdgzgk/sql',
  });
}
