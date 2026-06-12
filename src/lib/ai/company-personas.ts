// ============================================================
// Company Fixed Personas — 各公司固定的招聘风格描述
// ============================================================
// 用途：在偏好画像中，固定描述在前 + JD分析在后，两者结合展示
// 风格：口语化、像内部员工私下聊天、有画面感的细节

export const COMPANY_FIXED_PERSONAS: Record<string, string> = {
  '字节跳动': `聪明、能扛事的，特别看重你对数据的敏感度，思维的深度，所有岗位都会往技术思维上靠，你去面试字节，面试官基本不跟你唠闲嗑，拿着简历深挖你的项目，比如这个想法怎么来的，怎么验证的，怎么落地的，中间翻过几次车怎么救回来的，而且字节特别喜欢有主见、偏强势有独立判断的人`,
  '腾讯': `特别看重产品品味和用户同理心，你得是那种自己就是深度用户、能说出"这个体验哪里别扭"的人，面试官喜欢跟你聊产品感觉，看你有没有自己的产品审美，做事风格偏稳，不鼓励冒进，更看重你能不能把一个小功能打磨到极致，内部沟通特别重要，你得会写文档、会拉对齐、会跨部门推事情，那种闷头干活不善沟通的人在这里会很吃力`,
  '阿里巴巴': `要能扛高压、拥抱变化的人，阿里的节奏特别快，方向三天两头调，你得适应"昨天说的今天不算"这种状态，面试特别看重你做事的结果和逻辑，"你怎么拿到这个结果的"比"你做了什么"重要，P级文化深入骨髓，说话要有框架有层次，另外阿里味儿很重——使命驱动、价值观先行，你得展现出那种"相信做的事有意义"的状态`,
  '百度': `技术底子必须扎实，面试官会追着你问原理，"这个算法为什么这么设计"、"这个指标怎么算的"，你答不上来基本就凉了，百度人整体风格偏学术和工程化，喜欢结构化思维、逻辑严密的人，做产品你得能跟工程师对齐，不然推进不了，面试氛围相对正式，不会太放松，你要表现出专业度和深度`,
  '美团': `极其看重分析能力和逻辑思维，面试官会给你出各种估算题、拆解题，看你能不能把一个模糊问题拆成可执行的步骤，美团有自己的方法论——拆目标、定指标、看数据、迭代优化，你得会用这套语言，做事风格偏务实低调，不玩虚的，PPT做得再好看不如把ROI算明白，另外美团特别看重吃苦精神和执行力`,
  '京东': `看重供应链思维和运营纪律，你得理解零售和物流的底层逻辑，面试会追着你问"这个业务怎么做成本优化"、"效率怎么提升"，京东文化强调"客户为先"和执行力，说白了就是听话照做出结果，不喜欢太跳脱的人，做事要踏实、有章法，另外京东的组织比较庞大，你得能在流程和制度中推进事情`,
  '拼多多': `极致的效率导向，速度快到离谱，决策基本靠数据说话，面试官会直接问你"这个事情ROI多少"、"多长时间能拿到结果"，拼多多不在乎你履历多光鲜，更在乎你能不能快速出活，加班强度大，你得能接受高负荷运转，风格上不讲究排场和层级，能干就行，但内部决策偏集中，执行层面没什么可商量的`,
  '华为': `工程能力和执行力是底线，面试会考察你的系统思维和抗压能力，华为有很强的流程文化，做事必须按规矩来，不能太随意，狼性文化不是说着玩的——你得表现出那种拼劲和韧性，面试风格偏正式，会问得很细很实，另外华为特别看重长期主义和踏实作风，那种喜欢走捷径的人在这里活不下去`,
  '快手': `特别看重对下沉市场和社区的理解，你得是那种能站在普通用户角度想问题的人，面试官会追着你问"你的目标用户是谁、他们真正在意什么"，风格偏务实接地气，不搞花里胡哨的，做事重迭代和验证，快手的文化比较包容开放，但产品标准不低，你得有同理心、能共情用户，那种只看数据不感受用户的人很难做好`,
  '小米': `成本意识和效率意识要刻在骨子里，你得能花最少的钱做最好的体验，面试会关注你对性价比的理解、对供应链的把控，小米看重"米粉文化"，你得理解社区运营和用户参与感，做事节奏快，强调快速迭代和用户反馈驱动，风格上偏年轻扁平，但执行层面很卷，你得能扛住快节奏的交付压力`,
  '网易': `审美和品味是硬门槛，网易的产品都有一种"调性"，面试官会看你的审美判断力、对好内容好体验的嗅觉，风格相对宽松自由，但标准不低——你可以慢慢做，但做出来的东西得够好，网易人偏文艺气质，喜欢有独立想法、不随大流的人，面试氛围相对轻松，但会深挖你的作品和思考深度`,
  '滴滴': `数据驱动到极致，一切决策都要有数据支撑，面试官会追着你问"你怎么衡量这个效果"、"AB测试怎么设计"，滴滴的业务复杂度很高——涉及供需匹配、定价策略、多端协同，你得能处理多利益方的博弈，风格偏理性冷静，看重结构化表达能力，另外滴滴的运营属性很强，做产品得懂运营`,
};

// 固定核心技能 — 每家公司的硬技能偏好，用于简历修改时融入
// 当没有JD分析数据时，这些技能会作为画像融入的硬技能清单
export const COMPANY_FIXED_CORE_SKILLS: Record<string, Array<{ name: string; count: number }>> = {
  '字节跳动': [
    { name: '数据驱动', count: 5 },
    { name: 'AB测试', count: 4 },
    { name: '技术思维', count: 4 },
    { name: '大模型应用', count: 3 },
    { name: '项目深挖', count: 3 },
    { name: '用户增长', count: 3 },
    { name: '数据分析', count: 3 },
    { name: '算法理解', count: 2 },
  ],
  '腾讯': [
    { name: '产品品味', count: 5 },
    { name: '用户体验', count: 5 },
    { name: '跨部门协作', count: 4 },
    { name: '文档能力', count: 3 },
    { name: '用户研究', count: 3 },
    { name: '产品打磨', count: 3 },
    { name: '需求分析', count: 3 },
    { name: '沟通对齐', count: 2 },
  ],
  '阿里巴巴': [
    { name: '结果导向', count: 5 },
    { name: '商业逻辑', count: 4 },
    { name: '抗压能力', count: 4 },
    { name: '框架化思维', count: 3 },
    { name: '数据运营', count: 3 },
    { name: '生态思维', count: 3 },
    { name: '变革管理', count: 2 },
    { name: '价值观驱动', count: 2 },
  ],
  '百度': [
    { name: '技术深度', count: 5 },
    { name: 'AI/大模型', count: 4 },
    { name: '结构化思维', count: 4 },
    { name: '算法基础', count: 3 },
    { name: '搜索推荐', count: 3 },
    { name: '工程化能力', count: 3 },
    { name: 'NLP', count: 2 },
    { name: '指标体系', count: 2 },
  ],
  '美团': [
    { name: '逻辑分析', count: 5 },
    { name: '数据拆解', count: 4 },
    { name: 'ROI意识', count: 4 },
    { name: '方法论沉淀', count: 3 },
    { name: '估算能力', count: 3 },
    { name: '务实执行', count: 3 },
    { name: '本地生活', count: 2 },
    { name: '供需分析', count: 2 },
  ],
  '京东': [
    { name: '供应链思维', count: 5 },
    { name: '成本优化', count: 4 },
    { name: '运营纪律', count: 4 },
    { name: '流程管理', count: 3 },
    { name: '零售逻辑', count: 3 },
    { name: '物流优化', count: 3 },
    { name: '客户为先', count: 2 },
    { name: '规模运营', count: 2 },
  ],
  '拼多多': [
    { name: '效率优先', count: 5 },
    { name: '数据决策', count: 4 },
    { name: '快速交付', count: 4 },
    { name: 'ROI思维', count: 4 },
    { name: '极致执行', count: 3 },
    { name: '用户下沉', count: 3 },
    { name: '低成本运营', count: 3 },
    { name: '自驱力', count: 2 },
  ],
  '华为': [
    { name: '工程能力', count: 5 },
    { name: '系统思维', count: 4 },
    { name: '流程规范', count: 4 },
    { name: '抗压韧性', count: 4 },
    { name: '长期主义', count: 3 },
    { name: '技术深度', count: 3 },
    { name: 'B端产品', count: 3 },
    { name: '跨文化沟通', count: 2 },
  ],
  '快手': [
    { name: '用户同理心', count: 5 },
    { name: '下沉市场', count: 4 },
    { name: '社区运营', count: 4 },
    { name: '内容理解', count: 3 },
    { name: '迭代验证', count: 3 },
    { name: '数据驱动', count: 3 },
    { name: '用户增长', count: 2 },
    { name: '短视频生态', count: 2 },
  ],
  '小米': [
    { name: '成本意识', count: 5 },
    { name: '供应链管理', count: 4 },
    { name: '用户反馈驱动', count: 4 },
    { name: '快速迭代', count: 3 },
    { name: '社区运营', count: 3 },
    { name: '性价比思维', count: 3 },
    { name: '硬件+软件', count: 2 },
    { name: 'IoT生态', count: 2 },
  ],
  '网易': [
    { name: '产品审美', count: 5 },
    { name: '内容品味', count: 4 },
    { name: '用户体验', count: 4 },
    { name: '独立思考', count: 3 },
    { name: '创意设计', count: 3 },
    { name: '游戏化思维', count: 3 },
    { name: '社区运营', count: 2 },
    { name: '音乐/教育', count: 2 },
  ],
  '滴滴': [
    { name: '数据驱动', count: 5 },
    { name: 'AB测试', count: 4 },
    { name: '多端协同', count: 4 },
    { name: '供需匹配', count: 3 },
    { name: '定价策略', count: 3 },
    { name: '运营思维', count: 3 },
    { name: '多方博弈', count: 3 },
    { name: '出行场景', count: 2 },
  ],
};

// 固定软技能 — 每家公司的软技能偏好
export const COMPANY_FIXED_SOFT_SKILLS: Record<string, string[]> = {
  '字节跳动': ['独立判断', '数据敏感', '技术思维', '抗压能力', '自驱力'],
  '腾讯': ['产品品味', '用户同理心', '跨部门沟通', '文档能力', '耐心打磨'],
  '阿里巴巴': ['抗压能力', '拥抱变化', '结果导向', '框架化表达', '价值观认同'],
  '百度': ['技术深度', '逻辑严密', '结构化表达', '专业严谨', '持续学习'],
  '美团': ['逻辑分析', '务实低调', '吃苦精神', '数据敏感', '方法论沉淀'],
  '京东': ['踏实有章法', '执行力', '流程意识', '客户为先', '团队协作'],
  '拼多多': ['极致效率', '快速响应', '高强度抗压', '自驱力', '不讲究排场'],
  '华为': ['抗压韧性', '流程意识', '长期主义', '踏实作风', '狼性拼搏'],
  '快手': ['用户同理心', '务实接地气', '包容开放', '迭代验证', '社区理解'],
  '小米': ['成本意识', '快速迭代', '用户参与感', '年轻扁平', '效率导向'],
  '网易': ['审美品味', '独立想法', '创意思维', '文艺气质', '高标准'],
  '滴滴': ['理性冷静', '结构化表达', '多方协调', '运营思维', '数据敏感'],
};

// 别名映射：用于模糊匹配公司名称变体
// key = 用户可能输入的别名/简写，value = 数据库中的标准名称
const COMPANY_ALIASES: Record<string, string> = {
  '阿里': '阿里巴巴',
  '字节': '字节跳动',
  '滴滴出行': '滴滴',
  'JD': '京东',
  'jd': '京东',
  'bytedance': '字节跳动',
  'tencent': '腾讯',
  'alibaba': '阿里巴巴',
  'baidu': '百度',
  'meituan': '美团',
  'pinduoduo': '拼多多',
  'huawei': '华为',
  'kuaishou': '快手',
  'xiaomi': '小米',
  'netease': '网易',
  'didi': '滴滴',
};

// 所有可能的公司名（标准名 + 别名），用于子串匹配
const ALL_COMPANY_NAMES = [...new Set([
  ...Object.keys(COMPANY_FIXED_PERSONAS),
  ...Object.keys(COMPANY_ALIASES),
  ...Object.values(COMPANY_ALIASES),
])];

/**
 * 规范化公司名称：将别名/简写映射到标准名称
 * 用于数据库查询，确保"阿里"能匹配"阿里巴巴"的记录
 *
 * 匹配优先级：
 * 1. 精确匹配标准名 → 直接返回
 * 2. 别名映射 → 返回对应标准名
 * 3. 子串包含 → 返回包含的标准名
 * 4. 无匹配 → 返回原始输入
 */
export function normalizeCompanyName(name: string): string {
  if (!name) return name;
  const trimmed = name.trim();

  // 1. 精确匹配标准名
  if (COMPANY_FIXED_PERSONAS[trimmed]) return trimmed;

  // 2. 别名映射
  if (COMPANY_ALIASES[trimmed]) return COMPANY_ALIASES[trimmed];

  // 3. 子串包含（"北京字节跳动科技有限公司" → "字节跳动"）
  for (const standard of Object.keys(COMPANY_FIXED_PERSONAS)) {
    if (trimmed.includes(standard)) return standard;
  }

  // 4. 别名的子串包含（"阿里云" → 包含"阿里" → "阿里巴巴"）
  for (const [alias, canonical] of Object.entries(COMPANY_ALIASES)) {
    if (trimmed.includes(alias)) return canonical;
  }

  // 5. 英文子串匹配
  const lower = trimmed.toLowerCase();
  for (const standard of Object.keys(COMPANY_FIXED_PERSONAS)) {
    if (lower.includes(standard.toLowerCase())) return standard;
  }
  for (const [alias, canonical] of Object.entries(COMPANY_ALIASES)) {
    if (lower.includes(alias.toLowerCase())) return canonical;
  }

  return trimmed;
}

/**
 * 获取公司名的所有可能变体（标准名 + 别名），用于数据库模糊查询
 * 例如："阿里巴巴" → ["阿里巴巴", "阿里", "alibaba"]
 * 这样查一次就能覆盖所有相关记录
 */
export function getCompanyNameVariants(name: string): string[] {
  const normalized = normalizeCompanyName(name);
  const variants = new Set<string>();
  variants.add(normalized);

  // 添加映射到这个标准名的所有别名
  for (const [alias, canonical] of Object.entries(COMPANY_ALIASES)) {
    if (canonical === normalized) variants.add(alias);
  }

  // 如果输入本身就是别名，也加进去
  variants.add(name.trim());

  return [...variants].filter(Boolean);
}

/**
 * 根据公司名获取固定的风格描述
 * 支持：精确匹配 → 别名匹配 → 子串包含匹配
 */
export function getFixedPersona(companyName: string): string | null {
  if (!companyName) return null;
  const normalized = normalizeCompanyName(companyName);
  return COMPANY_FIXED_PERSONAS[normalized] || null;
}