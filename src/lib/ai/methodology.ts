import { createClient } from '@/lib/supabase/server';
import { generateText } from '@/lib/ai/claude';
import { buildMethodologyPrompt, METHODOLOGY_SYSTEM_PROMPT } from '@/lib/ai/prompts';

export const MIN_SOURCE_COUNT = 3;

function parseMarkdownMethodology(text: string): {
  framework: string;
  key_steps: string[];
  typical_cases: string[];
} {
  const sections = text.split(/^## /m).filter(Boolean);

  let framework = text;
  const keySteps: string[] = [];
  const typicalCases: string[] = [];

  for (const section of sections) {
    const lower = section.toLowerCase();
    const content = section.replace(/^[^\n]*\n?/, '').trim();

    if (lower.startsWith('核心框架')) {
      framework = content;
    } else if (lower.startsWith('关键步骤')) {
      keySteps.push(
        ...content
          .split('\n')
          .map((l) => l.replace(/^\s*(?:\d+\.|[-*])\s*/, '').trim())
          .filter(Boolean)
      );
    } else if (lower.startsWith('典型案例')) {
      typicalCases.push(
        ...content
          .split('\n')
          .map((l) => l.replace(/^\s*(?:\d+\.|[-*])\s*/, '').trim())
          .filter(Boolean)
      );
    }
  }

  return { framework, key_steps: keySteps, typical_cases: typicalCases };
}

export async function generateOrUpdateMethodology(
  supabase: ReturnType<typeof createClient> extends Promise<infer T> ? T : never,
  userId: string,
  typeId: string
): Promise<void> {
  const { data: analyses } = await supabase
    .from('question_analyses')
    .select('analysis, thinking_framework, answer_approach, interview_questions(text, type_id)')
    .eq('user_id', userId)
    .eq('interview_questions.type_id', typeId);

  const qaHistory = (analyses ?? [])
    .filter((a) => a.interview_questions)
    .map((a) => ({
      question: (a.interview_questions as unknown as { text: string }).text,
      analysis: a.analysis,
      thinking_framework: a.thinking_framework,
      answer_approach: a.answer_approach,
    }));

  if (qaHistory.length < MIN_SOURCE_COUNT) {
    return;
  }

  const { data: typeData } = await supabase
    .from('question_types')
    .select('name')
    .eq('id', typeId)
    .single();

  const prompt = buildMethodologyPrompt({
    typeName: typeData?.name ?? '综合',
    qaHistory,
  });

  const result = await generateText(prompt, {
    model: 'sonnet',
    system: METHODOLOGY_SYSTEM_PROMPT,
    maxTokens: 2048,
  });

  const text = result.trim();
  let methodology;

  try {
    const parsed = JSON.parse(text);
    methodology = {
      framework: parsed.framework ?? text,
      key_steps: parsed.key_steps ?? [],
      typical_cases: parsed.typical_cases ?? [],
    };
  } catch {
    methodology = parseMarkdownMethodology(text);
  }

  const { data: existing } = await supabase
    .from('interview_methodologies')
    .select('id, source_count')
    .eq('user_id', userId)
    .eq('type_id', typeId)
    .single();

  if (existing) {
    if (qaHistory.length > existing.source_count) {
      await supabase
        .from('interview_methodologies')
        .update({
          framework: methodology.framework,
          key_steps: methodology.key_steps,
          typical_cases: methodology.typical_cases,
          source_count: qaHistory.length,
          updated_at: new Date().toISOString(),
        })
        .eq('id', existing.id);
    }
  } else {
    await supabase.from('interview_methodologies').insert({
      user_id: userId,
      type_id: typeId,
      framework: methodology.framework,
      key_steps: methodology.key_steps,
      typical_cases: methodology.typical_cases,
      source_count: qaHistory.length,
    });
  }
}
