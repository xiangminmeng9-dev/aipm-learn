// ============================================================
// Resume Optimization Skills — 简历优化技能模块
// ============================================================
// 19个优化维度，按优先级分层，根据JD/画像/风格动态选择加载
// 粗体标注规则：只有画像融入(维度二)的内容用粗体，其他不加粗

export interface ResumeSkill {
  id: string;
  name: string;
  priority: 'P0' | 'P1' | 'P2' | 'P3';
  condition: 'always' | 'has_jd' | 'has_profile';
  instruction: string;
}

export const RESUME_SKILLS: ResumeSkill[] = [
  // ── P0: JD匹配 ──
  {
    id: 'jd-keyword-align',
    name: 'JD关键词与技能对齐',
    priority: 'P0',
    condition: 'has_jd',
    instruction: `【维度一：JD关键词与技能对齐】（最高优先级，必须严格执行）
- 从JD中提取核心技能关键词，确保简历中出现对应表述
- JD要求的具体经验/项目类型，在经历描述中强化体现
- JD中提到的工具/方法/框架名称，自然融入相关经历
- JD中的量化要求（如"3年以上"、"管理10人以上团队"），在简历中突出对应经历`,
  },

  // ── P1: 公司画像匹配 ──
  // NOTE: P1 skills are NOT emitted by buildSkillInstructions() because they are
  // already embedded in the profileDirective section of the prompt. They exist here
  // for documentation/reference only. Their `instruction` text is never sent to the AI.
  {
    id: 'profile-hard-skill',
    name: '公司画像匹配-硬技能融入',
    priority: 'P1',
    condition: 'has_profile',
    instruction: `- 硬技能融入：将偏好画像中的core_skills自然嵌入工作/项目经历的Action部分，如JD中有相同技能则优先突出`,
  },
  {
    id: 'profile-soft-skill',
    name: '公司画像匹配-软技能融入',
    priority: 'P1',
    condition: 'has_profile',
    instruction: `- 软技能融入：通过事件叙事体现soft_skills——"协调3个团队推进项目"体现沟通力，"1周内完成方案调整"体现适应力，不直接写"具备XX能力"`,
  },
  {
    id: 'profile-tone-adapt',
    name: '公司画像匹配-偏好适配措辞',
    priority: 'P1',
    condition: 'has_profile',
    instruction: `- 偏好适配：根据persona调整措辞——偏好数据驱动→多加量化指标和AB测试；偏好方法论→多加框架化表述；偏好技术深度→强化技术细节描述`,
  },
  {
    id: 'profile-not-care',
    name: '公司画像匹配-不看重部分淡化',
    priority: 'P1',
    condition: 'has_profile',
    instruction: `- 不看重部分：not_care中的内容可以淡化但保留，不要删除`,
  },

  // ── P2: 核心表达优化 ──
  {
    id: 'star-method',
    name: 'STAR法则结构化重写',
    priority: 'P2',
    condition: 'always',
    instruction: `【维度三：STAR法则结构化重写】（核心表达优化——AI产品经理风格）
- 每段工作/项目经历下的每条描述统一按STAR结构优化，但表达风格必须符合AI产品经理思维：
  - Situation+Task：交代业务背景和核心挑战（一句话，可合并），用业务语言而非技术语言
    - ❌ "优化了检索模块" → ✅ "为解决用户口语化提问检索不准问题，设计了混合检索策略"
    - ❌ "搭建了推荐系统" → ✅ "面对信息过载导致转化率持续走低，从0到1搭建个性化推荐系统"
  - Action：详述产品决策和方案选择——为什么这么做、怎么做的决策、考虑了什么trade-off
    - 必须体现"为什么做"（业务动机）和"怎么决策"（方案取舍），而非仅仅"做了什么"
    - ❌ "使用BERT做意图识别" → ✅ "对比规则引擎与语义模型后，选择BERT做意图识别，准确率从68%提升至92%"
    - ❌ "接入大模型" → ✅ "评估自研vs接入大模型的ROI后，接入GPT-4处理长尾问题，覆盖场景从30%扩至85%"
  - Result：必须包含量化成果+业务影响（见量化法则）
- AI产品经理特有表达模式：
  - 模型评估与迭代："上线后持续监控badcase率，发现XX问题后迭代优化，准确率从X%提升至Y%"
  - 数据飞轮："构建标注→训练→评估→上线→反馈的闭环，模型效果月均提升X%"
  - 业务价值翻译：技术指标→业务影响，"准确率92%"→"客诉率降低40%，节省XX万/月人力成本"
- S+T可合并为一个要点，A和R各成独立要点
- 整段经历统一按STAR结构组织，不出现结构不一致的条目`,
  },
  {
    id: 'xyz-formula',
    name: 'XYZ公式（Google推荐）',
    priority: 'P2',
    condition: 'always',
    instruction: `【XYZ公式】（与STAR互补的紧凑表达法——AI产品经理版）
- XYZ公式：Accomplished [X] as measured by [Y], by doing [Z]
- AI产品经理版XYZ：解决了[业务问题X]，通过[产品决策Z]，实现了[业务影响Y]
- 适用于需要压缩为单行要点的场景，一个要点就包含问题+决策+影响
- 示例："解决了用户口语化提问检索不准问题（X），设计混合检索+query改写策略（Z），意图识别准确率92%，客诉率降40%（Y）"
- 示例："面对冷启动无历史数据问题（X），设计基于内容特征的冷启策略+实时反馈修正（Z），新用户次日留存提升18%（Y）"
- STAR偏结构化展开（适合详细经历），XYZ偏单行压缩（适合简洁亮点）
- 两种公式灵活选用：详细经历用STAR，一句话亮点用XYZ`,
  },
  {
    id: 'quantify',
    name: '量化法则',
    priority: 'P2',
    condition: 'always',
    instruction: `【量化法则】（AI产品经理加强版）
- 每条经历描述必须包含量化指标，优先使用绝对数值
- 量化维度（按优先级排列）：
  1. 业务影响：收入(X万)、成本节省(X万/月)、转化率提升(X%)、用户留存提升(X%)、客诉率降低(X%)、覆盖用户(X万)
  2. 产品规模：覆盖量(X万用户/X条产品线)、日活(X万DAU)、处理量(X万次/日)
  3. 效率提升：缩短X天、降低X%、自动化率从X%提至Y%
  4. 模型效果：准确率/召回率/F1从X%提至Y%、badcase率从X%降至Y%、A/B测试胜出X%
- 【关键增强】量化指标必须同时给出基线和业务影响：
  - ❌ "准确率92%" → ✅ "准确率从68%提升至92%（基线68%），客诉率降低40%"
  - ❌ "留存提升15%" → ✅ "次日留存从42%提升至57%，月活增加8万"
  - ❌ "推荐CTR提升" → ✅ "推荐CTR从3.2%提至5.1%，带动GMV月增120万"
  - ❌ "模型上线" → ✅ "模型上线后badcase率从12%降至3%，每周迭代1次，持续优化"
- AI产品经理必须体现模型评估与迭代闭环：
  - "上线后持续A/B测试3轮，CTR从3.2%→4.5%→5.1%，最终胜出上线"
  - "构建评估体系（离线指标+在线A/B），发现XX问题后迭代，准确率从X%→Y%→Z%"
- 原始简历有具体数字的必须保留并突出
- 原始简历无数据时，用相对量化（如"3条产品线"、"0延期"、"从0到1"、"独立承担"），但不得编造具体数字`,
  },
  {
    id: 'achievement-oriented',
    name: '成就导向转写',
    priority: 'P2',
    condition: 'always',
    instruction: `【成就导向转写】（职责→产品决策→业务成果）
- 将职责导向的描述转为"产品决策+业务成果"导向，体现AI产品经理思维：
  - 职责式："负责产品迭代" → 产品决策式："识别出XX痛点后推动3次产品迭代，用户留存从42%提至57%"
  - 职责式："管理团队" → 产品决策式："组建8人跨职能团队，建立周迭代节奏，0延期交付6个项目"
  - 职责式："优化模型" → 产品决策式："发现模型在XX场景badcase率12%，设计评估体系后迭代优化，badcase率降至3%"
  - 职责式："做需求分析" → 产品决策式："通过XX用户访谈+数据分析定位核心需求，砍掉3个伪需求聚焦2个高价值方向，上线后转化率提升25%"
- 关键区别：
  - ❌ 传统写法："你在做什么"（职责罗列）
  - ✅ 产品经理写法："为什么做→怎么决策→做成了什么"（决策链+业务影响）
- 每条描述都要有可衡量的业务结果，不能只停留在"做了什么"`,
  },
  {
    id: 'strong-verbs',
    name: '表达力强化-强动词替换',
    priority: 'P2',
    condition: 'always',
    instruction: `【强动词替换】（AI产品经理版）
- 通用替换：参与→主导、负责→推动、协助→独立承担、跟进→驱动、完成→交付、优化→重构
- AI产品经理特色替换：
  - "优化"→"迭代优化"（体现持续迭代思维）
  - "设计"→"设计并验证"（体现验证意识）
  - "上线"→"灰度上线并全量"（体现发布策略）
  - "评估"→"建立评估体系"（体现体系化思维）
  - "分析"→"数据驱动分析"（体现数据驱动）
  - "对接"→"推动落地"（体现结果导向）
- 替换的强动词自然融入即可，不加粗标注`,
  },
  {
    id: 'remove-fluff',
    name: '表达力强化-去套话',
    priority: 'P2',
    condition: 'always',
    instruction: `【去套话】（AI产品经理版）
- 空洞描述→具体决策+业务影响："工作认真负责"→"独立负责3条产品线，0延期交付，季度OKR达成率110%"
- "沟通能力强"→"跨部门协调5个团队推进项目上线，对齐周期从2周缩至3天"
- "学习能力强"→"1周内完成新模型评估并推动灰度上线，覆盖场景扩至85%"
- "有团队精神"→"带领6人小组完成Q3目标，达成率110%"
- "熟悉XX技术"→"基于XX技术解决XX业务问题，实现XX业务价值"（技术→业务翻译）`,
  },
  {
    id: 'reorder-experience',
    name: '经历排序优化',
    priority: 'P2',
    condition: 'always',
    instruction: `【经历排序优化】（最相关排最前）
- 每段经历内的亮点，把与目标岗位/JD最相关的排第1条
- 面试官5秒扫简历，第1条印象最深——确保最核心的价值放在最前面
- 排序依据：与JD关键词匹配度 > 与公司画像匹配度 > 量化成果大小 > 其他`,
  },
  {
    id: 'summary-line',
    name: '一句话定位/Summary生成',
    priority: 'P2',
    condition: 'always',
    instruction: `【一句话定位/Summary生成】
- 在简历开头（姓名下方）生成一句精准定位，用引用块格式：> 一句话定位
- 定位必须根据JD和画像定制，不能泛泛的"产品经理"
- 示例："> AI产品经理，擅长数据驱动的大模型应用落地与商业化"（匹配字节跳动偏数据驱动）
- 示例："> 产品经理，擅长供应链数字化转型与成本优化"（匹配京东偏供应链思维）
- 定位中画像融入的关键词用粗体标注`,
  },

  // ── P3: 收尾优化 ──
  {
    id: 'format-unify',
    name: '三统一-格式统一',
    priority: 'P3',
    condition: 'always',
    instruction: `【格式统一】
- 全文统一使用Markdown格式（## 大板块、### 子标题、- 列表、**粗体**技能分类）
- 日期格式统一：所有时间段用 *YYYY.MM - YYYY.MM* 或 *YYYY.MM - 至今*
- 标题层级一致：不出现某个板块用h3另一个用h2的情况`,
  },
  {
    id: 'style-unify',
    name: '三统一-风格统一',
    priority: 'P3',
    condition: 'always',
    instruction: `【风格统一】
- 全文语气力度一致——不用"我"字开头、统一用强动词、不忽强忽弱
- 用词节奏一致——每条经历2-4行，句式结构相近
- 不出现某条3行某条半行的不均衡`,
  },
  {
    id: 'length-unify',
    name: '三统一-篇幅统一',
    priority: 'P3',
    condition: 'always',
    instruction: `【篇幅统一】
- 同类经历描述长度相近，不出现某段5条亮点某段2条的不均衡
- 每段工作经历控制在3-5条亮点
- 每段项目经历控制在2-4条亮点`,
  },
  {
    id: 'dedup',
    name: '重复去重/合并表述',
    priority: 'P3',
    condition: 'always',
    instruction: `【重复去重/合并表述】
- 同一技能/成果在多段经历中重复出现时，保留最强的那条表述，其他条换角度描述
- 不要在3段经历中都写"数据驱动"，一段写"数据驱动优化"，一段写"AB测试验证"，一段写"指标体系搭建"
- 同一项目不要在"工作经历"和"项目经历"中重复写完全相同的内容`,
  },
  {
    id: 'red-flag',
    name: '红旗规避',
    priority: 'P3',
    condition: 'always',
    instruction: `【红旗规避】
- 修正错别字和语法错误
- 时间线必须连贯无矛盾（不出现重叠时间段或莫名空档）
- 模糊表述具体化："至今"→具体月份、"若干"→具体数字、"大大提升"→具体百分比
- 确保联系方式完整：手机+邮箱至少有其一`,
  },
  {
    id: '3c-principle',
    name: '3C原则',
    priority: 'P3',
    condition: 'always',
    instruction: `【3C原则】（Clarity清晰、Conciseness简洁、Consistency一致）
- Clarity：每句话只传达一个核心信息，不堆砌多个要点
- Conciseness：删除冗余修饰词（"非常"、"极大地"、"成功地"），让动词本身传达力度
- Consistency：全文术语统一（不出现一会儿"用户留存"一会儿"留存率"）`,
  },
  {
    id: 'ats-friendly',
    name: 'ATS排版友好',
    priority: 'P3',
    condition: 'always',
    instruction: `【ATS排版友好】
- 不使用表格、图片、特殊字符、嵌套列表——这些会导致ATS解析失败
- 技能名称用标准术语（不要用自造缩写），确保ATS关键词匹配
- 日期格式统一用 YYYY.MM，ATS更容易识别
- 避免同义词混用：ATS只会精确匹配关键词，简历里写"PM"但JD写"产品经理"就匹配不上`,
  },
];

/**
 * 根据条件动态选择要加载的技能
 * @param hasJd 是否有JD
 * @param hasProfile 是否有公司偏好画像
 * @returns 按优先级排序的技能指令数组
 */
export function selectResumeSkills(hasJd: boolean, hasProfile: boolean): ResumeSkill[] {
  return RESUME_SKILLS.filter(skill => {
    if (skill.condition === 'always') return true;
    if (skill.condition === 'has_jd') return hasJd;
    if (skill.condition === 'has_profile') return hasProfile;
    return false;
  }).sort((a, b) => {
    const priorityOrder = { P0: 0, P1: 1, P2: 2, P3: 3 };
    return priorityOrder[a.priority] - priorityOrder[b.priority];
  });
}

/**
 * 将选中的技能拼接为完整的 prompt 指令段落
 * P0/P1: 固定加载（JD匹配、画像融入已在profileDirective中）
 * P2/P3: 作为"可选技能库"列出，AI根据简历实际情况自适应选用
 */
export function buildSkillInstructions(hasJd: boolean, hasProfile: boolean, profileWeight: 'strong' | 'moderate' | 'light' = 'strong'): string {
  const selected = selectResumeSkills(hasJd, hasProfile);
  const sections: string[] = [];

  // P0: JD匹配（单独一个段落，强制加载）
  const p0Skills = selected.filter(s => s.priority === 'P0');
  if (p0Skills.length > 0) {
    sections.push(p0Skills[0].instruction);
  }

  // P2: 核心表达优化技能 — 始终加载的强制技能
  const mandatoryP2 = selected.filter(s => s.priority === 'P2');
  for (const skill of mandatoryP2) {
    sections.push(skill.instruction);
  }

  // P3: 收尾优化 — 动态加载，AI需逐一判断是否需要，不能偷懒跳过
  const optionalP3 = selected.filter(s => s.priority === 'P3');

  if (optionalP3.length > 0) {
    const skillCatalog = optionalP3.map(s => {
      const firstLine = s.instruction.trim().split('\n')[0];
      return `| ${s.id} | ${s.name} | ${firstLine.replace(/^【.+?】/, '').trim().slice(0, 60)} |`;
    }).join('\n');

    sections.push(`【收尾优化技能库——逐一判断是否需要，不得偷懒跳过！】
以下收尾优化技能，你需要对简历的**每个板块**逐一检查是否存在该问题：
- 如果该板块存在这个问题 → 必须修复，并在changes_summary中记录
- 如果该板块确实不存在该问题 → 在changes_summary中标注"该板块无此问题"
- ❌ 不允许笼统跳过！你必须逐个板块过一遍，证明你检查过了

| 技能ID | 技能名 | 检查什么 |
|--------|--------|----------|
${skillCatalog}

${optionalP3.map(s => s.instruction).join('\n\n')}`);
  }

  return sections.join('\n\n');
}