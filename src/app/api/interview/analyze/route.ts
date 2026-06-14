import { NextRequest, NextResponse } from 'next/server';
import { createClient, createServiceClient } from '@/lib/supabase/server';
import { generateText, streamChatResponse } from '@/lib/ai/claude';
import { classifyQuestion } from '@/lib/ai/classifier';
import { buildAnalysisPrompt, ANALYSIS_SYSTEM_PROMPT } from '@/lib/ai/prompts';
import { searchWithTavily, formatSearchForUserMessage } from '@/lib/ai/tavily-search';
import { validateBody, analyzeSchema } from '@/lib/validations';

export const maxDuration = 60;

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const serviceClient = createServiceClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: '未登录' }, { status: 401 });

  const body = await request.json();
  const validation = validateBody(analyzeSchema, body);
  if (!validation.success) {
    return NextResponse.json({ error: validation.error }, { status: 400 });
  }
  const { question, session_id } = validation.data;

  // 1. Classify question (fast, uses haiku)
  const { data: existingTypes } = await supabase.from('question_types').select('id, name');
  const types = existingTypes ?? [];
  let typeId: string;
  let isNew: boolean;
  let typeName: string;

  try {
    const classifyResult = await classifyQuestion(question, types);
    typeName = classifyResult.typeName;

    if (classifyResult.isNew) {
      const { data: newType, error: typeError } = await supabase
        .from('question_types')
        .insert({ name: classifyResult.typeName, is_seed: false, created_by: user.id })
        .select('id, name')
        .single();

      if (typeError || !newType) {
        return NextResponse.json({ error: '创建问题类型失败' }, { status: 500 });
      }
      typeId = newType.id;
      isNew = true;
    } else {
      const existing = types.find((t) => t.name === classifyResult.typeName);
      typeId = existing!.id;
      isNew = false;
    }
  } catch {
    // Fallback: use first type or create "通用" type
    if (types.length > 0) {
      typeId = types[0].id;
      typeName = types[0].name;
      isNew = false;
    } else {
      const { data: newType } = await supabase
        .from('question_types')
        .insert({ name: '通用', is_seed: false, created_by: user.id })
        .select('id, name')
        .single();
      typeId = newType!.id;
      typeName = '通用';
      isNew = true;
    }
  }

  // 2. Save question record first
  const { data: questionRecord, error: questionError } = await serviceClient
    .from('interview_questions')
    .insert({
      text: question.trim(),
      type_id: typeId,
      source: 'user_input',
      user_id: user.id,
    })
    .select('id')
    .single();

  if (questionError || !questionRecord) {
    return NextResponse.json({ error: '保存问题失败' }, { status: 500 });
  }

  // 3. Tavily search for up-to-date information (注入 user message)
  const searchResponse = await searchWithTavily(question);
  const searchUserContext = formatSearchForUserMessage(searchResponse);
  const systemPrompt = ANALYSIS_SYSTEM_PROMPT;

  // 4. Stream the analysis via SSE
  const analysisPrompt = buildAnalysisPrompt(question) + searchUserContext;
  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      let fullAnswer = '';
      try {
        // Send metadata first
        controller.enqueue(encoder.encode(`data: ${JSON.stringify({
          type: 'metadata',
          question_id: questionRecord.id,
          question_type: { id: typeId, name: typeName, is_new: isNew },
        })}\n\n`));

        // Send search results if available
        if (searchResponse.results.length > 0) {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({
            type: 'search_results',
            results: searchResponse.results.map(r => ({ title: r.title, url: r.url })),
          })}\n\n`));
        }

        for await (const chunk of streamChatResponse(
          [{ role: 'user', content: analysisPrompt }],
          { system: systemPrompt, maxTokens: 4096 },
        )) {
          fullAnswer += chunk;
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'chunk', content: chunk })}\n\n`));
        }

        // Parse sections and save
        const sections = parseAnalysisSections(fullAnswer);

        const { error: insertError } = await serviceClient.from('question_analyses').insert({
          question_id: questionRecord.id,
          user_id: user.id,
          analysis: sections.analysis,
          thinking_framework: sections.thinking_framework,
          answer_approach: sections.answer_approach,
          answer_template: sections.answer_template,
        });

        if (insertError) {
          console.error('Failed to save analysis:', insertError);
        }

        // Send parsed sections
        controller.enqueue(encoder.encode(`data: ${JSON.stringify({
          type: 'sections',
          sections,
        })}\n\n`));

        // Trigger methodology update + achievement check (non-blocking)
        triggerMethodologyUpdate(user.id, typeId).catch(() => {});
        fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/user/achievements`, { method: 'POST' }).catch(() => {});

        controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'done' })}\n\n`));
      } catch (err) {
        console.error('Analyze stream error:', err);
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

// GET: return last analysis for the user
export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({});

    const { data: lastAnalysis } = await supabase
      .from('question_analyses')
      .select('id, question_id, analysis, thinking_framework, answer_approach, answer_template, created_at')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (!lastAnalysis) return NextResponse.json({});

    const { data: questionData } = await supabase
      .from('interview_questions')
      .select('id, text, type_id')
      .eq('id', lastAnalysis.question_id)
      .single();

    let typeName = '通用';
    if (questionData?.type_id) {
      const { data: typeData } = await supabase
        .from('question_types')
        .select('name')
        .eq('id', questionData.type_id)
        .single();
      if (typeData) typeName = typeData.name;
    }

    return NextResponse.json({
      question_text: questionData?.text ?? '',
      result: {
        question_id: lastAnalysis.question_id,
        type: { id: questionData?.type_id ?? '', name: typeName, is_new: false },
        analysis: lastAnalysis.analysis,
        thinking_framework: lastAnalysis.thinking_framework,
        answer_approach: lastAnalysis.answer_approach,
        answer_template: lastAnalysis.answer_template,
      },
    });
  } catch {
    return NextResponse.json({});
  }
}

async function triggerMethodologyUpdate(userId: string, typeId: string): Promise<void> {
  try {
    const { createClient } = await import('@/lib/supabase/server');
    const { generateOrUpdateMethodology } = await import('@/lib/ai/methodology');
    const supabase = await createClient();
    await generateOrUpdateMethodology(supabase, userId, typeId);
  } catch { /* non-blocking */ }
}

function parseAnalysisSections(text: string): {
  analysis: string;
  thinking_framework: string;
  answer_approach: string;
  answer_template: string;
} {
  const sections = { analysis: '', thinking_framework: '', answer_approach: '', answer_template: '' };

  const analysisMatch = text.match(/##\s*问题分析\s*\n([\s\S]*?)(?=##\s*(?:思考方式|思考框架)|$)/i);
  const thinkingMatch = text.match(/##\s*(?:思考方式|思考框架)\s*\n([\s\S]*?)(?=##\s*(?:回答思路)|$)/i);
  const approachMatch = text.match(/##\s*回答思路\s*\n([\s\S]*?)(?=##\s*(?:口语化模板|面试回答模板)|$)/i);
  const templateMatch = text.match(/##\s*(?:口语化模板|面试回答模板)\s*\n([\s\S]*?)$/i);

  sections.analysis = analysisMatch?.[1]?.trim() ?? text;
  sections.thinking_framework = thinkingMatch?.[1]?.trim() ?? '';
  sections.answer_approach = approachMatch?.[1]?.trim() ?? '';
  sections.answer_template = templateMatch?.[1]?.trim() ?? '';

  if (!sections.thinking_framework && !sections.answer_approach && !sections.answer_template) {
    sections.analysis = text;
  }

  return sections;
}
