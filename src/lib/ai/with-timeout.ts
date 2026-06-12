/**
 * Request-level timeout wrapper for AI calls.
 * Prevents indefinite hangs when the AI provider is slow or unresponsive.
 */

export class AITimeoutError extends Error {
  constructor(timeoutMs: number) {
    super(`AI 调用超时 (${Math.round(timeoutMs / 1000)}秒)，请重试`);
    this.name = 'AITimeoutError';
  }
}

/**
 * Wraps a promise with a timeout. If the promise doesn't resolve within
 * `timeoutMs`, rejects with an AITimeoutError.
 */
export function withTimeout<T>(promise: Promise<T>, timeoutMs: number): Promise<T> {
  return Promise.race([
    promise,
    new Promise<never>((_, reject) =>
      setTimeout(() => reject(new AITimeoutError(timeoutMs)), timeoutMs)
    ),
  ]);
}

/** Default timeout for AI calls: 90 seconds */
export const AI_TIMEOUT_MS = 90_000;
