/**
 * 技能语义归一化：将同义技能名称统一到标准名称
 * 用于 JD 分析和公司画像中的技能频率统计
 */

// 技能别名映射：标准名称 -> 同义词列表
const skillAliases: Record<string, string[]> = {
  '大模型应用与落地': ['大模型应用落地', '大模型产品策略', '大模型能力与应用场景', '大语言模型', 'LLM应用', 'LLM', '大模型', 'AI对话与大模型应用落地', '大模型落地', '大模型应用', 'LLM应用落地', '大模型技术理解', '大模型技术', 'LLM技术', '生成式AI应用', '生成式AI', 'AIGC应用', 'AIGC', 'AI大模型', '大语言模型应用'],
  'Agent搭建': ['Agent探索与设计', 'Agent架构设计', 'AI Agent搭建', 'AI Agent', 'Agentic产品设计', 'Agent', '智能体', 'AI Agent认知与洞见', 'Agent设计', 'Agent开发', '智能体设计', 'AI智能体', 'Agent应用', '智能体应用'],
  '协作能力': ['跨团队协作与项目推进', '跨团队协作', '跨团队协同与资源协调', '沟通与协调能力', '跨部门协作', '团队协作', '沟通能力', '跨团队沟通', '协作能力', '团队沟通', '跨部门沟通', '资源协调', '团队协同', '组织协调'],
  '数据驱动': ['数据分析与指标驱动', '数据分析与指标体系搭建', '数据思维与数据驱动决策', '数据驱动与数据分析', '数据分析', '数据驱动决策', '数据思维', '数据敏感度', '数据运营', '数据分析基础', '数据驱动产品', '数据驱动运营', '数据化运营', '数据洞察', '数据判断'],
  'AI产品设计': ['AI产品', 'AI产品经理', 'AI PM', '人工智能产品', '智能产品', 'AI应用', 'AI智能客服产品设计', 'AI聊天机器人/对话体验设计', 'AI对话产品设计', 'AI技术认知与行业洞察', 'AI产品规划', 'AI产品思维', 'AI应用设计', '智能化产品设计', 'AI产品落地', 'AI原生产品', 'AI-First产品'],
  'Prompt Engineering': ['提示词工程', '提示词设计', 'Prompt设计', 'Prompt优化', '提示词优化', 'Prompt撰写', '提示词编写', 'Prompt工程', 'Prompt调优', '提示词调优', '提示词', 'Prompt', 'Prompt Engineering'],
  '用户研究': ['用户调研', '用户访谈', '用户需求分析', '用户洞察', '用户理解', '用户体验洞察', '用户同理心与价值平衡', '用户分析', '用户画像', '用户行为分析', '用户需求挖掘', '用户场景分析'],
  'A/B测试': ['AB测试', 'A/B实验', '实验设计', '灰度实验', '分流实验', 'A/B测试', '实验分析', '灰度发布', '实验驱动', '效果验证'],
  '产品思维': ['产品意识', '产品sense', '产品感', '产品方法论', '产品思考', '产品逻辑', '产品判断力'],
  '需求分析': ['需求挖掘', '需求梳理', '需求定义', '需求管理', '需求拆解', '需求沟通与管理', '业务需求分析与策略制定', '需求理解', '需求洞察', '需求转化', '需求优先级'],
  '交互设计': ['用户体验设计', 'UX设计', 'UI/UX', '交互体验', '体验设计', '人机协同体验设计', '人机协同设计', '交互逻辑', '体验优化', 'UX', 'UI设计', '界面设计'],
  'PRD': ['产品需求文档', '需求文档', 'PRD撰写', 'PRD编写', 'PRD设计', '需求规格', '产品文档'],
  '项目管理': ['项目推进', '项目协调', '项目落地', '项目交付', '产品实施与推广', '项目规划', '项目执行', '项目跟踪', '项目管控'],
  '竞品分析': ['竞品研究', '竞品调研', '竞争分析', '竞品对标', '竞品洞察', '竞争策略', '竞品追踪', '市场竞品'],
  'SQL': ['SQL查询', 'SQL分析', '数据库查询', 'SQL编写', 'SQL能力', '数据库分析'],
  '商业分析': ['商业洞察', '商业模式', '商业sense', '商业理解', '商业化与业务增长驱动', '经营诊断与策略制定', '商业分析能力', '商业化', '商业判断', '业务分析', '商业逻辑'],
  '技术理解': ['技术sense', '技术判断', '技术评估', '技术选型', '技术可行性', 'AI前沿技术跟踪应用', '技术认知', '技术理解力', '技术思维', '技术背景', '技术沟通', '技术方案评估'],
  '产品策略': ['产品规划', '产品路线图', '产品方向', '战略规划', '产品0到1建设与迭代规划', '产品全生命周期管理', '产品战略', '产品定位', '产品方向规划', '产品迭代规划', '产品演进'],
  '指标体系': ['指标搭建', '指标设计', '度量体系', '数据指标', '指标体系搭建', '指标规划', '指标定义', '北极星指标', '核心指标'],
  '微调': ['Fine-tuning', '模型微调', 'finetune', '模型训练', '模型微调与训练', 'SFT', 'RL', '微调训练', '模型调优', '参数调优'],
  '多模态': ['多模态模型', '多模态交互', '多模态理解', '跨模态', '多模态应用', '多模态AI', '多模态设计'],
  'API设计': ['接口设计', 'API', 'API规划', '开放平台', 'API接口', '接口规划', 'API管理', '开放API'],
  'RAG': ['检索增强生成', '检索增强', '知识检索', 'RAG架构', 'RAG应用', '知识库检索', 'RAG设计', '检索增强生成技术'],
  'B端产品': ['B端产品设计', '商家端B端产品建设', '商家后台', 'SaaS系统', '复杂业务中台', '复杂B端系统建设', 'B端', '企业级产品', 'SaaS产品', 'B端系统', '后台产品', '中台产品'],
  '行业认知': ['电商行业认知', '生活服务行业认知', '行业业务分析', '行业洞察', '行业理解', '行业分析', '行业经验', '垂直行业', '行业知识'],
  '快速学习': ['快速学习与自驱力', '新技术学习与动手实践能力', '自驱力', '学习能力', '持续学习', '自我驱动', '学习敏锐度'],
  '平台化建设': ['平台化建设与资产沉淀', '平台化', '资产沉淀', '平台设计', '平台架构', '平台产品', '平台能力'],
  '模型评测': ['模型应用评估与量化分析', '模型训练与评测', 'AI评测', '模型评估', '模型效果评估', '评测体系', 'AI模型评测', '效果评测'],
  '产品运营': ['运营策略', '用户运营', '增长运营', '产品增长', '运营规划', '运营分析', '增长策略', '用户增长', 'Growth'],
  'AI伦理': ['AI安全', 'AI合规', '算法伦理', 'AI治理', '负责任AI', 'AI风险', '模型安全', '内容安全'],
  '知识图谱': ['知识图谱构建', '图谱应用', '知识库建设', '知识管理'],
  '对话系统': ['对话设计', '对话流设计', '对话体验', '对话式AI', '聊天机器人', 'Chatbot', '智能客服', '对话交互'],
  'Python': ['Python编程', 'Python开发', 'Python能力', '编程能力', '编程基础'],
  'NLP': ['自然语言处理', '文本分析', '语义理解', 'NLP技术', '自然语言理解'],
  '推荐系统': ['推荐算法', '推荐策略', '个性化推荐', '推荐引擎', '推荐产品设计'],
  '抗压能力': ['抗压', '压力管理', '情绪管理', '承受压力'],
  '创新精神': ['创新能力', '创新思维', '创新意识', '创新驱动'],
  '结果导向': ['目标导向', '结果驱动', '目标驱动', '结果意识'],
  '逻辑思维': ['逻辑分析', '逻辑推理', '结构化思维', '分析思维'],
};

// 构建反向映射和模糊规则（懒初始化）
let _aliasToCanonical: Map<string, string> | null = null;
let _fuzzyRules: Array<{ canonical: string; keyword: string }> | null = null;

function getAliasToCanonical() {
  if (_aliasToCanonical) return _aliasToCanonical;
  _aliasToCanonical = new Map();
  for (const [canonical, aliases] of Object.entries(skillAliases)) {
    _aliasToCanonical.set(canonical.toLowerCase(), canonical);
    for (const alias of aliases) {
      _aliasToCanonical.set(alias.toLowerCase(), canonical);
    }
  }
  return _aliasToCanonical;
}

function getFuzzyRules() {
  if (_fuzzyRules) return _fuzzyRules;
  _fuzzyRules = [];
  for (const [canonical, aliases] of Object.entries(skillAliases)) {
    const allNames = [canonical, ...aliases];
    for (const name of allNames) {
      const parts = name
        .replace(/[与和及]/g, '|')
        .replace(/[（）()]/g, '|')
        .split('|')
        .map(s => s.trim())
        .filter(s => s.length >= 2);
      for (const part of parts) {
        _fuzzyRules.push({ canonical, keyword: part });
      }
    }
  }
  _fuzzyRules.sort((a, b) => b.keyword.length - a.keyword.length);
  return _fuzzyRules;
}

/**
 * 归一化技能名称：精确匹配 → 模糊子串匹配 → 反向匹配
 */
export function normalizeSkill(name: string): string {
  const lower = name.toLowerCase();

  // 1. 精确匹配
  const exact = getAliasToCanonical().get(lower);
  if (exact) return exact;

  // 2. 模糊匹配：输入包含关键词（长词优先）
  for (const { canonical, keyword } of getFuzzyRules()) {
    if (lower.includes(keyword.toLowerCase())) return canonical;
  }

  // 3. 反向匹配：标准技能名包含输入
  for (const [canonicalName, aliases] of Object.entries(skillAliases)) {
    const allNames = [canonicalName, ...aliases];
    for (const alias of allNames) {
      if (alias.toLowerCase().includes(lower) && lower.length >= 2) return canonicalName;
    }
  }

  return name;
}

/**
 * 聚合技能频率（归一化后），同一条JD中同一技能只算1次
 * 返回 Map<标准技能名, { count, positions, importance? }>
 */
export function aggregateSkills(
  analyses: Array<{
    position_name?: string;
    extracted_skills?: Array<{ skill_name: string; importance?: string; category?: string }>;
  }>,
  options?: { trackPositions?: boolean; trackImportance?: boolean }
): Map<string, { count: number; positions?: string[]; importance?: string[] }> {
  const { trackPositions = true, trackImportance = true } = options ?? {};
  const skillMap = new Map<string, { count: number; positions?: string[]; importance?: string[] }>();

  for (const a of analyses) {
    const skills = a.extracted_skills || [];
    const seenInThisJd = new Set<string>();
    const posName = a.position_name || '未命名岗位';

    for (const s of skills) {
      const normalized = normalizeSkill(s.skill_name);
      if (seenInThisJd.has(normalized)) continue;
      seenInThisJd.add(normalized);

      if (!skillMap.has(normalized)) {
        skillMap.set(normalized, { count: 0, positions: trackPositions ? [] : undefined, importance: trackImportance ? [] : undefined });
      }
      const entry = skillMap.get(normalized)!;
      entry.count++;
      if (trackPositions && entry.positions) entry.positions.push(posName);
      if (trackImportance && s.importance && entry.importance) entry.importance.push(s.importance);
    }
  }

  return skillMap;
}
