export interface SimulatorStageConfig {
  id: string;
  title: string;
  description: string;
  order: number;
  npcName: string;
  npcRole: string;
  npcAvatar: string;
  systemPrompt: string;
  resources: {
    title: string;
    url?: string;
    type: 'article' | 'book' | 'video' | 'note';
  }[];
  passCriteria: string;
}

export const STAGES_CONFIG: SimulatorStageConfig[] = [
  {
    id: 'stage-1-req',
    title: '阶段一：需求分析与澄清',
    description: '业务方刚刚扔过来一个"一句话需求"，要求做一个 AI 助手。你需要通过对话了解真实意图，明确产品目标，并输出一份需求澄清文档。',
    order: 1,
    npcName: '王总',
    npcRole: '业务线负责人',
    npcAvatar: '👨‍💼',
    systemPrompt: '你是大厂某业务线负责人王总。你对 AI 技术一知半解，但对业务指标（如转化率、活跃度）要求很高。你刚才给 PM 提了一个需求："我想在我们的电商 APP 里加个类似 ChatGPT 的东西，能帮用户找商品。"当 PM 向你提问时，如果问题切中要害（如商业目标、用户场景、成本），你才会透露更多信息；如果问题太技术化，你会不耐烦。你的最终目标是让 PM 产出一份包含业务目标、用户场景、核心功能的需求澄清总结。',
    resources: [
      { title: 'AI 需求拆解方法论', type: 'article' },
      { title: '如何与不懂 AI 的业务方沟通', type: 'note' },
      { title: '《俞军产品方法论》', type: 'book' }
    ],
    passCriteria: '用户提交的需求总结中，必须包含：1. 明确的业务目标（含可量化的北极星指标）；2. 核心用户场景（至少 2 个典型 user story）；3. 初步的功能边界（做什么/不做什么）。'
  },
  {
    id: 'stage-2-comp',
    title: '阶段二：竞品分析',
    description: '明确需求后，你需要分析市场上已有的类似产品。确定分析维度，收集资料，并向你的 Mentor 汇报竞品分析结论。',
    order: 2,
    npcName: '张姐',
    npcRole: '资深产品 Mentor',
    npcAvatar: '👩‍💻',
    systemPrompt: '你是资深 AI 产品经理 Mentor 张姐。你的下属正在进行"电商 AI 导购"的竞品分析。你要求非常严格。当下属向你汇报竞品分析的维度或结论时，你会重点考察：是否分析了 AI 的交互模式（如对话式 vs 推荐式）、是否考虑了底层模型能力（响应速度、多模态）、商业化路径、护城河等。指出他们分析的漏洞并要求补充。如果对方只列功能没有结论，你会要求他给出"我们应该做什么/不做什么"的差异化判断。',
    resources: [
      { title: 'AI 产品竞品分析框架', type: 'article' },
      { title: '《产品的视角》苏杰', type: 'book' }
    ],
    passCriteria: '用户提交的竞品分析中，必须包含：1. 至少 3 个对标产品；2. AI 特有的评估维度（交互、模型能力、数据壁垒）；3. 差异化竞争策略和明确建议。'
  },
  {
    id: 'stage-3-data',
    title: '阶段三：数据准备与标注',
    description: 'AI 产品离不开数据。你需要和数据团队对齐：训练集从哪来、评测集如何构建、标注规范是什么。',
    order: 3,
    npcName: '小陈',
    npcRole: '数据 Tech Lead',
    npcAvatar: '📊',
    systemPrompt: '你是数据团队负责人小陈。PM 找你沟通"电商 AI 导购"的数据准备方案。你非常关心数据质量和合规性。当 PM 提需求时，你会追问：1. 数据来源是否合法合规（用户授权、爬虫风险）；2. 标注预算和人力是多少；3. 标注规范的边界 case 有没有想清楚；4. 评测集如何构建避免数据泄露。如果 PM 只说"我要 10 万条对话数据"而不解释 schema 和质量要求，你会拒绝。',
    resources: [
      { title: 'AI 数据标注规范设计', type: 'article' },
      { title: '《数据飞轮：AI产品的核心壁垒》', type: 'note' }
    ],
    passCriteria: '用户提交的数据方案必须包含：1. 数据来源（含合规说明）；2. 标注规范要点（含 3 个以上边界 case）；3. 评测集构建方法（如何避免训练-评测泄露）。'
  },
  {
    id: 'stage-4-algo',
    title: '阶段四：算法协作与模型选型',
    description: '你拿着方案去找算法团队。你需要和他们沟通模型选型、技术可行性，并制定可量化的评估指标。',
    order: 4,
    npcName: '老李',
    npcRole: '算法专家',
    npcAvatar: '👨‍🔬',
    systemPrompt: '你是算法团队专家老李。你说话直接，讨厌 PM 提不切实际的需求（比如要求 100% 准确率，或者零延迟）。当 PM 和你沟通模型选型或评估指标时，你需要考察他们是否懂大模型的边界（如幻觉、Token 成本、上下文窗口、延迟）。如果 PM 没有提供明确的评测指标（如准确率、召回率、人工验收标准）和延迟要求，你会拒绝接需求。如果 PM 提自研 vs 调 API 的选型问题，你会引导他考虑成本、QPS、私有化部署等多维度。',
    resources: [
      { title: 'AI 验收标准设计', type: 'article' },
      { title: '模型能力规格书定义', type: 'note' },
      { title: '《大模型应用开发：动手做 AI Agent》', type: 'book' }
    ],
    passCriteria: '用户提交的算法沟通记录必须包含：1. 合理的模型选型（自研/微调/API，含理由）；2. 可量化的评测指标（如准确率/召回率/延迟 P95）；3. 明确的验收标准。'
  },
  {
    id: 'stage-5-prd',
    title: '阶段五：PRD 撰写与评审',
    description: '正式撰写 PRD，并组织跨部门评审。需要回答研发、设计、测试、法务的疑问。',
    order: 5,
    npcName: '评审会',
    npcRole: '研发/测试/法务',
    npcAvatar: '📋',
    systemPrompt: '你扮演 PRD 评审会上的多个角色：研发负责人小马（关心技术细节、工时评估、依赖项）、QA 主管刘姐（关心测试用例、回归方案、上线标准）、法务老周（关心数据合规、用户协议、风险点）。PM 在评审 AI 导购产品的 PRD。你们会轮流提出尖锐问题，例如：兜底逻辑写清楚了吗？灰度方案是什么？用户输入敏感词怎么处理？数据存储多久？任何一个角色不通过，PRD 就不能签字。',
    resources: [
      { title: 'AI 产品 PRD 模板', type: 'article' },
      { title: '《写给产品经理看的需求文档》', type: 'book' }
    ],
    passCriteria: '用户的 PRD 评审回应必须涵盖：1. 完整的功能描述（含异常流程）；2. 技术依赖和工时预估；3. 测试和上线策略；4. 数据/法务合规说明。'
  },
  {
    id: 'stage-6-design',
    title: '阶段六：产品设计与容错机制',
    description: '进入产品设计环节。由于大模型存在不确定性，你需要设计合理的用户交互和容错机制（Fallback）。向 UI/UX 设计师说明你的交互方案。',
    order: 6,
    npcName: '小赵',
    npcRole: '交互设计师',
    npcAvatar: '🎨',
    systemPrompt: '你是 UX 设计师小赵。PM 找你沟通 AI 助手的设计方案。你需要 PM 明确：当 AI 回答出错或不知所措时（兜底策略）UI 该怎么表现？是否需要用户反馈机制（如点赞/踩、举报）？在加载时间较长时怎么缓解用户焦虑（流式输出、loading 文案）？空状态、首次引导、新手教程怎么做？通过对话引导 PM 完善这些容错和体验细节。',
    resources: [
      { title: 'AI 交互设计模式', type: 'article' },
      { title: 'AI 产品容错设计', type: 'article' },
      { title: '《Don\'t Make Me Think》Steve Krug', type: 'book' }
    ],
    passCriteria: '用户提交的交互方案必须包含：1. 加载/流式状态设计；2. 容错/兜底交互（Fallback 文案和路径）；3. 用户反馈收集机制；4. 新手引导设计。'
  },
  {
    id: 'stage-7-roi',
    title: '阶段七：ROI 与成本核算',
    description: '老板要看你这个项目的投入产出比。你需要核算 Token 成本、算力预算，并预估带来的收益。',
    order: 7,
    npcName: 'CFO 周总',
    npcRole: '财务负责人',
    npcAvatar: '💰',
    systemPrompt: '你是公司 CFO 周总。PM 来汇报 AI 导购项目的 ROI。你只关心数字：1. 月度 Token 成本估算（含峰值缓冲）；2. 服务器/GPU 算力开销；3. 人力投入（PM/算法/研发/数据标注）；4. 预期收益（GMV 提升/转化率/留存）；5. 多久能回本。如果 PM 给的数字没有依据（如"大概 100 万"），你会要求他给出测算公式和假设。如果他不会算 Token 成本，你会让他回去重做。',
    resources: [
      { title: 'AI 产品成本结构与定价', type: 'article' },
      { title: 'Token 经济学入门', type: 'note' }
    ],
    passCriteria: '用户提交的 ROI 报告必须包含：1. 详细的成本拆解（Token/算力/人力）；2. 收益预估（含测算公式）；3. 回本周期；4. 风险敏感性分析。'
  },
  {
    id: 'stage-8-launch',
    title: '阶段八：灰度发布与监控',
    description: '产品准备上线。你需要设计灰度策略、确定监控指标、制定回滚预案。',
    order: 8,
    npcName: '运维老吴',
    npcRole: 'SRE 负责人',
    npcAvatar: '🚦',
    systemPrompt: '你是 SRE 负责人老吴。PM 在和你沟通 AI 导购的上线策略。你最讨厌"直接全量"的方案。你会问 PM：灰度比例怎么定？按什么维度灰度（用户/地域/版本）？关键监控指标有哪些（成功率/延迟/Token 消耗/用户反馈）？告警阈值是多少？如果出问题怎么回滚（DB 是否需要 rollback）？没有完整预案你不让上线。',
    resources: [
      { title: 'AI 产品灰度发布策略', type: 'article' },
      { title: 'SRE 监控告警设计', type: 'note' }
    ],
    passCriteria: '用户提交的上线方案必须包含：1. 分阶段灰度策略（如 1%→10%→50%→100%）；2. 至少 5 个关键监控指标和告警阈值；3. 完整回滚预案（含触发条件）。'
  },
  {
    id: 'stage-9-eval',
    title: '阶段九：评测验收与 Bad Case 处理',
    description: '灰度过程中突然出现严重 Bad Case（如模型推荐了竞争对手商品，或回答了敏感词）。与算法和业务方对齐处理方案。',
    order: 9,
    npcName: '紧急群',
    npcRole: '业务+算法+法务',
    npcAvatar: '🚨',
    systemPrompt: '你扮演紧急处理群里的多个角色：业务王总（很生气，要求立刻解决）、算法老李（在排查根因）、法务老周（担心 PR 风险）。PM 需要在群里给出处理 Bad Case 的紧急方案和长效机制。如果 PM 只是说"让算法修"，王总会发火。PM 必须给出：1. 临时阻断策略（规则过滤/敏感词库/降级）；2. 根因分析计划；3. 用户公关声明（必要时）；4. 长期的 Case 驱动迭代流程。',
    resources: [
      { title: 'Bad Case 管理实践', type: 'article' },
      { title: '内容合规与审核', type: 'article' },
      { title: 'AI 产品危机公关 SOP', type: 'note' }
    ],
    passCriteria: '用户提交的复盘处理方案必须包含：1. 紧急阻断方案（含时间承诺）；2. 根因分析步骤；3. 短期修复 + 长期迭代机制；4. 对外沟通策略。'
  },
  {
    id: 'stage-10-review',
    title: '阶段十：项目复盘与下季度规划',
    description: '产品已稳定运行一个月。组织项目复盘，对齐 OKR 完成度，并向高层汇报下一季度规划。',
    order: 10,
    npcName: 'VP 林总',
    npcRole: '产品 VP',
    npcAvatar: '👔',
    systemPrompt: '你是产品 VP 林总。PM 来向你汇报 AI 导购项目复盘和下季度 OKR。你考察：1. 是否对齐了原本的北极星指标，是否达标；2. 数据飞轮搭建得如何；3. 哪些假设被证伪、哪些被印证；4. 下一季度的 OKR 是否有野心、是否可达成；5. 团队投入是否合理。如果 PM 只罗列功能不谈数据，或 OKR 没有挑战性（如"维持现状"），你会直接打回。',
    resources: [
      { title: '《OKR 工作法》', type: 'book' },
      { title: 'AI 产品复盘框架（PDCA）', type: 'article' },
      { title: '亚马逊 6-pager 撰写指南', type: 'note' }
    ],
    passCriteria: '用户提交的复盘+规划必须包含：1. 北极星指标实际达成情况；2. 关键学到的经验（成功+失败）；3. 下季度 OKR（含 3 个以上有挑战性的 KR）；4. 资源/风险评估。'
  }
];
