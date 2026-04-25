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
];