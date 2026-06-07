// 资源类型体系定义
import type { ResourceCategoryType } from '@/types';
export type ResourceType = ResourceCategoryType;

export interface ResourceTypeDefinition {
  value: ResourceType;
  label: string;
  icon: string;
  subcategories: { value: string; label: string }[];
}

export const CHART_COLORS = ['#6366F1', '#8B5CF6', '#06B6D4', '#10B981', '#F59E0B', '#EC4899', '#F97316'];

export const TYPE_LABELS: Record<string, string> = {
  website: '网站', paper: '论文', blog: '博客', lark_doc: '飞书文档',
  wechat: '公众号', video: '视频', book: '书籍', workflow: '工作流程',
  link: '链接', doc: '文档', folder: '文件夹',
};

export const AI_PM_DIRECTIONS = [
  {
    title: '产品思维',
    icon: '🧠',
    color: 'from-indigo-500 to-purple-500',
    topics: ['需求分析', '用户研究', '产品规划', '数据驱动决策', 'A/B测试设计'],
  },
  {
    title: 'AI 技术基础',
    icon: '🤖',
    color: 'from-emerald-500 to-teal-500',
    topics: ['大模型原理', 'Prompt Engineering', 'RAG 架构', 'Agent 设计', 'Fine-tuning 基础'],
  },
  {
    title: '行业应用',
    icon: '🌐',
    color: 'from-orange-500 to-red-500',
    topics: ['AI 搜索', 'AI 写作', 'AI 绘图', 'AI 编程助手', 'AI 客服'],
  },
  {
    title: '工程实践',
    icon: '⚙️',
    color: 'from-blue-500 to-cyan-500',
    topics: ['API 设计', '模型评估', '成本优化', '安全合规', 'MLOps'],
  },
];

// AI PM 工作流程 — 13个阶段
export const AI_PM_WORKFLOW = {
  title: 'AI PM 工作流程',
  description: '从行业洞察到持续运营的13个阶段，覆盖AI产品经理端到端全流程',
  icon: '🔄',
  stages: [
    {
      name: '01 行业与市场洞察',
      subcategory: 'market_insight',
      module_slug: 'ai-cognition',
      description: '理解行业趋势、市场规模、用户痛点，判断AI落地可行性',
      items: [
        { name: '行业趋势研判', description: '技术成熟度曲线、市场增速、政策风向、AI落地时机判断' },
        { name: '市场规模估算', description: 'TAM/SAM/SOM三层估算方法、自上而下vs自下而上' },
        { name: '用户痛点扫描', description: '未被满足的需求、现有方案不足、AI能否比规则/人工做得更好' },
        { name: 'AI落地可行性初判', description: '场景是否适合AI、技术成熟度是否足够、成本是否可承受' },
        { name: '技术趋势跟踪', description: '新模型发布、新范式涌现、成本变化、竞品技术动态' },
      ],
    },
    {
      name: '02 竞品分析与定位',
      subcategory: 'competitor_analysis',
      module_slug: 'ai-commercialization',
      description: '拆解竞品策略、对比AI能力、找到差异化空间',
      items: [
        { name: '竞品识别与选择', description: '直接竞品、间接竞品、潜在竞品的识别方法' },
        { name: '功能拆解与策略推演', description: '不只是功能罗列，要推演"为什么这么做"、下一步可能做什么' },
        { name: 'AI能力对比', description: '各家模型选型、效果差异、成本差异、技术路线差异' },
        { name: '体验对比', description: '实际使用竞品、记录体验差异、首次使用/核心流程/错误处理' },
        { name: '差异化定位', description: '蓝海策略、竞品没做好但用户需要的空间' },
      ],
    },
    {
      name: '03 用户研究与需求定义',
      subcategory: 'user_research',
      module_slug: 'user-research',
      description: '挖掘真需求、验证需求真伪、识别伪需求',
      items: [
        { name: '用户画像与场景还原', description: '目标用户是谁、在什么场景下遇到什么问题' },
        { name: '需求挖掘', description: '5Why追问、场景还原、问题vs方案分离' },
        { name: '需求真伪验证', description: '假门测试、数据验证、用户访谈、行为数据验证' },
        { name: '需求优先级', description: 'ROI排序、Kano模型（基本型/期望型/兴奋型）、频率×严重度×成本' },
        { name: '伪需求识别', description: '用户说想要≠真需要、动机分析、行为数据验证' },
      ],
    },
    {
      name: '04 模型能力评估与选型',
      subcategory: 'model_evaluation',
      module_slug: 'evals',
      description: '测试模型边界、对比选型、建立效果基线',
      items: [
        { name: '模型能力边界测试', description: '什么能做/不能做/做了不可靠、边界case测试方法' },
        { name: '多模型对比选型', description: '效果、延迟、成本、合规维度对比、选型决策矩阵' },
        { name: 'Prompt工程可行性验证', description: 'Prompt能否解决、还是需要微调/RAG、成本与效果权衡' },
        { name: '模型效果基线建立', description: '评估集设计、Bad Case分类体系、基线指标记录' },
        { name: '模型迭代节奏规划', description: '何时升级模型、何时迁移、多模型路由策略' },
      ],
    },
    {
      name: '05 AI产品设计',
      subcategory: 'ai_product_design',
      module_slug: 'ai-product-design',
      description: '用户视角拆解、交互流程、行为规范、人机协作、AI PRD',
      items: [
        { name: '用户视角拆解', description: '用户看到什么、做什么、得到什么反馈、AI介入点在哪' },
        { name: '交互流程设计', description: '对话FSM、意图体系、槽位填充、Agent工作流编排' },
        { name: 'AI行为规范定义', description: '正常case、边界case、异常case的预期行为和处理规则' },
        { name: '人机协作设计', description: '何时转人工、人工辅助模式、自动化程度选择' },
        { name: 'AI PRD撰写', description: '模型行为规范、效果指标、降级方案、测试用例、上线Checklist' },
      ],
    },
    {
      name: '06 技术方案评估',
      subcategory: 'tech_evaluation',
      module_slug: 'ai-native-design',
      description: '可行性评估、架构理解、与算法团队协作',
      items: [
        { name: '技术可行性评估', description: '能不能做、值不值得做、风险在哪、成熟度评估' },
        { name: '架构方案理解', description: 'RAG/Agent/微调/混合方案的适用场景和代价' },
        { name: '与算法团队沟通协作', description: '提出正确问题、理解回答、识别搪塞、效果/成本/风险问题怎么问' },
        { name: '需求→技术规范转化', description: '把业务需求翻译成工程师能执行的规格' },
      ],
    },
    {
      name: '07 数据策略',
      subcategory: 'data_strategy',
      module_slug: 'data-quality-annotation',
      description: '数据需求定义、标注策略、Human-in-the-loop、隐私合规',
      items: [
        { name: '数据需求定义', description: '训练数据、评估数据、运营数据分别需要什么' },
        { name: '数据采集与标注策略', description: '标注规范制定、质量管控、成本预算、标注工具选型' },
        { name: 'Human-in-the-loop设计', description: '人审环节、质检流程、数据飞轮入口、标注→训练→评估闭环' },
        { name: '数据隐私与合规', description: '用户数据使用范围、脱敏策略、数据留存策略、GDPR/个人信息保护法' },
      ],
    },
    {
      name: '08 效果评估体系',
      subcategory: 'evaluation_system',
      module_slug: 'evals',
      description: '评估集、指标体系、离线/在线评估、数据飞轮',
      items: [
        { name: '评估集构建', description: '覆盖度、难度分层、Bad Case分类、对抗测试用例' },
        { name: '指标体系设计', description: '准确率/召回率/延迟/成本/用户满意度、业务指标vs技术指标' },
        { name: '离线评估vs在线评估', description: 'A/B测试设计、长期价值评估、离线指标与在线效果的gap' },
        { name: '数据飞轮设计', description: '用户反馈→数据→模型→体验的闭环、反馈收集机制' },
        { name: '效果回归测试', description: 'Prompt/模型变更后的回归验证、回归测试套件设计' },
      ],
    },
    {
      name: '09 安全与合规审查',
      subcategory: 'security_compliance',
      module_slug: 'content-compliance',
      description: 'AI安全测试、内容安全、隐私保护、合规审查、伦理审查',
      items: [
        { name: 'AI安全测试', description: '红蓝对抗、对抗测试、Prompt注入、越狱测试、安全评估框架' },
        { name: '内容安全审核', description: '有害内容检测、版权风险、偏见检测、内容审核策略' },
        { name: '隐私保护设计', description: '数据最小化、用户知情权、数据删除权、隐私计算' },
        { name: '合规审查', description: '算法备案、生成内容标识、行业监管要求、跨境合规' },
        { name: '伦理审查', description: '公平性、透明性、可解释性、责任归属、AI伦理框架' },
      ],
    },
    {
      name: '10 兜底与降级策略',
      subcategory: 'fallback_degradation',
      module_slug: 'ai-native-design',
      description: '降级分层、幻觉兜底、错误预算、故障响应',
      items: [
        { name: '降级分层设计', description: '大模型→小模型→规则→人工的分层降级、降级触发条件' },
        { name: '幻觉兜底', description: '幻觉检测、拦截、用户提示、自动修正策略' },
        { name: '错误预算设计', description: 'SLO定义、可接受的错误率、错误预算消耗策略' },
        { name: '故障响应流程', description: '监控告警、应急处理、自动降级、复盘改进' },
      ],
    },
    {
      name: '11 成本与ROI分析',
      subcategory: 'cost_roi',
      module_slug: 'ai-commercialization',
      description: '成本拆解、ROI计算、优化策略、定价策略',
      items: [
        { name: '成本结构拆解', description: 'Token成本、推理成本、标注成本、人工成本、运维成本' },
        { name: 'ROI计算', description: '降本增效量化、收入增长归因、ROI计算模板' },
        { name: '成本优化策略', description: '量化/蒸馏/模型路由/缓存/批量推理的代价收益' },
        { name: '定价策略', description: 'API定价、按效果定价、订阅制、免费+增值模式' },
      ],
    },
    {
      name: '12 上线与灰度发布',
      subcategory: 'launch_release',
      module_slug: 'ai-requirement-spec',
      description: '上线Checklist、灰度策略、期望管理、发布沟通',
      items: [
        { name: '上线Checklist', description: '模型版本锁定、效果验证、降级测试、监控告警配置' },
        { name: '灰度发布策略', description: '流量比例、效果对比、回滚条件、灰度节奏' },
        { name: '用户教育与期望管理', description: 'AI能力边界沟通、避免过度承诺、用户引导设计' },
        { name: '发布沟通计划', description: '对内对外的预期管理、发布文档、变更通知' },
      ],
    },
    {
      name: '13 持续运营与迭代',
      subcategory: 'operation_iteration',
      module_slug: 'badcase-analysis',
      description: '监控体系、数据驱动优化、模型升级、复盘方法论',
      items: [
        { name: '监控体系', description: '效果监控、成本监控、用户行为监控、告警规则' },
        { name: '数据驱动优化', description: 'Bad Case→改进→回归验证的闭环、优化节奏' },
        { name: '模型升级策略', description: '新模型评估、迁移计划、A/B对比、版本管理' },
        { name: '需求演进', description: '用户行为变化、新场景发现、产品路线图更新' },
        { name: '复盘方法论', description: '效果复盘、成本复盘、用户满意度复盘、复盘模板' },
      ],
    },
  ],
};

export const RESOURCE_TYPES: ResourceTypeDefinition[] = [
  {
    value: 'website',
    label: '网站',
    icon: '🌐',
    subcategories: [
      { value: 'ai_api', label: 'AI模型与API平台' },
      { value: 'prompt_eng', label: 'Prompt工程工具' },
      { value: 'dev_framework', label: '开发框架文档' },
      { value: 'coding', label: '编程实战' },
      { value: 'pm_toolkit', label: '产品经理工具箱' },
      { value: 'open_source', label: '开源社区' },
      { value: 'ai_nav', label: 'AI导航' },
    ],
  },
  {
    value: 'paper',
    label: '论文',
    icon: '📄',
    subcategories: [
      { value: 'llm', label: 'LLM核心论文' },
      { value: 'rag', label: 'RAG与检索论文' },
      { value: 'agent', label: 'Agent与工具论文' },
      { value: 'evaluation', label: '评估与对齐论文' },
      { value: 'product_ai', label: 'AI产品化论文' },
    ],
  },
  {
    value: 'blog',
    label: '博客',
    icon: '📝',
    subcategories: [
      { value: 'ai_tech', label: 'AI技术深度' },
      { value: 'ai_product', label: 'AI产品思考' },
      { value: 'industry', label: '行业与投资观察' },
      { value: 'pm_practice', label: 'PM实战经验' },
      { value: 'team_eng', label: '团队工程博客' },
    ],
  },
  {
    value: 'lark_doc',
    label: '飞书文档',
    icon: '📋',
    subcategories: [
      { value: 'tech_doc', label: '技术文档' },
      { value: 'product_doc', label: '产品文档' },
      { value: 'notes', label: '学习笔记' },
      { value: 'team_doc', label: '团队文档' },
    ],
  },
  {
    value: 'wechat',
    label: '公众号',
    icon: '📱',
    subcategories: [
      { value: 'tech_account', label: '技术公众号' },
      { value: 'product_account', label: '产品公众号' },
      { value: 'ai_news', label: 'AI资讯' },
    ],
  },
  {
    value: 'video',
    label: '视频',
    icon: '🎬',
    subcategories: [
      { value: 'ai_course', label: 'AI系统课程' },
      { value: 'tech_talk', label: '技术分享与论文解读' },
      { value: 'product_demo', label: 'AI产品拆解与Demo' },
      { value: 'interview_prep', label: '面试准备与实战' },
      { value: 'conference', label: '会议演讲与Keynote' },
    ],
  },
  {
    value: 'book',
    label: '书籍',
    icon: '📚',
    subcategories: [
      { value: 'ai_tech', label: 'AI技术' },
      { value: 'product_method', label: '产品方法论' },
      { value: 'data_analysis', label: '数据分析' },
      { value: 'career', label: '职业发展' },
      { value: 'thinking', label: '思维模型' },
    ],
  },
  {
    value: 'workflow',
    label: 'AI PM 工作流程',
    icon: '🔄',
    subcategories: AI_PM_WORKFLOW.stages.map(s => ({
      value: s.subcategory,
      label: s.name,
    })),
  },
];

export const RESOURCE_TYPE_MAP = Object.fromEntries(
  RESOURCE_TYPES.map(t => [t.value, t])
) as Record<ResourceType, ResourceTypeDefinition>;

export const SUBCATEGORY_LABELS: Record<string, string> = Object.fromEntries(
  RESOURCE_TYPES.flatMap(t => t.subcategories.map(s => [s.value, s.label]))
);

export function getResourceTypeLabel(type: string): string {
  return RESOURCE_TYPE_MAP[type as ResourceType]?.label ?? type;
}

export function getSubcategoryLabel(type: string, subcategory: string): string {
  const def = RESOURCE_TYPE_MAP[type as ResourceType];
  return def?.subcategories.find(s => s.value === subcategory)?.label ?? subcategory;
}

export function getSubcategoriesForType(type: string) {
  return RESOURCE_TYPE_MAP[type as ResourceType]?.subcategories ?? [];
}

export function getResourceTypeIcon(type: string): string {
  return RESOURCE_TYPE_MAP[type as ResourceType]?.icon ?? '📌';
}

// 现有资源预设数据 — 按新分类体系整理
export const PRESET_RESOURCES = [
  // === 网站 - AI模型与API平台 ===
  { name: 'OpenAI API Docs', url: 'https://platform.openai.com/docs', description: 'GPT系列模型API官方文档', resource_type: 'website' as ResourceType, subcategory: 'ai_api' },
  { name: 'Anthropic Docs', url: 'https://docs.anthropic.com', description: 'Claude系列模型API官方文档', resource_type: 'website' as ResourceType, subcategory: 'ai_api' },
  { name: 'Google AI Studio', url: 'https://aistudio.google.com', description: 'Gemini模型API与实验平台', resource_type: 'website' as ResourceType, subcategory: 'ai_api' },
  // === 网站 - Prompt工程工具 ===
  { name: 'ChatGPT Shortcut', url: 'https://newzone.top/chatgpt/', description: 'ChatGPT提示词快捷指令', resource_type: 'website' as ResourceType, subcategory: 'prompt_eng' },
  // === 网站 - 编程实战 ===
  { name: 'LeetCode', url: 'https://leetcode.cn', description: '算法与数据结构刷题平台', resource_type: 'website' as ResourceType, subcategory: 'coding' },
  { name: '牛客网', url: 'https://www.nowcoder.com', description: 'IT求职笔试面试刷题平台', resource_type: 'website' as ResourceType, subcategory: 'coding' },
  { name: 'Kaggle', url: 'https://www.kaggle.com', description: '数据科学竞赛与数据集平台', resource_type: 'website' as ResourceType, subcategory: 'coding' },
  { name: 'Google Colab', url: 'https://colab.research.google.com', description: '免费GPU在线Python编程环境', resource_type: 'website' as ResourceType, subcategory: 'coding' },
  // === 网站 - 开发框架文档 ===
  { name: 'LangChain Docs', url: 'https://python.langchain.com/docs/', description: 'LangChain框架官方文档', resource_type: 'website' as ResourceType, subcategory: 'dev_framework' },
  { name: 'LangGraph Docs', url: 'https://langchain-ai.github.io/langgraph/', description: 'LangGraph状态图框架文档', resource_type: 'website' as ResourceType, subcategory: 'dev_framework' },
  { name: 'MCP Specification', url: 'https://spec.modelcontextprotocol.io', description: 'Model Context Protocol协议规范', resource_type: 'website' as ResourceType, subcategory: 'dev_framework' },
  // === 网站 - 产品经理工具箱 ===
  { name: 'Coursera', url: 'https://www.coursera.org', description: '全球顶级在线课程平台', resource_type: 'website' as ResourceType, subcategory: 'pm_toolkit' },
  { name: '吴恩达AI课程', url: 'https://www.deeplearning.ai', description: 'Andrew Ng深度学习系列课程', resource_type: 'website' as ResourceType, subcategory: 'pm_toolkit' },
  { name: 'DeepLearning.AI Short Courses', url: 'https://www.deeplearning.ai/short-courses/', description: 'AI领域免费短课程集合', resource_type: 'website' as ResourceType, subcategory: 'pm_toolkit' },
  // === 网站 - 开源社区 ===
  { name: 'GitHub', url: 'https://github.com', description: '全球最大代码托管与开源社区', resource_type: 'website' as ResourceType, subcategory: 'open_source' },
  { name: 'Hugging Face', url: 'https://huggingface.co', description: '模型仓库与NLP工具平台', resource_type: 'website' as ResourceType, subcategory: 'open_source' },
  // === 网站 - AI导航 ===
  { name: 'AI工具集', url: 'https://ai-bot.cn', description: 'AI工具与资源导航', resource_type: 'website' as ResourceType, subcategory: 'ai_nav' },
  { name: 'WaytoAGI', url: 'https://www.waytoagi.com', description: 'AI知识库与社区导航', resource_type: 'website' as ResourceType, subcategory: 'ai_nav' },
  // === 论文 ===
  { name: 'Attention Is All You Need', url: 'https://arxiv.org/abs/1706.03762', description: 'Transformer架构奠基论文', resource_type: 'paper' as ResourceType, subcategory: 'llm', author: 'Vaswani et al.', year: 2017 },
  { name: 'Retrieval-Augmented Generation', url: 'https://arxiv.org/abs/2005.11401', description: 'RAG架构原始论文', resource_type: 'paper' as ResourceType, subcategory: 'rag', author: 'Lewis et al.', year: 2020 },
  { name: 'ReAct: Synergizing Reasoning and Acting', url: 'https://arxiv.org/abs/2210.03629', description: 'ReAct Agent范式论文', resource_type: 'paper' as ResourceType, subcategory: 'agent', author: 'Yao et al.', year: 2022 },
  { name: 'Training language models to follow instructions', url: 'https://arxiv.org/abs/2203.02155', description: 'InstructGPT/RLHF对齐论文', resource_type: 'paper' as ResourceType, subcategory: 'evaluation', author: 'Ouyang et al.', year: 2022 },
  // === 博客 ===
  { name: 'Lilian Weng Blog', url: 'https://lilianweng.github.io/', description: 'OpenAI研究员Lilian Weng技术博客', resource_type: 'blog' as ResourceType, subcategory: 'ai_tech' },
  { name: 'Jay Alammar Blog', url: 'https://jalammar.github.io/', description: 'Transformer/LLM可视化解读', resource_type: 'blog' as ResourceType, subcategory: 'ai_tech' },
  { name: 'Latent Cat', url: 'https://latent.cat', description: 'AI产品经理深度内容', resource_type: 'blog' as ResourceType, subcategory: 'ai_product' },
  // === 视频 ===
  { name: '3Blue1Brown 神经网络', url: 'https://www.bilibili.com/video/BV1bx411M7Zx', description: '最直观的神经网络可视化讲解', resource_type: 'video' as ResourceType, subcategory: 'ai_course', platform: 'B站' },
  { name: '李沐动手学深度学习', url: 'https://www.bilibili.com/video/BV1kq4y1H7FL', description: 'Amazon首席科学家深度学习课程', resource_type: 'video' as ResourceType, subcategory: 'ai_course', platform: 'B站' },
  // === 书籍 ===
  { name: '《人工智能：现代方法》', url: '', description: 'AI领域经典教材(Stuart Russell)', resource_type: 'book' as ResourceType, subcategory: 'ai_tech', author: 'Stuart Russell, Peter Norvig' },
  { name: '《深度学习》', url: '', description: '花书-Ian Goodfellow深度学习圣经', resource_type: 'book' as ResourceType, subcategory: 'ai_tech', author: 'Ian Goodfellow' },
  { name: '《启示录》', url: '', description: '产品经理必读经典-Marty Cagan', resource_type: 'book' as ResourceType, subcategory: 'product_method', author: 'Marty Cagan' },
  { name: '《精益数据分析》', url: '', description: '数据驱动产品决策方法论', resource_type: 'book' as ResourceType, subcategory: 'data_analysis', author: 'Alistair Croll' },
  { name: '《金字塔原理》', url: '', description: '结构化思维与表达方法论', resource_type: 'book' as ResourceType, subcategory: 'thinking', author: 'Barbara Minto' },
];

// --- 文件夹辅助函数 ---
import type { ExternalResource } from '@/types';

export interface FolderNode {
  id: string;
  title: string;
  parent_id: string | null;
  children: FolderNode[];
  itemCount: number;
}

export function buildFolderTree(resources: ExternalResource[], resourceType: string): FolderNode[] {
  const folders = resources.filter(r => r.type === 'folder' && (r.resource_type || 'website') === resourceType);
  const nonFolderResources = resources.filter(r => r.type !== 'folder' && (r.resource_type || 'website') === resourceType);

  const nodeMap = new Map<string, FolderNode>();
  for (const f of folders) {
    nodeMap.set(f.id, { id: f.id, title: f.title, parent_id: f.parent_id, children: [], itemCount: 0 });
  }

  for (const r of nonFolderResources) {
    if (r.parent_id && nodeMap.has(r.parent_id)) {
      nodeMap.get(r.parent_id)!.itemCount++;
    }
  }
  for (const f of folders) {
    if (f.parent_id && nodeMap.has(f.parent_id)) {
      nodeMap.get(f.parent_id)!.itemCount++;
    }
  }

  const roots: FolderNode[] = [];
  for (const node of nodeMap.values()) {
    if (node.parent_id && nodeMap.has(node.parent_id)) {
      nodeMap.get(node.parent_id)!.children.push(node);
    } else {
      roots.push(node);
    }
  }

  const sortNodes = (nodes: FolderNode[]) => {
    nodes.sort((a, b) => a.title.localeCompare(b.title));
    for (const n of nodes) sortNodes(n.children);
  };
  sortNodes(roots);

  return roots;
}

export function getFolderPath(resources: ExternalResource[], folderId: string): { id: string; title: string }[] {
  const path: { id: string; title: string }[] = [];
  let current = resources.find(r => r.id === folderId);
  while (current) {
    path.unshift({ id: current.id, title: current.title });
    current = current.parent_id ? resources.find(r => r.id === current!.parent_id) : undefined;
  }
  return path;
}

export function getFoldersForType(resources: ExternalResource[], resourceType: string): ExternalResource[] {
  return resources.filter(r => r.type === 'folder' && (r.resource_type || 'website') === resourceType);
}

export function getDirectChildrenCount(resources: ExternalResource[], folderId: string): number {
  return resources.filter(r => r.parent_id === folderId).length;
}

// 学习地图节点 slug ↔ 技能树模块 slug 映射
export const LEARNING_MAP_TO_SKILL_MODULE: Record<string, string> = {
  'pm-thinking': 'pm-basics',
  'user-research': 'user-research',
  'product-design': 'ai-product-design',
  'ai-commercialization': 'ai-commercialization',
  'pm-capability': 'pm-capability',
  'ai-fundamentals': 'ai-cognition',
  'prompt-engineering': 'prompt-eng',
  'ai-architecture': 'ai-native-design',
  'ai-workflow': 'ai-native-design',
  'conversational-ai': 'conversational-ai',
  'data-metrics': 'data-analysis',
  'ai-evaluation': 'evals',
  'product-strategy': 'product-strategy',
  'ai-leadership': 'ai-leadership',
  'job-preparation': 'job-preparation',
  'rag-architecture': 'rag-architecture',
  'ai-agent-design': 'ai-agent-design',
  'data-quality-annotation': 'data-quality-annotation',
  'ai-requirement-spec': 'ai-requirement-spec',
  'hitl-design': 'hitl-design',
  'content-compliance': 'content-compliance',
  'cn-llm-ecosystem': 'cn-llm-ecosystem',
  'badcase-analysis': 'badcase-analysis',
  'ai-vendor-evaluation': 'ai-vendor-evaluation',
  'ai-growth': 'ai-growth',
  'ai-safety': 'ai-safety',
  'data-flywheel': 'data-flywheel',
  'ai-frontier': 'ai-frontier',
  'job-practice': 'job-practice',
};

export const SKILL_MODULE_TO_LEARNING_MAP: Record<string, string> = Object.fromEntries(
  Object.entries(LEARNING_MAP_TO_SKILL_MODULE).map(([k, v]) => [v, k])
);
