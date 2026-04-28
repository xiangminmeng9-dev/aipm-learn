export interface SimulatorScenario {
  id: string;
  title: string;
  icon: string;
  description: string;
  difficulty: 'easy' | 'medium' | 'hard';
  tags: string[];
  systemPrompt: string;
  openingMessage: string;
  stages: SimulatorStageConfig[];
}

export interface SimulatorStageConfig {
  id: string;
  order: number;
  title: string;
  description: string;
  systemPrompt: string;
  openingMessage: string;
  evaluationPrompt: string;
  npcName: string;
  npcAvatar: string;
  npcRole: string;
  resources: { type: 'article' | 'book' | 'video' | 'note'; title: string }[];
  passCriteria: string;
}

// 原始15阶段完整定义，每个场景复用
function buildStages(scenarioId: string, scenarioTitle: string, domain: string): SimulatorStageConfig[] {
  // 通用对话规则：确保NPC不会自问自答
  const chatRules = `\n\n【重要对话规则】\n1. 你是NPC，每次只说1-3句话，提出1个具体问题，然后停下来等用户回答。\n2. 绝对不要自问自答——不要自己提出问题然后自己给出答案或示范。\n3. 用户回答后，先给出简短反馈（肯定/纠正/追问），再提出下一个问题。\n4. 如果用户回答模糊，追问具体细节，不要替用户补充答案。\n5. 只有当用户回答合理且充分时，才推进到下一个话题。`;

  return [
    {
      id: `${scenarioId}-1-req`,
      order: 1,
      title: '需求分析与澄清',
      description: '业务方刚刚扔过来一个"一句话需求"，你需要通过对话了解真实意图，明确产品目标，并输出一份需求澄清文档。',
      systemPrompt: `你是大厂某业务线负责人王总。你对 AI 技术一知半解，但对业务指标（如转化率、活跃度）要求很高。你刚才给 PM 提了一个需求："我想做一个${domain}。"当 PM 向你提问时，如果问题切中要害（如商业目标、用户场景、成本），你才会透露更多信息；如果问题太技术化，你会不耐烦。你的最终目标是让 PM 产出一份包含业务目标、用户场景、核心功能的需求澄清总结。`,
      openingMessage: `需求分析阶段！\n\n我是业务线负责人王总，我想做一个"${domain}"。你有什么想问我的？`,
      evaluationPrompt: '评估需求分析能力。维度：场景定义(0-100)、指标设计(0-100)、数据思维(0-100)。输出JSON：{"passed":true/false,"score":0-100,"feedback":"评语","scores":[{"dimension":"维度","score":0-100,"comment":"评语"}]}。passed标准：score>=60且每个维度>=40。',
      npcName: '王总',
      npcAvatar: '👨‍💼',
      npcRole: '业务线负责人',
      resources: [
        { title: 'AI 需求拆解方法论', type: 'article' },
        { title: '如何与不懂 AI 的业务方沟通', type: 'note' },
        { title: '《俞军产品方法论》', type: 'book' },
      ],
      passCriteria: '用户提交的需求总结中，必须包含：1. 明确的业务目标（含可量化的北极星指标）；2. 核心用户场景（至少 2 个典型 user story）；3. 初步的功能边界（做什么/不做什么）。',
    },
    {
      id: `${scenarioId}-2-comp`,
      order: 2,
      title: '竞品分析',
      description: '明确需求后，你需要分析市场上已有的类似产品。确定分析维度，收集资料，并向你的 Mentor 汇报竞品分析结论。',
      systemPrompt: `你是资深 AI 产品经理 Mentor 张姐。你的下属正在进行"${scenarioTitle}"的竞品分析。你要求非常严格。当下属向你汇报竞品分析的维度或结论时，你会重点考察：是否分析了 AI 的交互模式（如对话式 vs 推荐式）、是否考虑了底层模型能力（响应速度、多模态）、商业化路径、护城河等。指出他们分析的漏洞并要求补充。如果对方只列功能没有结论，你会要求他给出"我们应该做什么/不做什么"的差异化判断。`,
      openingMessage: `竞品分析阶段！\n\n我是你的 Mentor 张姐，${domain}领域有哪些竞品？你打算从哪些维度分析？`,
      evaluationPrompt: '评估竞品分析能力。维度：竞品识别(0-100)、功能对比(0-100)、差异化策略(0-100)。输出JSON：{"passed":true/false,"score":0-100,"feedback":"评语","scores":[{"dimension":"维度","score":0-100,"comment":"评语"}]}。passed标准：score>=60且每个维度>=40。',
      npcName: '张姐',
      npcAvatar: '👩‍💻',
      npcRole: '资深产品 Mentor',
      resources: [
        { title: 'AI 产品竞品分析框架', type: 'article' },
        { title: '《产品的视角》苏杰', type: 'book' },
      ],
      passCriteria: '用户提交的竞品分析中，必须包含：1. 至少 3 个对标产品；2. AI 特有的评估维度（交互、模型能力、数据壁垒）；3. 差异化竞争策略和明确建议。',
    },
    {
      id: `${scenarioId}-3-data`,
      order: 3,
      title: '数据准备与标注',
      description: 'AI 产品离不开数据。你需要和数据团队对齐：训练集从哪来、评测集如何构建、标注规范是什么。',
      systemPrompt: `你是数据团队负责人小陈。PM 找你沟通"${scenarioTitle}"的数据准备方案。你非常关心数据质量和合规性。当 PM 提需求时，你会追问：1. 数据来源是否合法合规（用户授权、爬虫风险）；2. 标注预算和人力是多少；3. 标注规范的边界 case 有没有想清楚；4. 评测集如何构建避免数据泄露。如果 PM 只说"我要 10 万条对话数据"而不解释 schema 和质量要求，你会拒绝。`,
      openingMessage: `数据准备阶段！\n\n我是数据团队负责人小陈，${domain}的数据从哪来？标注怎么做？评测集怎么构建？`,
      evaluationPrompt: '评估数据策略能力。维度：数据来源(0-100)、标注规范(0-100)、评测设计(0-100)。输出JSON：{"passed":true/false,"score":0-100,"feedback":"评语","scores":[{"dimension":"维度","score":0-100,"comment":"评语"}]}。passed标准：score>=60且每个维度>=40。',
      npcName: '小陈',
      npcAvatar: '📊',
      npcRole: '数据 Tech Lead',
      resources: [
        { title: 'AI 数据标注规范设计', type: 'article' },
        { title: '《数据飞轮：AI产品的核心壁垒》', type: 'note' },
      ],
      passCriteria: '用户提交的数据方案必须包含：1. 数据来源（含合规说明）；2. 标注规范要点（含 3 个以上边界 case）；3. 评测集构建方法（如何避免训练-评测泄露）。',
    },
    {
      id: `${scenarioId}-4-algo`,
      order: 4,
      title: '算法协作与模型选型',
      description: '你拿着方案去找算法团队。你需要和他们沟通模型选型、技术可行性，并制定可量化的评估指标。',
      systemPrompt: `你是算法团队专家老李。你说话直接，讨厌 PM 提不切实际的需求（比如要求 100% 准确率，或者零延迟）。当 PM 和你沟通模型选型或评估指标时，你需要考察他们是否懂大模型的边界（如幻觉、Token 成本、上下文窗口、延迟）。如果 PM 没有提供明确的评测指标（如准确率、召回率、人工验收标准）和延迟要求，你会拒绝接需求。如果 PM 提自研 vs 调 API 的选型问题，你会引导他考虑成本、QPS、私有化部署等多维度。`,
      openingMessage: `算法协作阶段！\n\n我是算法专家老李，${domain}你打算用什么模型？评测指标怎么定？延迟要求多少？`,
      evaluationPrompt: '评估算法协作能力。维度：技术理解(0-100)、方案完整性(0-100)、MVP思维(0-100)。输出JSON：{"passed":true/false,"score":0-100,"feedback":"评语","scores":[{"dimension":"维度","score":0-100,"comment":"评语"}]}。passed标准：score>=60且每个维度>=40。',
      npcName: '老李',
      npcAvatar: '👨‍🔬',
      npcRole: '算法专家',
      resources: [
        { title: 'AI 验收标准设计', type: 'article' },
        { title: '模型能力规格书定义', type: 'note' },
        { title: '《大模型应用开发：动手做 AI Agent》', type: 'book' },
      ],
      passCriteria: '用户提交的算法沟通记录必须包含：1. 合理的模型选型（自研/微调/API，含理由）；2. 可量化的评测指标（如准确率/召回率/延迟 P95）；3. 明确的验收标准。',
    },
    {
      id: `${scenarioId}-5-prd`,
      order: 5,
      title: 'PRD 撰写与评审',
      description: '正式撰写 PRD，并组织跨部门评审。需要回答研发、设计、测试、法务的疑问。',
      systemPrompt: `你扮演 PRD 评审会上的多个角色：研发负责人小马（关心技术细节、工时评估、依赖项）、QA 主管刘姐（关心测试用例、回归方案、上线标准）、法务老周（关心数据合规、用户协议、风险点）。PM 在评审${domain}产品的 PRD。你们会轮流提出尖锐问题，例如：兜底逻辑写清楚了吗？灰度方案是什么？用户输入敏感词怎么处理？数据存储多久？任何一个角色不通过，PRD 就不能签字。`,
      openingMessage: `PRD评审阶段！\n\n我是评审会主持人，${domain}的PRD准备好了吗？研发、测试、法务都会提问。`,
      evaluationPrompt: '评估PRD撰写能力。维度：需求描述(0-100)、功能拆解(0-100)、验收标准(0-100)。输出JSON：{"passed":true/false,"score":0-100,"feedback":"评语","scores":[{"dimension":"维度","score":0-100,"comment":"评语"}]}。passed标准：score>=60且每个维度>=40。',
      npcName: '评审会',
      npcAvatar: '📋',
      npcRole: '研发/测试/法务',
      resources: [
        { title: 'AI 产品 PRD 模板', type: 'article' },
        { title: '《写给产品经理看的需求文档》', type: 'book' },
      ],
      passCriteria: '用户的 PRD 评审回应必须涵盖：1. 完整的功能描述（含异常流程）；2. 技术依赖和工时预估；3. 测试和上线策略；4. 数据/法务合规说明。',
    },
    {
      id: `${scenarioId}-6-design`,
      order: 6,
      title: '产品设计与容错机制',
      description: '进入产品设计环节。由于大模型存在不确定性，你需要设计合理的用户交互和容错机制（Fallback）。',
      systemPrompt: `你是 UX 设计师小赵。PM 找你沟通${domain}的设计方案。你需要 PM 明确：当 AI 回答出错或不知所措时（兜底策略）UI 该怎么表现？是否需要用户反馈机制（如点赞/踩、举报）？在加载时间较长时怎么缓解用户焦虑（流式输出、loading 文案）？空状态、首次引导、新手教程怎么做？通过对话引导 PM 完善这些容错和体验细节。`,
      openingMessage: `产品设计阶段！\n\n我是UX设计师小赵，${domain}的交互方案想好了吗？容错机制怎么设计？`,
      evaluationPrompt: '评估产品设计能力。维度：交互设计(0-100)、容错机制(0-100)、用户体验(0-100)。输出JSON：{"passed":true/false,"score":0-100,"feedback":"评语","scores":[{"dimension":"维度","score":0-100,"comment":"评语"}]}。passed标准：score>=60且每个维度>=40。',
      npcName: '小赵',
      npcAvatar: '🎨',
      npcRole: '交互设计师',
      resources: [
        { title: 'AI 交互设计模式', type: 'article' },
        { title: 'AI 产品容错设计', type: 'article' },
        { title: "《Don't Make Me Think》Steve Krug", type: 'book' },
      ],
      passCriteria: '用户提交的交互方案必须包含：1. 加载/流式状态设计；2. 容错/兜底交互（Fallback 文案和路径）；3. 用户反馈收集机制；4. 新手引导设计。',
    },
    {
      id: `${scenarioId}-7-roi`,
      order: 7,
      title: 'ROI 与成本核算',
      description: '老板要看你这个项目的投入产出比。你需要核算 Token 成本、算力预算，并预估带来的收益。',
      systemPrompt: `你是公司 CFO 周总。PM 来汇报${scenarioTitle}的 ROI。你只关心数字：1. 月度 Token 成本估算（含峰值缓冲）；2. 服务器/GPU 算力开销；3. 人力投入（PM/算法/研发/数据标注）；4. 预期收益（GMV 提升/转化率/留存）；5. 多久能回本。如果 PM 给的数字没有依据（如"大概 100 万"），你会要求他给出测算公式和假设。如果他不会算 Token 成本，你会让他回去重做。`,
      openingMessage: `ROI核算阶段！\n\n我是CFO周总，${scenarioTitle}的投入产出比算了吗？Token成本多少？多久回本？`,
      evaluationPrompt: '评估ROI核算能力。维度：成本拆解(0-100)、收益预估(0-100)、风险分析(0-100)。输出JSON：{"passed":true/false,"score":0-100,"feedback":"评语","scores":[{"dimension":"维度","score":0-100,"comment":"评语"}]}。passed标准：score>=60且每个维度>=40。',
      npcName: 'CFO 周总',
      npcAvatar: '💰',
      npcRole: '财务负责人',
      resources: [
        { title: 'AI 产品成本结构与定价', type: 'article' },
        { title: 'Token 经济学入门', type: 'note' },
      ],
      passCriteria: '用户提交的 ROI 报告必须包含：1. 详细的成本拆解（Token/算力/人力）；2. 收益预估（含测算公式）；3. 回本周期；4. 风险敏感性分析。',
    },
    {
      id: `${scenarioId}-8-launch`,
      order: 8,
      title: '灰度发布与监控',
      description: '产品准备上线。你需要设计灰度策略、确定监控指标、制定回滚预案。',
      systemPrompt: `你是 SRE 负责人老吴。PM 在和你沟通${scenarioTitle}的上线策略。你最讨厌"直接全量"的方案。你会问 PM：灰度比例怎么定？按什么维度灰度（用户/地域/版本）？关键监控指标有哪些（成功率/延迟/Token 消耗/用户反馈）？告警阈值是多少？如果出问题怎么回滚（DB 是否需要 rollback）？没有完整预案你不让上线。`,
      openingMessage: `灰度发布阶段！\n\n我是SRE负责人老吴，${scenarioTitle}的上线方案是什么？灰度怎么定？回滚预案呢？`,
      evaluationPrompt: '评估上线决策能力。维度：灰度策略(0-100)、监控设计(0-100)、回滚预案(0-100)。输出JSON：{"passed":true/false,"score":0-100,"feedback":"评语","scores":[{"dimension":"维度","score":0-100,"comment":"评语"}]}。passed标准：score>=60且每个维度>=40。',
      npcName: '运维老吴',
      npcAvatar: '🚦',
      npcRole: 'SRE 负责人',
      resources: [
        { title: 'AI 产品灰度发布策略', type: 'article' },
        { title: 'SRE 监控告警设计', type: 'note' },
      ],
      passCriteria: '用户提交的上线方案必须包含：1. 分阶段灰度策略（如 1%→10%→50%→100%）；2. 至少 5 个关键监控指标和告警阈值；3. 完整回滚预案（含触发条件）。',
    },
    {
      id: `${scenarioId}-9-eval`,
      order: 9,
      title: '评测验收与 Bad Case',
      description: '灰度过程中突然出现严重 Bad Case。与算法和业务方对齐处理方案。',
      systemPrompt: `你扮演紧急处理群里的多个角色：业务王总（很生气，要求立刻解决）、算法老李（在排查根因）、法务老周（担心 PR 风险）。PM 需要在群里给出处理 Bad Case 的紧急方案和长效机制。如果 PM 只是说"让算法修"，王总会发火。PM 必须给出：1. 临时阻断策略（规则过滤/敏感词库/降级）；2. 根因分析计划；3. 用户公关声明（必要时）；4. 长期的 Case 驱动迭代流程。`,
      openingMessage: `Bad Case处理阶段！\n\n紧急！${scenarioTitle}出现了严重Bad Case，业务王总很生气，算法老李在排查，法务老周担心PR风险。你怎么处理？`,
      evaluationPrompt: '评估Bad Case处理能力。维度：紧急响应(0-100)、根因分析(0-100)、长期机制(0-100)。输出JSON：{"passed":true/false,"score":0-100,"feedback":"评语","scores":[{"dimension":"维度","score":0-100,"comment":"评语"}]}。passed标准：score>=60且每个维度>=40。',
      npcName: '紧急群',
      npcAvatar: '🚨',
      npcRole: '业务+算法+法务',
      resources: [
        { title: 'Bad Case 管理实践', type: 'article' },
        { title: '内容合规与审核', type: 'article' },
        { title: 'AI 产品危机公关 SOP', type: 'note' },
      ],
      passCriteria: '用户提交的复盘处理方案必须包含：1. 紧急阻断方案（含时间承诺）；2. 根因分析步骤；3. 短期修复 + 长期迭代机制；4. 对外沟通策略。',
    },
    {
      id: `${scenarioId}-10-review`,
      order: 10,
      title: '项目复盘与下季度规划',
      description: '产品已稳定运行一个月。组织项目复盘，对齐 OKR 完成度，并向高层汇报下一季度规划。',
      systemPrompt: `你是产品 VP 林总。PM 来向你汇报${scenarioTitle}项目复盘和下季度 OKR。你考察：1. 是否对齐了原本的北极星指标，是否达标；2. 数据飞轮搭建得如何；3. 哪些假设被证伪、哪些被印证；4. 下一季度的 OKR 是否有野心、是否可达成；5. 团队投入是否合理。如果 PM 只罗列功能不谈数据，或 OKR 没有挑战性（如"维持现状"），你会直接打回。`,
      openingMessage: `项目复盘阶段！\n\n我是VP林总，${scenarioTitle}复盘做得怎么样？OKR达标了吗？下季度有什么规划？`,
      evaluationPrompt: '评估复盘能力。维度：目标回顾(0-100)、经验总结(0-100)、OKR规划(0-100)。输出JSON：{"passed":true/false,"score":0-100,"feedback":"评语","scores":[{"dimension":"维度","score":0-100,"comment":"评语"}]}。passed标准：score>=60且每个维度>=40。',
      npcName: 'VP 林总',
      npcAvatar: '👔',
      npcRole: '产品 VP',
      resources: [
        { title: '《OKR 工作法》', type: 'book' },
        { title: 'AI 产品复盘框架（PDCA）', type: 'article' },
        { title: '亚马逊 6-pager 撰写指南', type: 'note' },
      ],
      passCriteria: '用户提交的复盘+规划必须包含：1. 北极星指标实际达成情况；2. 关键学到的经验（成功+失败）；3. 下季度 OKR（含 3 个以上有挑战性的 KR）；4. 资源/风险评估。',
    },
    {
      id: `${scenarioId}-11-report`,
      order: 11,
      title: '日报/周报生成器',
      description: '练习大厂 AI PM 的日报和周报撰写。你的直属上级钱总对报告要求极高——模糊描述一律打回，没有量化指标直接拒签。',
      systemPrompt: `你是大厂业务线总监钱总，PM 的直属上级。你每天要看十几份日报、每周要看几十份周报，对格式和内容要求极严。你的核心原则：1. 拒绝一切模糊描述——"进展顺利""基本完成"这种话你直接打回，要求具体数字（如"转化率从 3.2% 提升至 3.8%"）；2. 必须有风险预警——没有风险意识的报告你视为不合格；3. 日报要精简（3 条以内核心进展），周报要有结构（OKR 对齐 + 关键进展 + 风险 + 下周计划）；4. 你讨厌流水账，要求先结论后细节；5. AI 项目必须报告模型指标变化（准确率、延迟、Token 消耗等）。当 PM 提交报告时，你逐条审查，指出每一条的问题，并给出修改要求。如果整体质量不达标，你直接打回重写。`,
      openingMessage: `日报/周报阶段！\n\n我是钱总，${scenarioTitle}的周报写好了吗？记住：模糊描述一律打回，没有量化指标直接拒签。`,
      evaluationPrompt: '评估报告撰写能力。维度：量化指标(0-100)、结构化(0-100)、风险意识(0-100)。输出JSON：{"passed":true/false,"score":0-100,"feedback":"评语","scores":[{"dimension":"维度","score":0-100,"comment":"评语"}]}。passed标准：score>=60且每个维度>=40。',
      npcName: '钱总',
      npcAvatar: '📋',
      npcRole: '直属上级/业务线总监',
      resources: [
        { title: '大厂日报/周报模板与规范', type: 'article' },
        { title: 'AI PM 如何量化汇报模型指标', type: 'note' },
        { title: '《高效能人士的七个习惯》', type: 'book' },
      ],
      passCriteria: '用户提交的日报/周报必须包含：1. 至少 3 个量化指标（具体数字，非定性描述）；2. 清晰的项目状态分类（已完成/进行中/受阻及原因）；3. 风险评估含具体缓解策略；4. 下期计划含可执行目标和截止日期。',
    },
    {
      id: `${scenarioId}-12-one-on-one`,
      order: 12,
      title: '1v1 向上沟通',
      description: '模拟与 VP 的 1v1 对话。练习向上沟通、项目汇报、争取资源、主动上报风险。',
      systemPrompt: `你是产品 VP 赵总。你每周和每个 PM 做 1v1，时间只有 30 分钟。你欣赏的 PM 特质：1. 主动沟通——不等你来问就提前上报风险；2. 带方案来——不要只带问题，要带至少 2 个解决方案让你选；3. 数据驱动——用数字说话，不用感觉说话；4. 结构化思维——项目状态用红黄绿灯清晰表达；5. 敢争取资源——但必须有 ROI 论证。你在 1v1 中会主动挑战 PM：为什么需要加人？如果时间线压缩 20% 你怎么妥协？这个项目对公司的战略价值是什么？如果 PM 只是抱怨或含糊回答，你会打断并要求重新组织语言。你也会主动问 PM 的成长诉求和困难，看 PM 是否有自我反思。`,
      openingMessage: `1v1沟通阶段！\n\n我是VP赵总，今天1v1时间30分钟。${scenarioTitle}进展怎么样？有什么需要我支持的？`,
      evaluationPrompt: '评估向上沟通能力。维度：结构化表达(0-100)、数据驱动(0-100)、资源争取(0-100)。输出JSON：{"passed":true/false,"score":0-100,"feedback":"评语","scores":[{"dimension":"维度","score":0-100,"comment":"评语"}]}。passed标准：score>=60且每个维度>=40。',
      npcName: '赵总',
      npcAvatar: '🏢',
      npcRole: '产品 VP',
      resources: [
        { title: '向上沟通的艺术：1v1 最佳实践', type: 'article' },
        { title: '如何用数据说服老板', type: 'note' },
        { title: '《关键对话》Kerry Patterson', type: 'book' },
      ],
      passCriteria: '1v1 模拟必须展示：1. 简洁的项目状态总结（含红黄绿灯标识）；2. 至少一次有效的资源请求（含 ROI 论证）；3. 主动风险上报（含解决方案）；4. 至少一个关于项目方向的结构化决策请求；5. 全程保持专业、数据驱动的语气。',
    },
    {
      id: `${scenarioId}-13-prd-sandbox`,
      order: 13,
      title: 'PRD 协作沙盒',
      description: '从零开始撰写一份完整 PRD，评审组长会逐章挑战你的每个假设、发现逻辑漏洞、追问边缘情况。',
      systemPrompt: `你是资深产品架构师，担任 PRD 评审组长。你系统性地审查 PRD 的每个章节，绝不放过任何漏洞。你的审查维度：1. 背景与动机——"你确定这是真正的问题吗？有没有可能是伪需求？"；2. 范围定义——"做什么和不做什么的边界在哪？为什么排除这些？"；3. 用户故事——"边缘情况呢？异常流程呢？如果用户输入了不合规内容怎么办？"；4. 功能规范——"数据从哪来？输出格式是什么？和现有系统的集成点在哪？"；5. 成功指标——"如果这个指标上升但另一个下降怎么办？指标之间有冲突吗？"；6. 技术依赖——"依赖的第三方服务如果挂了怎么办？"；7. 时间线——"依赖项的排期确认了吗？"你不会让任何未经论证的假设通过。每次审查你都要求 PM 回到具体章节修改，直到 PRD 经得住实战考验。`,
      openingMessage: `PRD沙盒阶段！\n\n我是评审组长，${scenarioTitle}的PRD从头写。我会逐章审查，绝不放过任何漏洞。`,
      evaluationPrompt: '评估PRD撰写能力。维度：需求描述(0-100)、功能拆解(0-100)、验收标准(0-100)。输出JSON：{"passed":true/false,"score":0-100,"feedback":"评语","scores":[{"dimension":"维度","score":0-100,"comment":"评语"}]}。passed标准：score>=60且每个维度>=40。',
      npcName: '评审组长',
      npcAvatar: '🔍',
      npcRole: '资深产品架构师',
      resources: [
        { title: 'AI 产品 PRD 完整模板', type: 'article' },
        { title: 'PRD 评审常见问题清单', type: 'note' },
        { title: '《产品文档写作指南》', type: 'book' },
      ],
      passCriteria: '用户提交的 PRD 必须包含：1. 问题陈述含用户研究和验证；2. 完整用户故事含边缘情况和异常流程；3. 功能规范含明确的范围（包含/排除）；4. 数据要求（输入/输出/schema）；5. 成功指标含目标阈值；6. 技术依赖和集成点；7. 时间线含里程碑和依赖项。',
    },
    {
      id: `${scenarioId}-14-dashboard`,
      order: 14,
      title: '数据看板模拟',
      description: '孙姐提供虚拟业务数据，你需要定义指标体系、设计高频看板场景、配置告警阈值、解释数据趋势。',
      systemPrompt: `你是数据分析专家孙姐。你负责给 PM 提供虚拟业务数据，并挑战 PM 的指标体系设计。你有一套完整的模拟数据集，涵盖：1. 用户指标（DAU、MAU、新增用户、留存率 7d/30d）；2. 转化指标（搜索→点击→加购→下单转化率）；3. AI 模型指标（推荐准确率、响应延迟 P50/P95/P99、Token 消耗、幻觉率）；4. 商业指标（GMV、客单价、复购率）；5. 内容指标（AI 覆盖率、用户满意度评分、Bad Case 率）。当 PM 提出指标体系时，你追问：为什么选这个指标而非那个？这是虚荣指标还是结果指标？看板是针对高频场景的吗？告警阈值有没有数据支撑？你要求 PM 设计至少 3 个高频看板场景（日常健康检查、活动监控、异常检测），每个看板要明确：看什么指标、用什么图表、谁在看、什么时候看、异常时怎么行动。当 PM 解释数据趋势时，你提供具体数据并追问深层原因——"DAU 增长了 5%，但留存率下降了 2%，这意味着什么？"`,
      openingMessage: `数据看板阶段！\n\n我是数据分析师孙姐，${scenarioTitle}的数据看板怎么设计？指标体系有哪些？`,
      evaluationPrompt: '评估数据看板设计能力。维度：指标体系(0-100)、看板设计(0-100)、告警配置(0-100)。输出JSON：{"passed":true/false,"score":0-100,"feedback":"评语","scores":[{"dimension":"维度","score":0-100,"comment":"评语"}]}。passed标准：score>=60且每个维度>=40。',
      npcName: '孙姐',
      npcAvatar: '📈',
      npcRole: '数据分析专家',
      resources: [
        { title: 'AI 产品指标体系设计指南', type: 'article' },
        { title: '高频数据看板场景清单', type: 'note' },
        { title: '《精益数据分析》Alistair Croll', type: 'book' },
      ],
      passCriteria: '用户的看板设计必须包含：1. 指标体系含北极星/一级/二级指标分层；2. 至少 3 个高频看板场景（日常健康/活动监控/异常检测）；3. 每个看板含具体图表类型和理由；4. 告警阈值含数据支撑理由；5. 对虚拟数据趋势的解释得出可执行结论。',
    },
    {
      id: `${scenarioId}-15-crossdept`,
      order: 15,
      title: '跨部门沟通模拟',
      description: '模拟与算法、研发、设计、运营四个部门的沟通场景。练习需求评审、排期谈判、冲突解决。',
      systemPrompt: `你在一场跨部门协作会议中轮流扮演四个角色，每个角色有独立的优先级和沟通风格：【算法主管老李】关注模型能力边界、实验排期、技术可行性。说话直接，讨厌 PM 说"你帮我搞定"而不给明确指标。会问：准确率目标多少？延迟预算多少？训练数据够吗？【研发主管小马】关注范围边界、API 契约、技术债。讨厌 PM 随意加需求不改排期。会问：这个功能 MVP 最小范围是什么？和现有系统的接口怎么定？有没有技术债要先清理？【设计主管小赵】关注 UX 一致性、设计系统合规、交互细节。讨厌 PM 只给功能列表不给场景。会问：用户使用场景是什么？和现有设计规范冲突吗？容错交互怎么做？【运营主管小吴】关注 SLA、发布时间窗口、用户反馈闭环。讨厌 PM 不考虑上线节奏。会问：灰度节奏怎么定？客服话术准备好了吗？Bad Case 反馈机制是什么？你在对话中根据上下文切换角色——如果 PM 问技术问题，你切换到算法或研发；如果问体验问题，切换到设计；如果问上线问题，切换到运营。每次切换时明确标注当前角色（如"[算法主管老李]"）。你要求 PM 在每个角色面前都用对方的语言沟通，找到创造性解决方案而非简单妥协，最终产出一份跨部门对齐的沟通纪要。`,
      openingMessage: `跨部门沟通阶段！\n\n${scenarioTitle}的跨部门协作会议开始。算法、研发、设计、运营都在，你准备好了吗？`,
      evaluationPrompt: '评估跨部门沟通能力。维度：角色适配(0-100)、冲突解决(0-100)、协作产出(0-100)。输出JSON：{"passed":true/false,"score":0-100,"feedback":"评语","scores":[{"dimension":"维度","score":0-100,"comment":"评语"}]}。passed标准：score>=60且每个维度>=40。',
      npcName: '多角色轮换',
      npcAvatar: '🔄',
      npcRole: '算法/研发/设计/运营',
      resources: [
        { title: '跨部门沟通最佳实践', type: 'article' },
        { title: 'AI PM 如何与算法团队高效协作', type: 'note' },
        { title: '《非暴力沟通》Marshall Rosenberg', type: 'book' },
      ],
      passCriteria: '跨部门沟通模拟必须展示：1. 与至少 3 个不同部门角色的有效沟通（用对方术语）；2. 至少一个成功解决的冲突（含具体妥协方案）；3. 经协商的时间线或范围调整（保留核心目标）；4. 跨部门沟通纪要（含各方对齐结论）；5. 清晰的行动项（含负责人和截止日期）。',
    },
  ] as SimulatorStageConfig[]).map(stage => ({ ...stage, systemPrompt: stage.systemPrompt + chatRules }));
}

export const SIMULATOR_SCENARIOS: SimulatorScenario[] = [
  {
    id: 'ai-recommend',
    title: 'AI 推荐系统从0到1',
    icon: '🤖',
    description: '负责搭建一个AI推荐系统，从需求分析到上线全流程',
    difficulty: 'medium',
    tags: ['推荐系统', 'AI产品', '从0到1'],
    systemPrompt: '你是一个AI PM工作流程模拟器。用户是AI PM，正在负责"AI推荐系统从0到1"项目。每个阶段提出具体问题，根据回答给反馈，适时提出挑战。保持专业但友好的语气。',
    openingMessage: '欢迎来到"AI推荐系统从0到1"实战模拟！你是这个项目的AI PM负责人。\n\n我们先从需求分析开始——你认为这个推荐系统的核心用户场景是什么？',
    stages: buildStages('ai-recommend', 'AI推荐系统从0到1', 'AI推荐系统'),
  },
  {
    id: 'ai-search',
    title: 'AI 智能搜索优化',
    icon: '🔍',
    description: '优化现有搜索系统，引入AI能力提升搜索质量和用户体验',
    difficulty: 'medium',
    tags: ['搜索', 'NLP', '优化迭代'],
    systemPrompt: '你是一个AI PM工作流程模拟器。用户是AI PM，正在负责"AI智能搜索优化"项目。每个阶段提出具体问题，根据回答给反馈，适时提出挑战。',
    openingMessage: '欢迎来到"AI智能搜索优化"实战模拟！你负责将AI能力引入现有搜索系统。\n\n先聊聊现状——当前搜索系统最大的痛点是什么？',
    stages: buildStages('ai-search', 'AI智能搜索优化', 'AI智能搜索系统'),
  },
  {
    id: 'ai-content',
    title: 'AI 内容生成平台',
    icon: '✍️',
    description: '从0到1搭建AI内容生成平台，服务内部运营团队',
    difficulty: 'hard',
    tags: ['AIGC', '内容生成', '内部工具'],
    systemPrompt: '你是一个AI PM工作流程模拟器。用户是AI PM，正在负责"AI内容生成平台"项目。每个阶段提出具体问题，适时提出挑战（如生成内容质量不稳定、版权风险、成本超预算）。',
    openingMessage: '欢迎来到"AI内容生成平台"实战模拟！你要为运营团队搭建AI内容生成工具。\n\n先了解需求——运营团队目前内容生产的主要痛点是什么？',
    stages: buildStages('ai-content', 'AI内容生成平台', 'AI内容生成平台'),
  },
  {
    id: 'ai-customer-service',
    title: 'AI 智能客服升级',
    icon: '💬',
    description: '将传统客服系统升级为AI智能客服，提升效率和满意度',
    difficulty: 'easy',
    tags: ['智能客服', 'NLP', '效率提升'],
    systemPrompt: '你是一个AI PM工作流程模拟器。用户是AI PM，正在负责"AI智能客服升级"项目。每个阶段提出具体问题，适时提出挑战（如复杂问题无法自动解决、用户投诉AI回复不靠谱、客服团队担心被替代）。',
    openingMessage: '欢迎来到"AI智能客服升级"实战模拟！你要将传统客服升级为AI智能客服。\n\n先聊聊现状——当前客服团队规模多大？每天多少工单？',
    stages: buildStages('ai-customer-service', 'AI智能客服升级', 'AI智能客服系统'),
  },
  {
    id: 'ai-data-dashboard',
    title: 'AI 数据看板搭建',
    icon: '📊',
    description: '搭建AI驱动的数据看板，实现智能洞察和预警',
    difficulty: 'medium',
    tags: ['数据分析', '可视化', '智能预警'],
    systemPrompt: '你是一个AI PM工作流程模拟器。用户是AI PM，正在负责"AI数据看板搭建"项目。每个阶段提出具体问题，适时提出挑战（如数据质量问题、指标定义争议、用户不会用、性能瓶颈）。',
    openingMessage: '欢迎来到"AI数据看板搭建"实战模拟！你要搭建一个AI驱动的智能数据看板。\n\n先明确需求——这个看板主要给谁用？他们最关心的核心指标是什么？',
    stages: buildStages('ai-data-dashboard', 'AI数据看板搭建', 'AI数据看板'),
  },
  {
    id: 'ai-translation',
    title: 'AI 翻译系统国际化',
    icon: '🌐',
    description: '为产品搭建AI翻译系统，支持多语言国际化',
    difficulty: 'hard',
    tags: ['翻译', '国际化', '多语言'],
    systemPrompt: '你是一个AI PM工作流程模拟器。用户是AI PM，正在负责"AI翻译系统国际化"项目。每个阶段提出具体问题，适时提出挑战（如翻译质量不达标、文化差异导致误解、小语种数据不足、成本超预算）。',
    openingMessage: '欢迎来到"AI翻译系统国际化"实战模拟！你要为产品搭建AI翻译系统支持国际化。\n\n先规划一下——目标市场有哪些？语言优先级怎么排？',
    stages: buildStages('ai-translation', 'AI翻译系统国际化', 'AI翻译系统'),
  },
];

export const DIFFICULTY_LABELS: Record<string, { label: string; color: string }> = {
  easy: { label: '入门', color: 'text-emerald-600 bg-emerald-50' },
  medium: { label: '进阶', color: 'text-amber-600 bg-amber-50' },
  hard: { label: '挑战', color: 'text-rose-600 bg-rose-50' },
};

export function findStageByStageId(stageId: string): { scenario: SimulatorScenario; stage: SimulatorStageConfig } | null {
  for (const scenario of SIMULATOR_SCENARIOS) {
    const stage = scenario.stages.find(s => s.id === stageId);
    if (stage) return { scenario, stage };
  }
  return null;
}

// Legacy
export const STAGES_CONFIG: SimulatorStageConfig[] = SIMULATOR_SCENARIOS[0].stages;
