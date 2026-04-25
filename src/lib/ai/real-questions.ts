// ============================================================
// Real Interview Questions — From Major Tech Companies
// Enhanced with more categories and questions
// ============================================================

export interface RealQuestion {
  question: string;
  source: string;
  difficulty: 'easy' | 'medium' | 'hard';
}

const REAL_INTERVIEW_QUESTIONS: Record<string, RealQuestion[]> = {
  'AI产品思维': [
    { question: '请介绍一下你对AI产品经理这个岗位的理解？和传统产品经理有什么区别？', source: '字节跳动', difficulty: 'easy' },
    { question: '如何设计一个AI客服产品的MVP版本？', source: '美团', difficulty: 'medium' },
    { question: 'AI产品的商业化路径有哪些？请举例说明。', source: '阿里巴巴', difficulty: 'medium' },
    { question: '如何衡量AI产品对业务的价值？ROI如何计算？', source: '美团', difficulty: 'hard' },
    { question: '如何设计AI产品的用户反馈机制？', source: '百度', difficulty: 'medium' },
    { question: 'AI产品如何做冷启动？新用户没有历史数据怎么办？', source: '字节跳动', difficulty: 'hard' },
    { question: '如何平衡AI产品的自动化程度和用户控制感？', source: '腾讯', difficulty: 'hard' },
    { question: '请设计一个AI写作助手的核心功能优先级。', source: '阿里巴巴', difficulty: 'medium' },
    { question: 'AI产品的用户体验和传统产品有什么不同？需要额外关注什么？', source: '百度', difficulty: 'easy' },
    { question: '如何设计AI产品的错误处理和降级方案？', source: '腾讯', difficulty: 'hard' },
  ],
  'AI技术理解': [
    { question: '请描述RAG技术的基本原理，以及在产品中如何应用？', source: '腾讯', difficulty: 'medium' },
    { question: '请解释什么是模型幻觉？在产品层面如何规避？', source: '字节跳动', difficulty: 'hard' },
    { question: '请解释Agent的概念，以及在产品中的应用场景。', source: '百度', difficulty: 'medium' },
    { question: '如何评估Prompt Engineering的效果？', source: '字节跳动', difficulty: 'medium' },
    { question: '请解释Fine-tuning和RAG的区别，各自适用场景是什么？', source: '华为', difficulty: 'hard' },
    { question: '大模型的Token限制对产品设计有什么影响？如何解决？', source: '腾讯', difficulty: 'medium' },
    { question: '请介绍ChatGPT的基本原理？', source: '字节跳动', difficulty: 'easy' },
    { question: '如何为大模型应用设计Prompt模板？', source: '阿里巴巴', difficulty: 'medium' },
    { question: 'MCP协议是什么？对AI产品有什么影响？', source: '字节跳动', difficulty: 'medium' },
    { question: '如何评估大模型在特定任务上的表现？', source: '百度', difficulty: 'medium' },
    { question: '大模型应用如何做A/B测试？', source: '阿里巴巴', difficulty: 'medium' },
    { question: '如何处理大模型的敏感内容输出？', source: '腾讯', difficulty: 'medium' },
  ],
  '用户研究': [
    { question: 'AI产品的用户研究方法和传统产品有什么不同？', source: '字节跳动', difficulty: 'easy' },
    { question: '如何评估用户对AI输出的信任度？', source: '阿里巴巴', difficulty: 'medium' },
    { question: '如何设计AI产品的用户满意度调研？', source: '腾讯', difficulty: 'medium' },
    { question: 'AI产品的用户画像和传统产品有什么区别？', source: '百度', difficulty: 'medium' },
    { question: '如何通过用户反馈数据优化AI模型效果？', source: '美团', difficulty: 'hard' },
    { question: 'AI产品如何做可用性测试？和传统产品有什么不同？', source: '字节跳动', difficulty: 'medium' },
  ],
  '数据分析': [
    { question: '如何评估一个大模型产品的上线效果？有哪些关键指标？', source: '阿里巴巴', difficulty: 'medium' },
    { question: '如何平衡AI产品的准确率和召回率？', source: '阿里巴巴', difficulty: 'hard' },
    { question: 'AI产品的数据飞轮怎么建？', source: '字节跳动', difficulty: 'hard' },
    { question: '如何设计AI产品的数据埋点方案？', source: '腾讯', difficulty: 'medium' },
    { question: 'AI产品的A/B测试有哪些特殊考虑？', source: '百度', difficulty: 'medium' },
    { question: '如何用数据分析驱动AI产品的迭代优化？', source: '美团', difficulty: 'hard' },
  ],
  '项目管理': [
    { question: 'AI产品项目的不确定性比传统项目高，如何做项目管理？', source: '字节跳动', difficulty: 'medium' },
    { question: 'AI产品的需求变更频繁，如何控制项目范围？', source: '阿里巴巴', difficulty: 'medium' },
    { question: '如何协调算法团队和产品团队的目标差异？', source: '腾讯', difficulty: 'hard' },
    { question: 'AI产品从0到1的过程中，如何设定里程碑？', source: '百度', difficulty: 'medium' },
    { question: 'AI产品的技术债务如何管理？', source: '华为', difficulty: 'hard' },
  ],
  '沟通协作': [
    { question: '如何向非技术背景的老板解释AI产品的局限性？', source: '字节跳动', difficulty: 'medium' },
    { question: 'AI产品经理如何与算法工程师高效协作？', source: '阿里巴巴', difficulty: 'medium' },
    { question: '如何处理业务方对AI产品效果的不合理期望？', source: '腾讯', difficulty: 'hard' },
    { question: '如何推动组织对AI产品的接受和采纳？', source: '百度', difficulty: 'medium' },
  ],
  '商业思维': [
    { question: 'AI产品的定价策略有哪些？如何平衡成本和用户价值？', source: '字节跳动', difficulty: 'hard' },
    { question: '如何评估AI产品的市场机会？', source: '阿里巴巴', difficulty: 'medium' },
    { question: 'AI产品的护城河在哪里？', source: '腾讯', difficulty: 'hard' },
    { question: '如何做AI产品的竞品分析？', source: '百度', difficulty: 'medium' },
    { question: 'AI SaaS产品的增长策略有哪些？', source: '美团', difficulty: 'hard' },
  ],
  '创新思维': [
    { question: '如何发现AI可以解决的新场景和新需求？', source: '字节跳动', difficulty: 'medium' },
    { question: 'AI产品的创新和传统产品创新有什么不同？', source: '阿里巴巴', difficulty: 'medium' },
    { question: '如何在成熟产品中引入AI能力？请举例说明。', source: '腾讯', difficulty: 'hard' },
    { question: 'AI产品的差异化竞争策略有哪些？', source: '百度', difficulty: 'hard' },
  ],
  'AI伦理与合规': [
    { question: '如何设计AI产品的安全机制？防止用户滥用？', source: '腾讯', difficulty: 'hard' },
    { question: 'AI产品的隐私保护应该怎么做？', source: '百度', difficulty: 'medium' },
    { question: '如何处理AI产品的偏见和公平性问题？', source: '阿里巴巴', difficulty: 'hard' },
    { question: '中国AI产品的合规要求有哪些？算法备案怎么做？', source: '字节跳动', difficulty: 'medium' },
    { question: 'AI产品的内容审核机制如何设计？', source: '腾讯', difficulty: 'medium' },
  ],
  '大模型应用设计': [
    { question: '如果用户反馈AI回答不准确，你会如何分析和解决这个问题？', source: '百度', difficulty: 'medium' },
    { question: '大模型在垂直领域落地时，如何解决领域知识不足的问题？', source: '华为', difficulty: 'hard' },
    { question: '如何设计大模型应用的缓存策略？', source: '字节跳动', difficulty: 'hard' },
    { question: '请设计一个基于大模型的知识库问答产品。', source: '阿里巴巴', difficulty: 'hard' },
    { question: '大模型应用的延迟优化有哪些方案？', source: '腾讯', difficulty: 'medium' },
    { question: '如何设计大模型的多轮对话体验？', source: '百度', difficulty: 'medium' },
    { question: 'AI编程助手产品如何设计？核心功能有哪些？', source: '字节跳动', difficulty: 'medium' },
    { question: '如何评估和选择适合业务场景的大模型？', source: '阿里巴巴', difficulty: 'medium' },
  ],
  '推荐算法': [
    { question: '请介绍推荐系统的基本架构？', source: '字节跳动', difficulty: 'easy' },
    { question: '如何评估推荐算法的效果？', source: '阿里巴巴', difficulty: 'medium' },
    { question: '推荐系统的冷启动问题如何解决？', source: '腾讯', difficulty: 'hard' },
    { question: '如何平衡推荐的准确性和多样性？', source: '美团', difficulty: 'hard' },
    { question: '请解释协同过滤和内容推荐的优缺点？', source: '百度', difficulty: 'medium' },
  ],
  'NLP': [
    { question: '请介绍NLP的基本任务有哪些？', source: '百度', difficulty: 'easy' },
    { question: '如何评估文本分类模型的效果？', source: '阿里巴巴', difficulty: 'medium' },
    { question: '请解释BERT和GPT的区别？', source: '字节跳动', difficulty: 'medium' },
    { question: '如何设计一个智能问答系统？', source: '腾讯', difficulty: 'hard' },
    { question: '文本相似度计算有哪些方法？', source: '百度', difficulty: 'medium' },
  ],
  '计算机视觉': [
    { question: '请介绍计算机视觉的主要应用场景？', source: '字节跳动', difficulty: 'easy' },
    { question: '如何评估图像识别模型的准确率？', source: '阿里巴巴', difficulty: 'medium' },
    { question: 'OCR产品如何设计用户体验？', source: '腾讯', difficulty: 'medium' },
    { question: '如何解决图像识别中的长尾问题？', source: '百度', difficulty: 'hard' },
  ],
};

// Category name mapping for fuzzy matching
const CATEGORY_ALIASES: Record<string, string[]> = {
  'AI产品思维': ['AI产品', '产品思维', '产品设计', '产品经理'],
  'AI技术理解': ['AI技术', '技术理解', '大模型', 'LLM'],
  '大模型应用设计': ['大模型应用', '大模型', 'LLM应用'],
  'AI伦理与合规': ['AI伦理', '合规', '安全', '隐私'],
};

function resolveCategory(category: string): string {
  if (REAL_INTERVIEW_QUESTIONS[category]) return category;
  for (const [key, aliases] of Object.entries(CATEGORY_ALIASES)) {
    if (aliases.some(a => category.includes(a))) return key;
  }
  return 'AI产品思维';
}

/**
 * Get real interview questions from the question bank
 */
export function getRealQuestions(category?: string, difficulty?: string, count: number = 5): RealQuestion[] {
  const resolvedCategory = category ? resolveCategory(category) : 'AI产品思维';
  const categoryQuestions = REAL_INTERVIEW_QUESTIONS[resolvedCategory] || REAL_INTERVIEW_QUESTIONS['AI产品思维'];

  let filtered = categoryQuestions;
  if (difficulty && difficulty !== 'all') {
    filtered = categoryQuestions.filter((q) => q.difficulty === difficulty);
  }

  const shuffled = [...filtered].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count);
}

/**
 * Get real questions context text (for injecting into prompts)
 */
export function getRealQuestionsContext(category?: string, count: number = 3): string {
  const questions = getRealQuestions(category, undefined, count);
  if (questions.length === 0) return '';
  const lines = questions.map((q, i) => `${i + 1}. [${q.source}] ${q.question}`).join('\n');
  return `\n【真实面试题参考】\n以下是从各大互联网公司面试中收集的真实题目，请参考这些题目的风格和难度：\n${lines}`;
}
