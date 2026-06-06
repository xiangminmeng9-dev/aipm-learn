import { fetchFeed, truncateContent } from './fetcher';
import { stripHtml, isAiRelated as isAiRelatedShared } from './shared-utils';
import { translateToPlainLanguage } from './translator';
import { getSourcesForCategory, type RssSourceConfig } from './sources';
import { createServiceClient } from '@/lib/supabase/server';

function isAiRelated(text: string, language: string): boolean {
  if (language === 'zh') return isAiRelatedShared(text);
  return true;
}

export async function refreshRssArticles(category?: 'ai_tech' | 'ai_pm'): Promise<{
  newArticles: number;
  translated: number;
  errors: string[];
}> {
  const supabase = createServiceClient();
  const sources = category
    ? getSourcesForCategory(category)
    : [...getSourcesForCategory('ai_tech'), ...getSourcesForCategory('ai_pm')];

  let newCount = 0;
  let translatedCount = 0;
  const errors: string[] = [];

  for (const source of sources) {
    try {
      const feed = await fetchFeed(source.url);

      for (const item of feed.items.slice(0, 10)) {
        if (!item.link) continue;

        const combined = `${item.title} ${item.contentSnippet || ''}`;
        if (!isAiRelated(combined, source.language)) continue;

        // Check if article already exists (by url + source name as composite key)
        const { data: existing } = await supabase
          .from('daily_ai_news_articles')
          .select('id')
          .eq('url', item.link)
          .maybeSingle();

        if (existing) continue;

        // Extract content
        const rawContent = item.content || item.contentSnippet || '';
        const cleanContent = stripHtml(rawContent);
        const summary = cleanContent.slice(0, 500);

        // Insert into daily_ai_news_articles
        const { data: newArticle, error: insertError } = await supabase
          .from('daily_ai_news_articles')
          .insert({
            news_date: new Date().toLocaleDateString('sv-SE', { timeZone: 'Asia/Shanghai' }),
            source: source.name,
            title: item.title.slice(0, 200),
            url: item.link,
            summary: summary.slice(0, 500),
            published_at: item.isoDate || item.pubDate || new Date().toISOString(),
          })
          .select('id')
          .single();

        if (insertError) {
          // Duplicate URL — skip
          if (insertError.code === '23505') continue;
          console.error(`Insert error for ${item.title}:`, insertError.message);
          continue;
        }

        if (newArticle) {
          newCount++;

          // Translate to plain language for PM understanding
          const translation = await translateToPlainLanguage(
            item.title,
            truncateContent(cleanContent, 3000),
            source.category,
          );

          if (translation) {
            // Store the full translation JSON as summary for structured display
            const enrichedSummary = translation.summary || summary.slice(0, 200);
            await supabase
              .from('daily_ai_news_articles')
              .update({
                summary: JSON.stringify(translation),
              })
              .eq('id', newArticle.id);

            translatedCount++;
          }
        }
      }
    } catch (err) {
      const msg = `Source ${source.name} failed: ${err instanceof Error ? err.message : 'unknown'}`;
      errors.push(msg);
      console.error(msg);
    }
  }

  return { newArticles: newCount, translated: translatedCount, errors };
}