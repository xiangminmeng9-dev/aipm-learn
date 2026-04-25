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
    // record_id is a question_analyses id
    const { data: analysis } = await supabase
      .from('question_analyses')
      .select('id, question_id')
      .eq('id', record_id)
      .eq('user_id', user.id)
      .single();

    if (!analysis) {
      return NextResponse.json({ error: '记录不存在' }, { status: 404 });
    }

    // Get the question text
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

    // Store evaluation in the analysis record (using answer_approach field as evaluation storage)
    // since question_analyses doesn't have an evaluation column
    await supabase
      .from('question_analyses')
      .update({
        answer_approach: JSON.stringify({ user_answer, evaluation }),
      })
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
    ? '\n\n【知识库参考】\n以下是相关知识条目，请参考这些内容来回答：\n' +
      kbResults.map((entry, i) =>
        `${i + 1}. ${entry.title}\n${entry.content}`
      ).join('\n\n')
    : '';

  // 2. Real questions context
  const realQuestionsContext = getRealQuestionsContext(category || '', 3);

  // 3. Memory context: recent analyses
  let memoryContext = '';
  {
    const { data: recentAnalyses } = await supabase
      .from('question_analyses')
      .select('question_id, analysis, created_at')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(5);

    if (recentAnalyses && recentAnalyses.length > 0) {
      const qIds = recentAnalyses.map(a => a.question_id);
      const { data: recentQs } = await supabase
        .from('interview_questions')
        .select('id, text')
        .in('id', qIds);

      const qMap = new Map((recentQs || []).map(q => [q.id, q.text]));

      memoryContext = '\n\n【对话记忆】\n以下是该用户最近的问答记录，请参考这些历史来保持对话连贯性：\n' +
        recentAnalyses.map((a, i) => {
          const qText = qMap.get(a.question_id) || '';
          return `${i + 1}. 问：${qText}\n答：${(a.analysis || '').substring(0, 200)}...`;
        }).join('\n\n');
    }
  }

  // 4. Methodology context
  let methodologyContext = '';
  if (category) {
    const { data: typeData } = await supabase
      .from('question_types')
      .select('id')
      .eq('name', category)
      .single();

    if (typeData) {
      const { data: methodology } = await supabase
        .from('interview_methodologies')
        .select('framework, key_steps, typical_cases')
        .eq('type_id', typeData.id)
        .eq('user_id', user.id)
        .single();

      if (methodology) {
        methodologyContext = `\n\n【该类型的方法论】\n核心框架：${methodology.framework}\n关键步骤：${(methodology.key_steps as string[]).join('、')}\n典型案例：${(methodology.typical_cases as string[]).join('、')}\n请参考以上方法论指导候选人，帮助其运用框架和步骤组织回答。`;
      }
    }
  }

  // Build system prompt
  const systemPrompt = ASSISTANT_SYSTEM_PROMPT + knowledgeContext + realQuestionsContext + memoryContext + methodologyContext;

  // Find or create the interview_question
  let questionId: string;
  let typeId: string | null = null;

  // Resolve category to type_id
  if (category) {
    const { data: typeData } = await supabase
      .from('question_types')
      .select('id')
      .eq('name', category)
      .single();
    typeId = typeData?.id || null;
  }

  // Check if this question already exists for this user
  const { data: existingQ } = await supabase
    .from('interview_questions')
    .select('id')
    .eq('user_id', user.id)
    .eq('text', question)
    .limit(1);

  if (existingQ && existingQ.length > 0) {
    questionId = existingQ[0].id;
  } else {
    const insertData: Record<string, unknown> = {
      user_id: user.id,
      text: question,
      source: 'user_input',
    };
    if (typeId) insertData.type_id = typeId;

    const { data: newQ } = await supabase
      .from('interview_questions')
      .insert(insertData)
      .select('id')
      .single();

    questionId = newQ?.id || '';
  }

  // Create a placeholder analysis record
  const { data: newAnalysis } = await supabase
    .from('question_analyses')
    .insert({
      user_id: user.id,
      question_id: questionId,
      analysis: '',
    })
    .select('id')
    .single();

  const newRecordId = newAnalysis?.id;

  // Stream the response
  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      let fullAnswer = '';
      try {
        for await (const chunk of streamChatResponse(
          [{ role: 'user', content: question }],
          { system: systemPrompt },
        )) {
          fullAnswer += chunk;
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'chunk', content: chunk })}\n\n`));
        }

        if (newRecordId) {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'record_id', record_id: newRecordId })}\n\n`));
        }

        // Update analysis record with full answer
        if (newRecordId) {
          await supabase
            .from('question_analyses')
            .update({ analysis: fullAnswer })
            .eq('id', newRecordId);
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
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
    },
  });
}