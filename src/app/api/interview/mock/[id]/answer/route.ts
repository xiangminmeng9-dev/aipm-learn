import { NextRequest, NextResponse } from 'next/server';
import { createClient, createServiceClient } from '@/lib/supabase/server';
import { streamChatResponse, generateText } from '@/lib/ai/claude';
import {
  buildMockScoringPrompt,
  buildMockQuestionPrompt,
  MOCK_SCORING_SYSTEM_PROMPT,
  MOCK_QUESTION_SYSTEM_PROMPT,
} from '@/lib/ai/prompts';

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    let authenticatedUser = user;
    if (!authenticatedUser) {
      const authHeader = request.headers.get('Authorization');
      if (authHeader?.startsWith('Bearer ')) {
        const token = authHeader.slice(7);
        const { data: { user: headerUser } } = await supabase.auth.getUser(token);
        authenticatedUser = headerUser;
      }
    }

    if (!authenticatedUser) {
      return NextResponse.json({ error: '未登录', code: 'UNAUTHORIZED' }, { status: 401 });
    }

    const { id: mockId } = await params;
    const body = await request.json();
    const { answer, skip } = body as { answer?: string; skip?: boolean };
    const serviceClient = createServiceClient();

    const { data: mockInterview } = await serviceClient
      .from('mock_interviews')
      .select('id, type_id, current_question, total_questions, status, jd_text, resume_text')
      .eq('id', mockId)
      .eq('user_id', authenticatedUser.id)
      .single();

    if (!mockInterview) {
      return NextResponse.json({ error: '模拟面试不存在', code: 'NOT_FOUND' }, { status: 404 });
    }

    if (mockInterview.status !== 'in_progress') {
      return NextResponse.json({ error: '面试已结束', code: 'VALIDATION_ERROR' }, { status: 400 });
    }

    const { data: currentAnswer } = await serviceClient
      .from('interview_answers')
      .select('id, question_number, question_text')
      .eq('mock_interview_id', mockId)
      .eq('question_number', mockInterview.current_question)
      .single();

    if (!currentAnswer) {
      return NextResponse.json({ error: '当前题目不存在', code: 'NOT_FOUND' }, { status: 404 });
    }

    const isSkipped = skip === true;
    const answerText = answer?.trim() ?? '';

    if (!isSkipped && !answerText) {
      return NextResponse.json(
        { error: '请输入回答或选择跳过', code: 'VALIDATION_ERROR' },
        { status: 400 }
      );
    }

    // Skipped — return immediately
    if (isSkipped) {
      await serviceClient
        .from('interview_answers')
        .update({
          user_answer: null,
          score: null,
          gap_analysis: '已跳过',
          perfect_answer: '已跳过',
          is_skipped: true,
          answered_at: new Date().toISOString(),
        })
        .eq('id', currentAnswer.id);

      const isLast = mockInterview.current_question >= mockInterview.total_questions;
      if (isLast) {
        await serviceClient.from('mock_interviews').update({ status: 'completed', completed_at: new Date().toISOString() }).eq('id', mockId);
        return NextResponse.json({ evaluation_text: '已跳过', is_last: true, next_question: null });
      }

      // Generate next question
      const nextQ = await generateNextQuestion(serviceClient, mockInterview, mockId);
      return NextResponse.json({ evaluation_text: '已跳过', is_last: false, next_question: nextQ });
    }

    // ── Stream evaluation via SSE ──
    const { data: typeData } = await supabase
      .from('question_types')
      .select('name')
      .eq('id', mockInterview.type_id)
      .single();

    const scoringPrompt = buildMockScoringPrompt({
      question: currentAnswer.question_text,
      answer: answerText,
      typeName: typeData?.name ?? '综合',
    });

    // Collect full text while streaming
    let fullEvaluationText = '';

    const stream = streamChatResponse(
      [{ role: 'user', content: scoringPrompt }],
      { model: 'sonnet', system: MOCK_SCORING_SYSTEM_PROMPT, maxTokens: 2048 }
    );

    const encoder = new TextEncoder();
    const readable = new ReadableStream({
      async start(controller) {
        try {
          for await (const chunk of stream) {
            fullEvaluationText += chunk;
            controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'text', content: chunk })}\n\n`));
          }

          // Parse score from the natural language output
          const score = parseScoreFromText(fullEvaluationText);
          const dimensions = parseDimensionsFromText(fullEvaluationText);
          const gapAnalysis = parseSectionFromText(fullEvaluationText, '差距分析');
          const perfectAnswer = parseSectionFromText(fullEvaluationText, '满分回答');
          const thinkingFramework = parseSectionFromText(fullEvaluationText, '回答思路');

          // Save to DB
          await serviceClient
            .from('interview_answers')
            .update({
              user_answer: answerText,
              score,
              gap_analysis: gapAnalysis || fullEvaluationText,
              perfect_answer: perfectAnswer,
              thinking_framework: thinkingFramework,
              dimensions: dimensions,
              is_skipped: false,
              answered_at: new Date().toISOString(),
            })
            .eq('id', currentAnswer.id);

          const isLast = mockInterview.current_question >= mockInterview.total_questions;

          if (isLast) {
            await serviceClient.from('mock_interviews').update({ status: 'completed', completed_at: new Date().toISOString() }).eq('id', mockId);
            triggerMethodologyUpdate(authenticatedUser.id, mockInterview.type_id).catch(() => {});
            controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'done', is_last: true, next_question: null, score })}\n\n`));
          } else {
            // Generate next question (non-streaming, fast)
            const nextQ = await generateNextQuestion(serviceClient, mockInterview, mockId);
            controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'done', is_last: false, next_question: nextQ, score })}\n\n`));
          }

          controller.close();
        } catch (err) {
          console.error('Stream error:', err);
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'error', message: '评分出错' })}\n\n`));
          controller.close();
        }
      },
    });

    return new Response(readable, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    });
  } catch (error) {
    console.error('Answer API error:', error);
    return NextResponse.json({ error: '服务器内部错误', code: 'INTERNAL_ERROR' }, { status: 500 });
  }
}

/** Parse score from natural language like "**得分：** 85分" */
function parseScoreFromText(text: string): number {
  const match = text.match(/得分[：:]\s*\*{0,2}\s*(\d+)\s*分/);
  if (match) return parseInt(match[1], 10);
  // Fallback: any number followed by 分
  const fallback = text.match(/(\d+)\s*分/);
  return fallback ? parseInt(fallback[1], 10) : 0;
}

/** Parse dimensions from text like "- 结构清晰度：80分 — 评价" */
function parseDimensionsFromText(text: string): { name: string; score: number; comment: string }[] | null {
  const dims: { name: string; score: number; comment: string }[] = [];
  const lines = text.split('\n');
  for (const line of lines) {
    const match = line.match(/[-•]\s*(.+?)[：:]\s*(\d+)\s*分\s*[—\-–]\s*(.+)/);
    if (match) {
      dims.push({ name: match[1].trim(), score: parseInt(match[2], 10), comment: match[3].trim() });
    }
  }
  return dims.length > 0 ? dims : null;
}

/** Parse a named section from the text */
function parseSectionFromText(text: string, sectionName: string): string {
  // Match "**差距分析：** content" or "**满分回答：** content"
  const regex = new RegExp(`\\*{0,2}${sectionName}[：:]\\*{0,2}\\s*([\\s\\S]*?)(?=\\*{2}(?:得分|差距|维度|回答|满分)|$)`, 'i');
  const match = text.match(regex);
  if (match) return match[1].trim();
  return '';
}

/** Generate next question */
async function generateNextQuestion(
  serviceClient: ReturnType<typeof createServiceClient>,
  mockInterview: { id: string; type_id: string; current_question: number; total_questions: number; jd_text: string | null; resume_text: string | null },
  mockId: string,
): Promise<{ number: number; text: string }> {
  const nextQuestionNumber = mockInterview.current_question + 1;
  const { data: typeData } = await serviceClient
    .from('question_types')
    .select('id, name')
    .eq('id', mockInterview.type_id)
    .single();

  const { data: previousAnswers } = await serviceClient
    .from('interview_answers')
    .select('question_text')
    .eq('mock_interview_id', mockId);

  const questionPrompt = buildMockQuestionPrompt({
    typeName: typeData?.name ?? '综合',
    jdText: mockInterview.jd_text,
    resumeText: mockInterview.resume_text,
    previousQuestions: previousAnswers?.map((a) => a.question_text) ?? [],
    questionNumber: nextQuestionNumber,
    totalQuestions: mockInterview.total_questions,
  });

  const nextQuestionText = await generateText(questionPrompt, {
    model: 'sonnet',
    system: MOCK_QUESTION_SYSTEM_PROMPT,
    maxTokens: 512,
  });

  await serviceClient.from('interview_answers').insert({
    mock_interview_id: mockId,
    question_number: nextQuestionNumber,
    question_text: nextQuestionText.trim(),
    question_type_id: mockInterview.type_id,
    is_skipped: false,
  });

  await serviceClient
    .from('mock_interviews')
    .update({ current_question: nextQuestionNumber })
    .eq('id', mockId);

  return { number: nextQuestionNumber, text: nextQuestionText.trim() };
}

async function triggerMethodologyUpdate(userId: string, typeId: string): Promise<void> {
  try {
    const { createClient } = await import('@/lib/supabase/server');
    const { generateOrUpdateMethodology } = await import('@/app/api/interview/methodology/route');
    const supabase = await createClient();
    await generateOrUpdateMethodology(supabase, userId, typeId);
  } catch {}
}
