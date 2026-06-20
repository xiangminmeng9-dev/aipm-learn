// Skill name/description translation service — server-side only
// Batch-translates English skill names & descriptions to Chinese using AI,
// with in-memory cache (24h TTL) to avoid repeated calls.

import { generateText } from '@/lib/ai/claude';
import {
  buildSkillTranslationPrompt,
  SKILL_TRANSLATION_SYSTEM_PROMPT,
} from '@/lib/ai/prompts';
import type { UnifiedSkill } from '@/types/workshop';

// ── Cache ────────────────────────────────────────────────────────────

interface CachedTranslation {
  nameZh: string;
  descriptionZh: string;
  expires: number;
}

const translationCache = new Map<string, CachedTranslation>();
const CACHE_TTL = 24 * 60 * 60 * 1000; // 24 hours

function getCached(key: string): CachedTranslation | null {
  const entry = translationCache.get(key);
  if (entry && entry.expires > Date.now()) return entry;
  translationCache.delete(key);
  return null;
}

function setCache(key: string, data: CachedTranslation) {
  translationCache.set(key, { ...data, expires: Date.now() + CACHE_TTL });
}

// ── Translate ────────────────────────────────────────────────────────

export async function translateSkills(
  skills: UnifiedSkill[],
): Promise<UnifiedSkill[]> {
  if (skills.length === 0) return skills;

  // Separate cached vs uncached
  const result: UnifiedSkill[] = [];
  const toTranslate: UnifiedSkill[] = [];

  for (const skill of skills) {
    const cacheKey = `translate:${skill.platform}:${skill.slug}`;
    const cached = getCached(cacheKey);
    if (cached) {
      result.push({ ...skill, nameZh: cached.nameZh, descriptionZh: cached.descriptionZh });
    } else {
      toTranslate.push(skill);
    }
  }

  // All cached — return immediately
  if (toTranslate.length === 0) return result;

  // Batch translate uncached skills (max 20 per AI call)
  const BATCH_SIZE = 20;
  for (let i = 0; i < toTranslate.length; i += BATCH_SIZE) {
    const batch = toTranslate.slice(i, i + BATCH_SIZE);
    try {
      const prompt = buildSkillTranslationPrompt(
        batch.map((s) => ({
          slug: s.slug,
          name: s.name,
          description: s.description || s.name,
          platform: s.platform,
        })),
      );

      const rawResult = await generateText(prompt, {
        model: 'haiku',
        system: SKILL_TRANSLATION_SYSTEM_PROMPT,
        maxTokens: 4096,
      });

      // Parse JSON
      const cleaned = rawResult.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      const parsed = JSON.parse(cleaned);
      const translations: Array<{ slug: string; nameZh: string; descriptionZh: string }> =
        parsed.translations || [];

      // Build lookup map
      const translationMap = new Map(translations.map((t) => [t.slug, t]));

      // Merge translations back
      for (const skill of batch) {
        const t = translationMap.get(skill.slug);
        if (t) {
          const cacheKey = `translate:${skill.platform}:${skill.slug}`;
          setCache(cacheKey, { nameZh: t.nameZh, descriptionZh: t.descriptionZh, expires: 0 });
          result.push({ ...skill, nameZh: t.nameZh, descriptionZh: t.descriptionZh });
        } else {
          // No translation returned — keep original
          result.push(skill);
        }
      }
    } catch (err) {
      // Translation failed — silently degrade, keep English
      console.warn('[skill-translator] Batch translation failed:', err);
      result.push(...batch);
    }
  }

  return result;
}
