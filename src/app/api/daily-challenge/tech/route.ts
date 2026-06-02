import { NextRequest, NextResponse } from 'next/server';
import { createClient, createServiceClient } from '@/lib/supabase/server';
import { generateText } from '@/lib/ai/claude';

export const maxDuration = 60;

// Ensure all string fields in a record are actually strings, not JSON objects
function ensureStrings(record: Record<string, unknown>): Record<string, unknown> {
  const result = { ...record };
  const stringFields = ['title', 'summary', 'explanation', 'impact', 'source_name', 'source_url'];
  for (const field of stringFields) {
    if (result[field] != null && typeof result[field] !== 'string') {
      const obj = result[field] as Record<string, unknown>;
      result[field] = (obj.zh || obj.en || obj.summary || obj.text || obj.content || JSON.stringify(obj)) as string;
    }
  }
  return result;
}

// Official AI blog RSS feeds — fetch directly to guarantee tech content
const OFFICIAL_RSS_FEEDS = [
  { name: 'OpenAI Blog', url: 'https://openai.com/blog/rss.xml' },
  { name: 'Google AI Blog', url: 'https://blog.google/innovation-and-ai/technology/ai/rss/' },
  { name: 'Google DeepMind', url: 'https://www.deepmind.google/feed/' },
  { name: 'Microsoft Research', url: 'https://www.microsoft.com/en-us/research/feed/' },
  { name: 'Hugging Face Blog', url: 'https://huggingface.co/blog/feed.xml' },
  { name: 'AWS ML Blog', url: 'https://aws.amazon.com/blogs/machine-learning/feed/' },
];

interface RssItem {
  title: string;
  link: string;
  pubDate: string;
  description: string;
  sourceName: string;
}

async function fetchOfficialRssItems(): Promise<RssItem[]> {
  const items: RssItem[] = [];
  const results = await Promise.allSettled(
    OFFICIAL_RSS_FEEDS.map(async (feed) => {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 8000);
      try {
        const res = await fetch(feed.url, { signal: controller.signal, headers: { 'User-Agent': 'Mozilla/5.0' } });
        if (!res.ok) return;
        const xml = await res.text();
        // Parse RSS/Atom items
        const itemRegex = /<entry[\s>]|<item[\s>]/gi;
        const entries: RssItem[] = [];
        let match;
        // Split by <entry> or <item>
        const parts = xml.split(itemRegex);
        const isAtom = /<feed[\s>]/i.test(xml);
        for (let i = 1; i < parts.length; i++) {
          const part = parts[i];
          const title = part.match(/<title[^>]*>([\s\S]*?)<\/title>/)?.[1]?.replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1').trim() || '';
          let link = '';
          if (isAtom) {
            link = part.match(/<link[^>]*href="([^"]+)"[^>]*\/?>/)?.[1] || part.match(/<link[^>]*>([\s\S]*?)<\/link>/)?.[1]?.trim() || '';
          } else {
            link = part.match(/<link[^>]*>([\s\S]*?)<\/link>/)?.[1]?.trim() || '';
          }
          const pubDate = part.match(/<published>([\s\S]*?)<\/published>/)?.[1] || part.match(/<pubDate>([\s\S]*?)<\/pubDate>/)?.[1] || part.match(/<updated>([\s\S]*?)<\/updated>/)?.[1] || '';
          const desc = part.match(/<summary[^>]*>([\s\S]*?)<\/summary>/)?.[1] || part.match(/<description[^>]*>([\s\S]*?)<\/description>/)?.[1] || part.match(/<content[^>]*>([\s\S]*?)<\/content>/)?.[1] || '';
          const cleanDesc = desc.replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1').replace(/<[^>]+>/g, '').trim();
          if (title && link) {
            entries.push({ title, link, pubDate, description: cleanDesc.slice(0, 500), sourceName: feed.name });
          }
        }
        return entries;
      } catch {
        return [];
      } finally {
        clearTimeout(timeout);
      }
    })
  );
  for (const r of results) {
    if (r.status === 'fulfilled' && r.value) items.push(...r.value);
  }
  // Sort by date descending, only keep articles from the last 30 days
  const thirtyDaysAgo = Date.now() - 30 * 86400000;
  items.sort((a, b) => new Date(b.pubDate).getTime() - new Date(a.pubDate).getTime());
  return items.filter(item => {
    const d = new Date(item.pubDate).getTime();
    return d > thirtyDaysAgo || d === 0; // keep items with no date (might be recent)
  });
}

export async function GET(request: NextRequest) {
  try {
    const forceRefresh = new URL(request.url).searchParams.get('refresh') === '1';
    const supabase = await createClient();
    const serviceClient = createServiceClient();
    const today = new Date().toISOString().split('T')[0];

    // Get user and bookmarks early
    const { data: { user } } = await supabase.auth.getUser();
    let bookmarks: string[] = [];
    if (user) {
      const { data } = await supabase
        .from('daily_tech_bookmarks')
        .select('tech_date')
        .eq('user_id', user.id);
      bookmarks = (data || []).map((b: { tech_date: string }) => b.tech_date);
    }

    // Check if today already has cache (skip generation unless force-refresh)
    if (!forceRefresh) {
      const { data: cached, error: cacheErr } = await serviceClient
        .from('daily_tech_cache')
        .select('*')
        .eq('date', today)
        .maybeSingle();

      if (cacheErr) console.error('Cache query error:', cacheErr);

      if (cached) {
        // If cached title/impact looks like raw English or placeholder, regenerate
        const cachedTitle = String(cached.title || '');
        const cachedImpact = String(cached.impact || '');
        const needsRegeneration = cachedImpact === '关注此技术动态，理解其对 AI PM 工作的影响'
          || /^[A-Z]/.test(cachedTitle) && !/[一-鿿]/.test(cachedTitle); // English title with no Chinese chars

        if (!needsRegeneration) {
          const { data: history } = await serviceClient
            .from('daily_tech_cache')
            .select('*')
            .order('date', { ascending: false })
            .limit(30);
          return NextResponse.json({ tech: ensureStrings(cached), history: (history || []).map(ensureStrings), bookmarks, source: 'cache' });
        }
        // Fall through to regenerate
      }
    }

    // --- Generate content from RSS ---

    // 1. Get what's currently cached (before we delete anything)
    const { data: existingCache } = await serviceClient
      .from('daily_tech_cache')
      .select('title, source_url, date')
      .order('date', { ascending: false })
      .limit(30);

    // Remember the title that was just shown to the user
    const prevShownTitle = forceRefresh
      ? (existingCache ?? []).find((e: { date: string }) => e.date === today)?.title || (existingCache?.[0] as { title: string } | undefined)?.title
      : null;

    // 2. Force refresh: delete today's cache
    if (forceRefresh) {
      await serviceClient.from('daily_tech_cache').delete().eq('date', today);
    }

    // 3. Fetch official AI blog articles directly from RSS (parallel, 8s timeout each)
    const officialItems = await fetchOfficialRssItems();

    // 4. Also trigger background RSS sync to populate database for future requests
    try {
      const refreshWithTimeout = Promise.race([
        import('@/lib/rss/pipeline').then(({ refreshRssArticles }) => refreshRssArticles('ai_tech')),
        new Promise<null>((_, reject) => setTimeout(() => reject(new Error('RSS refresh timeout')), 30000)),
      ]);
      await refreshWithTimeout;
    } catch (refreshErr) {
      console.error('RSS refresh error:', refreshErr);
    }

    // 5. Fetch articles from RSS table as fallback
    const sevenDaysAgo = new Date(Date.now() - 7 * 86400000).toISOString();
    const thirtyDaysAgo = new Date(Date.now() - 30 * 86400000).toISOString();
    let { data: articles, error: articlesErr } = await serviceClient
      .from('daily_ai_news_articles')
      .select('title, url, source, summary, published_at')
      .gte('published_at', thirtyDaysAgo)
      .order('published_at', { ascending: false })
      .limit(50);

    if (articlesErr) console.error('Recent articles query error:', articlesErr);

    if (!articles || articles.length === 0) {
      const { data: allArticles } = await serviceClient
        .from('daily_ai_news_articles')
        .select('title, url, source, summary, published_at')
        .order('published_at', { ascending: false })
        .limit(50);
      articles = allArticles;
    }

    // 6. Select an article — official RSS first, then database
    const officialSources = ['OpenAI', 'Google AI', 'Google DeepMind', 'Google', 'Microsoft Research', 'Microsoft', 'Hugging Face', 'AWS', 'Amazon'];
    const isOfficial = (a: { source: string | Record<string, unknown> | null }) => {
      const src = typeof a.source === 'string' ? a.source : a.source ? String((a.source as Record<string, unknown>).name || JSON.stringify(a.source)) : '';
      return officialSources.some(s => src.includes(s));
    };

    // Get cached titles/urls to avoid showing duplicates
    const cachedUrls = new Set((existingCache ?? []).map((e: { source_url?: string }) => e.source_url).filter(Boolean));
    const cachedTitles = new Set((existingCache ?? []).map((e: { title: string | Record<string, unknown> }) => typeof e.title === 'string' ? e.title : String(e.title.zh || e.title.en || JSON.stringify(e.title))));

    // Filter official items: not already cached, not the one just shown
    const prevShownTitleStr = prevShownTitle;
    const freshOfficial = officialItems.filter(item =>
      !cachedUrls.has(item.link) &&
      !cachedTitles.has(item.title) &&
      (!prevShownTitleStr || item.title !== prevShownTitleStr)
    );

    let selectedArticle: { title: string | Record<string, unknown>; url: string; source: string | Record<string, unknown> | null; summary: string | Record<string, unknown> | null; published_at: string | null } | undefined;
    let source = 'official_rss';

    if (freshOfficial.length > 0) {
      // Pick a random official article (avoid always showing the same one)
      const idx = forceRefresh ? Math.floor(Math.random() * freshOfficial.length) : 0;
      const item = freshOfficial[idx];
      selectedArticle = {
        title: item.title,
        url: item.link,
        source: item.sourceName,
        summary: item.description,
        published_at: item.pubDate || null,
      };
    } else if (forceRefresh && prevShownTitle) {
      // "换一条" from database: prefer official sources
      const getTitleStr = (t: string | Record<string, unknown>) => typeof t === 'string' ? t : String(t.zh || t.en || JSON.stringify(t));
      const differentArticles = (articles ?? []).filter((a: { title: string | Record<string, unknown> }) => getTitleStr(a.title) !== prevShownTitle);
      selectedArticle = differentArticles.find(isOfficial) || differentArticles[0];
      if (selectedArticle) {
        source = 'refresh';
      } else if (articles && articles.length > 0) {
        selectedArticle = articles.find(isOfficial) || articles[Math.min(1, articles.length - 1)];
        source = 'refresh';
      }
    } else {
      // Normal flow from database: prefer official sources
      const notCached = (articles ?? []).filter((a: { url: string; title: string | Record<string, unknown> }) =>
        !cachedUrls.has(a.url) && !cachedTitles.has(typeof a.title === 'string' ? a.title : String(a.title.zh || a.title.en || JSON.stringify(a.title)))
      );
      selectedArticle = notCached.find(isOfficial) || notCached[0];
      if (!selectedArticle && articles && articles.length > 0) {
        selectedArticle = articles.find(isOfficial) || articles[0];
        source = 'duplicate';
      } else if (selectedArticle) {
        source = 'ai';
      }
    }

    // 7. Generate and cache
    if (selectedArticle) {
      return await generateAndCache(selectedArticle, today, serviceClient, bookmarks, source);
    }

    // 8. No articles at all — cache a fallback message
    const fallbackTech = {
      date: today,
      title: '暂无AI技术资讯',
      summary: 'RSS数据源暂时无法获取最新资讯，请稍后重试',
      explanation: '系统正在从多个AI技术源获取最新资讯，请稍后刷新页面查看。你也可以点击"换一条"按钮强制获取最新内容。',
      impact: '建议稍后刷新页面，或查看历史推送中的内容。',
      tags: [] as string[],
      source_name: '系统提示',
    };

    await serviceClient.from('daily_tech_cache').delete().eq('date', today);
    const { error: fallbackInsertErr } = await serviceClient.from('daily_tech_cache').insert(fallbackTech);
    if (fallbackInsertErr) console.error('Fallback cache insert error:', fallbackInsertErr);

    const { data: updatedHistory } = await serviceClient
      .from('daily_tech_cache')
      .select('*')
      .order('date', { ascending: false })
      .limit(30);

    return NextResponse.json({
      tech: fallbackTech,
      history: (updatedHistory || []).map(ensureStrings),
      bookmarks,
      source: 'fallback',
    });
  } catch (err) {
    console.error('Get daily tech error:', err);
    return NextResponse.json({ error: '获取失败' }, { status: 500 });
  }
}

async function generateAndCache(
  article: { title: string | Record<string, unknown>; url: string; source: string | Record<string, unknown> | null; summary: string | Record<string, unknown> | null; published_at: string | null },
  today: string,
  serviceClient: ReturnType<typeof createServiceClient>,
  bookmarks: string[],
  source: string,
) {
  // Ensure all fields are strings
  const articleTitle = typeof article.title === 'string' ? article.title : String((article.title as Record<string, unknown>)?.zh || (article.title as Record<string, unknown>)?.en || JSON.stringify(article.title));
  const articleSource = article.source ? (typeof article.source === 'string' ? article.source : String((article.source as Record<string, unknown>)?.name || JSON.stringify(article.source))) : null;

  // Ensure summary is a string — RSS pipeline may store JSON objects
  let rawSummary = '';
  if (article.summary) {
    if (typeof article.summary === 'string') {
      try {
        const parsed = JSON.parse(article.summary);
        rawSummary = parsed.summary || parsed.text || parsed.content || article.summary;
      } catch { rawSummary = article.summary; }
    } else if (typeof article.summary === 'object') {
      const s = article.summary as Record<string, unknown>;
      rawSummary = String(s.summary || s.text || s.content || s.title || JSON.stringify(s));
    }
  }

  let aiTitle = articleTitle;
  let aiSummary = rawSummary;
  let aiExplanation = rawSummary;
  let aiImpact = '关注此技术动态，理解其对 AI PM 工作的影响';

  try {
    const aiResult = await generateText(
      `你是一位AI技术分析师，专门为AI产品经理筛选和解读AI技术动态。

请基于以下AI资讯，用中文生成一份面向AI产品经理的技术解读：

标题：${articleTitle}
原文摘要：${rawSummary}
${article.published_at ? `发布时间：${article.published_at}` : ''}

重要：只关注AI技术、新功能、新模型、新工具、新能力发布。如果是纯新闻报道（融资、人事、政策、诉讼、市场份额等），请指出"这不是技术动态"。

要求：
1. 中文标题（如果原文是英文标题，翻译成中文，简洁有力，突出技术/功能关键词）
2. 技术摘要（1句话，精炼概括核心内容，偏专业表达）
3. 白话解读（2-3句，用通俗易懂的语言解释这项技术是什么、能做什么，多用类比和产品场景帮助理解，避免晦涩术语）
4. 对AI产品经理的影响（1-2句中文，具体说明对产品决策、用户需求或市场竞争的影响，不要写空泛的话）

格式（严格遵守）：
标题：...
摘要：...
白话解读：...
影响：...`,
      { maxTokens: 800 }
    );

    const lines = aiResult.split('\n').filter((l: string) => l.trim());
    for (const line of lines) {
      if (line.startsWith('标题：') || line.startsWith('标题:') || line.startsWith('标题：**') || line.startsWith('标题:**')) {
        const parsed = line.replace(/^标题[：:]\*{0,2}\s*/, '').trim();
        if (parsed) aiTitle = parsed;
      } else if (line.startsWith('摘要：') || line.startsWith('摘要:') || line.startsWith('摘要：**') || line.startsWith('摘要:**')) {
        aiSummary = line.replace(/^摘要[：:]\*{0,2}\s*/, '').trim();
      } else if (line.startsWith('白话解读：') || line.startsWith('白话解读:') || line.startsWith('白话解读：**') || line.startsWith('白话解读:**')) {
        aiExplanation = line.replace(/^白话解读[：:]\*{0,2}\s*/, '').trim();
      } else if (line.startsWith('影响：') || line.startsWith('影响:') || line.startsWith('影响：**') || line.startsWith('影响:**')) {
        aiImpact = line.replace(/^影响[：:]\*{0,2}\s*/, '').trim();
      }
    }
    // Fallback: if "摘要" wasn't parsed but "解读" was (old format), split it
    if (aiSummary === rawSummary && aiExplanation === rawSummary && aiResult.length > 0) {
      const summaryMatch = aiResult.match(/(?:摘要|解读)[：:]\*{0,2}\s*([\s\S]+?)(?=(?:白话解读|影响)[：:])/);
      const explainMatch = aiResult.match(/白话解读[：:]\*{0,2}\s*([\s\S]+?)(?=影响[：:])/);
      if (summaryMatch) aiSummary = summaryMatch[1].trim();
      if (explainMatch) aiExplanation = explainMatch[1].trim();
    }
    if (aiSummary === rawSummary && aiResult.length > 0) {
      aiSummary = aiResult.slice(0, 200);
    }
    if (aiExplanation === rawSummary && aiResult.length > 0) {
      aiExplanation = aiSummary;
    }
  } catch (aiErr) {
    console.error('AI summary generation failed, using raw content:', aiErr);
  }

  // Format published date for display
  const publishedDate = article.published_at
    ? new Date(article.published_at).toLocaleDateString('zh-CN', { year: 'numeric', month: 'long', day: 'numeric' })
    : null;

  const newTech = {
    date: today,
    title: aiTitle,
    summary: aiSummary.slice(0, 200),
    explanation: aiExplanation,
    impact: aiImpact,
    tags: [] as string[],
    source_url: article.url,
    source_name: articleSource || 'AI 技术 RSS',
  };

  // Delete existing today cache before inserting
  await serviceClient.from('daily_tech_cache').delete().eq('date', today);

  const { data: inserted, error: insertErr } = await serviceClient
    .from('daily_tech_cache')
    .insert(newTech)
    .select()
    .single();

  if (insertErr) {
    console.error('Cache insert error:', insertErr);
    const minimalTech = {
      date: today,
      title: aiTitle,
      summary: aiSummary.slice(0, 200),
      explanation: aiSummary,
      impact: aiImpact,
      tags: [] as string[],
      source_url: article.url,
      source_name: articleSource || 'AI 技术 RSS',
    };
    const { data: retryInserted, error: retryErr } = await serviceClient
      .from('daily_tech_cache')
      .insert(minimalTech)
      .select()
      .single();
    if (retryErr) console.error('Retry insert also failed:', retryErr);
    if (retryInserted) {
      const result = retryInserted as Record<string, unknown>;
      if (publishedDate) result.source_published_display = publishedDate;
      if (article.published_at) result.source_published_at = article.published_at;
      const { data: updatedHistory } = await serviceClient
        .from('daily_tech_cache')
        .select('*')
        .order('date', { ascending: false })
        .limit(30);
      return NextResponse.json({ tech: ensureStrings(result), history: (updatedHistory || []).map(ensureStrings), bookmarks, source });
    }
  }

  const result = (inserted || newTech) as Record<string, unknown>;

  // Add formatted date for frontend display
  if (!result.source_published_display && publishedDate) {
    result.source_published_display = publishedDate;
  }
  if (!result.source_published_at && article.published_at) {
    result.source_published_at = article.published_at;
  }

  // Refresh history after insert
  const { data: updatedHistory } = await serviceClient
    .from('daily_tech_cache')
    .select('*')
    .order('date', { ascending: false })
    .limit(30);

  return NextResponse.json({
    tech: ensureStrings(result),
    history: (updatedHistory || []).map(ensureStrings),
    bookmarks,
    source,
  });
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: '未登录' }, { status: 401 });

    const body = await request.json();
    const { action, tech_date, tech_data } = body as {
      action: 'bookmark' | 'unbookmark';
      tech_date: string;
      tech_data?: { title?: string; summary?: string; explanation?: string; impact?: string; tags?: string[]; source_url?: string };
    };

    if (action === 'bookmark') {
      const { error } = await supabase
        .from('daily_tech_bookmarks')
        .insert({
          user_id: user.id,
          tech_date,
          title: tech_data?.title || '未命名',
          summary: tech_data?.summary || null,
          explanation: tech_data?.explanation || null,
          impact: tech_data?.impact || null,
          tags: tech_data?.tags || [],
          source_url: tech_data?.source_url || null,
        });
      if (error && !error.message.includes('duplicate')) {
        console.error('Bookmark insert error:', error);
        return NextResponse.json({ error: '收藏失败' }, { status: 500 });
      }
      return NextResponse.json({ bookmarked: true });
    }

    if (action === 'unbookmark') {
      await supabase
        .from('daily_tech_bookmarks')
        .delete()
        .eq('user_id', user.id)
        .eq('tech_date', tech_date);
      return NextResponse.json({ bookmarked: false });
    }

    return NextResponse.json({ error: '无效操作' }, { status: 400 });
  } catch {
    return NextResponse.json({ error: '操作失败' }, { status: 500 });
  }
}