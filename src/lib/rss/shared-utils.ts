/**
 * Shared RSS/network utilities — used by rss pipeline, daily-ai-news, and resume/jobs.
 * Previously duplicated across 3+ files.
 */

export function stripHtml(html: string): string {
  return html
    .replace(/<[^>]*>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, ' ')
    .trim();
}

export async function fetchWithTimeout(
  url: string,
  timeoutMs = 10000,
  userAgent = 'Mozilla/5.0 (compatible; AIPMBot/1.0; +https://example.com/bot)',
): Promise<string> {
  const controller = new AbortController();
  const t = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, {
      signal: controller.signal,
      headers: { 'User-Agent': userAgent },
      next: { revalidate: 0 },
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.text();
  } finally {
    clearTimeout(t);
  }
}

// Comprehensive AI keyword regex — covers zh and en terms
export const AI_KEYWORDS_REGEX = /(AI|人工智能|大模型|LLM|GPT|生成式|智能体|Agent|机器学习|深度学习|多模态|RAG|Claude|Gemini|DeepSeek|通义|文心|Kimi|智谱|Sora|Copilot|AutoGPT|NLP|CV|AIGC|ChatGPT|Midjourney|Stable Diffusion|开源模型|基座模型|推理优化|向量数据库|知识图谱|prompt|token|embedding|fine-tuning|微调|Machine Learning|Foundation Model|Generative)/i;

export function isAiRelated(text: string): boolean {
  return AI_KEYWORDS_REGEX.test(text);
}