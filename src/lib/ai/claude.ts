import Anthropic from '@anthropic-ai/sdk';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY!,
});

export type ModelType = 'sonnet' | 'haiku';

const MODEL_MAP: Record<ModelType, string> = {
  sonnet: 'claude-sonnet-4-20250514',
  haiku: 'claude-haiku-4-5-20251001',
};

export async function generateText(
  prompt: string,
  options: {
    model?: ModelType;
    system?: string;
    maxTokens?: number;
  } = {}
): Promise<string> {
  const { model = 'sonnet', system, maxTokens = 4096 } = options;

  const response = await anthropic.messages.create({
    model: MODEL_MAP[model],
    max_tokens: maxTokens,
    system: system || undefined,
    messages: [{ role: 'user', content: prompt }],
  });

  const block = response.content[0];
  if (block.type === 'text') {
    return block.text;
  }
  return '';
}

export async function generateChatResponse(
  messages: { role: 'user' | 'assistant'; content: string }[],
  options: {
    model?: ModelType;
    system?: string;
    maxTokens?: number;
  } = {}
): Promise<string> {
  const { model = 'sonnet', system, maxTokens = 4096 } = options;

  const response = await anthropic.messages.create({
    model: MODEL_MAP[model],
    max_tokens: maxTokens,
    system: system || undefined,
    messages,
  });

  const block = response.content[0];
  if (block.type === 'text') {
    return block.text;
  }
  return '';
}

export async function* streamChatResponse(
  messages: { role: 'user' | 'assistant'; content: string }[],
  options: {
    model?: ModelType;
    system?: string;
    maxTokens?: number;
  } = {}
): AsyncGenerator<string> {
  const { model = 'sonnet', system, maxTokens = 4096 } = options;

  const stream = anthropic.messages.stream({
    model: MODEL_MAP[model],
    max_tokens: maxTokens,
    system: system || undefined,
    messages,
  });

  for await (const event of stream) {
    if (
      event.type === 'content_block_delta' &&
      event.delta.type === 'text_delta'
    ) {
      yield event.delta.text;
    }
  }
}
