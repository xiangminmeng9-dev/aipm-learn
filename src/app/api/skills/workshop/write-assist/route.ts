import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { generateText } from '@/lib/ai/claude';
import { buildSkillWriteAssistPrompt, SKILL_WRITE_ASSIST_SYSTEM_PROMPT } from '@/lib/ai/prompts';
import { withTimeout, AI_TIMEOUT_EXTENDED_MS } from '@/lib/ai/with-timeout';
export const dynamic = 'force-dynamic';

// Simple in-memory rate limiter for write-assist endpoint
// 20 assists per user per day
const assistCounts = new Map<string, { count: number; expires: number }>();
const DAILY_LIMIT = 20;
const TTL_MS = 24 * 60 * 60 * 1000; // 24 hours

function checkRateLimit(userId: string): { allowed: boolean; remaining: number } {
  const now = Date.now();
  const entry = assistCounts.get(userId);
  if (!entry || entry.expires < now) {
    assistCounts.set(userId, { count: 1, expires: now + TTL_MS });
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
      return NextResponse.json(
        { error: '今日辅助写作次数已达上限', remaining: 0 },
        { status: 429 }
      );
    }

    // Parse body
    const body = await request.json();
    const { user_description, template_type, existing_content } = body as {
      user_description?: string;
      template_type?: string;
      existing_content?: string;
    };

    if (!user_description?.trim()) {
      return NextResponse.json({ error: '请提供技能描述' }, { status: 400 });
    }

    // Call AI
    const prompt = buildSkillWriteAssistPrompt({
      userDescription: user_description.trim(),
      templateType: template_type || 'basic',
      existingContent: existing_content || undefined,
    });

    const rawResult = await withTimeout(
      generateText(prompt, {
        model: 'sonnet',
        system: SKILL_WRITE_ASSIST_SYSTEM_PROMPT,
        maxTokens: 8192,
      }),
      AI_TIMEOUT_EXTENDED_MS
    );

    // Parse JSON result
    let result: { skill_content: string; explanation: string; tips: string[] };
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

    return NextResponse.json({
      skill_content: result.skill_content || '',
      explanation: result.explanation || '',
      tips: result.tips || [],
    });
  } catch (err) {
    console.error('[skill-write-assist] Error:', err);
    const msg = err instanceof Error ? err.message : 'AI 辅助编写失败';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
