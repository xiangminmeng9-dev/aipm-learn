// ============================================================
// Prompt Templates — AI PM Interview Assistant
// ============================================================

/**
 * 问题分析 prompt：要求输出四部分（问题分析、思考方式、回答思路、口语化模板）
 */
export function buildAnalysisPrompt(question: string): string {
  return `你是一位资深的 AI 产品经理面试教练。请对以下面试问题进行深度分析，严格按照四部分输出：

## 问题分析
分析这道问题背后的考察逻辑、面试官真正想了解什么、这类问题的常见陷阱。

## 思考方式
给出结构化的思考框架（如 STAR、5W2H、用户旅程等），帮助候选人建立答题思路。

## 回答思路
提供清晰的逻辑链和答题要点，按优先级排列，包含具体论据和案例方向。

## 口语化模板
用第一人称写一段自然流畅的面试回答示范，像在真实面试中说话一样，不要用列表符号，用段落式表达。

面试问题：${question}`;
}

export const ANALYSIS_SYSTEM_PROMPT = `你是一位专业的 AI 产品经理面试教练，擅长帮助候选人深度理解面试问题并构建高质量回答。
你的分析要具体、有洞察力，避免泛泛而谈。口语化模板要自然流畅，像真实面试对话。`;

/**
 * 问题类型分类 prompt：接收问题文本 + 已有类型列表，返回分类结果或建议新类型
 */
export function buildClassifierPrompt(question: string, existingTypes: string[]): string {
  const typeList = existingTypes.join('、');
  return `请判断以下面试问题属于哪种类型。

已有类型列表：${typeList}

如果问题属于已有类型，返回该类型名称。
如果问题不属于任何已有类型，建议一个新的类型名称（简短，如"XX类"）。

面试问题：${question}

请只返回类型名称，不要返回其他内容。`;
}

export const CLASSIFIER_SYSTEM_PROMPT = `你是一个面试问题分类器。根据问题内容判断其所属类型。
只返回类型名称，不要返回任何解释。如果属于已有类型，返回已有类型名；否则建议新类型名。`;

/**
 * Session 对话 system prompt
 */
export function buildSessionSystemPrompt(options: {
  jdText?: string | null;
  resumeText?: string | null;
  compressedSummary?: string | null;
}): string {
  let prompt = `你是一位资深的 AI 产品经理面试教练，正在与候选人进行一对一的面试准备对话。
你的职责是：
1. 回答候选人关于面试问题的疑问
2. 帮助候选人优化回答思路
3. 提供针对性的建议和改进方向
4. 适时追问，帮助候选人深入思考

请用专业但亲切的语气回答，给出具体可操作的建议。`;

  if (options.jdText) {
    prompt += `\n\n--- 目标岗位 JD ---\n${options.jdText}`;
  }

  if (options.resumeText) {
    prompt += `\n\n--- 候选人简历 ---\n${options.resumeText}`;
  }

  if (options.compressedSummary) {
    prompt += `\n\n--- 历史对话摘要 ---\n${options.compressedSummary}`;
  }

  return prompt;
}

/**
 * 记忆压缩 prompt：将旧消息压缩为摘要
 */
export function buildCompressionPrompt(messages: string): string {
  return `请将以下面试准备对话历史压缩为一段简洁的摘要，保留关键信息：
1. 讨论过的主要话题和问题类型
2. 候选人的核心困惑和已获得的建议
3. 重要的结论和待改进的方向

对话历史：
${messages}`;
}

export const COMPRESSION_SYSTEM_PROMPT = `你是一个对话摘要压缩器。将长对话压缩为简洁摘要，保留关键信息点，去除冗余内容。摘要应便于后续对话参考。`;

/**
 * 模拟面试出题 prompt
 */
export function buildMockQuestionPrompt(options: {
  typeName: string;
  jdText?: string | null;
  resumeText?: string | null;
  previousQuestions?: string[];
  questionNumber: number;
  totalQuestions: number;
}): string {
  let prompt = `你是一位 AI 产品经理面试官，正在对候选人进行模拟面试。

面试类型：${options.typeName}
当前是第 ${options.questionNumber} 题（共 ${options.totalQuestions} 题）。

请出一道${options.typeName}的面试问题。要求：
- 问题要有深度，考察真实的产品思维
- 难度适中，适合 3-5 年经验的 AI 产品经理
- 问题表述清晰，避免歧义`;

  if (options.jdText) {
    prompt += `\n- 结合目标岗位 JD 出题：${options.jdText}`;
  }

  if (options.resumeText) {
    prompt += `\n- 根据候选人简历针对性出题：${options.resumeText}`;
  }

  if (options.previousQuestions && options.previousQuestions.length > 0) {
    prompt += `\n\n已出过的题目（不要重复）：\n${options.previousQuestions.map((q, i) => `${i + 1}. ${q}`).join('\n')}`;
  }

  prompt += '\n\n请只输出面试问题，不要输出其他内容。';

  return prompt;
}

export const MOCK_QUESTION_SYSTEM_PROMPT = `你是一位严格的 AI 产品经理面试官。你的问题要专业、有深度，考察真实的产品思维和 AI 理解。`;

/**
 * 模拟面试评分 prompt
 */
export function buildMockScoringPrompt(options: {
  question: string;
  answer: string;
  typeName: string;
}): string {
  return `请对以下模拟面试回答进行评分和分析。

面试问题：${options.question}
问题类型：${options.typeName}
候选人回答：${options.answer}

请按以下格式输出（严格使用 JSON）：
{
  "score": <0-10的分数，保留一位小数>,
  "gap_analysis": "<差距分析：回答中缺少的关键点、逻辑漏洞、可改进之处>",
  "perfect_answer": "<满分回答示范：简洁完整的参考答案>"
}`;
}

export const MOCK_SCORING_SYSTEM_PROMPT = `你是一位专业的 AI 产品经理面试评分官。评分要客观公正，满分回答要具体可操作。输出严格的 JSON 格式。`;

/**
 * 模拟面试总结 prompt
 */
export function buildMockSummaryPrompt(options: {
  answers: { question: string; answer: string | null; score: number | null; is_skipped: boolean }[];
  typeName: string;
}): string {
  const answersText = options.answers
    .map(
      (a, i) =>
        `第${i + 1}题：${a.question}\n回答：${a.is_skipped ? '（跳过）' : a.answer}\n得分：${a.score ?? 'N/A'}`
    )
    .join('\n\n');

  return `请根据以下模拟面试数据生成总结报告。

面试类型：${options.typeName}

答题记录：
${answersText}

请按以下格式输出（严格使用 JSON）：
{
  "strengths": "<强项分析：候选人表现好的方面>",
  "weaknesses": "<弱项分析：需要重点改进的方面>",
  "suggestions": "<改进建议：具体可执行的提升方向>"
}`;
}

export const MOCK_SUMMARY_SYSTEM_PROMPT = `你是一位资深的 AI 产品经理面试教练，擅长总结面试表现并给出针对性建议。输出严格的 JSON 格式。`;

/**
 * 方法论提炼 prompt
 */
export function buildMethodologyPrompt(options: {
  typeName: string;
  qaHistory: {
    question: string;
    analysis: string;
    thinking_framework: string;
    answer_approach: string;
  }[];
}): string {
  const historyText = options.qaHistory
    .map(
      (qa, i) =>
        `问题${i + 1}：${qa.question}\n分析：${qa.analysis}\n思考框架：${qa.thinking_framework}\n回答思路：${qa.answer_approach}`
    )
    .join('\n\n');

  return `请基于以下${options.typeName}的问答练习历史，提炼出该类型的方法论。

练习历史：
${historyText}

请按以下格式输出（严格使用 JSON）：
{
  "framework": "<核心框架：该类型问题的通用解题框架，2-3句话概括>",
  "key_steps": ["<步骤1>", "<步骤2>", "<步骤3>", ...],
  "typical_cases": ["<典型案例1>", "<典型案例2>", ...]
}`;
}

export const METHODOLOGY_SYSTEM_PROMPT = `你是一位方法论提炼专家，擅长从大量练习数据中抽象出通用的解题框架和步骤。输出严格的 JSON 格式。`;
