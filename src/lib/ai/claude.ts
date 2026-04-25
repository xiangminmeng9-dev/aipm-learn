import Anthropic from '@anthropic-ai/sdk';
import OpenAI from 'openai';
import { createClient } from '@/lib/supabase/server';

export type ModelType = 'sonnet' | 'haiku';
export type AIProtocol = 'anthropic' | 'openai';

interface AIConfig {
  protocol: AIProtocol;
  baseURL: string | undefined;
  apiKey: string;
  model: string;
}

const DEFAULT_CONFIG: AIConfig = {
  protocol: 'anthropic',
  baseURL: process.env.ANTHROPIC_BASE_URL || undefined,
  apiKey: process.env.ANTHROPIC_API_KEY!,
  model: 'astron-code-latest',
};

async function resolveConfig(): Promise<AIConfig> {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return DEFAULT_CONFIG;

    const { data } = await supabase
      .from('user_ai_configs')
      .select('protocol, base_url, api_key, model')
      .eq('user_id', user.id)
      .maybeSingle();

    if (data && data.api_key && data.model) {
      return {
        protocol: (data.protocol as AIProtocol) || 'anthropic',
        baseURL: data.base_url || undefined,
        apiKey: data.api_key,
        model: data.model,
      };
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

  if (cfg.protocol === 'openai') {
    const client = buildOpenAI(cfg);
    const messages: { role: 'system' | 'user'; content: string }[] = [];
    if (system) messages.push({ role: 'system', content: system });
    messages.push({ role: 'user', content: prompt });

    const resp = await client.chat.completions.create({
      model: cfg.model,
      max_tokens: maxTokens,
      messages,
    });
    return resp.choices[0]?.message?.content ?? '';
  }

  // Anthropic — use streaming to avoid timeout on slow responses
  const client = buildAnthropic(cfg);
  const stream = client.messages.stream({
    model: cfg.model,
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

  if (cfg.protocol === 'openai') {
    const client = buildOpenAI(cfg);
    const fullMessages: { role: 'system' | 'user' | 'assistant'; content: string }[] = [];
    if (system) fullMessages.push({ role: 'system', content: system });
    fullMessages.push(...messages);

    const resp = await client.chat.completions.create({
      model: cfg.model,
      max_tokens: maxTokens,
      messages: fullMessages,
    });
    return resp.choices[0]?.message?.content ?? '';
  }

  // Anthropic — use streaming to avoid timeout
  const client = buildAnthropic(cfg);
  const stream = client.messages.stream({
    model: cfg.model,
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

  if (cfg.protocol === 'openai') {
    const client = buildOpenAI(cfg);
    const fullMessages: { role: 'system' | 'user' | 'assistant'; content: string }[] = [];
    if (system) fullMessages.push({ role: 'system', content: system });
    fullMessages.push(...messages);

    const stream = await client.chat.completions.create({
      model: cfg.model,
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
    model: cfg.model,
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
