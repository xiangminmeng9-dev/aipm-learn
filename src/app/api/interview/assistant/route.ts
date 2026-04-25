import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { streamChatResponse, generateText } from '@/lib/ai/claude';
import {
  ASSISTANT_SYSTEM_PROMPT,
  ASSISTANT_SCORING_SYSTEM_PROMPT,
  buildAssistantScoringPrompt,
} from '@/lib/ai/prompts';
import { searchKnowledgeBase } from '@/lib/ai/knowledge-base';
import { getRealQuestionsContext } from '@/lib/ai/real-questions';

export const maxDuration = 60;

// POST /api/interview/assistant
export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: '未登录' }, { status: 401 });

  const body = await request.json();
  const { question, category, evaluate, record_id, user_answer } = body;

  // --- Evaluate mode ---
  if (evaluate && record_id && user_answer) {
    // Find the assistant_qa_record
    const { data: record } = await supabase
      .from('assistant_qa_records')
      .select('id, question, category')
      .eq('id', record_id)
      .eq('user_id', user.id)
      .single();

    if (!record) {
      return NextResponse.json({ error: '记录不存在' }, { status: 404 });
    }

    const scoringPrompt = buildAssistantScoringPrompt({
      question: record.question,
      answer: user_answer,
      category: record.category || 'AI产品思维',
    });

    const evaluationResult = await generateText(scoringPrompt, {
      system: ASSISTANT_SCORING_SYSTEM_PROMPT,
      maxTokens: 4096,
    });

    let evaluation;
    try {
      const raw = typeof evaluationResult === 'string' ? evaluationResult : JSON.stringify(evaluationResult);
      const jsonMatch = raw.match(/\{[\s\S]*\}/);
      evaluation = jsonMatch ? JSON.parse(jsonMatch[0]) : JSON.parse(raw);
    } catch {
      evaluation = {
        score: 0,
        dimensions: {
          '专业深度': { score: 0, comment: '评估解析失败' },
          '产品思维': { score: 0, comment: '评估解析失败' },
          '逻辑表达': { score: 0, comment: '评估解析失败' },
          '实战经验': { score: 0, comment: '评估解析失败' },
        },
        feedback: typeof evaluationResult === 'string' ? evaluationResult : '评估解析失败',
        key_points: [],
        gap_analysis: '',
        perfect_answer: '',
      };
    }

    // Update the record with evaluation
    await supabase
      .from('assistant_qa_records')
      .update({ evaluation })
      .eq('id', record_id)
      .eq('user_id', user.id);

    return NextResponse.json({ evaluation });
  }

  // --- Q&A mode ---
  if (!question) {
    return NextResponse.json({ error: '请输入问题' }, { status: 400 });
  }

  // 1. Knowledge base search
  const kbResults = searchKnowledgeBase(question, 3);
  const knowledgeContext = kbResults.length > 0
    ? '\n\n【知识库参考】\n' + kbResults.map((entry, i) => `${i + 1}. ${entry.title}\n${entry.content}`).join('\n\n')
    : '';

  // 2. Real questions context
  const realQuestionsContext = getRealQuestionsContext(category || '', 3);

  // 3. Memory context from assistant_qa_records
  let memoryContext = '';
  {
    const { data: recentRecords } = await supabase
      .from('assistant_qa_records')
      .select('question, answer, created_at')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(5);

    if (recentRecords && recentRecords.length > 0) {
      memoryContext = '\n\n【对话记忆】\n' +
        recentRecords.map((r, i) => {
          return `${i + 1}. 问：${r.question}\n答：${(r.answer || '').substring(0, 200)}...`;
        }).join('\n\n');
    }
  }

  const systemPrompt = ASSISTANT_SYSTEM_PROMPT + knowledgeContext + realQuestionsContext + memoryContext;

  // Create assistant_qa_record FIRST (before streaming)
  const { data: newRecord, error: insertError } = await supabase
    .from('assistant_qa_records')
    .insert({
      user_id: user.id,
      question: question.trim(),
      category: category || null,
      answer: '', // will be updated after streaming
    })
    .select('id')
    .single();

  if (insertError || !newRecord) {
    console.error('Create assistant record error:', insertError);
    return NextResponse.json({ error: '创建记录失败' }, { status: 500 });
  }

  const recordId = newRecord.id;

  // Stream response
  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      let fullAnswer = '';
      try {
        // Send record_id first
        controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'record_id', record_id: recordId })}\n\n`));

        for await (const chunk of streamChatResponse(
          [{ role: 'user', content: question }],
          { system: systemPrompt },
        )) {
          fullAnswer += chunk;
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'chunk', content: chunk })}\n\n`));
        }

        // Update the record with full answer
        await supabase
          .from('assistant_qa_records')
          .update({ answer: fullAnswer })
          .eq('id', recordId);

        // Also save to question_analyses for methodology/stats integration
        try {
          // Find or create interview_question
          let questionId: string | null = null;
          if (category) {
            const { data: typeData } = await supabase
              .from('question_types')
              .select('id')
              .eq('name', category)
              .single();
            if (typeData) {
              const { data: existingQ } = await supabase
                .from('interview_questions')
                .select('id')
                .eq('user_id', user.id)
                .eq('text', question.trim())
                .limit(1);
              if (existingQ && existingQ.length > 0) {
                questionId = existingQ[0].id;
              } else {
                const { data: newQ } = await supabase
                  .from('interview_questions')
                  .insert({ user_id: user.id, text: question.trim(), source: 'user_input', type_id: typeData.id })
                  .select('id')
                  .single();
                questionId = newQ?.id;
              }

              if (questionId) {
                await supabase.from('question_analyses').insert({
                  user_id: user.id,
                  question_id: questionId,
                  analysis: fullAnswer,
                });

                // Trigger methodology update
                const { generateOrUpdateMethodology } = await import('@/app/api/interview/methodology/route');
                await generateOrUpdateMethodology(supabase, user.id, typeData.id);
              }
            }
          }
        } catch { /* non-blocking */ }

        controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'done' })}\n\n`));
      } catch (err) {
        console.error('Stream error:', err);
        controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'error', error: 'AI 服务异常' })}\n\n`));
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: { 'Content-Type': 'text/event-stream', 'Cache-Control': 'no-cache', Connection: 'keep-alive' },
  });
}