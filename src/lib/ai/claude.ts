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

// Request-level cache: resolved once per request, reused across AI calls
let cachedConfig: { config: AIConfig; userId: string } | null = null;

async function resolveConfig(): Promise<AIConfig> {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { cachedConfig = null; return DEFAULT_CONFIG; }

    // Return cached config if same user within this request
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
  return new Anthropic({
    apiKey: cfg.apiKey,
    baseURL: cfg.baseURL,
    timeout: 120_000,
    maxRetries: 2,
  });
}

function buildOpenAI(cfg: AIConfig): OpenAI {
  return new OpenAI({
    apiKey: cfg.apiKey,
    baseURL: cfg.baseURL,
    timeout: 120_000,
    maxRetries: 2,
  });
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
  // Only use sonnet/haiku when using official Anthropic API (no custom baseURL)
  const isOfficialAnthropic = !cfg.baseURL;
  const model = (isOfficialAnthropic && options.model) ? options.model : cfg.model;

  if (cfg.protocol === 'openai') {
    const client = buildOpenAI(cfg);
    const messages: { role: 'system' | 'user'; content: string }[] = [];
    if (system) messages.push({ role: 'system', content: system });
    messages.push({ role: 'user', content: prompt });

    const resp = await client.chat.completions.create({
      model,
      max_tokens: maxTokens,
      messages,
    });
    return resp.choices[0]?.message?.content ?? '';
  }

  // Anthropic — use streaming to avoid timeout on slow responses
  const client = buildAnthropic(cfg);
  const stream = client.messages.stream({
    model,
    max_tokens: maxTokens,
    system: system || undefined,
    messages: [{ role: 'user', content: prompt }],
  });

  let result = '';
  for await (const event of stream) {
    if (event.type === 'content_block_delta' && event.delta.type === 'text_delta') {
      result += event.delta.text;
    }
  }
  return result;
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
  // Only use sonnet/haiku when using official Anthropic API (no custom baseURL)
  const isOfficialAnthropic = !cfg.baseURL;
  const model = (isOfficialAnthropic && options.model) ? options.model : cfg.model;

  if (cfg.protocol === 'openai') {
    const client = buildOpenAI(cfg);
    const fullMessages: { role: 'system' | 'user' | 'assistant'; content: string }[] = [];
    if (system) fullMessages.push({ role: 'system', content: system });
    fullMessages.push(...messages);

    const resp = await client.chat.completions.create({
      model,
      max_tokens: maxTokens,
      messages: fullMessages,
    });
    return resp.choices[0]?.message?.content ?? '';
  }

  // Anthropic — use streaming to avoid timeout
  const client = buildAnthropic(cfg);
  const stream = client.messages.stream({
    model,
    max_tokens: maxTokens,
    system: system || undefined,
    messages,
  });

  let result = '';
  for await (const event of stream) {
    if (event.type === 'content_block_delta' && event.delta.type === 'text_delta') {
      result += event.delta.text;
    }
  }
  return result;
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
  // Only use sonnet/haiku when using official Anthropic API (no custom baseURL)
  const isOfficialAnthropic = !cfg.baseURL;
  const model = (isOfficialAnthropic && options.model) ? options.model : cfg.model;

  if (cfg.protocol === 'openai') {
    const client = buildOpenAI(cfg);
    const fullMessages: { role: 'system' | 'user' | 'assistant'; content: string }[] = [];
    if (system) fullMessages.push({ role: 'system', content: system });
    fullMessages.push(...messages);

    const stream = await client.chat.completions.create({
      model,
      max_tokens: maxTokens,
      messages: fullMessages,
      stream: true,
    });

    for await (const event of stream) {
      const delta = event.choices[0]?.delta?.content;
      if (delta) yield delta;
    }
    return;
  }

  const client = buildAnthropic(cfg);
  const stream = client.messages.stream({
    model,
    max_tokens: maxTokens,
    system: system || undefined,
    messages,
  });

  for await (const event of stream) {
    if (event.type === 'content_block_delta' && event.delta.type === 'text_delta') {
      yield event.delta.text;
    }
  }
}
