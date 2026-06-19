// ─── Tavily Search Module ──────────────────────────────────────────
// 为面试回答提供实时搜索增强，解决 AI 时效性问题
// 设计原则：静默降级，搜索失败不阻塞主流程

export interface TavilyResult {
  title: string;
  url: string;
  content: string;
  score: number;
}

export interface TavilySearchResponse {
  results: TavilyResult[];
  answer: string | null;
}

interface TavilySearchOptions {
  maxResults?: number;  // 默认 3
  topic?: 'general' | 'news';  // 默认 general
}

// ─── In-memory cache for Tavily search results ─────────────────────
// NOTE: This is an in-memory cache, NOT shared across serverless instances.
// That's acceptable for query-result caching: worst case a few cold instances
// re-query Tavily for the same question, but hot instances serve repeat
// questions instantly for 5 minutes.
const searchCache = new Map<string, { data: TavilySearchResponse; expires: number }>();
const SEARCH_CACHE_TTL = 5 * 60 * 1000; // 5 minutes

function getCachedSearch(query: string): TavilySearchResponse | null {
  const key = query.trim().toLowerCase();
  const entry = searchCache.get(key);
  if (entry && entry.expires > Date.now()) return entry.data;
  searchCache.delete(key);
  return null;
}

function setCachedSearch(query: string, data: TavilySearchResponse) {
  searchCache.set(query.trim().toLowerCase(), { data, expires: Date.now() + SEARCH_CACHE_TTL });
}

/**
 * 调用 Tavily Search API 获取最新资讯
 * 失败时静默返回空结果，不阻塞主流程
 */
export async function searchWithTavily(
  query: string,
  options: TavilySearchOptions = {}
): Promise<TavilySearchResponse> {
  const apiKey = process.env.TAVILY_API_KEY;
  if (!apiKey) {
    console.warn('[Tavily] No API key found in env');
    return { results: [], answer: null };
  }

  const { maxResults = 3, topic = 'general' } = options;

  // Cache key includes options so the same query with a different topic or
  // maxResults doesn't collide. Query is normalized (trim + lowercase) so
  // different users asking the same question share the cache.
  const cacheKey = `${query.trim().toLowerCase()}|${topic}|${maxResults}`;
  const cached = getCachedSearch(cacheKey);
  if (cached) {
    console.log(`[Tavily] Cache hit for "${query}" (topic=${topic}, max=${maxResults})`);
    return cached;
  }

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000);

    const requestBody = {
      api_key: apiKey,
      query,
      max_results: maxResults,
      topic,
      include_answer: true,
      include_raw_content: false,
    };

    console.log(`[Tavily] Searching: "${query}" (topic=${topic}, max=${maxResults})`);

    const response = await fetch('https://api.tavily.com/search', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(requestBody),
      signal: controller.signal,
    });

    clearTimeout(timeout);

    if (!response.ok) {
      const errText = await response.text().catch(() => '');
      console.warn(`[Tavily] Search failed: ${response.status} ${response.statusText} ${errText.substring(0, 200)}`);
      return { results: [], answer: null };
    }

    const data = await response.json();
    const results: TavilyResult[] = (data.results || []).map(
      (r: { title?: string; url?: string; content?: string; score?: number }) => ({
        title: r.title || '',
        url: r.url || '',
        content: (r.content || '').substring(0, 500),
        score: r.score || 0,
      })
    );

    const answer = data.answer ? String(data.answer) : null;
    const result: TavilySearchResponse = { results, answer };

    // Only cache successful, non-empty responses. Don't pollute the cache
    // with empty results (e.g. transient API hiccups) so retries can reach Tavily.
    if (results.length > 0 || answer) {
      setCachedSearch(cacheKey, result);
    }

    console.log(`[Tavily] Got ${results.length} results for "${query}", answer: ${answer ? 'yes' : 'no'}`);

    return result;
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    if (msg.includes('abort')) {
      console.warn('[Tavily] Search timed out (8s)');
    } else {
      console.warn('[Tavily] Search error:', msg);
    }
    return { results: [], answer: null };
  }
}

/**
 * 将搜索结果格式化为注入 user message 的文本
 * 放在 user message 而非 system prompt 中，确保 AI 必须处理这些信息
 */
export function formatSearchForUserMessage(searchResponse: TavilySearchResponse): string {
  const { results, answer } = searchResponse;
  if (results.length === 0 && !answer) return '';

  let text = '\n\n---\n📎 以下是我从互联网搜索到的最新信息，请基于这些信息回答我的问题：\n';

  if (answer) {
    text += `\n【搜索摘要】${answer}\n`;
  }

  if (results.length > 0) {
    text += '\n【搜索结果详情】\n';
    text += results
      .map((r, i) => `${i + 1}. ${r.title}\n来源：${r.url}\n${r.content}`)
      .join('\n\n');
  }

  text += '\n---\n请直接使用以上搜索结果中的数据和事实来回答，不要说"无法提供实时信息"。';
  return text;
}

/**
 * 旧版兼容：格式化为 system prompt 上下文（用于 analyze 路由）
 * @deprecated 优先使用 formatSearchForUserMessage
 */
export function formatSearchContext(results: TavilyResult[]): string {
  if (results.length === 0) return '';

  const formatted = results
    .map((r, i) => `${i + 1}. ${r.title}\n来源：${r.url}\n${r.content}`)
    .join('\n\n');

  return `\n\n【最新资讯参考 — 必须优先使用以下搜索结果中的最新数据和信息】
以下是刚刚从互联网搜索到的最新资讯，你的回答必须优先引用这些最新数据，而不是依赖你的训练数据中的旧信息。如果搜索结果中包含具体数字、日期、价格等时效性数据，必须直接引用并注明来源。

${formatted}`;
}
