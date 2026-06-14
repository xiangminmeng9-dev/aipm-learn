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
  if (!apiKey) return [];

  const { maxResults = 3, topic = 'general' } = options;

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000);

    const response = await fetch('https://api.tavily.com/search', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        api_key: apiKey,
        query,
        max_results: maxResults,
        topic,
        include_answer: false,
        include_raw_content: false,
      }),
      signal: controller.signal,
    });

    clearTimeout(timeout);

    if (!response.ok) {
      console.warn(`[Tavily] Search failed: ${response.status} ${response.statusText}`);
      return [];
    }

    const data = await response.json();
    const results: TavilyResult[] = (data.results || []).map(
      (r: { title?: string; url?: string; content?: string; score?: number }) => ({
        title: r.title || '',
        url: r.url || '',
        content: (r.content || '').substring(0, 500), // 截断过长内容
        score: r.score || 0,
      })
    );

    return results;
  } catch (err) {
    // 静默降级：超时/网络错误/API 错误都不阻塞主流程
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
 */
export function formatSearchContext(results: TavilyResult[]): string {
  if (results.length === 0) return '';

  const formatted = results
    .map((r, i) => `${i + 1}. ${r.title}\n来源：${r.url}\n${r.content}`)
    .join('\n\n');

  return `\n\n【最新资讯参考】\n${formatted}`;
}
