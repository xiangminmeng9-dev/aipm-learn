import { generateText } from '@/lib/ai/claude';
import { buildPlainTranslationPrompt, PLAIN_TRANSLATION_SYSTEM_PROMPT } from '@/lib/ai/prompts';
import type { PlainTranslation } from '@/types';

export async function translateToPlainLanguage(
  title: string,
  content: string,
  category: 'ai_tech' | 'ai_pm',
): Promise<PlainTranslation | null> {
  try {
    const prompt = buildPlainTranslationPrompt({ title, content, category });
    const result = await generateText(prompt, { system: PLAIN_TRANSLATION_SYSTEM_PROMPT });

    let parsed: PlainTranslation;
    if (typeof result === 'string') {
      try {
        parsed = JSON.parse(result);
      } catch {
        // If not valid JSON, construct from text
        parsed = {
          summary: result.slice(0, 100),
          explanation: result,
          impact: '',
          tags: [],
        };
      }
    } else {
      parsed = result as PlainTranslation;
    }

    return parsed;
  } catch (err) {
    console.error('Translation failed:', err);
    return null;
  }
}
