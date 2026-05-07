import Anthropic from '@anthropic-ai/sdk';
import OpenAI from 'openai';
import { createClient } from '@/lib/supabase/server';
import { decrypt } from '@/lib/crypto';

export type ModelType = 'sonnet' | 'haiku';
export type AIProtocol = 'anthropic' | 'openai';

interface AIConfig {
  protocol: AIProtocol;
  baseURL: string | undefined;
  apiKey: string;
  model: string;
}

function cleanEnv(val: string | undefined): string | undefined {
  if (!val) return undefined;
  return val.replace(/^["']|["']$/g, '').trim() || undefined;
}

const DEFAULT_CONFIG: AIConfig = {
  protocol: 'anthropic',
  baseURL: cleanEnv(process.env.ANTHROPIC_BASE_URL),
  apiKey: cleanEnv(process.env.ANTHROPIC_API_KEY) || '',
  model: 'astron-code-latest',
};

const RETRY_DELAYS = [2000, 4000, 8000];

function isRateLimitError(err: unknown): boolean {
  const msg = String(err);
  return msg.includes('11202') || msg.includes('QpsOverFlow') || msg.includes('rate_limit') || msg.includes('429');
}

async function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

// Request-level cache: resolved once per request, reused across AI calls
let cachedConfig: { config: AIConfig; userId: string } | null = null;

async function resolveConfig(): Promise<AIConfig> {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { cachedConfig = null; return DEFAULT_CONFIG; }

    if (cachedConfig && cachedConfig.userId === user.id) {
      return cachedConfig.config;
    }

    const { data } = await supabase
      .from('user_ai_configs')
      .select('protocol, base_url, api_key, model')
      .eq('user_id', user.id)
      .maybeSingle();

    if (data && data.api_key && data.model) {
      let apiKey = data.api_key;
      try {
        apiKey = decrypt(apiKey);
      } catch {
        // Legacy unencrypted key
      }
      const config: AIConfig = {
        protocol: (data.protocol as AIProtocol) || 'anthropic',
        baseURL: data.base_url || undefined,
        apiKey,
        model: data.model,
      };
      cachedConfig = { config, userId: user.id };
      return config;
    }
  } catch {
    // fallback to default
  }
  return DEFAULT_CONFIG;
}

function buildAnthropic(cfg: AIConfig): Anthropic {
  const isThirdParty = !!cfg.baseURL;
  return new Anthropic({
    apiKey: cfg.apiKey,
    baseURL: cfg.baseURL,
    timeout: 120_000,
    maxRetries: 0,
    // Third-party APIs (Xunfei MaaS etc.) don't understand the SDK's
    // generated Authorization header and only accept x-api-key.
    fetch: isThirdParty ? stripAuthFetch : undefined,
  });
}

const stripAuthFetch: typeof globalThis.fetch = (url, init) => {
  const headers = new Headers(init?.headers);
  headers.delete('authorization');
  return globalThis.fetch(url, { ...init, headers });
};

function buildOpenAI(cfg: AIConfig): OpenAI {
  return new OpenAI({
    apiKey: cfg.apiKey,
    baseURL: cfg.baseURL,
    timeout: 120_000,
    maxRetries: 0,
  });
}

async function callAnthropic(
  cfg: AIConfig,
  model: string,
  maxTokens: number,
  system: string | undefined,
  messages: { role: 'user' | 'assistant'; content: string }[],
  stream: boolean
): Promise<string> {
  const client = buildAnthropic(cfg);

  if (stream) {
    const s = client.messages.stream({
      model,
      max_tokens: maxTokens,
      system: system || undefined,
      messages,
    });

    let result = '';
    for await (const event of s) {
      if (event.type === 'content_block_delta' && event.delta.type === 'text_delta') {
        result += event.delta.text;
      }
    }
    return result;
  }

  const resp = await client.messages.create({
    model,
    max_tokens: maxTokens,
    system: system || undefined,
    messages,
  });

  return resp.content.map((c) => (c.type === 'text' ? c.text : '')).join('');
}

async function withRetry<T>(fn: () => Promise<T>): Promise<T> {
  let lastErr: unknown;
  for (let i = 0; i <= RETRY_DELAYS.length; i++) {
    try {
      return await fn();
    } catch (err) {
      lastErr = err;
      if (i < RETRY_DELAYS.length && isRateLimitError(err)) {
        await sleep(RETRY_DELAYS[i]);
        continue;
      }
      throw err;
    }
  }
  throw lastErr;
}

export async function generateText(
  prompt: string,
  options: {
    model?: ModelType;
    system?: string;
    maxTokens?: number;
  } = {}
): Promise<string> {
  const { system, maxTokens = 4096 } = options;
  const cfg = await resolveConfig();
  const model = cfg.model || options.model || 'sonnet';
  const isThirdParty = !!cfg.baseURL;

  if (cfg.protocol === 'openai') {
    const client = buildOpenAI(cfg);
    const messages: { role: 'system' | 'user'; content: string }[] = [];
    if (system) messages.push({ role: 'system', content: system });
    messages.push({ role: 'user', content: prompt });

    const resp = await withRetry(() =>
      client.chat.completions.create({ model, max_tokens: maxTokens, messages })
    );
    return resp.choices[0]?.message?.content ?? '';
  }

  return withRetry(() =>
    callAnthropic(
      cfg, model, maxTokens, system,
      [{ role: 'user' as const, content: prompt }],
      !isThirdParty
    )
  );
}

export async function generateChatResponse(
  messages: { role: 'user' | 'assistant'; content: string }[],
  options: {
    model?: ModelType;
    system?: string;
    maxTokens?: number;
  } = {}
): Promise<string> {
  const { system, maxTokens = 4096 } = options;
  const cfg = await resolveConfig();
  const model = cfg.model || options.model || 'sonnet';
  const isThirdParty = !!cfg.baseURL;

  if (cfg.protocol === 'openai') {
    const client = buildOpenAI(cfg);
    const fullMessages: { role: 'system' | 'user' | 'assistant'; content: string }[] = [];
    if (system) fullMessages.push({ role: 'system', content: system });
    fullMessages.push(...messages);

    const resp = await withRetry(() =>
      client.chat.completions.create({ model, max_tokens: maxTokens, messages: fullMessages })
    );
    return resp.choices[0]?.message?.content ?? '';
  }

  return withRetry(() =>
    callAnthropic(cfg, model, maxTokens, system, messages, !isThirdParty)
  );
}

export async function* streamChatResponse(
  messages: { role: 'user' | 'assistant'; content: string }[],
  options: {
    model?: ModelType;
    system?: string;
    maxTokens?: number;
  } = {}
): AsyncGenerator<string> {
  const { system, maxTokens = 4096 } = options;
  const cfg = await resolveConfig();
  const model = cfg.model || options.model || 'sonnet';

  if (cfg.protocol === 'openai') {
    const client = buildOpenAI(cfg);
    const fullMessages: { role: 'system' | 'user' | 'assistant'; content: string }[] = [];
    if (system) fullMessages.push({ role: 'system', content: system });
    fullMessages.push(...messages);

    const s = await client.chat.completions.create({
      model,
      max_tokens: maxTokens,
      messages: fullMessages,
      stream: true,
    });

    for await (const event of s) {
      const delta = event.choices[0]?.delta?.content;
      if (delta) yield delta;
    }
    return;
  }

  const client = buildAnthropic(cfg);
  const s = client.messages.stream({
    model,
    max_tokens: maxTokens,
    system: system || undefined,
    messages,
  });

  for await (const event of s) {
    if (event.type === 'content_block_delta' && event.delta.type === 'text_delta') {
      yield event.delta.text;
    }
  }
}
