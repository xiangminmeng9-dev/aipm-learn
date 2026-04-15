import { generateText } from './claude';
import { buildClassifierPrompt, CLASSIFIER_SYSTEM_PROMPT } from './prompts';

export interface ClassifyResult {
  typeName: string;
  isNew: boolean;
}

/**
 * 问题类型分类器
 * 接收问题文本 + 已有类型列表，调用 Haiku 返回分类结果或建议新类型
 */
export async function classifyQuestion(
  question: string,
  existingTypes: { id: string; name: string }[]
): Promise<ClassifyResult> {
  const typeNames = existingTypes.map((t) => t.name);
  const prompt = buildClassifierPrompt(question, typeNames);

  const result = await generateText(prompt, {
    model: 'haiku',
    system: CLASSIFIER_SYSTEM_PROMPT,
    maxTokens: 100,
  });

  const typeName = result.trim();
  const existing = existingTypes.find(
    (t) => t.name === typeName || t.name.includes(typeName) || typeName.includes(t.name)
  );

  if (existing) {
    return { typeName: existing.name, isNew: false };
  }

  return { typeName, isNew: true };
}
