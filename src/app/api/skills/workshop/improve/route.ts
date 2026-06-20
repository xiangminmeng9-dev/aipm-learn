import { NextRequest, NextResponse } from 'next/server';
import { createClient, createServiceClient } from '@/lib/supabase/server';
import { generateText } from '@/lib/ai/claude';
import { buildSkillImprovementPrompt, SKILL_IMPROVEMENT_SYSTEM_PROMPT } from '@/lib/ai/prompts';
import { withTimeout, AI_TIMEOUT_EXTENDED_MS } from '@/lib/ai/with-timeout';

export const dynamic = 'force-dynamic';

// Simple in-memory rate limiter for improve endpoint
// 20 improves per user per day
const improveCounts = new Map<string, { count: number; expires: number }>();
const DAILY_LIMIT = 20;
const TTL_MS = 24 * 60 * 60 * 1000; // 24 hours

function checkRateLimit(userId: string): { allowed: boolean; remaining: number } {
  const now = Date.now();
  const entry = improveCounts.get(userId);
  if (!entry || entry.expires < now) {
    improveCounts.set(userId, { count: 1, expires: now + TTL_MS });
    return { allowed: true, remaining: DAILY_LIMIT - 1 };
  }
  if (entry.count >= DAILY_LIMIT) {
    return { allowed: false, remaining: 0 };
  }
  entry.count++;
  return { allowed: true, remaining: DAILY_LIMIT - entry.count };
}

export async function POST(request: NextRequest) {
  try {
    // Auth check
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: '请先登录' }, { status: 401 });
    }

    // Rate limit
    const rateLimit = checkRateLimit(user.id);
    if (!rateLimit.allowed) {
      return NextResponse.json({ error: '今日改进次数已达上限', remaining: 0 }, { status: 429 });
    }

    // Parse body
    const body = await request.json();
    const { content, analysisId } = body as {
      content?: string;
      analysisId?: string;
    };

    if (!content?.trim()) {
      return NextResponse.json({ error: '请提供 SKILL.md 内容' }, { status: 400 });
    }

    // Verify analysisId belongs to user and get analysis result
    let analysisResultStr = '';
    if (analysisId) {
      const { data: analysis, error: fetchError } = await supabase
        .from('skill_workshop_analyses')
        .select('analysis_result')
        .eq('id', analysisId)
        .eq('user_id', user.id)
        .single();

      if (fetchError || !analysis) {
        return NextResponse.json({ error: '分析记录不存在或无权访问' }, { status: 404 });
      }
      analysisResultStr = JSON.stringify(analysis.analysis_result);
    }

    // Call AI
    const prompt = buildSkillImprovementPrompt(content.trim(), analysisResultStr);
    const rawResult = await withTimeout(
      generateText(prompt, {
        model: 'sonnet',
        system: SKILL_IMPROVEMENT_SYSTEM_PROMPT,
        maxTokens: 8192,
      }),
      AI_TIMEOUT_EXTENDED_MS
    );

    // Parse JSON result
    let result: {
      improved_content: string;
      changes: Array<{ aspect: string; before: string; after: string; reason: string }>;
    };
    try {
      const cleaned = rawResult
        .replace(/```json\n?/g, '')
        .replace(/```\n?/g, '')
        .trim();
      result = JSON.parse(cleaned);
    } catch {
      return NextResponse.json(
        { error: 'AI 返回格式异常，请重试', raw: rawResult.slice(0, 500) },
        { status: 502 }
      );
    }

    // Update analysis record with improved content
    if (analysisId) {
      const serviceClient = createServiceClient();
      await serviceClient
        .from('skill_workshop_analyses')
        .update({
          improved_content: result.improved_content,
          improvement_applied: false,
        })
        .eq('id', analysisId)
        .eq('user_id', user.id);
    }

    return NextResponse.json({
      improved_content: result.improved_content || '',
      changes: result.changes || [],
      analysis_id: analysisId || null,
      remaining: rateLimit.remaining,
    });
  } catch (err) {
    console.error('[skill-improve] Error:', err);
    const msg = err instanceof Error ? err.message : '改进失败';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
