// ─── Tavily Extract Module ──────────────────────────────────────────
// 从 URL 提取页面内容，支持 JS 渲染页面（如 BOSS直聘）
// 设计原则：静默降级，提取失败不阻塞主流程

export interface TavilyExtractResult {
  url: string;
  raw_content: string;
}

export interface TavilyExtractResponse {
  results: TavilyExtractResult[];
  failed_results: Array<{ url: string; error: string }>;
  response_time: number;
}

interface TavilyExtractOptions {
  extract_depth?: 'basic' | 'advanced';
  query?: string;
  format?: 'markdown' | 'text';
  timeout?: number;
}

/**
 * 调用 Tavily Extract API 从 URL 提取页面内容
 * advanced 模式可处理 JS 渲染页面（如 BOSS直聘），但延迟更高（最多 30s）
 * 失败时静默返回 null，不阻塞主流程
 */
export async function extractWithTavily(
  urls: string | string[],
  options: TavilyExtractOptions = {}
): Promise<TavilyExtractResponse | null> {
  const apiKey = process.env.TAVILY_API_KEY;
  if (!apiKey) {
    console.warn('[Tavily Extract] No API key found in env');
    return null;
  }

  const urlList = Array.isArray(urls) ? urls : [urls];
  const {
    extract_depth = 'advanced',
    query,
    format = 'text',
    timeout = 30,
  } = options;

  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), (timeout + 5) * 1000);

    const requestBody: Record<string, unknown> = {
      urls: urlList,
      extract_depth,
      format,
      timeout,
    };
    if (query) {
      requestBody.query = query;
    }

    console.log(`[Tavily Extract] Extracting from ${urlList.length} URL(s), depth=${extract_depth}, timeout=${timeout}s`);

    const response = await fetch('https://api.tavily.com/extract', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify(requestBody),
      signal: controller.signal,
    });

    clearTimeout(timer);

    if (!response.ok) {
      const errText = await response.text().catch(() => '');
      console.warn(`[Tavily Extract] Failed: ${response.status} ${response.statusText} ${errText.substring(0, 200)}`);
      return null;
    }

    const data = await response.json();
    console.log(`[Tavily Extract] Got ${data.results?.length || 0} results, ${data.failed_results?.length || 0} failed, response_time: ${data.response_time}s`);
    return data;
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    if (msg.includes('abort')) {
      console.warn('[Tavily Extract] Timed out');
    } else {
      console.warn('[Tavily Extract] Error:', msg);
    }
    return null;
  }
}
