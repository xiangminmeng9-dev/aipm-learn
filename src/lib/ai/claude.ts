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

function isTimeoutError(err: unknown): boolean {
  const msg = String(err);
  return msg.includes('timed out') || msg.includes('ETIMEDOUT') || msg.includes('ECONNRESET');
}

async function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

// TTL cache: avoid DB lookups on every AI call within the same session
interface CachedConfigEntry {
  config: AIConfig;
  userId: string;
  expiresAt: number;
}
const CONFIG_CACHE_TTL_MS = 60_000; // 60s
let cachedConfig: CachedConfigEntry | null = null;

// Export function to clear cache when user updates their AI config
export function clearAiConfigCache(): void {
  cachedConfig = null;
}

/**
 * Resolve AI config for server-side/cron contexts (no user session).
 * Uses environment variables directly — no cookie-based auth needed.
 * This is used by generateText in cron/background paths where
 * createClient() would fail or return no user.
 */
export function resolveServiceConfig(): AIConfig {
  // Try to read from dedicated cron env vars first
  const cronApiKey = cleanEnv(process.env.CRON_AI_API_KEY);
  const cronBaseURL = cleanEnv(process.env.CRON_AI_BASE_URL);
  const cronModel = cleanEnv(process.env.CRON_AI_MODEL);

  if (cronApiKey) {
    return {
      protocol: cronBaseURL ? 'openai' : 'anthropic',
      baseURL: cronBaseURL || undefined,
      apiKey: cronApiKey,
      model: cronModel || 'astron-code-latest',
    };
  }

  // Fallback to default env vars
  return DEFAULT_CONFIG;
}

async function resolveConfig(): Promise<AIConfig> {
  const now = Date.now();
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      cachedConfig = null;
      // No user session (cron/background context) — use service config
      return resolveServiceConfig();
    }

    if (cachedConfig && cachedConfig.userId === user.id && cachedConfig.expiresAt > now) {
      return cachedConfig.config;
    }

    const { data, error: dbError } = await supabase
      .from('user_ai_configs')
      .select('protocol, base_url, api_key, model')
      .eq('user_id', user.id)
      .maybeSingle();

    if (dbError) {
      console.error('[resolveConfig] DB query error:', dbError.message);
    }

    if (data && data.api_key && data.model) {
      let apiKey = data.api_key;
      try {
        apiKey = decrypt(apiKey);
      } catch {
        // Legacy unencrypted key — use as-is
        console.warn('[resolveConfig] decrypt failed, using raw key (legacy format)');
      }
      const config: AIConfig = {
        protocol: (data.protocol as AIProtocol) || 'anthropic',
        baseURL: data.base_url || undefined,
        apiKey,
        model: data.model,
      };
      cachedConfig = { config, userId: user.id, expiresAt: now + CONFIG_CACHE_TTL_MS };
      console.log('[resolveConfig] Using user config: protocol=' + config.protocol + ', model=' + config.model + ', baseURL=' + (config.baseURL || 'default'));
      return config;
    } else {
      console.warn('[resolveConfig] No user AI config found for user ' + user.id + ', falling back to DEFAULT_CONFIG');
    }
  } catch (err) {
    console.error('[resolveConfig] Unexpected error:', err instanceof Error ? err.message : String(err));
    // No user session or auth failure — use service config
    return resolveServiceConfig();
  }
  return DEFAULT_CONFIG;
}

function buildAnthropic(cfg: AIConfig): Anthropic {
  const isThirdParty = !!cfg.baseURL;
  return new Anthropic({
    apiKey: cfg.apiKey,
    baseURL: cfg.baseURL,
    timeout: 180_000,
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
    timeout: 180_000,
    maxRetries: 0,
  });
}

function makeCacheSystem(system: string | undefined) {
  if (!system) return undefined;
  return [
    { type: 'text' as const, text: system, cache_control: { type: 'ephemeral' as const } },
  ];
}

function makeCacheMessages(messages: { role: 'user' | 'assistant'; content: string }[]) {
  return messages.map((m, i) => {
    // Cache the last user message if it's long enough (prompt caching requires >1024 tokens for text blocks)
    const shouldCache = m.role === 'user' && i === messages.length - 1 && m.content.length > 1500;
    if (!shouldCache) return m;
    return {
      role: m.role,
      content: [{ type: 'text' as const, text: m.content, cache_control: { type: 'ephemeral' as const } }],
    };
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
  const isThirdParty = !!cfg.baseURL;
  const cachedSystem = isThirdParty ? (system || undefined) : makeCacheSystem(system);
  const cachedMessages = isThirdParty ? messages : makeCacheMessages(messages);

  if (stream) {
    const s = client.messages.stream({
      model,
      max_tokens: maxTokens,
      system: cachedSystem as Parameters<typeof client.messages.stream>[0]['system'],
      messages: cachedMessages as Parameters<typeof client.messages.stream>[0]['messages'],
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
    system: cachedSystem as Parameters<typeof client.messages.create>[0]['system'],
    messages: cachedMessages as Parameters<typeof client.messages.create>[0]['messages'],
  });

  return (resp as { content: { type: string; text?: string }[] }).content
    .map((c) => (c.type === 'text' && c.text ? c.text : ''))
    .join('');
}

async function withRetry<T>(fn: () => Promise<T>): Promise<T> {
  let lastErr: unknown;
  for (let i = 0; i <= RETRY_DELAYS.length; i++) {
    try {
      return await fn();
    } catch (err) {
      lastErr = err;
      if (i < RETRY_DELAYS.length && (isRateLimitError(err) || isTimeoutError(err))) {
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

// ──────────────────────────────────────────────
// Tool-use / Function-calling support
// ──────────────────────────────────────────────

export interface ToolDefinition {
  name: string;
  description: string;
  input_schema: Record<string, unknown>;
}

export interface ToolUseCall {
  id: string;
  name: string;
  input: Record<string, unknown>;
}

export interface ToolResultContent {
  tool_use_id: string;
  content: string;
  is_error?: boolean;
}

export interface ModelResponse {
  text: string;
  toolCalls: ToolUseCall[];
  stopReason: 'end_turn' | 'tool_use' | 'max_tokens' | 'stop_sequence' | string;
}

export type AgentMessage =
  | { role: 'user'; content: string }
  | { role: 'assistant'; content: Array<{ type: 'text'; text: string } | { type: 'tool_use'; id: string; name: string; input: Record<string, unknown> }> }
  | { role: 'user'; content: Array<{ type: 'tool_result'; tool_use_id: string; content: string; is_error?: boolean }> };

export interface GenerateWithToolsOptions {
  model?: 'sonnet' | 'haiku';
  system?: string;
  maxTokens?: number;
  tools?: ToolDefinition[];
  messages: AgentMessage[];
}

function resolveModel(config: AIConfig, hint?: string): string {
  return config.model || hint || 'sonnet';
}

/**
 * Call AI with tool_use support.
 * - Anthropic: native tool_use API
 * - OpenAI-compatible: native function_calling API
 * - Fallback (third-party): embed tool defs in prompt, parse structured output
 */
export async function generateWithTools(opts: GenerateWithToolsOptions): Promise<ModelResponse> {
  const config = await resolveConfig();
  const model = resolveModel(config, opts.model);
  const maxTokens = opts.maxTokens || 4096;
  const hasTools = opts.tools && opts.tools.length > 0;

  // Anthropic native tool_use
  if (config.protocol === 'anthropic' && hasTools) {
    try {
      return await callAnthropicWithTools(config, model, opts, maxTokens);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      console.warn('[generateWithTools] Anthropic tool_use failed, using fallback:', msg.slice(0, 100));
      return callFallbackWithTools(config, model, opts, maxTokens);
    }
  }

  // OpenAI-compatible: use fallback by default to avoid SDK format validation issues
  // (Agnes AI and other third-party providers often don't support function_calling correctly)
  if (config.protocol === 'openai' && hasTools) {
    return callFallbackWithTools(config, model, opts, maxTokens);
  }

  if (hasTools) return callFallbackWithTools(config, model, opts, maxTokens);

  // No tools — simple text generation
  const lastUserMsg = opts.messages.filter(m => m.role === 'user' && typeof m.content === 'string').pop();
  const prompt = lastUserMsg && typeof lastUserMsg.content === 'string' ? lastUserMsg.content : '';
  const text = await generateText(prompt, { model: opts.model, system: opts.system, maxTokens });
  return { text, toolCalls: [], stopReason: 'end_turn' };
}

async function callAnthropicWithTools(
  config: AIConfig, model: string, opts: GenerateWithToolsOptions, maxTokens: number
): Promise<ModelResponse> {
  const anthropic = new Anthropic({ apiKey: config.apiKey, baseURL: config.baseURL, timeout: 180_000, maxRetries: 0 });
  const apiMessages = opts.messages.map(m => {
    if (m.role === 'user' && typeof m.content === 'object') return { role: 'user' as const, content: m.content };
    if (m.role === 'assistant' && typeof m.content === 'object') return { role: 'assistant' as const, content: m.content };
    return { role: m.role as 'user' | 'assistant', content: m.content };
  });

  const resp = await withRetry(() =>
    anthropic.messages.create({
      model,
      max_tokens: maxTokens,
      system: opts.system || undefined,
      messages: apiMessages as Parameters<typeof anthropic.messages.create>[0]['messages'],
      tools: (opts.tools || []).map(t => ({
        name: t.name,
        description: t.description,
        input_schema: t.input_schema as { type: 'object'; properties: Record<string, unknown> },
      })),
    })
  );

  let text = '';
  const toolCalls: ToolUseCall[] = [];
  for (const block of resp.content) {
    if (block.type === 'text') text += block.text;
    if (block.type === 'tool_use') {
      toolCalls.push({ id: block.id, name: block.name, input: block.input as Record<string, unknown> });
    }
  }
  return { text, toolCalls, stopReason: (resp.stop_reason as string) || 'end_turn' };
}

async function callOpenAIWithTools(
  config: AIConfig, model: string, opts: GenerateWithToolsOptions, maxTokens: number
): Promise<ModelResponse> {
  const openai = buildOpenAI(config);
  const oaiMessages: Array<Record<string, unknown>> = [];

  if (opts.system) oaiMessages.push({ role: 'system', content: opts.system });

  for (const m of opts.messages) {
    if (m.role === 'user' && typeof m.content === 'object') {
      for (const block of m.content) {
        if (block.type === 'tool_result') {
          oaiMessages.push({ role: 'tool', tool_call_id: block.tool_use_id, content: block.content });
        }
      }
    } else if (m.role === 'assistant' && typeof m.content === 'object') {
      const texts = m.content.filter((b): b is { type: 'text'; text: string } => b.type === 'text').map(b => b.text).join('');
      const tools = m.content.filter((b): b is { type: 'tool_use'; id: string; name: string; input: Record<string, unknown> } => b.type === 'tool_use');
      oaiMessages.push({
        role: 'assistant',
        content: texts || null,
        ...(tools.length > 0 ? { tool_calls: tools.map(b => ({ id: b.id, type: 'function', function: { name: b.name, arguments: JSON.stringify(b.input) } })) } : {}),
      });
    } else {
      oaiMessages.push({ role: m.role, content: m.content });
    }
  }

  const resp = await withRetry(() =>
    openai.chat.completions.create({
      model,
      max_tokens: maxTokens,
      messages: oaiMessages as any,
      tools: (opts.tools || []).map(t => ({
        type: 'function' as const,
        function: { name: t.name, description: t.description, parameters: t.input_schema },
      })),
    })
  );

  const choice = resp.choices[0];
  const text = choice.message.content || '';
  const rawToolCalls = (choice.message as any).tool_calls || [];
  const toolCalls: ToolUseCall[] = rawToolCalls.map((tc: any) => ({
    id: tc.id, name: tc.function?.name || tc.name, input: JSON.parse(tc.function?.arguments || tc.arguments || '{}'),
  }));
  return { text, toolCalls, stopReason: (choice as any).finish_reason === 'tool_calls' ? 'tool_use' : ((choice as any).finish_reason || 'end_turn') };
}

/** Fallback: embed tool definitions in prompt, parse structured calls from text output */
async function callFallbackWithTools(
  config: AIConfig, model: string, opts: GenerateWithToolsOptions, maxTokens: number
): Promise<ModelResponse> {
  const toolText = (opts.tools || []).map(t =>
    `### Tool: ${t.name}\n${t.description}\nInput: ${JSON.stringify(t.input_schema)}`
  ).join('\n\n');

  const fallbackSystem = [
    opts.system || '',
    '\nYou have tools. To call a tool, output EXACTLY:',
    '<<<TOOL_CALL>>>',
    '{"name":"tool_name","input":{...}}',
    '<<<END_TOOL_CALL>>>',
    'You may call multiple tools. After tool calls, continue reasoning.',
    'When done, call the "finish" tool.',
    '\nAvailable tools:\n' + toolText,
  ].join('\n');

  const flatMsgs: Array<{ role: 'user' | 'assistant'; content: string }> = [];
  for (const m of opts.messages) {
    if (m.role === 'user' && typeof m.content === 'object') {
      const results = m.content.map(b => `[Tool Result ${b.tool_use_id}]: ${b.content}${b.is_error ? ' (ERROR)' : ''}`).join('\n');
      flatMsgs.push({ role: 'user', content: results });
    } else if (m.role === 'assistant' && typeof m.content === 'object') {
      const parts = m.content.map(b => {
        if (b.type === 'text') return b.text;
        if (b.type === 'tool_use') return `<<<TOOL_CALL>>>\n${JSON.stringify({ name: b.name, input: b.input })}\n<<<END_TOOL_CALL>>>`;
        return '';
      });
      flatMsgs.push({ role: 'assistant', content: parts.join('\n') });
    } else {
      flatMsgs.push({ role: m.role, content: m.content as string });
    }
  }

  // Build the full conversation as a single prompt string for fallback
  // We need to send ALL messages, not just the last one, so the AI has
  // context to make tool calls in the agent loop.
  const conversationParts: string[] = [];
  for (const m of flatMsgs) {
    if (m.role === 'assistant') {
      conversationParts.push(`Assistant: ${m.content}`);
    } else {
      conversationParts.push(`User: ${m.content}`);
    }
  }
  const fullConversation = conversationParts.join('\n\n');

  const text = await generateText(fullConversation, { model: opts.model, system: fallbackSystem, maxTokens });

  const toolCalls: ToolUseCall[] = [];
  const callRegex = /<<<TOOL_CALL>>>\s*([\s\S]*?)<<<END_TOOL_CALL>>>/g;
  let match;
  while ((match = callRegex.exec(text)) !== null) {
    try {
      const parsed = JSON.parse(match[1].trim());
      toolCalls.push({ id: `fb_${toolCalls.length}`, name: parsed.name, input: parsed.input || {} });
    } catch { /* skip malformed */ }
  }
  const remainingText = text.replace(callRegex, '').trim();
  return { text: remainingText, toolCalls, stopReason: toolCalls.length > 0 ? 'tool_use' : 'end_turn' };
}
