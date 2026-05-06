import { NextRequest, NextResponse } from 'next/server';
import { createClient, createServiceClient } from '@/lib/supabase/server';
import { generateText, streamChatResponse } from '@/lib/ai/claude';
import {
  buildSpecPracticeQuestionPrompt,
  SPEC_PRACTICE_QUESTION_SYSTEM_PROMPT,
  buildSpecEvaluationPrompt,
  SPEC_EVALUATION_SYSTEM_PROMPT,
} from '@/lib/ai/prompts';
import { validateBody, specPracticeSchema } from '@/lib/validations';

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: '未登录' }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const refresh = searchParams.get('refresh');

    if (refresh !== '1') {
      const { data: existing } = await supabase
        .from('spec_practices')
        .select('question, question_category')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (existing) {
        return NextResponse.json({
          question: existing.question,
          question_category: existing.question_category,
        });
      }
    }

    // Use haiku for question generation (fast, simple task)
    const prompt = buildSpecPracticeQuestionPrompt();
    const result = await generateText(prompt, {
      model: 'haiku',
      system: SPEC_PRACTICE_QUESTION_SYSTEM_PROMPT,
      maxTokens: 256,
    });

    let questionData;
    try {
      const cleaned = result.trim().replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '');
      questionData = JSON.parse(cleaned);
    } catch {
      return NextResponse.json({ error: '题目生成失败，请重试' }, { status: 500 });
    }

    return NextResponse.json({
      question: questionData.question,
      question_category: questionData.question_category,
    });
  } catch (error) {
    console.error('Spec practice question error:', error);
    return NextResponse.json({ error: '服务器内部错误' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: '未登录' }, { status: 401 });

    const body = await request.json();
    const validation = validateBody(specPracticeSchema, body);
    if (!validation.success) {
      return NextResponse.json({ error: validation.error }, { status: 400 });
    }
    const { question, question_category, user_spec } = validation.data;

    const prompt = buildSpecEvaluationPrompt(question, user_spec);
    const encoder = new TextEncoder();

    const stream = new ReadableStream({
      async start(controller) {
        let fullText = '';
        try {
          for await (const chunk of streamChatResponse(
            [{ role: 'user', content: prompt }],
            { model: 'sonnet', system: SPEC_EVALUATION_SYSTEM_PROMPT, maxTokens: 2048 },
          )) {
            fullText += chunk;
            controller.enqueue(encoder.encode(`data: ${JSON.stringify({ text: chunk })}\n\n`));
          }

          // Parse evaluation and save
          let evaluation;
          try {
            const cleaned = fullText.trim().replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '');
            evaluation = JSON.parse(cleaned);
          } catch {
            controller.enqueue(encoder.encode(`data: ${JSON.stringify({ error: 'AI 评分解析失败' })}\n\n`));
            controller.close();
            return;
          }

          const serviceClient = createServiceClient();
          const { data, error } = await serviceClient
            .from('spec_practices')
            .insert({
              user_id: user.id,
              question,
              question_category,
              user_spec,
              total_score: evaluation.total_score,
              dimension_scores: evaluation.dimension_scores,
              suggestions: evaluation.suggestions,
            })
            .select()
            .single();

          if (error) {
            console.error('Spec practice save error:', error);
          }

          controller.enqueue(encoder.encode(`data: ${JSON.stringify({
            done: true,
            evaluation: {
              id: data?.id || null,
              total_score: evaluation.total_score,
              dimension_scores: evaluation.dimension_scores,
              suggestions: evaluation.suggestions,
              created_at: data?.created_at || new Date().toISOString(),
            },
          })}\n\n`));
        } catch (err) {
          console.error('Spec practice stream error:', err);
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
    console.error('Spec practice evaluate error:', error);
    return NextResponse.json({ error: '服务器内部错误' }, { status: 500 });
  }
}