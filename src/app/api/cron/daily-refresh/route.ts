import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/server';

export const maxDuration = 120;

// Called by Vercel Cron (or external scheduler) at 00:05 Asia/Shanghai daily
// Deletes today's cached daily challenge + daily tech so they regenerate on next request
export async function GET(request: NextRequest) {
  // Verify cron secret to prevent abuse
  const auth = request.headers.get('authorization');
  if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }

  const today = new Date().toISOString().split('T')[0];
  const serviceClient = createServiceClient();

  const results: string[] = [];

  // Delete today's daily challenge cache
  const { error: challengeErr } = await serviceClient
    .from('daily_challenges')
    .delete()
    .eq('date', today);
  results.push(challengeErr ? `challenge: ${challengeErr.message}` : 'challenge: cleared');

  // Delete today's daily tech cache
  const { error: techErr } = await serviceClient
    .from('daily_tech_cache')
    .delete()
    .eq('date', today);
  results.push(techErr ? `tech: ${techErr.message}` : 'tech: cleared');

  return NextResponse.json({ date: today, results });
}
