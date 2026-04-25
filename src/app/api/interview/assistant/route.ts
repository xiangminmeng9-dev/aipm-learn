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

  // --- Evaluate mode: 4-dimension scoring ---
  if (evaluate && record_id && user_answer) {
    const { data: analysis } = await supabase
      .from('question_analyses')
      .select('id, question_id')
      .eq('id', record_id)
      .eq('user_id', user.id)
      .single();

    if (!analysis) {
      return NextResponse.json({ error: '记录不存在' }, { status: 404 });
    }

    const { data: iq } = await supabase
      .from('interview_questions')
      .select('text, type_id')
      .eq('id', analysis.question_id)
      .single();

    let questionCategory = category || 'AI产品思维';
    if (iq?.type_id) {
      const { data: typeData } = await supabase
        .from('question_types')
        .select('name')
        .eq('id', iq.type_id)
        .single();
      if (typeData) questionCategory = typeData.name;
    }

    const scoringPrompt = buildAssistantScoringPrompt({
      question: iq?.text || question,
      answer: user_answer,
      category: questionCategory,
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

    // Store evaluation
    await supabase
      .from('question_analyses')
      .update({
        answer_approach: JSON.stringify({ user_answer, evaluation }),
      })
      .eq('id', record_id)
      .eq('user_id', user.id);

    return NextResponse.json({ evaluation });
  }

  // --- Q&A mode: structured analysis with streaming ---
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

  // 3. Memory context
  let memoryContext = '';
  {
    const { data: recentAnalyses } = await supabase
      .from('question_analyses')
      .select('question_id, analysis, created_at')
      .eq('user_id', user.id)
      .eq('source', 'assistant')
      .order('created_at', { ascending: false })
      .limit(5);

    if (recentAnalyses && recentAnalyses.length > 0) {
      const qIds = recentAnalyses.map(a => a.question_id);
      const { data: recentQs } = await supabase
        .from('interview_questions')
        .select('id, text')
        .in('id', qIds);

      const qMap = new Map((recentQs || []).map(q => [q.id, q.text]));
      memoryContext = '\n\n【对话记忆】\n' +
        recentAnalyses.map((a, i) => {
          const qText = qMap.get(a.question_id) || '';
          return `${i + 1}. 问：${qText}\n答：${(a.analysis || '').substring(0, 200)}...`;
        }).join('\n\n');
    }
  }

  // Build system prompt
  const systemPrompt = ASSISTANT_SYSTEM_PROMPT + knowledgeContext + realQuestionsContext + memoryContext;

  // Find or create interview_question
  let questionId: string;
  let typeId: string | null = null;

  if (category) {
    const { data: typeData } = await supabase
      .from('question_types')
      .select('id')
      .eq('name', category)
      .single();
    typeId = typeData?.id || null;
  }

  const { data: existingQ } = await supabase
    .from('interview_questions')
    .select('id')
    .eq('user_id', user.id)
    .eq('text', question)
    .limit(1);

  if (existingQ && existingQ.length > 0) {
    questionId = existingQ[0].id;
  } else {
    const insertData: Record<string, unknown> = { user_id: user.id, text: question, source: 'assistant' };
    if (typeId) insertData.type_id = typeId;
    const { data: newQ } = await supabase.from('interview_questions').insert(insertData).select('id').single();
    questionId = newQ?.id || '';
  }

  // Create analysis record — mark source as 'assistant' to distinguish from QA
  const { data: newAnalysis } = await supabase
    .from('question_analyses')
    .insert({ user_id: user.id, question_id: questionId, analysis: '' })
    .select('id')
    .single();

  const newRecordId = newAnalysis?.id;

  if (!newRecordId) {
    return NextResponse.json({ error: '创建记录失败' }, { status: 500 });
  }

  // Stream response
  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      let fullAnswer = '';
      try {
        // Send record_id first — this is critical for evaluation
        controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'record_id', record_id: newRecordId })}\n\n`));

        for await (const chunk of streamChatResponse(
          [{ role: 'user', content: question }],
          { system: systemPrompt },
        )) {
          fullAnswer += chunk;
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'chunk', content: chunk })}\n\n`));
        }

        // Update analysis record
        await supabase.from('question_analyses').update({ analysis: fullAnswer }).eq('id', newRecordId);

        // Trigger methodology update
        if (typeId) {
          try {
            const { generateOrUpdateMethodology } = await import('@/app/api/interview/methodology/route');
            await generateOrUpdateMethodology(supabase, user.id, typeId);
          } catch { /* non-blocking */ }
        }

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