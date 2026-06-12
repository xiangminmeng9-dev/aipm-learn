import { NextRequest, NextResponse } from 'next/server';
import { createClient, createServiceClient } from '@/lib/supabase/server';
import { generateText, streamChatResponse } from '@/lib/ai/claude';
import {
  buildPromptPracticeQuestionPrompt,
  PROMPT_PRACTICE_QUESTION_SYSTEM_PROMPT,
  buildPromptEvaluationPrompt,
  PROMPT_EVALUATION_SYSTEM_PROMPT,
} from '@/lib/ai/prompts';
import { validateBody, promptPracticeSchema } from '@/lib/validations';

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: '未登录' }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const refresh = searchParams.get('refresh');
    const category = searchParams.get('category') || undefined;
    const difficulty = searchParams.get('difficulty') || undefined;

    if (refresh !== '1') {
      const { data: existing } = await supabase
        .from('prompt_practices')
        .select('question, question_category, difficulty')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (existing) {
        return NextResponse.json({
          question: existing.question,
          question_category: existing.question_category,
          difficulty: existing.difficulty || '进阶',
        });
      }
    }

    // Generate new question via AI (haiku for speed)
    const prompt = buildPromptPracticeQuestionPrompt({ category, difficulty });
    const result = await generateText(prompt, {
      model: 'haiku',
      system: PROMPT_PRACTICE_QUESTION_SYSTEM_PROMPT,
      maxTokens: 512,
    });

    let questionData: { question?: string; question_category?: string; difficulty?: string };
    try {
      let cleaned = result.trim();
      cleaned = cleaned.replace(/```(?:json)?\s*/gi, '').replace(/```\s*/gi, '');
      const start = cleaned.indexOf('{');
      const end = cleaned.lastIndexOf('}');
      if (start >= 0 && end > start) cleaned = cleaned.slice(start, end + 1);
      questionData = JSON.parse(cleaned);
      if (!questionData.question) throw new Error('Missing question field');
    } catch {
      questionData = {
        question: '你是一位 AI 产品经理，请为"AI 驱动的用户调研助手"设计一个 prompt，使其能够从用户访谈记录中提取关键需求、痛点和机会点，并以结构化格式输出。',
        question_category: '结构化输出',
        difficulty: '进阶',
      };
    }

    return NextResponse.json({
      question: questionData.question,
      question_category: questionData.question_category || '结构化输出',
      difficulty: questionData.difficulty || '进阶',
    });
  } catch (error) {
    console.error('Prompt practice question error:', error);
    return NextResponse.json({ error: '服务器内部错误' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: '未登录' }, { status: 401 });

    const body = await request.json();
    const validation = validateBody(promptPracticeSchema, body);
    if (!validation.success) {
      return NextResponse.json({ error: validation.error }, { status: 400 });
    }
    const { question, question_category, difficulty, user_prompt } = validation.data;

    const prompt = buildPromptEvaluationPrompt(question, question_category || '结构化输出', difficulty || '进阶', user_prompt);
    const encoder = new TextEncoder();

    const stream = new ReadableStream({
      async start(controller) {
        let fullText = '';
        try {
          for await (const chunk of streamChatResponse(
            [{ role: 'user', content: prompt }],
            { model: 'haiku', system: PROMPT_EVALUATION_SYSTEM_PROMPT, maxTokens: 4096 },
          )) {
            fullText += chunk;
            controller.enqueue(encoder.encode(`data: ${JSON.stringify({ text: chunk })}\n\n`));
          }

          // Parse evaluation
          let evaluation;
          try {
            const cleaned = fullText.trim().replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '');
            const start = cleaned.indexOf('{');
            const end = cleaned.lastIndexOf('}');
            const jsonStr = start >= 0 && end > start ? cleaned.slice(start, end + 1) : cleaned;
            evaluation = JSON.parse(jsonStr);
          } catch {
            controller.enqueue(encoder.encode(`data: ${JSON.stringify({ error: 'AI 评分解析失败' })}\n\n`));
            controller.close();
            return;
          }

          // Save to DB
          const serviceClient = createServiceClient();
          const { data, error } = await serviceClient
            .from('prompt_practices')
            .insert({
              user_id: user.id,
              question,
              question_category: question_category || '结构化输出',
              difficulty: difficulty || '进阶',
              user_prompt,
              total_score: evaluation.score || 0,
              dimension_scores: evaluation.dimensions || [],
              differences: evaluation.differences || [],
              optimizations: evaluation.optimizations || [],
              ideal_answer: evaluation.idealAnswer || '',
              overall_feedback: evaluation.overallFeedback || '',
            })
            .select()
            .single();

          if (error) {
            console.error('Prompt practice save error:', error);
          }

          controller.enqueue(encoder.encode(`data: ${JSON.stringify({
            done: true,
            evaluation: {
              id: data?.id || null,
              score: evaluation.score || 0,
              dimensions: evaluation.dimensions || [],
              differences: evaluation.differences || [],
              optimizations: evaluation.optimizations || [],
              idealAnswer: evaluation.idealAnswer || '',
              overallFeedback: evaluation.overallFeedback || '',
              created_at: data?.created_at || new Date().toISOString(),
            },
          })}\n\n`));
        } catch (err) {
          console.error('Prompt practice stream error:', err);
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ error: 'AI 服务异常' })}\n\n`));
        } finally {
          controller.close();
        }
      },
    });

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        Connection: 'keep-alive',
      },
    });
  } catch (error) {
    console.error('Prompt practice evaluate error:', error);
    return NextResponse.json({ error: '服务器内部错误' }, { status: 500 });
  }
}
