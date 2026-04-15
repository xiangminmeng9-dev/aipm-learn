import { generateText } from './claude';
import { buildCompressionPrompt, COMPRESSION_SYSTEM_PROMPT } from './prompts';
import { estimateTokens, shouldCompress } from '@/lib/utils/tokens';

const SLIDING_WINDOW_SIZE = 10; // 保留最近 10 轮完整对话
const CONTEXT_WINDOW = 200000;
const COMPRESSION_THRESHOLD = 0.7;

interface Message {
  role: 'user' | 'assistant';
  content: string;
  token_count: number;
  is_compressed: boolean;
}

/**
 * 计算消息列表的总 token 数
 */
export function calculateTotalTokens(messages: Message[]): number {
  return messages.reduce((sum, m) => sum + m.token_count, 0);
}

/**
 * 检查是否需要压缩
 */
export function checkCompressionNeeded(messages: Message[], newMessageTokens: number): boolean {
  const totalTokens = calculateTotalTokens(messages) + newMessageTokens;
  return shouldCompress(totalTokens, CONTEXT_WINDOW, COMPRESSION_THRESHOLD);
}

/**
 * 执行记忆压缩：将旧消息压缩为摘要，保留最近 N 轮
 */
export async function compressMemory(
  messages: Message[]
): Promise<{ summary: string; messagesToKeep: Message[] }> {
  // 保留最近 SLIDING_WINDOW_SIZE 轮（每轮 = 1 user + 1 assistant）
  const recentCount = SLIDING_WINDOW_SIZE * 2;
  const messagesToCompress = messages.slice(0, -recentCount);
  const messagesToKeep = messages.slice(-recentCount);

  if (messagesToCompress.length === 0) {
    return { summary: '', messagesToKeep: messages };
  }

  // 将旧消息格式化为文本
  const messagesText = messagesToCompress
    .map((m) => `${m.role === 'user' ? '候选人' : '教练'}：${m.content}`)
    .join('\n\n');

  // 调用 Haiku 压缩
  const prompt = buildCompressionPrompt(messagesText);
  const summary = await generateText(prompt, {
    model: 'haiku',
    system: COMPRESSION_SYSTEM_PROMPT,
    maxTokens: 1024,
  });

  return { summary, messagesToKeep };
}

/**
 * 组装发送给 AI 的上下文
 */
export function buildChatContext(options: {
  systemPrompt: string;
  compressedSummary: string | null;
  recentMessages: Message[];
}): { role: 'user' | 'assistant'; content: string }[] {
  const messages: { role: 'user' | 'assistant'; content: string }[] = [];

  // 添加压缩摘要作为上下文
  if (options.compressedSummary) {
    messages.push({
      role: 'assistant',
      content: `[历史对话摘要]\n${options.compressedSummary}`,
    });
  }

  // 添加最近消息
  for (const msg of options.recentMessages) {
    messages.push({ role: msg.role, content: msg.content });
  }

  return messages;
}

export { estimateTokens };
