import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { generateText } from '@/lib/ai/claude';
import {
  buildDevFlowPrompt,
  DEV_FLOW_SYSTEM_PROMPT,
  buildCodingMethodologyPrompt,
  CODING_METHODOLOGY_SYSTEM_PROMPT,
} from '@/lib/ai/prompts';

export async function GET() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: '未登录', code: 'UNAUTHORIZED' }, { status: 401 });
    }

    // 获取用户最近一次开发流程
    const { data: latestFlow } = await supabase
      .from('dev_flows')
      .select('id, question_text, mode_id, clarification, breakdown, steps, notes, created_at, dev_modes(id, name, description, slug, sort_order)')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (!latestFlow) {
      return NextResponse.json({ result: null });
    }

    const mode = latestFlow.dev_modes as unknown as {
      id: string; name: string; description: string; slug: string; sort_order: number;
    } | null;

    return NextResponse.json({
      result: {
        id: latestFlow.id,
        question_text: latestFlow.question_text,
        mode: mode ?? { id: latestFlow.mode_id, name: '未知', description: '', slug: '', sort_order: 0 },
        clarification: latestFlow.clarification,
        breakdown: latestFlow.breakdown,
        steps: latestFlow.steps,
        notes: latestFlow.notes,
        created_at: latestFlow.created_at,
      },
    });
  } catch (error) {
    console.error('Get latest flow API error:', error);
    return NextResponse.json({ error: '服务器内部错误', code: 'INTERNAL_ERROR' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: '未登录', code: 'UNAUTHORIZED' }, { status: 401 });
    }

    const body = await request.json();
    const { question, mode_id } = body as { question: string; mode_id: string };

    if (!question || question.trim().length < 5 || question.length > 5000) {
      return NextResponse.json(
        { error: '题目内容不能为空或超过5000字符', code: 'VALIDATION_ERROR' },
        { status: 400 }
      );
    }

    if (!mode_id) {
      return NextResponse.json(
        { error: '请选择开发模式', code: 'VALIDATION_ERROR' },
        { status: 400 }
      );
    }

    // 获取开发模式
    const { data: mode } = await supabase.from('dev_modes').select('*').eq('id', mode_id).single();
    if (!mode) {
      return NextResponse.json({ error: '开发模式不存在', code: 'NOT_FOUND' }, { status: 404 });
    }

    // 调用 Claude 生成开发流程
    const prompt = buildDevFlowPrompt(question.trim(), mode.name, mode.description);
    const result = await generateText(prompt, {
      model: 'sonnet',
      system: DEV_FLOW_SYSTEM_PROMPT,
      maxTokens: 2048,
    });

    // 解析四部分内容
    const sections = parseDevFlowSections(result);

    // 保存到数据库
    const { data: flow, error: flowError } = await supabase
      .from('dev_flows')
      .insert({
        user_id: user.id,
        question_text: question.trim(),
        mode_id,
        clarification: sections.clarification,
        breakdown: sections.breakdown,
        steps: sections.steps,
        notes: sections.notes,
      })
      .select('id, created_at')
      .single();

    if (flowError || !flow) {
      return NextResponse.json(
        { error: '保存开发流程失败', code: 'INTERNAL_ERROR' },
        { status: 500 }
      );
    }

    // 异步触发方法论更新
    triggerCodingMethodologyUpdate(user.id).catch(() => {});

    return NextResponse.json({
      id: flow.id,
      question_text: question.trim(),
      mode,
      clarification: sections.clarification,
      breakdown: sections.breakdown,
      steps: sections.steps,
      notes: sections.notes,
      created_at: flow.created_at,
    });
  } catch (error) {
    console.error('Generate flow API error:', error);
    return NextResponse.json({ error: '服务器内部错误', code: 'INTERNAL_ERROR' }, { status: 500 });
  }
}

function parseDevFlowSections(text: string) {
  const sections = { clarification: '', breakdown: '', steps: '', notes: '' };

  const clarifyMatch = text.match(/##\s*澄清问题\s*\n([\s\S]*?)(?=##\s*(?:需求拆解)|$)/i);
  const breakdownMatch = text.match(/##\s*需求拆解\s*\n([\s\S]*?)(?=##\s*(?:开发步骤)|$)/i);
  const stepsMatch = text.match(/##\s*开发步骤\s*\n([\s\S]*?)(?=##\s*(?:重点关注|注意事项)|$)/i);
  const notesMatch = text.match(/##\s*(?:重点关注事项|注意事项)\s*\n([\s\S]*?)$/i);

  sections.clarification = clarifyMatch?.[1]?.trim() ?? '';
  sections.breakdown = breakdownMatch?.[1]?.trim() ?? '';
  sections.steps = stepsMatch?.[1]?.trim() ?? '';
  sections.notes = notesMatch?.[1]?.trim() ?? '';

  if (!sections.clarification && !sections.breakdown && !sections.steps && !sections.notes) {
    sections.clarification = text;
  }

  return sections;
}

async function triggerCodingMethodologyUpdate(userId: string): Promise<void> {
  try {
    const { createClient } = await import('@/lib/supabase/server');
    const { generateText } = await import('@/lib/ai/claude');
    const { buildCodingMethodologyPrompt, CODING_METHODOLOGY_SYSTEM_PROMPT } =
      await import('@/lib/ai/prompts');
    const supabase = await createClient();

    // 获取用户所有开发流程
    const { data: flows } = await supabase
      .from('dev_flows')
      .select('question_text, clarification, breakdown, steps, notes, dev_modes(name)')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (!flows || flows.length < 3) return;

    const flowsForPrompt = flows.map((f) => ({
      question_text: f.question_text,
      mode_name: (f.dev_modes as unknown as { name: string })?.name ?? '未知',
      clarification: f.clarification,
      breakdown: f.breakdown,
      steps: f.steps,
      notes: f.notes,
    }));

    const prompt = buildCodingMethodologyPrompt(flowsForPrompt);
    const result = await generateText(prompt, {
      model: 'sonnet',
      system: CODING_METHODOLOGY_SYSTEM_PROMPT,
      maxTokens: 2048,
    });

    let methodology;
    try {
      methodology = JSON.parse(result.trim());
    } catch {
      methodology = {
        high_freq_questions: [],
        common_breakdowns: [],
        cross_mode_steps: [result.trim()],
        key_notes: [],
      };
    }

    // Upsert 方法论
    const { data: existing } = await supabase
      .from('coding_methodologies')
      .select('id, source_count')
      .eq('user_id', userId)
      .single();

    if (existing) {
      if (flows.length > existing.source_count) {
        await supabase
          .from('coding_methodologies')
          .update({
            high_freq_questions: methodology.high_freq_questions,
            common_breakdowns: methodology.common_breakdowns,
            cross_mode_steps: methodology.cross_mode_steps,
            key_notes: methodology.key_notes,
            source_count: flows.length,
            updated_at: new Date().toISOString(),
          })
          .eq('id', existing.id);
      }
    } else {
      await supabase.from('coding_methodologies').insert({
        user_id: userId,
        high_freq_questions: methodology.high_freq_questions,
        common_breakdowns: methodology.common_breakdowns,
        cross_mode_steps: methodology.cross_mode_steps,
        key_notes: methodology.key_notes,
        source_count: flows.length,
      });
    }
  } catch {
    // 静默失败
  }
}
