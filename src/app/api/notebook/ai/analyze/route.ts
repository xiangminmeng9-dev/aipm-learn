import { generateText } from '@/lib/ai/claude';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { prompt } = await request.json();

    if (!prompt || typeof prompt !== 'string') {
      return NextResponse.json({ error: 'Missing prompt' }, { status: 400 });
    }

    const analysis = await generateText(prompt, {
      model: 'sonnet',
      system: '你是一位资深的 AI 产品经理工作顾问。你的分析要具体、有洞察力，给出可执行的建议。用 Markdown 格式输出，结构清晰。',
      maxTokens: 2048,
    });

    return NextResponse.json({ analysis });
  } catch (error) {
    console.error('AI analysis error:', error);
    return NextResponse.json({ error: 'AI 分析失败' }, { status: 500 });
  }
}
