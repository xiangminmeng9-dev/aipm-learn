import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { generateText } from '@/lib/ai/claude';

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: '请先登录' }, { status: 401 });

    // Get existing question texts to avoid duplicates
    const { data: existing } = await supabase
      .from('community_questions')
      .select('text')
      .eq('status', 'active');
    const existingTexts = new Set((existing ?? []).map((q) => q.text));

    const prompt = `请列出 8 道真实的、高频的 AI 产品经理面试题。这些题目应该来自大厂（Google、Meta、字节、腾讯、阿里、百度等）真实的面试场景。

要求：
- 题目要具体，包含真实业务场景
- 覆盖不同方向：AI产品设计、数据分析、模型原理、场景分析、竞品分析、产品策略、技术沟通、增长
- 每道题 30-80 字
- 只输出 JSON 数组，不要其他内容

格式：
[
  {"text": "题目1", "category": "方向名称"},
  {"text": "题目2", "category": "方向名称"},
  ...
]`;

    const result = await generateText(prompt, {
      model: 'haiku',
      maxTokens: 1024,
      system: '你是大厂AI产品经理面试官。输出严格的 JSON 数组格式，不要任何额外说明。',
    });

    let questions: { text: string; category: string }[];
    try {
      const cleaned = result.trim().replace(/```(?:json)?\s*/gi, '').replace(/```\s*/gi, '');
      const start = cleaned.indexOf('[');
      const end = cleaned.lastIndexOf(']');
      questions = JSON.parse(cleaned.slice(start, end + 1));
    } catch {
      return NextResponse.json({ error: '题目生成失败，请重试' }, { status: 500 });
    }

    // Filter duplicates and insert
    let added = 0;
    for (const q of questions) {
      if (existingTexts.has(q.text) || q.text.length < 10) continue;
      const { error } = await supabase.from('community_questions').insert({
        text: q.text,
        user_id: user.id,
        status: 'active',
      });
      if (!error) added++;
    }

    return NextResponse.json({ success: true, added, total: questions.length });
  } catch (err) {
    console.error('Community fetch error:', err);
    return NextResponse.json({ error: '获取失败' }, { status: 500 });
  }
}
