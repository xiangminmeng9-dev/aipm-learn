import { STAGES_CONFIG } from '@/lib/simulator-config';

export function buildStageSystemPrompt(stageId: string): string {
  const stage = STAGES_CONFIG.find(s => s.id === stageId);
  if (!stage) return '你是一个 AI 助手。';
  return stage.systemPrompt;
}

export function buildEvaluationPrompt(stageId: string, conversation: string): string {
  const stage = STAGES_CONFIG.find(s => s.id === stageId);
  if (!stage) return '';

  return `你现在不再扮演角色。你是一个客观严格的评审专家。

请根据以下对话记录和通关标准，评估用户（AI 产品经理）的表现。

## 通关标准
${stage.passCriteria}

## 对话记录
${conversation}

请严格按照以下 JSON 格式输出评估结果（不要用 markdown 代码块包裹）：
{
  "passed": true或false,
  "score": 0到100的整数分数,
  "feedback": "详细的评价，指出做得好的地方和需要改进的地方，200字以内"
}`;
}

export const EVALUATION_SYSTEM_PROMPT = '你是一个 AI PM 模拟工作流程的评审专家。你需要根据用户在模拟场景中的表现进行客观评估。输出严格的 JSON 格式。';
