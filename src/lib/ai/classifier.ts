import { generateText } from './claude';
import { buildClassifierPrompt, CLASSIFIER_SYSTEM_PROMPT } from './prompts';

export interface ClassifyResult {
  typeName: string;
  isNew: boolean;
}

const KEYWORD_MAP: Record<string, string[]> = {
  'AI产品思维': ['ai产品', 'ai pm', '产品思维', '产品感', '产品经理', 'ai应用'],
  '需求分析': ['需求', '用户需求', '需求分析', '需求澄清', '需求拆解', 'prd'],
  '竞品分析': ['竞品', '竞品分析', '市场分析', '竞争对手', '对标'],
  '算法沟通': ['算法', '模型', '训练', '推理', '算法团队', '算法工程师', '技术沟通'],
  '数据指标': ['指标', '数据', '埋点', 'ab测试', '数据分析', '效果评估', '评估指标'],
  '产品设计': ['设计', '原型', '交互', '用户体验', 'ux', '产品设计'],
  '项目管理': ['项目', '排期', '进度', '协作', '项目管理', '敏捷'],
  '用户研究': ['用户研究', '用户调研', '用户访谈', '问卷', '用研'],
};

function classifyByKeywords(question: string): string | null {
  const q = question.toLowerCase();
  for (const [type, keywords] of Object.entries(KEYWORD_MAP)) {
    if (keywords.some(kw => q.includes(kw))) return type;
  }
  return null;
}

export async function classifyQuestion(
  question: string,
  existingTypes: { id: string; name: string }[]
): Promise<ClassifyResult> {
  try {
    const typeNames = existingTypes.map((t) => t.name);
    const prompt = buildClassifierPrompt(question, typeNames);

    const result = await generateText(prompt, {
      model: 'haiku',
      system: CLASSIFIER_SYSTEM_PROMPT,
      maxTokens: 50,
    });

    const typeName = result.trim();
    const existing = existingTypes.find(
      (t) => t.name === typeName || t.name.includes(typeName) || typeName.includes(t.name)
    );

    if (existing) {
      return { typeName: existing.name, isNew: false };
    }

    return { typeName, isNew: true };
  } catch {
    // Fallback: keyword-based classification
    const keywordType = classifyByKeywords(question);
    if (keywordType) {
      const existing = existingTypes.find(t => t.name === keywordType);
      if (existing) return { typeName: existing.name, isNew: false };
    }

    // Last resort: use first existing type
    if (existingTypes.length > 0) {
      return { typeName: existingTypes[0].name, isNew: false };
    }

    return { typeName: '通用', isNew: true };
  }
}
