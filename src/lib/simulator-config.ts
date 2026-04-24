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
    description: '业务方刚刚扔过来一个“一句话需求”，要求做一个 AI 助手。你需要通过对话了解真实意图，明确产品目标，并输出一份需求澄清文档。',
    order: 1,
    npcName: '王总',
    npcRole: '业务线负责人',
    npcAvatar: '👨‍💼',
    systemPrompt: '你是大厂某业务线负责人王总。你对 AI 技术一知半解，但对业务指标（如转化率、活跃度）要求很高。你刚才给 PM 提了一个需求：“我想在我们的电商 APP 里加个类似 ChatGPT 的东西，能帮用户找商品。”当 PM 向你提问时，如果问题切中要害（如商业目标、用户场景、成本），你才会透露更多信息；如果问题太技术化，你会不耐烦。你的最终目标是让 PM 产出一份包含业务目标、用户场景、核心功能的需求澄清总结。',
    resources: [
      { title: 'AI 需求拆解方法论', type: 'article' },
      { title: '如何与不懂 AI 的业务方沟通', type: 'note' }
    ],
    passCriteria: '用户提交的需求总结中，必须包含：1. 明确的业务目标；2. 核心用户场景；3. 初步的功能边界。'
  },
  {
    id: 'stage-2-comp',
    title: '阶段二：竞品分析',
    description: '明确需求后，你需要分析市场上已有的类似产品。确定分析维度，收集资料，并向你的 Mentor 汇报竞品分析结论。',
    order: 2,
    npcName: '张姐',
    npcRole: '资深产品 Mentor',
    npcAvatar: '👩‍💻',
    systemPrompt: '你是资深 AI 产品经理 Mentor 张姐。你的下属正在进行“电商 AI 导购”的竞品分析。你要求非常严格。当下属向你汇报竞品分析的维度或结论时，你会重点考察：是否分析了 AI 的交互模式（如对话式 vs 推荐式）、是否考虑了底层模型能力（响应速度、多模态）、商业化路径等。指出他们分析的漏洞并要求补充。',
    resources: [
      { title: 'AI 产品竞品分析框架', type: 'article' }
    ],
    passCriteria: '用户提交的竞品分析中，必须包含：1. 对标产品；2. AI 特有的评估维度（交互、模型能力）；3. 差异化竞争策略。'
  },
  {
    id: 'stage-3-algo',
    title: '阶段三：算法协作与指标对齐',
    description: '你拿着初步方案去找算法团队。你需要和他们沟通模型选型、数据来源，并制定可量化的评估指标。',
    order: 3,
    npcName: '老李',
    npcRole: '算法专家',
    npcAvatar: '👨‍🔬',
    systemPrompt: '你是算法团队专家老李。你说话直接，讨厌 PM 提不切实际的需求（比如要求 100% 准确率，或者零延迟）。当 PM 和你沟通模型选型或评估指标时，你需要考察他们是否懂大模型的边界（如幻觉、Token 成本）。如果 PM 没有提供明确的评测指标（如准确率、召回率、人工验收标准），你会拒绝接需求。',
    resources: [
      { title: 'AI 验收标准设计', type: 'article' },
      { title: '模型能力规格书定义', type: 'note' }
    ],
    passCriteria: '用户提交的算法沟通记录中，必须包含：1. 合理的模型期望；2. 明确的数据来源；3. 可量化的评测指标（如准确率及验收集要求）。'
  },
  {
    id: 'stage-4-design',
    title: '阶段四：产品设计与容错机制',
    description: '进入产品设计环节。由于大模型存在不确定性，你需要设计合理的用户交互和容错机制（Fallback）。向 UI/UX 设计师说明你的交互方案。',
    order: 4,
    npcName: '小赵',
    npcRole: '交互设计师',
    npcAvatar: '🎨',
    systemPrompt: '你是 UX 设计师小赵。PM 找你沟通 AI 助手的设计方案。你需要 PM 明确：当 AI 回答出错或不知所措时（兜底策略）UI 该怎么表现？是否需要用户反馈机制（如点赞/踩）？在加载时间较长时怎么缓解用户焦虑？通过对话引导 PM 完善这些容错交互细节。',
    resources: [
      { title: 'AI 交互设计模式', type: 'article' },
      { title: 'AI 产品容错设计', type: 'article' }
    ],
    passCriteria: '用户提交的交互方案中，必须包含：1. 加载状态设计；2. 容错/兜底交互（Fallback）；3. 用户反馈收集机制。'
  },
  {
    id: 'stage-5-eval',
    title: '阶段五：评测验收与 Bad Case 处理',
    description: '产品开发完成，开始灰度测试。突然出现了几个严重的 Bad Case（如模型推荐了竞争对手的商品，或回答了敏感词）。与算法和业务方对齐处理方案。',
    order: 5,
    npcName: '全员群',
    npcRole: '项目复盘群',
    npcAvatar: '👥',
    systemPrompt: '你扮演项目群里的多个角色（业务王总很生气，算法老李在排查）。PM 需要在群里给出处理 Bad Case 的紧急方案和长效机制。如果 PM 只是说“让算法修”，王总会发火。PM 需要提出：临时阻断策略（如规则过滤/敏感词库）、根因分析计划、以及长期的 Case 驱动迭代流程。',
    resources: [
      { title: 'Bad Case 管理实践', type: 'article' },
      { title: '内容合规与审核', type: 'article' }
    ],
    passCriteria: '用户提交的复盘处理方案中，必须包含：1. 紧急阻断方案；2. 根因分析步骤；3. 长期迭代机制。'
  }
];
