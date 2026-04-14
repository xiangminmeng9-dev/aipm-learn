/**
 * Estimate token count for a string.
 * Uses a simple heuristic: ~4 characters per token for English,
 * ~2 characters per token for Chinese.
 * This is an approximation — exact counts come from the model API.
 */
export function estimateTokens(text: string): number {
  if (!text) return 0;

  let tokens = 0;
  for (const char of text) {
    // CJK characters: roughly 1 token per character
    if (/[\u4e00-\u9fff\u3400-\u4dbf]/.test(char)) {
      tokens += 1;
    } else {
      // Latin/ASCII: roughly 1 token per 4 characters
      tokens += 0.25;
    }
  }

  return Math.ceil(tokens);
}

/**
 * Check if total tokens exceed the compression threshold.
 * Default context window: 200k tokens, threshold: 70%
 */
export function shouldCompress(
  totalTokens: number,
  contextWindow: number = 200000,
  threshold: number = 0.7
): boolean {
  return totalTokens >= contextWindow * threshold;
}
