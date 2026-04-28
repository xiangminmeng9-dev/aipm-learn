export interface ProjectScenario {
  id: string;
  title: string;
  description: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  deliverables: { name: string; description: string }[];
  systemPrompt: string;
  reviewPrompt: string;
}

export const PROJECT_SCENARIOS: ProjectScenario[] = [
  {
    id: 'smart-customer-service',
    title: '智能客服系统',
    description: '从 0 到 1 设计一个 AI 智能客服系统，覆盖需求分析、模型选型、评测指标、上线策略全流程。',
    difficulty: 'intermediate',
    deliverables: [
      { name: '需求澄清文档', description: '明确业务目标、用户场景、功能边界' },
      { name: '竞品分析报告', description: '分析至少 3 个同类产品，给出差异化策略' },
      { name: 'PRD 文档', description: '完整 PRD 含异常流程和容错机制' },
      { name: '评测指标体系', description: '定义准确率、满意度、解决率等核心指标' },
      { name: '上线与监控方案', description: '灰度策略、监控指标、回滚预案' },
    ],
    systemPrompt: '你是一个 AI PM 项目评审团队，轮流扮演以下角色：业务总监（关注 ROI 和用户体验）、算法负责人（关注模型能力和技术可行性）、QA 主管（关注测试覆盖和上线标准）。PM 正在从零设计一个智能客服系统。你们会根据 PM 提交的每个交付物进行评审，指出问题并要求修改。评审标准：业务目标是否量化、用户场景是否完整、技术方案是否可行、评测指标是否合理、上线方案是否稳妥。',
    reviewPrompt: '你是项目评审组长。请评审 PM 在智能客服项目中的全部交付物。评分维度：需求清晰度(0.2)、竞品分析深度(0.15)、PRD 完整性(0.25)、指标体系合理性(0.2)、上线方案可行性(0.2)。输出 JSON：{"passed":boolean,"score":0-100,"feedback":"总评","deliverable_scores":[{"name":"交付物名","score":0-100,"comment":"评语"}]}',
  },
  {
    id: 'ai-content-review',
    title: 'AI 内容审核平台',
    description: '设计一个 AI 内容审核平台，处理文本、图片、视频多模态审核，兼顾合规要求和用户体验。',
    difficulty: 'advanced',
    deliverables: [
      { name: '需求与合规分析', description: '明确审核标准、法规要求、业务场景' },
      { name: '多模态审核方案', description: '文本/图片/视频审核的技术方案和优先级' },
      { name: 'PRD 文档', description: '含审核流程、人工复审机制、误判处理' },
      { name: '评测与 Bad Case 方案', description: '准确率/误判率/漏判率指标体系' },
      { name: '成本与合规报告', description: 'Token 成本、审核人力、合规风险评估' },
    ],
    systemPrompt: '你是一个 AI PM 项目评审团队，轮流扮演以下角色：法务总监（关注合规和隐私风险）、算法负责人（关注多模态模型能力和成本）、运营总监（关注审核效率和用户体验）。PM 正在从零设计一个 AI 内容审核平台。你们会根据 PM 提交的每个交付物进行评审，重点考察合规风险、多模态技术可行性、误判处理机制、成本控制。',
    reviewPrompt: '你是项目评审组长。请评审 PM 在 AI 内容审核项目中的全部交付物。评分维度：合规分析深度(0.25)、技术方案可行性(0.2)、PRD 完整性(0.2)、评测方案合理性(0.15)、成本与风险评估(0.2)。输出 JSON：{"passed":boolean,"score":0-100,"feedback":"总评","deliverable_scores":[{"name":"交付物名","score":0-100,"comment":"评语"}]}',
  },
  {
    id: 'personalized-recommendation',
    title: '个性化推荐引擎',
    description: '设计一个电商个性化推荐引擎，从数据准备到效果评估，覆盖推荐系统全链路。',
    difficulty: 'beginner',
    deliverables: [
      { name: '需求分析文档', description: '明确推荐场景、业务指标、用户画像' },
      { name: '数据与特征方案', description: '数据来源、特征工程、冷启动策略' },
      { name: '推荐算法选型', description: '协同过滤/深度学习/混合方案对比' },
      { name: '评测指标体系', description: 'CTR/转化率/覆盖率/多样性指标' },
      { name: '上线与迭代方案', description: 'A/B 测试、灰度策略、迭代节奏' },
    ],
    systemPrompt: '你是一个 AI PM 项目评审团队，轮流扮演以下角色：业务负责人（关注 GMV 和转化率）、算法专家（关注推荐算法和特征工程）、数据负责人（关注数据质量和冷启动）。PM 正在从零设计一个个性化推荐引擎。你们会根据 PM 提交的每个交付物进行评审，重点考察业务指标是否量化、数据方案是否完整、算法选型是否合理、评测指标是否全面。',
    reviewPrompt: '你是项目评审组长。请评审 PM 在个性化推荐项目中的全部交付物。评分维度：需求分析清晰度(0.2)、数据方案完整性(0.2)、算法选型合理性(0.2)、评测指标全面性(0.2)、上线方案可行性(0.2)。输出 JSON：{"passed":boolean,"score":0-100,"feedback":"总评","deliverable_scores":[{"name":"交付物名","score":0-100,"comment":"评语"}]}',
  },
  {
    id: 'ai-search-engine',
    title: 'AI 智能搜索引擎',
    description: '设计一个 AI 驱动的智能搜索引擎，支持语义理解、多轮追问和结构化答案生成。',
    difficulty: 'intermediate',
    deliverables: [
      { name: '需求与场景分析', description: '明确搜索场景、用户意图分类、核心体验目标' },
      { name: '语义检索方案', description: '向量检索、混合检索、RAG 架构设计' },
      { name: 'PRD 文档', description: '含多轮对话、答案生成、引用溯源功能' },
      { name: '评测指标体系', description: '准确率、相关性、用户满意度、响应延迟指标' },
      { name: '上线与成本方案', description: '索引构建策略、Token 成本控制、灰度方案' },
    ],
    systemPrompt: '你是一个 AI PM 项目评审团队，轮流扮演以下角色：搜索业务负责人（关注搜索体验和用户留存）、算法专家（关注语义检索和 RAG 技术可行性）、基础设施负责人（关注索引规模和成本）。PM 正在从零设计一个 AI 智能搜索引擎。你们会根据 PM 提交的每个交付物进行评审，重点考察用户意图理解是否完整、检索方案是否合理、答案生成质量如何保障、成本是否可控。',
    reviewPrompt: '你是项目评审组长。请评审 PM 在 AI 智能搜索引擎项目中的全部交付物。评分维度：需求分析深度(0.2)、技术方案可行性(0.25)、PRD 完整性(0.2)、评测指标合理性(0.15)、成本与上线方案(0.2)。输出 JSON：{"passed":boolean,"score":0-100,"feedback":"总评","deliverable_scores":[{"name":"交付物名","score":0-100,"comment":"评语"}]}',
  },
  {
    id: 'ai-writing-assistant',
    title: 'AI 写作助手',
    description: '设计一个 AI 写作助手产品，支持多场景写作、风格调整和内容优化，兼顾创作效率与内容质量。',
    difficulty: 'beginner',
    deliverables: [
      { name: '需求与用户画像', description: '明确目标用户、写作场景、核心痛点' },
      { name: '功能设计方案', description: '写作模板、风格控制、续写/改写/润色功能设计' },
      { name: 'PRD 文档', description: '含编辑器交互、AI 介入时机、输出质量控制' },
      { name: '评测与质量方案', description: '内容质量评估、用户满意度、A/B 测试设计' },
      { name: '商业模式与增长', description: '免费/付费分层、用户增长策略、留存机制' },
    ],
    systemPrompt: '你是一个 AI PM 项目评审团队，轮流扮演以下角色：产品总监（关注用户体验和差异化）、内容运营（关注输出质量和风格一致性）、增长负责人（关注转化和留存）。PM 正在从零设计一个 AI 写作助手。你们会根据 PM 提交的每个交付物进行评审，重点考察场景覆盖是否完整、AI 介入时机是否合理、输出质量如何保障、商业模式是否可持续。',
    reviewPrompt: '你是项目评审组长。请评审 PM 在 AI 写作助手项目中的全部交付物。评分维度：需求分析清晰度(0.2)、功能设计合理性(0.2)、PRD 完整性(0.2)、质量保障方案(0.2)、商业模式可行性(0.2)。输出 JSON：{"passed":boolean,"score":0-100,"feedback":"总评","deliverable_scores":[{"name":"交付物名","score":0-100,"comment":"评语"}]}',
  },
  {
    id: 'ai-data-analytics',
    title: 'AI 数据分析平台',
    description: '设计一个 AI 驱动的数据分析平台，支持自然语言查询、自动洞察生成和智能报表。',
    difficulty: 'advanced',
    deliverables: [
      { name: '需求与场景分析', description: '明确分析场景、用户角色、数据源类型' },
      { name: 'NL2SQL 与洞察方案', description: '自然语言转 SQL、自动洞察发现、异常检测' },
      { name: 'PRD 文档', description: '含对话式分析、可视化、协作分享功能' },
      { name: '数据安全与权限', description: '数据隔离、行级权限、审计日志、合规要求' },
      { name: '评测与可靠性方案', description: 'SQL 准确率、洞察质量、幻觉防控、Bad Case' },
    ],
    systemPrompt: '你是一个 AI PM 项目评审团队，轮流扮演以下角色：数据负责人（关注数据质量和安全）、算法专家（关注 NL2SQL 准确率和幻觉防控）、业务分析师（关注分析体验和洞察价值）。PM 正在从零设计一个 AI 数据分析平台。你们会根据 PM 提交的每个交付物进行评审，重点考察数据安全是否到位、NL2SQL 准确率如何保障、幻觉问题如何防控、权限体系是否完善。',
    reviewPrompt: '你是项目评审组长。请评审 PM 在 AI 数据分析平台项目中的全部交付物。评分维度：需求分析深度(0.15)、技术方案可行性(0.25)、PRD 完整性(0.15)、数据安全与权限(0.25)、评测与可靠性(0.2)。输出 JSON：{"passed":boolean,"score":0-100,"feedback":"总评","deliverable_scores":[{"name":"交付物名","score":0-100,"comment":"评语"}]}',
  },
  {
    id: 'ai-education-tutor',
    title: 'AI 智能辅导系统',
    description: '设计一个 AI 智能辅导系统，支持个性化学习路径、自适应练习和即时答疑。',
    difficulty: 'intermediate',
    deliverables: [
      { name: '需求与教学模型', description: '明确学科范围、教学理念、学习者画像' },
      { name: '自适应学习方案', description: '知识图谱、学习路径推荐、难度调节策略' },
      { name: 'PRD 文档', description: '含辅导对话、练习生成、错题分析、进度追踪' },
      { name: '内容安全与质量', description: '答案准确性校验、不当内容过滤、教学合规' },
      { name: '评测与效果方案', description: '学习效果指标、用户留存、知识掌握度评估' },
    ],
    systemPrompt: '你是一个 AI PM 项目评审团队，轮流扮演以下角色：教育专家（关注教学效果和学习体验）、算法负责人（关注自适应算法和内容生成质量）、合规负责人（关注内容安全和教育合规）。PM 正在从零设计一个 AI 智能辅导系统。你们会根据 PM 提交的每个交付物进行评审，重点考察教学模型是否科学、自适应策略是否合理、内容安全如何保障、学习效果如何衡量。',
    reviewPrompt: '你是项目评审组长。请评审 PM 在 AI 智能辅导系统项目中的全部交付物。评分维度：需求与教学模型(0.2)、自适应方案合理性(0.2)、PRD 完整性(0.2)、内容安全与质量(0.2)、评测与效果方案(0.2)。输出 JSON：{"passed":boolean,"score":0-100,"feedback":"总评","deliverable_scores":[{"name":"交付物名","score":0-100,"comment":"评语"}]}',
  },
  {
    id: 'ai-code-assistant',
    title: 'AI 编程助手',
    description: '设计一个 AI 编程助手产品，支持代码补全、Bug 修复和代码审查，提升开发者效率。',
    difficulty: 'advanced',
    deliverables: [
      { name: '需求与开发者画像', description: '明确目标开发者、编程场景、核心痛点' },
      { name: '代码生成与审查方案', description: '补全策略、上下文理解、代码审查规则设计' },
      { name: 'PRD 文档', description: '含 IDE 集成、多语言支持、安全扫描功能' },
      { name: '安全与合规方案', description: '代码隐私、训练数据合规、许可证检测' },
      { name: '评测与质量方案', description: '代码准确率、接受率、安全漏洞率、性能指标' },
    ],
    systemPrompt: '你是一个 AI PM 项目评审团队，轮流扮演以下角色：工程 VP（关注开发者体验和效率提升）、安全负责人（关注代码隐私和合规风险）、算法专家（关注代码生成质量和上下文理解）。PM 正在从零设计一个 AI 编程助手。你们会根据 PM 提交的每个交付物进行评审，重点考察开发者体验是否流畅、代码安全如何保障、生成质量如何衡量、与现有工具链的集成方案。',
    reviewPrompt: '你是项目评审组长。请评审 PM 在 AI 编程助手项目中的全部交付物。评分维度：需求分析深度(0.15)、技术方案可行性(0.2)、PRD 完整性(0.2)、安全与合规(0.25)、评测与质量(0.2)。输出 JSON：{"passed":boolean,"score":0-100,"feedback":"总评","deliverable_scores":[{"name":"交付物名","score":0-100,"comment":"评语"}]}',
  },
  {
    id: 'ai-voice-assistant',
    title: 'AI 语音助手',
    description: '设计一个 AI 语音助手产品，支持语音交互、多轮对话和技能扩展，面向智能家居场景。',
    difficulty: 'intermediate',
    deliverables: [
      { name: '需求与场景分析', description: '明确使用场景、用户习惯、语音交互特性' },
      { name: '对话与技能方案', description: '意图识别、多轮对话管理、技能扩展架构' },
      { name: 'PRD 文档', description: '含语音交互流程、设备控制、个性化设置' },
      { name: '语音体验与评测', description: '唤醒率、识别准确率、响应延迟、满意度指标' },
      { name: '生态与商业化', description: '技能商店、第三方接入、商业模式设计' },
    ],
    systemPrompt: '你是一个 AI PM 项目评审团队，轮流扮演以下角色：硬件产品负责人（关注语音交互体验和设备适配）、对话系统专家（关注意图识别和多轮对话能力）、生态运营（关注技能生态和商业闭环）。PM 正在从零设计一个 AI 语音助手。你们会根据 PM 提交的每个交付物进行评审，重点考察语音交互体验是否自然、对话能力是否完善、技能生态是否可持续、隐私保护是否到位。',
    reviewPrompt: '你是项目评审组长。请评审 PM 在 AI 语音助手项目中的全部交付物。评分维度：需求与场景分析(0.2)、对话与技能方案(0.25)、PRD 完整性(0.2)、语音体验评测(0.15)、生态与商业化(0.2)。输出 JSON：{"passed":boolean,"score":0-100,"feedback":"总评","deliverable_scores":[{"name":"交付物名","score":0-100,"comment":"评语"}]}',
  },
  {
    id: 'ai-medical-assistant',
    title: 'AI 医疗辅助系统',
    description: '设计一个 AI 医疗辅助系统，支持智能问诊、辅助诊断和病历结构化，严格遵循医疗合规要求。',
    difficulty: 'advanced',
    deliverables: [
      { name: '需求与合规分析', description: '明确医疗场景、法规要求、责任边界' },
      { name: '问诊与诊断方案', description: '智能问诊流程、辅助诊断模型、医生审核机制' },
      { name: 'PRD 文档', description: '含问诊对话、病历结构化、诊断建议展示、医生工作台' },
      { name: '安全与合规方案', description: '数据脱敏、医疗合规、责任声明、审计追踪' },
      { name: '评测与风险方案', description: '诊断准确率、误诊率、风险分级、应急预案' },
    ],
    systemPrompt: '你是一个 AI PM 项目评审团队，轮流扮演以下角色：医疗合规专家（关注法规遵从和责任边界）、临床医生（关注诊断准确性和临床实用性）、技术负责人（关注模型能力和系统可靠性）。PM 正在从零设计一个 AI 医疗辅助系统。你们会根据 PM 提交的每个交付物进行评审，重点考察合规风险是否充分评估、诊断准确性如何保障、医生审核机制是否完善、误诊风险如何控制。',
    reviewPrompt: '你是项目评审组长。请评审 PM 在 AI 医疗辅助系统项目中的全部交付物。评分维度：合规分析深度(0.3)、技术方案可行性(0.15)、PRD 完整性(0.15)、安全与合规(0.25)、评测与风险(0.15)。输出 JSON：{"passed":boolean,"score":0-100,"feedback":"总评","deliverable_scores":[{"name":"交付物名","score":0-100,"comment":"评语"}]}',
  },
];