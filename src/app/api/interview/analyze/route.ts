import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { generateText } from '@/lib/ai/claude';
import { classifyQuestion } from '@/lib/ai/classifier';
import { buildAnalysisPrompt, ANALYSIS_SYSTEM_PROMPT } from '@/lib/ai/prompts';
import type { AnalysisResult } from '@/types';

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
    const { question } = body as { question: string; session_id?: string };

    if (!question || question.trim().length < 5 || question.length > 5000) {
      return NextResponse.json(
        { error: '问题内容不能为空或超过5000字符', code: 'VALIDATION_ERROR' },
        { status: 400 }
      );
    }

    // 获取已有问题类型
    const { data: existingTypes } = await supabase.from('question_types').select('id, name');

    const types = existingTypes ?? [];

    // 分类问题
    const classifyResult = await classifyQuestion(question, types);

    let typeId: string;
    let isNew: boolean;

    if (classifyResult.isNew) {
      // 创建新类型
      const { data: newType, error: typeError } = await supabase
        .from('question_types')
        .insert({ name: classifyResult.typeName, is_seed: false, created_by: user.id })
        .select('id, name')
        .single();

      if (typeError || !newType) {
        return NextResponse.json(
          { error: '创建问题类型失败', code: 'INTERNAL_ERROR' },
          { status: 500 }
        );
      }
      typeId = newType.id;
      isNew = true;
    } else {
      const existing = types.find((t) => t.name === classifyResult.typeName);
      typeId = existing!.id;
      isNew = false;
    }

    // 调用 Sonnet 生成四部分分析
    const analysisPrompt = buildAnalysisPrompt(question);
    const analysisText = await generateText(analysisPrompt, {
      model: 'sonnet',
      system: ANALYSIS_SYSTEM_PROMPT,
      maxTokens: 4096,
    });

    // 解析四部分内容
    const sections = parseAnalysisSections(analysisText);

    // 保存面试问题
    const { data: questionRecord, error: questionError } = await supabase
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
      return NextResponse.json({ error: '保存问题失败', code: 'INTERNAL_ERROR' }, { status: 500 });
    }

    // 保存分析结果
    const { error: analysisError } = await supabase.from('question_analyses').insert({
      question_id: questionRecord.id,
      user_id: user.id,
      analysis: sections.analysis,
      thinking_framework: sections.thinking_framework,
      answer_approach: sections.answer_approach,
      answer_template: sections.answer_template,
    });

    if (analysisError) {
      return NextResponse.json({ error: '保存分析失败', code: 'INTERNAL_ERROR' }, { status: 500 });
    }

    // 获取类型名称
    const { data: typeData } = await supabase
      .from('question_types')
      .select('id, name')
      .eq('id', typeId)
      .single();

    const result: AnalysisResult = {
      question_id: questionRecord.id,
      type: { id: typeId, name: typeData?.name ?? classifyResult.typeName, is_new: isNew },
      analysis: sections.analysis,
      thinking_framework: sections.thinking_framework,
      answer_approach: sections.answer_approach,
      answer_template: sections.answer_template,
    };

    // 异步触发方法论更新（不阻塞响应）
    triggerMethodologyUpdate(user.id, typeId).catch(() => {
      // 静默失败，不影响主流程
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error('Analyze API error:', error);
    return NextResponse.json({ error: '服务器内部错误', code: 'INTERNAL_ERROR' }, { status: 500 });
  }
}

/**
 * 异步触发方法论更新
 */
async function triggerMethodologyUpdate(userId: string, typeId: string): Promise<void> {
  try {
    const { createClient } = await import('@/lib/supabase/server');
    const { generateOrUpdateMethodology } = await import('@/app/api/interview/methodology/route');
    const supabase = await createClient();
    await generateOrUpdateMethodology(supabase, userId, typeId);
  } catch {
    // 静默失败
  }
}

/**
 * 解析 AI 返回的四部分分析内容
 */
function parseAnalysisSections(text: string): {
  analysis: string;
  thinking_framework: string;
  answer_approach: string;
  answer_template: string;
} {
  const sections = {
    analysis: '',
    thinking_framework: '',
    answer_approach: '',
    answer_template: '',
  };

  // 尝试按标题拆分
  const analysisMatch = text.match(/##\s*问题分析\s*\n([\s\S]*?)(?=##\s*(?:思考方式|思考框架)|$)/i);
  const thinkingMatch = text.match(
    /##\s*(?:思考方式|思考框架)\s*\n([\s\S]*?)(?=##\s*(?:回答思路)|$)/i
  );
  const approachMatch = text.match(
    /##\s*回答思路\s*\n([\s\S]*?)(?=##\s*(?:口语化模板|面试回答模板)|$)/i
  );
  const templateMatch = text.match(/##\s*(?:口语化模板|面试回答模板)\s*\n([\s\S]*?)$/i);

  sections.analysis = analysisMatch?.[1]?.trim() ?? text;
  sections.thinking_framework = thinkingMatch?.[1]?.trim() ?? '';
  sections.answer_approach = approachMatch?.[1]?.trim() ?? '';
  sections.answer_template = templateMatch?.[1]?.trim() ?? '';

  // 如果解析失败，把全部内容放到 analysis
  if (!sections.thinking_framework && !sections.answer_approach && !sections.answer_template) {
    sections.analysis = text;
  }

  return sections;
}
