import { NextRequest, NextResponse } from 'next/server';
import { createClient, createServiceClient } from '@/lib/supabase/server';
import { generateText } from '@/lib/ai/claude';
import { buildSkillAnalysisPrompt, SKILL_ANALYSIS_SYSTEM_PROMPT } from '@/lib/ai/prompts';
import { withTimeout, AI_TIMEOUT_EXTENDED_MS } from '@/lib/ai/with-timeout';
export const dynamic = 'force-dynamic';

// Simple in-memory rate limiter for analyze endpoint
// 20 analyses per user per day
const analyzeCounts = new Map<string, { count: number; expires: number }>();
const DAILY_LIMIT = 20;
const TTL_MS = 24 * 60 * 60 * 1000; // 24 hours

function checkRateLimit(userId: string): { allowed: boolean; remaining: number } {
  const now = Date.now();
  const entry = analyzeCounts.get(userId);
  if (!entry || entry.expires < now) {
    analyzeCounts.set(userId, { count: 1, expires: now + TTL_MS });
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
      return NextResponse.json({ error: '今日分析次数已达上限', remaining: 0 }, { status: 429 });
    }

    // Parse body
    const body = await request.json();
    const { skill_content, skill_name, skill_slug, skill_source } = body as {
      skill_content?: string;
      skill_name?: string;
      skill_slug?: string;
      skill_source?: 'clawhub' | 'skillssh' | 'manual';
    };

    if (!skill_content?.trim()) {
      return NextResponse.json({ error: '请提供 SKILL.md 内容' }, { status: 400 });
    }

    // Call AI
    const prompt = buildSkillAnalysisPrompt(skill_content);
    const rawResult = await withTimeout(
      generateText(prompt, {
        model: 'sonnet',
        system: SKILL_ANALYSIS_SYSTEM_PROMPT,
        maxTokens: 8192,
      }),
      AI_TIMEOUT_EXTENDED_MS
    );

    // Parse JSON result
    let analysisResult: Record<string, unknown>;
    try {
      const cleaned = rawResult
        .replace(/```json\n?/g, '')
        .replace(/```\n?/g, '')
        .trim();
      analysisResult = JSON.parse(cleaned);
    } catch {
      return NextResponse.json(
        { error: 'AI 返回格式异常，请重试', raw: rawResult.slice(0, 500) },
        { status: 502 }
      );
    }

    // Save to DB
    const serviceClient = createServiceClient();
    const { data: inserted, error: dbError } = await serviceClient
      .from('skill_workshop_analyses')
      .insert({
        user_id: user.id,
        skill_content: skill_content.trim(),
        skill_name: skill_name || null,
        skill_slug: skill_slug || null,
        skill_source: skill_source || 'manual',
        analysis_result: analysisResult,
      })
      .select('id')
      .single();

    if (dbError) {
      console.error('[skill-analyze] DB insert error:', dbError.message);
      // Still return the result even if save fails
      return NextResponse.json({
        analysis_result: analysisResult,
        analysis_id: null,
      });
    }

    return NextResponse.json({
      analysis_result: analysisResult,
      analysis_id: inserted?.id ?? null,
    });
  } catch (err) {
    console.error('[skill-analyze] Error:', err);
    const msg = err instanceof Error ? err.message : '分析失败';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
