import { createClient } from '@/lib/supabase/server';
import { generateText } from '@/lib/ai/claude';
import { buildCompetitiveMethodologyPrompt, COMPETITIVE_METHODOLOGY_SYSTEM_PROMPT } from '@/lib/ai/prompts';

export const MIN_COMPETITIVE_ANALYSES = 3;

function parseCompetitiveMethodology(text: string) {
  try {
    return JSON.parse(text);
  } catch {
    return {
      framework: text,
      key_steps: [] as string[],
      typical_cases: [] as string[],
      common_pitfalls: [] as string[],
      scoring_insights: [] as string[],
    };
  }
}

export async function generateOrUpdateCompetitiveMethodology(
  supabase: ReturnType<typeof createClient> extends Promise<infer T> ? T : never,
  userId: string
): Promise<void> {
  const { data: analyses } = await supabase
    .from('competitive_analyses')
    .select('product_name, market_position, feature_comparison, strengths_weaknesses, differentiation_strategy, total_score, dimension_scores')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(20);

  const history = analyses ?? [];
  if (history.length < MIN_COMPETITIVE_ANALYSES) return;

  const prompt = buildCompetitiveMethodologyPrompt(history as Parameters<typeof buildCompetitiveMethodologyPrompt>[0]);

  const result = await generateText(prompt, {
    model: 'sonnet',
    system: COMPETITIVE_METHODOLOGY_SYSTEM_PROMPT,
    maxTokens: 4096,
  });

  const methodology = parseCompetitiveMethodology(result.trim());

  const { data: existing } = await supabase
    .from('competitive_methodologies')
    .select('id, source_count')
    .eq('user_id', userId)
    .single();

  if (existing) {
    if (history.length > existing.source_count) {
      await supabase
        .from('competitive_methodologies')
        .update({
          framework: methodology.framework ?? '',
          key_steps: methodology.key_steps ?? [],
          typical_cases: methodology.typical_cases ?? [],
          common_pitfalls: methodology.common_pitfalls ?? [],
          scoring_insights: methodology.scoring_insights ?? [],
          source_count: history.length,
          updated_at: new Date().toISOString(),
        })
        .eq('id', existing.id);
    }
  } else {
    await supabase.from('competitive_methodologies').insert({
      user_id: userId,
      framework: methodology.framework ?? '',
      key_steps: methodology.key_steps ?? [],
      typical_cases: methodology.typical_cases ?? [],
      common_pitfalls: methodology.common_pitfalls ?? [],
      scoring_insights: methodology.scoring_insights ?? [],
      source_count: history.length,
    });
  }
}
