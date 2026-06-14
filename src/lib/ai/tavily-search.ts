// ─── Tavily Search Module ──────────────────────────────────────────
// 为面试回答提供实时搜索增强，解决 AI 时效性问题
// 设计原则：静默降级，搜索失败不阻塞主流程

export interface TavilyResult {
  title: string;
  url: string;
  content: string;
  score: number;
}

interface TavilySearchOptions {
  maxResults?: number;  // 默认 3
  topic?: 'general' | 'news';  // 默认 general
}

/**
 * 调用 Tavily Search API 获取最新资讯
 * 失败时静默返回空数组，不阻塞主流程
 */
export async function searchWithTavily(
  query: string,
  options: TavilySearchOptions = {}
): Promise<TavilyResult[]> {
  const apiKey = process.env.TAVILY_API_KEY;
  if (!apiKey) {
    console.warn('[Tavily] No API key found in env');
    return [];
  }

  const { maxResults = 3, topic = 'general' } = options;

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
      return [];
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

    console.log(`[Tavily] Got ${results.length} results for "${query}"`);
    if (data.answer) {
      console.log(`[Tavily] Answer snippet: ${String(data.answer).substring(0, 200)}`);
    }

    return results;
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    if (msg.includes('abort')) {
      console.warn('[Tavily] Search timed out (8s)');
    } else {
      console.warn('[Tavily] Search error:', msg);
    }
    return [];
  }
}

/**
 * 将搜索结果格式化为可注入 prompt 的文本
 * 包含明确的引用指令，确保 AI 优先使用搜索结果中的最新信息
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
