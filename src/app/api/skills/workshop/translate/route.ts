import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { generateText } from '@/lib/ai/claude';
import { withTimeout } from '@/lib/ai/with-timeout';
import {
  buildSkillContentTranslationPrompt,
  SKILL_CONTENT_TRANSLATION_SYSTEM_PROMPT,
} from '@/lib/ai/prompts';

// In-memory rate limit: 30 translations per user per day
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();
const DAILY_LIMIT = 30;

function checkRateLimit(userId: string): boolean {
  const now = Date.now();
  const entry = rateLimitMap.get(userId);
  if (!entry || entry.resetAt < now) {
    rateLimitMap.set(userId, { count: 1, resetAt: now + 24 * 60 * 60 * 1000 });
    return true;
  }
  if (entry.count >= DAILY_LIMIT) return false;
  entry.count++;
  return true;
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: '未登录' }, { status: 401 });
    }

    // Rate limit
    if (!checkRateLimit(user.id)) {
      return NextResponse.json(
        { error: `翻译次数已达每日上限（${DAILY_LIMIT}次/天）` },
        { status: 429 }
      );
    }

    const body = await request.json();
    const { content, skill_name } = body as { content?: string; skill_name?: string };

    if (!content || typeof content !== 'string') {
      return NextResponse.json({ error: '缺少 content 参数' }, { status: 400 });
    }

    if (content.length > 20000) {
      return NextResponse.json({ error: '内容过长，最多支持 20000 字符' }, { status: 400 });
    }

    const prompt = buildSkillContentTranslationPrompt(content);
    const translatedContent = await withTimeout(
      generateText(prompt, {
        model: 'haiku',
        system: SKILL_CONTENT_TRANSLATION_SYSTEM_PROMPT,
        maxTokens: 8192,
      }),
      60000
    );

    return NextResponse.json({
      translated_content: translatedContent,
      skill_name,
    });
  } catch (err) {
    console.error('[translate] Error:', err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : '翻译失败' },
      { status: 500 }
    );
  }
}
