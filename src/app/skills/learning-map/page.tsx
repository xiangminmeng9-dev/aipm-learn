'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  EXTRA_TOPICS,
  EXTRA_CASES,
  EXTRA_MUSTREAD,
  EXTRA_INTERVIEWQS,
  EXTRA_PITFALLS,
  EXTRA_KEYQUESTIONS,
  EXTRA_LEARNINGTIPS,
} from './extra-data';

// ─── Data ───────────────────────────────────────────────────────────

interface Topic {
  name: string;
  points: string[];
}

interface MustRead {
  title: string;
  author: string;
  why: string;
}

interface CaseStudy {
  title: string;
  company: string;
  lesson: string;
}

interface InterviewQ {
  question: string;
  hint: string;
}

interface MapNode {
  id: string;
  label: string;
  shortLabel: string;
  icon: string;
  x: number;
  y: number;
  region: string;
  color: string;
  content: {
    summary: string;
    topics: Topic[];
    keyQuestions: string[];
    mustRead: MustRead[];
    tools: string[];
    pitfalls: string[];
    caseStudies: CaseStudy[];
    interviewQs: InterviewQ[];
    learningTips: string[];
  };
  connections: string[];
}

// ─── Map Data ───────────────────────────────────────────────────────

const REGIONS = [
  { id: 'product', name: '产品大陆', color: '#34c759' },
  { id: 'ai', name: 'AI 高地', color: '#ff9500' },
  { id: 'data', name: '数据海洋', color: '#5856d6' },
  { id: 'leadership', name: '领导力群岛', color: '#af52de' },
];

const NODES: MapNode[] = [
  // ── 产品大陆 ──
  {
    id: 'pm-thinking',
    label: '产品思维模型',
    shortLabel: '产品思维',
    icon: '🧠',
    x: 120, y: 160,
    region: 'product',
    color: '#34c759',
    content: {
      summary: '产品经理的底层操作系统：如何思考问题、拆解需求、做出判断。这是所有后续学习的地基。',
      topics: [
        { name: '需求分析框架', points: [
          'KANO模型：基本型需求（没有会骂）/期望型需求（有了更好）/兴奋型需求（超出预期）',
          'MoSCoW法则：Must have / Should have / Could have / Won\'t have 四级优先级',
          '用户故事地图：从用户旅程出发，按Release拆解功能优先级',
          'Jobs-to-be-Done：用户"雇佣"产品完成什么任务，关注任务而非方案',
          '需求池管理：如何维护一个活的需求池，定期清理和重新评估',
          '伪需求识别：5个信号判断需求是否真实（没人愿意付费/只在特定场景/无法量化）',
        ] },
        { name: '优先级判断', points: [
          'RICE评分：Reach（影响人数）× Impact（影响程度）× Confidence（信心度）/ Effort（投入）',
          'WSJF加权最短作业优先：SAFe框架下的优先级方法，考虑时间成本和延迟成本',
          '价值/复杂度矩阵：Quick Win（高价值低复杂）/ Strategic（高价值高复杂）/ Fill-in / Avoid',
          '机会评分法：用户痛点严重度 × 解决难度反向评分',
          'ICE评分：Impact × Confidence × Ease，适合快速排序',
          'Buy a Feature：让利益相关者用虚拟预算"购买"功能，暴露真实优先级',
        ] },
        { name: 'MVP思维', points: [
          '最小可行产品定义：验证核心假设的最小功能集合，不是半成品',
          '假设驱动开发：先列出关键假设 → 设计最小实验 → 验证/推翻假设',
          'Pretotype：在写代码前用最简方式测试需求是否存在（假门/假按钮/人工模拟）',
          'Concierge MVP：用人工方式模拟自动化服务，验证用户愿意为结果付费',
          'Wizard of Oz：用户以为在用AI，实际是人工在后台操作，验证体验假设',
          'MVP陷阱：不要把MVP做成"功能少但质量差"的产品，核心体验必须完整',
        ] },
        { name: '产品决策模型', points: [
          '第一性原理：回归事物本质思考，不被类比和惯性束缚',
          '逆向推理：从期望的终局状态倒推路径和关键里程碑',
          '类比推理：从相似场景借鉴方案，但要注意类比的有效性边界',
          '贝叶斯更新：根据新证据不断调整先验概率，避免锚定效应',
          '决策树分析：量化每个分支的期望值，处理不确定性决策',
          '预 mortem：假设项目已经失败，倒推可能的失败原因并提前预防',
        ] },
        { name: '产品生命周期管理', points: [
          '引入期策略：冷启动、种子用户、口碑传播的启动方法',
          '成长期策略：增长飞轮、渠道扩展、产品矩阵的构建',
          '成熟期策略：精细化运营、第二曲线探索、防御性功能',
          '衰退期策略：优雅退出、用户迁移、数据资产的价值保留',
          'AI产品的生命周期特殊性：技术迭代快、模型能力跃迁、范式迁移',
          '跨越鸿沟：从早期采用者到大众市场的关键跨越策略',
        ] },
        { name: 'AI时代的产品思维升级', points: [
          '概率性思维：AI输出不是确定性的，产品要接受"大概率对"而非"一定对"',
          '迭代式交付：模型能力持续进化，产品要设计"越用越好"的机制',
          '人机协作思维：不是AI替代人，而是重新设计人机分工的边界',
          '数据飞轮意识：用户使用→数据积累→模型优化→体验提升的闭环设计',
          '技术敏感度：关注模型能力跃迁，及时将新能力转化为产品价值',
          '伦理前置：在产品设计阶段就考虑公平性、隐私和安全性，而非事后补救',
        ] },
        { name: 'AI项目管理全流程', points: [
          '需求阶段：从业务问题出发而非技术出发("能不能用AI"不是好问题/"业务问题怎么解决"才是)、AI PRD模板(业务背景→用户场景→AI方案设计→数据需求→评估指标→Bad Case处理→上线计划)',
          '数据阶段：数据采集(内部日志/外部数据集/合成数据LLM生成冷启动用)、数据清洗(去重/异常值处理/格式统一)、数据标注(标注规范设计→标注人员培训→质量控制Kappa一致性→定期复检)、数据版本管理',
          '模型阶段：配合算法团队(能参与Bad Case分析/判断优化方向/知道什么指标合理)、模型选型(效果×成本×延迟×安全性综合评估)、评估指标设定(专业性/流畅性/安全性/相关性)、Bad Case分类(理解错误/知识缺失/幻觉/安全问题)与根因分析',
          '上线阶段：A/B测试设计(实验组vs对照组/5%小流量验证/核心指标+辅助指标/统计显著性p<0.05)、灰度发布(1%→10%→50%→全量每阶段观察24-48h出问题立即回滚)、模型迭代节奏(按周小版本/按月效果复盘大迭代)',
          'AI产品特有指标：模型效果(准确率/召回率/F1/BLEU/ROUGE/Hit Rate/幻觉率/重复率)、用户体验(任务完成率/好评差评率/转人工率/响应时间)、业务(DAU增量/转化率提升/成本节约)',
        ] },
      ],
      keyQuestions: [
        '用户真正的痛点是什么？还是只是伪需求？用数据怎么证明？',
        '如果我们只做一个功能，应该做什么？为什么？',
        '这个决策的核心假设是什么？最便宜的验证方式是什么？',
        '6个月后这个方案还成立吗？如果技术变了呢？',
        '竞品为什么没做这个？是他们没想到还是验证过不可行？',
        'AI能力的不确定性如何影响你的产品决策？你如何管理这种不确定性？',
      ],
      mustRead: [
        { title: '《启示录》', author: 'Marty Cagan', why: '产品经理的圣经，定义了什么是好的产品管理，硅谷PM必读' },
        { title: '《用户故事地图》', author: 'Jeff Patton', why: '从用户视角组织需求的最实用方法，告别功能列表思维' },
        { title: '《精益创业》', author: 'Eric Ries', why: 'MVP和假设驱动开发的方法论基础，创业和内部创新都适用' },
        { title: '《Inspired》中文版', author: 'Marty Cagan', why: '和《启示录》互补，更侧重产品发现和产品交付的流程设计' },
        { title: '《Competing Against Luck》', author: 'Clayton Christensen', why: 'JTBD理论的完整阐述，改变你理解需求的方式' },
        { title: '《Escaping the Build Trap》', author: 'Melissa Perri', why: '如何从"需求交付机器"变成"价值发现引擎"，产品战略优于需求排期' },
      ],
      tools: ['Notion/飞书文档', 'Miro/FigJam', 'ProductBoard', 'Coda', 'Aha!', 'Linear', 'Jira Product Discovery', 'Framer'],
      pitfalls: [
        '不要把"我觉得"当作用户需求——没有数据支撑的直觉是危险的',
        '不要追求完美方案而错过验证时机——速度比完美更重要',
        '不要忽略负面反馈——它往往比正面反馈更有价值',
        '不要把所有需求都排成队列——要主动砍掉不值得做的需求',
        '不要只关注功能需求——非功能需求（性能、安全、可用性）同样重要',
      ],
      caseStudies: [
        { title: 'Instagram的Pivot', company: 'Instagram', lesson: '从Burbn（位置签到App）到照片分享，砍掉80%功能聚焦核心价值，验证了"少即是多"' },
        { title: 'Dropbox的Demo MVP', company: 'Dropbox', lesson: '用3分钟视频验证需求，一夜之间7.5万注册。Pretotype的教科书案例' },
        { title: 'Figma的产品发现', company: 'Figma', lesson: '没有直接问用户要什么，而是观察设计师的工作流程，发现浏览器端协作是真正的痛点' },
        { title: 'Superhuman的产品市场契合度测量', company: 'Superhuman', lesson: '用Sean Ellis测试法（40%用户表示"非常失望"如果产品消失）量化PMF，从主观判断到客观指标' },
      ],
      interviewQs: [
        { question: '如何判断一个需求是否值得做？', hint: '从用户价值、商业价值、技术可行性三个维度，用RICE或ICE框架量化' },
        { question: '描述一次你推翻自己最初判断的经历', hint: '展示数据驱动决策的能力，以及不被沉没成本束缚的判断力' },
        { question: '如何处理利益相关者之间的需求冲突？', hint: '不是简单折中，而是回到用户价值和商业目标，用框架对齐判断标准' },
        { question: 'AI产品的需求验证和传统产品有什么不同？', hint: 'AI输出不确定、效果依赖数据、用户预期难管理——需要更频繁的实验和更快的迭代' },
      ],
      learningTips: [
        '先读《启示录》建立整体框架，再用《用户故事地图》学实操方法',
        '找一个你常用的产品，用KANO模型分析它的功能分布',
        '练习写PRD：选一个产品想法，用假设驱动的方式定义MVP',
        '找一个真实的需求冲突场景，用RICE评分做量化决策',
        '选一个AI产品，分析它的"越用越好"机制——数据飞轮是如何运转的',
      ],
    },
    connections: ['user-research', 'product-design', 'ai-fundamentals'],
  },
  {
    id: 'user-research',
    label: '用户研究方法论',
    shortLabel: '用户研究',
    icon: '🔍',
    x: 340, y: 100,
    region: 'product',
    color: '#34c759',
    content: {
      summary: '从"我觉得"到"用户说"：系统化的用户理解方法。AI时代更需要深度理解用户。',
      topics: [
        { name: '定性研究方法', points: [
          '深度访谈：半结构化访谈技巧，5个为什么追问法，沉默的力量',
          '情境调查：在用户真实环境中观察，发现用户自己都没意识到的行为',
          '日记研究：长周期行为追踪，捕捉间歇性需求和情感变化',
          '焦点小组：群体互动中的需求挖掘，注意群体思维偏差',
          '可用性测试：任务驱动式测试设计，5个用户发现85%的问题',
          '卡片排序：信息架构的验证方法，开放/封闭/混合排序',
        ] },
        { name: '定量研究方法', points: [
          '问卷设计：量表选择（Likert/NPS/CSAT）、题目编排、信效度验证',
          'A/B测试：假设→分组→指标→显著性，最小样本量计算',
          '漏斗分析：每一步的转化率和流失原因定位',
          '队列分析：用户行为的时间维度变化，发现趋势和异常',
          '留存分析：NRR/D1/D7/D30的意义，不同产品类型的基准值',
          '路径分析：用户实际走的路vs你设计的路，发现意外行为',
        ] },
        { name: '用户画像构建', points: [
          '行为画像：基于真实行为数据聚类，而非人口统计学标签',
          '需求画像：核心需求×使用场景×痛点，三维交叉定义',
          '技术接受度画像：AI产品特有维度——对AI的信任度和使用意愿',
          '画像验证：用数据验证画像假设，避免"我觉得用户是这样的"',
          '动态画像：用户画像不是静态的，随产品迭代和用户成长更新',
          '画像的边界：什么时候画像有用，什么时候会限制思维',
        ] },
        { name: 'AI辅助研究', points: [
          '用LLM分析访谈记录：自动提取主题、情感、关键洞察',
          'AI生成问卷初稿：基于研究目标自动生成问题，人工优化',
          '自动化用户反馈分类：NLP驱动的反馈分类和情感分析',
          '用AI模拟用户测试场景：生成合成数据验证研究方案',
          'AI驱动的用户行为预测：基于历史数据预测用户下一步行为',
          '研究效率提升：AI做重复性工作（转录/编码/统计），人做判断',
        ] },
        { name: '研究项目管理', points: [
          '研究计划书：目标、方法、时间线、预算、预期产出',
          '研究招募：如何找到对的用户，避免样本偏差',
          '研究伦理：知情同意、数据保护、隐私合规',
          '研究知识库：如何组织和沉淀研究洞察，让团队都能用',
          '研究ROI：如何衡量研究的价值，向管理层证明研究投入',
          '持续研究：从项目制研究到持续洞察流的转变',
        ] },
        { name: 'AI产品用户研究特殊性', points: [
          '信任度研究：用户对AI输出的信任程度测量，信任建立和信任修复机制',
          '心理模型研究：用户如何理解AI的能力边界，与实际能力的偏差',
          '容错期望研究：用户对AI错误和人类错误的容忍度差异',
          'AI接受度模型：技术接受模型(TAM)在AI场景的扩展和适配',
          '人机协作偏好研究：用户希望AI自主决策还是辅助决策的场景差异',
          '冷启动体验研究：新用户首次接触AI功能的"aha moment"和流失点',
        ] },
      ],
      keyQuestions: [
        '你的用户研究结论能改变产品决策吗？还是只是验证了已有判断？',
        '定性洞察和定量数据是否互相印证？有没有矛盾的地方？',
        '你是在验证假设还是在寻找真相？两种模式需要不同的方法',
        '样本代表性足够吗？有没有幸存者偏差或自选择偏差？',
        '研究结果多久会过时？你的用户画像上次更新是什么时候？',
        'AI产品的用户对AI的信任度如何？你如何测量和提升这种信任？',
      ],
      mustRead: [
        { title: '《Just Enough Research》', author: 'Erika Hall', why: '实用主义的研究方法指南，不搞学术派，适合快速上手' },
        { title: '《精益数据分析》', author: 'Alistair Croll', why: '数据驱动决策的完整框架，不同商业模式的核心指标' },
        { title: '《Interviewing Users》', author: 'Steve Portigal', why: '用户访谈的实操手册，从准备到执行到分析' },
        { title: '《Mental Models》', author: 'Indi Young', why: '超越表面需求，理解用户思维模型的方法论' },
        { title: 'Nielsen Norman Group 文章集', author: 'NN/g', why: 'UX研究领域的黄金标准，几乎每个话题都有深度文章' },
        { title: '《Sprint》', author: 'Jake Knapp', why: 'Google Ventures的5天设计冲刺方法，快速验证假设的实战框架' },
      ],
      tools: ['Maze', 'Hotjar', 'UserTesting', 'Dovetail', 'Amplitude', 'UserInterviews', 'Aurelius', 'EnjoyHQ', 'Lyssna', 'Lookback'],
      pitfalls: [
        '不要只问用户想要什么——观察他们做什么，行为比言语更真实',
        '不要把少数用户的反馈当普遍需求——5个人说想要≠市场需要',
        '不要忽略沉默的大多数——主动找那些不反馈的用户',
        '不要在研究开始前就预设结论——确认偏差是最常见的陷阱',
        '不要把用户研究当成一次性项目——持续洞察才是正确姿势',
      ],
      caseStudies: [
        { title: 'Airbnb的摄影师实验', company: 'Airbnb', lesson: '发现专业照片能显著提升预订率，从用户行为数据中发现关键洞察' },
        { title: 'Slack的持续用户研究', company: 'Slack', lesson: '每周做用户访谈，研究不是项目而是持续流程，洞察驱动产品迭代' },
        { title: 'Spotify的定性+定量', company: 'Spotify', lesson: '用定量数据发现"是什么"，用定性研究解释"为什么"，两者缺一不可' },
        { title: 'Apple的极简用户研究', company: 'Apple', lesson: '不依赖大规模调研，而是深度观察少数用户的极端使用场景，发现隐藏需求' },
      ],
      interviewQs: [
        { question: '如何设计一个用户研究方案来验证一个新功能？', hint: '从研究目标→方法选择→样本设计→执行计划→分析框架，展示系统思维' },
        { question: '当定性研究和定量数据矛盾时怎么办？', hint: '不要简单选一个，要深挖矛盾的原因——可能是方法问题、样本问题或真洞察' },
        { question: '如何用最小成本做有效的用户研究？', hint: 'Guerrilla研究、远程测试、AI辅助分析、利用现有数据，展示资源意识' },
        { question: '如何研究用户对AI产品的信任度和接受度？', hint: '从信任测量→心理模型→容错期望→协作偏好，设计针对性的研究方案' },
      ],
      learningTips: [
        '先做3次真实的用户访谈，比读10本书更有用',
        '用Hotjar录屏观察真实用户行为，你会发现很多意想不到的事',
        '学习Amplitude的基础功能，用漏斗分析理解用户流失',
        '建立一个研究知识库，把每次研究的洞察沉淀下来',
        '用5天设计冲刺方法快速验证一个AI功能的用户需求假设',
      ],
    },
    connections: ['product-design', 'data-metrics', 'pm-thinking'],
  },
  {
    id: 'product-design',
    label: 'AI 产品设计',
    shortLabel: '产品设计',
    icon: '🎨',
    x: 260, y: 360,
    region: 'product',
    color: '#34c759',
    content: {
      summary: 'AI产品的设计不只是UI，更是人机协作范式的设计。信任感、可控性、惊喜感——三者的平衡。',
      topics: [
        { name: 'AI交互范式', points: [
          '对话式交互：ChatBot / Copilot / Agent的设计差异和适用场景',
          '嵌入式AI：AI在现有流程中的无感融入，降低使用门槛',
          '代理式交互：AI自主执行+人工审批的平衡，信任的渐进建立',
          '渐进式披露：从简单到复杂的AI能力呈现，避免功能过载',
          '多模态交互：文字+语音+视觉+手势的组合设计',
          '场景化交互：不同场景下AI的介入程度和方式应该不同',
        ] },
        { name: '信任与透明度设计', points: [
          '可解释性设计：为什么AI给出这个结果？用用户能理解的方式解释',
          '置信度展示：让用户知道AI的确定程度，低置信度时主动提示',
          '错误处理策略：优雅降级而非崩溃，提供替代方案和人工兜底',
          '用户控制感：撤销、调整、覆盖AI决策的能力，让用户有安全感',
          '反馈循环：让用户的反馈能改善AI，形成正向循环',
          '信任修复：AI犯错后如何修复信任——道歉、解释、改进承诺',
        ] },
        { name: 'AI UX模式库', points: [
          '流式输出：打字机效果的心理设计——降低等待焦虑、建立期待感',
          '意图澄清：AI不确定时主动提问，而非猜测和出错',
          '上下文记忆：短期/长期记忆的UX表达——"我记得你上次..."',
          '个性化适配：从通用到个人的渐进学习，冷启动策略',
          '多步骤任务：进度展示、中间结果预览、中途调整能力',
          '协作模式：人主导AI辅助 / AI主导人审批 / 人AI共创三种模式',
        ] },
        { name: '伦理与安全设计', points: [
          '偏见检测与缓解：公平性评估框架，不同人群的效果差异',
          '内容安全：输入/输出双重过滤，多层级安全策略',
          '隐私保护：数据最小化原则、差分隐私、联邦学习',
          '合规设计：GDPR / AI法案 / 行业监管的UX体现',
          '儿童保护：AI产品对未成年人的特殊设计考量',
          '可审计性：AI决策的可追溯和可审计设计',
        ] },
        { name: 'AI产品设计流程', points: [
          'AI产品发现：从用户痛点出发，判断AI是否是最佳解决方案',
          'AI能力定义：定义AI"应该做什么"和"不应该做什么"',
          'AI体验原型：用Wizard of Oz方法快速验证AI体验假设',
          'AI效果设计：定义"好"的标准，设计评估指标和阈值',
          'AI迭代策略：数据飞轮设计，用户反馈如何改善AI',
          'AI产品发布：灰度策略、A/B测试、回滚方案的特殊考量',
        ] },
        { name: 'AI产品Onboarding设计', points: [
          '首次体验设计：AI功能的首次触达和引导，降低认知门槛',
          '能力展示策略：用具体示例而非抽象描述让用户理解AI能做什么',
          '渐进式授权：从低风险操作到高风险操作的信任建立路径',
          '期望管理：明确告知AI的能力边界，避免用户过度信任或过度怀疑',
          '个性化冷启动：新用户首次使用AI功能时如何提供有价值的体验',
          '失败引导：AI首次出错时如何将负面体验转化为信任建立机会',
        ] },
        { name: 'AI产品竞品分析', points: [
          '竞品分析维度：功能对比/技术路线/用户体验/商业模式/数据策略/生态布局，6维度全面拆解',
          'AI竞品特有维度：模型选型(GPT/Claude/开源)/RAG架构/Agent能力/评估体系/成本结构',
          '竞品体验拆解法：注册→首次使用→核心功能→边界场景→错误处理，全流程体验并记录',
          '竞品技术逆向分析：从产品表现推断技术方案(响应速度推断模型大小/回答风格推断Prompt设计/引用来源推断RAG架构)',
          '竞品矩阵绘制：按功能完整度×体验成熟度画二维矩阵，定位自己和竞品的差异化空间',
          '竞品动态追踪：关注竞品更新日志/招聘JD/专利申请/技术博客，预判竞品方向',
        ] },
      ],
      keyQuestions: [
        '用户能理解AI在做什么吗？如果不能，怎么让他们理解？',
        'AI犯错时用户有控制感吗？能撤销/调整/覆盖吗？',
        '这个设计是在增强人还是替代人？用户会接受吗？',
        '有没有考虑边缘case和恶意使用？最坏情况是什么？',
        'AI的"个性"和"语气"对吗？和品牌调性一致吗？',
        '新用户第一次用AI功能时能理解它在做什么吗？Onboarding够清晰吗？',
      ],
      mustRead: [
        { title: 'Google PAIR: People + AI Guidebook', author: 'Google', why: '最系统的AI UX设计指南，Google多年实践总结' },
        { title: '《Designing Bots》', author: 'Amir Shevat', why: '对话式产品设计的经典，交互模式库很实用' },
        { title: 'Apple HIG: Machine Learning', author: 'Apple', why: 'Apple的AI设计哲学——让AI无形地增强体验' },
        { title: '《Conversational Design》', author: 'Erika Hall', why: '对话式设计的思维框架，不只是聊天界面' },
        { title: 'Microsoft AI Design Guidelines', author: 'Microsoft', why: '包容性AI设计的原则和实践' },
        { title: '《Mapping Experiences》', author: 'Jim Kalbach', why: '体验地图和对齐图的方法论，AI产品需要更精细地映射人机协作体验' },
      ],
      tools: ['Figma + AI插件', 'Voiceflow', 'Botpress', 'Streamlit', 'Gradio', 'Vercel v0', 'Framer AI', 'Bolt.new'],
      pitfalls: [
        '不要让AI看起来比实际更聪明——过度承诺会摧毁信任',
        '不要忽略"AI沉默"的场景——不触发AI时界面应该是什么样',
        '不要把所有功能都塞进对话——该用UI就用UI，对话不是万能的',
        '不要假设用户会读AI的输出——设计扫描友好的信息呈现',
        '不要只设计"正常路径"——AI出错时的体验比成功时更重要',
        '不要忽视Onboarding——用户第一次用AI功能的体验决定了留存，3秒内必须展示价值',
      ],
      caseStudies: [
        { title: 'GitHub Copilot的信任设计', company: 'GitHub', lesson: '灰色建议vs自动补全、Tab接受/Esc拒绝、多候选展示——让开发者保持控制感' },
        { title: 'Notion AI的渐进式披露', company: 'Notion', lesson: '不是所有地方都有AI，只在用户需要时出现，保持界面简洁' },
        { title: 'ChatGPT的流式输出', company: 'OpenAI', lesson: '打字机效果不只是视觉噱头——降低等待焦虑，让用户随时可以打断' },
        { title: 'Duolingo Max的AI角色设计', company: 'Duolingo', lesson: 'AI角色要有个性但不能越界，教育场景的AI语气和互动方式需要精心设计' },
      ],
      interviewQs: [
        { question: '设计一个AI推荐功能，如何平衡准确率和惊喜感？', hint: '准确率保证信任，惊喜感带来发现。用exploration/exploitation框架思考' },
        { question: 'AI产品出错时应该怎么处理？', hint: '不是简单的错误提示——要有解释、替代方案、反馈入口和快速恢复路径' },
        { question: '如何设计AI产品的"可控性"？', hint: '从预防（限制范围）→检测（异常识别）→恢复（撤销/调整）三层设计' },
        { question: '如何设计AI产品的首次使用体验？', hint: '3秒展示价值→明确能力边界→低风险操作先行→渐进式授权，信任是逐步建立的' },
      ],
      learningTips: [
        '用Voiceflow做一个对话式AI原型，体验对话设计的挑战',
        '分析3个AI产品的错误处理设计，对比它们的优劣',
        '用Figma设计一个AI辅助编辑器的交互方案，重点考虑信任和控制感',
        '读Google PAIR Guidebook，每个原则找一个违反的反例',
        '设计一个AI功能的Onboarding流程，重点考虑首次体验和期望管理',
      ],
    },
    connections: ['pm-thinking', 'ai-evaluation', 'ai-fundamentals'],
  },

  // ── 新增：AI商业化 ──
  {
    id: 'ai-commercialization',
    label: 'AI 商业化落地',
    shortLabel: 'AI商业化',
    icon: '💰',
    x: 440, y: 360,
    region: 'product',
    color: '#34c759',
    content: {
      summary: 'AI产品不仅要做得好，还要卖得好。从商业模式设计到定价策略，从GTM到ROI，AI商业化有独特挑战。',
      topics: [
        { name: '商业模式设计', points: [
          'API计费模式：按Token/调用次数计费(OpenAI GPT-4输入$0.03/1K Token输出$0.06/1K Token)、阶梯用量折扣(用量越大单价越低)、适合开发者/企业集成场景、关键指标：API调用量/平均Token消耗/客户LTV',
          'SaaS订阅模式：按月/年订阅收费、分层定价(Free/Pro/Enterprise功能差异)、AI产品特有考量(模型成本占订阅费比例/高用量用户亏损风险)、典型案例：GitHub Copilot $10/月个人/$19/月企业',
          '按效果付费模式：按AI产出结果收费而非按使用量、如按生成的合格线索/完成的翻译字数/解决的客服工单计费、从"卖工具"到"卖结果"的范式转变、挑战：效果归因与计量标准',
          '私有化部署模式：一次性授权费+年度维护费、客户数据不出域(金融/医疗/政务刚需)、定制化开发额外收费、适合对数据安全/合规要求高的企业、典型案例：智谱GLM私有化/百度文心私有化',
          '免费+增值模式：AI产品的免费层设计，如何让免费用户转化为付费',
          '平台模式：从AI工具到AI平台的商业模式演进，生态建设',
          '混合模式：多种收费方式的组合，适配不同用户场景',
          '商业模式画布：AI产品的9要素系统分析，从价值主张到成本结构',
        ] },
        { name: '定价策略', points: [
          '价值定价vs成本定价：AI产品应该按价值定价而非成本定价',
          '阶梯定价设计：Free/Pro/Enterprise的边界划分和功能差异',
          '用量定价：Token/请求/存储的计量单位选择和阈值设计',
          '动态定价：根据模型成本波动调整定价，成本传导机制',
          '竞品定价分析：AI产品市场的定价基准和差异化策略',
          '定价心理学：锚定效应/诱饵效应/稀缺性在AI产品定价中的应用',
          '定价实验：A/B测试不同定价方案的效果和转化率',
        ] },
        { name: 'GTM策略', points: [
          'AI产品的GTM特殊性：技术验证→小范围试用→规模化推广的独特路径',
          '冷启动策略：如何找到第一批AI产品的付费用户',
          '产品驱动增长(PLG)：AI产品如何通过产品体验驱动增长而非销售',
          '销售驱动增长(SLG)：企业级AI产品的销售策略和客户成功',
          '渠道策略：直销/合作伙伴/平台集成的不同渠道组合',
          '市场定位：AI产品如何在"AI工具"和"行业解决方案"之间定位',
          '发布策略：AI产品的灰度发布和渐进式市场推广',
        ] },
        { name: 'ROI与成本管理', points: [
          'AI产品的单位经济模型：收入/成本/利润的精细化计算',
          '模型成本优化：Token成本/推理延迟/吞吐量的三方权衡',
          '成本传导：如何将模型成本变化传导到用户定价',
          'ROI计算框架：AI产品的投资回报率计算方法，短期vs长期',
          '成本结构分析：固定成本(模型训练)/变动成本(推理)/边际成本',
          '成本降低策略：缓存/量化/模型路由/批处理降低10x成本',
          '财务模型：AI产品的3年财务预测和关键假设',
        ] },
        { name: '增长与留存', points: [
          'AI产品的增长飞轮：数据→模型→体验→用户→数据的自增强循环',
          '用户激活：AI产品的"aha moment"设计和首次体验优化',
          '留存策略：如何让AI产品用户持续使用而非尝鲜后流失',
          '扩展收入：从单功能到多功能，从个人到团队到企业的扩展路径',
          '流失分析：AI产品用户流失的原因分类和预防策略',
          '社区增长：开源/社区/生态驱动的增长模式',
          '国际化增长：AI产品的出海策略和本地化挑战',
        ] },
        { name: 'AI产品GTM案例', points: [
          'ChatGPT的GTM：从免费到Plus到Team到Enterprise的渐进式路径',
          'Copilot的定价策略：按用户/按用量/按效果的多种定价实验',
          'Midjourney的订阅设计：从免费试用到付费订阅的转化漏斗',
          'Notion AI的增值模式：在现有产品上叠加AI功能的定价策略',
          'Stripe的API定价：按调用计费的成本透明和阶梯设计',
          'Salesforce AI的Enterprise销售：企业级AI产品的销售方法论',
          '开源AI产品的商业化：从开源到商业的路径设计(Meta/Llama)',
        ] },
        { name: 'AI产品营销与用户教育', points: [
          'AI产品定位：从"AI工具"到"效率提升"到"不可替代的智能伙伴"的定位演进、如何让用户理解AI价值而非恐惧AI、差异化定位(比竞品快3倍/准确率高30%/成本降50%)',
          'AI产品用户教育：用户不知道AI能做什么→教育场景(用例展示/教程引导/模板库)、用户不信任AI→建立信任(来源引用/置信度标注/可解释输出)、用户不会用AI→降低门槛(一键模板/自然语言交互/渐进式功能展示)',
          'AI产品营销渠道：内容营销(技术博客/使用案例/行业白皮书)、社区运营(用户群/模板市场/插件生态)、产品驱动增长(免费增值/邀请制/裂变机制)、行业会议与KOL合作',
          'AI产品品牌建设：技术品牌(开源贡献/技术博客/论文发表)、用户品牌(案例故事/NPS口碑/社区活跃度)、行业品牌(标准制定/行业报告/监管参与)',
        ] },
        { name: 'AI产品竞争策略与生态', points: [
          'AI产品护城河分析：数据飞轮(用户越多数据越好模型越准体验越好) > 网络效应(用户间价值传递) > 转换成本(数据/习惯/定制化) > 技术壁垒(模型/算法)、不同阶段护城河不同',
          'AI产品竞争策略：差异化(垂直场景深做vs通用平台浅做)、成本领先(API价格战vs服务质量战)、生态绑定(开放平台vs封闭花园)、速度优势(先发6个月=用户习惯锁定)',
          'AI生态构建：开放API(让开发者基于你的模型构建应用)、插件市场(第三方扩展核心产品能力)、合作伙伴(行业集成商/咨询公司分销)、开发者社区(开源工具/文档/培训)、生态即壁垒',
        ] },
      ],
      keyQuestions: [
        '你的AI产品商业模式是什么？用户为什么愿意付费？',
        'AI推理成本占收入的比例是多少？成本波动时怎么办？',
        '免费用户到付费用户的转化率是多少？转化路径是什么？',
        'AI产品的护城河是数据、技术还是生态？哪个更可持续？',
        '3年后你的商业模式还成立吗？如果模型成本降10x呢？',
        '如何平衡"让更多人用AI"和"让AI产品赚钱"之间的矛盾？',
      ],
      mustRead: [
        { title: '《商业模式新生代》', author: 'Alexander Osterwalder', why: '商业模式画布的完整方法论，系统化思考商业模式' },
        { title: '《Monetizing Innovation》', author: 'Madhavan Ramanujam', why: '如何让创新产品赚钱，定价先于产品设计的思维' },
        { title: '《Product-Led Growth》', author: 'Wes Bush', why: 'PLG方法论，产品驱动增长的完整框架' },
        { title: 'a16z: AI商业模式报告', author: 'a16z', why: '最前沿的AI商业模式分析和趋势判断' },
        { title: '《The Lean Product Playbook》', author: 'Dan Olsen', why: '从MVP到商业化的实战路径' },
        { title: 'OpenAI的商业化演进', author: 'OpenAI官方博客', why: '从非营利到API到ChatGPT Plus，每一步的商业逻辑' },
      ],
      tools: ['Stripe', 'Paddle', 'Chargebee', 'Vercel Analytics', 'Amplitude', 'Mixpanel', 'HubSpot', 'Salesforce'],
      pitfalls: [
        '不要用成本定价——AI产品的价值远大于推理成本，按价值定价',
        '不要忽视免费层的成本——免费用户的推理成本可能吃掉利润',
        '不要把所有功能都塞进付费层——核心体验应该免费，增值才收费',
        '不要忽略成本波动——模型API价格可能突然变化，要有传导机制',
        '不要追求大客户而忽视小客户——AI产品的规模效应来自大量小客户',
        '不要把商业模式和产品体验割裂——好的商业模式本身就是好的产品体验',
      ],
      caseStudies: [
        { title: 'ChatGPT Plus的定价策略', company: 'OpenAI', lesson: '$20/月的定价如何平衡推理成本和用户价值，Plus会员的核心差异化功能设计' },
        { title: 'GitHub Copilot的商业模式', company: 'GitHub/Microsoft', lesson: '从个人$10/月到企业$19/用户/月的阶梯定价，AI工具的PLG路径' },
        { title: 'Midjourney的订阅转化', company: 'Midjourney', lesson: '从免费试用到付费订阅的转化漏斗设计，限时免费策略的效果' },
        { title: 'Salesforce Einstein的Enterprise销售', company: 'Salesforce', lesson: '企业级AI产品的销售方法论，从POC到规模化部署的路径' },
      ],
      interviewQs: [
        { question: '如何设计一个AI产品的定价策略？', hint: '从价值定价出发，考虑阶梯/用量/结果导向，平衡成本和用户价值' },
        { question: 'AI推理成本突然涨3倍，你怎么办？', hint: '成本传导机制/缓存优化/模型路由/定价调整的组合策略' },
        { question: '如何让AI产品从免费用户转化为付费用户？', hint: 'aha moment设计/功能边界划分/渐进式解锁/价值展示' },
        { question: 'AI产品的增长飞轮怎么设计？', hint: '数据→模型→体验→用户→数据的闭环，每个环节如何加速' },
      ],
      learningTips: [
        '为你熟悉的AI产品画一个商业模式画布，分析9个要素',
        '对比3个AI产品的定价策略，找出差异化因素',
        '计算一个AI产品的单位经济模型：收入-成本=利润',
        '设计一个AI产品的GTM计划，从冷启动到规模化',
        '分析一个AI产品的增长飞轮，画出数据→模型→体验→用户的循环',
      ],
    },
    connections: ['product-design', 'product-strategy', 'ai-fundamentals'],
  },

  // ── 新增：AI PM能力模型 ──
  {
    id: 'pm-capability',
    label: 'AI PM 能力模型',
    shortLabel: '能力模型',
    icon: '📐',
    x: 80, y: 360,
    region: 'product',
    color: '#34c759',
    content: {
      summary: 'AI产品经理需要什么样的能力？硬技能打底、软技能破局、加分项脱颖而出。用能力模型自检，找到你的短板和优势。',
      topics: [
        { name: '硬技能：AI技术基础', points: [
          'LLM原理：理解大语言模型的生成机制、Token化、上下文窗口、RLHF对齐',
          'RAG架构：检索增强生成的完整链路——向量化、检索、重排序、生成',
          'Agent系统：工具调用、规划执行、多Agent协作的设计模式',
          '微调基础：SFT/RLHF/DPO的区别，什么时候该微调vs用Prompt',
          '向量数据库：Pinecone/Weaviate/Chroma选型，Embedding模型选择',
          'AI评估方法：幻觉率、准确率、响应速度、用户满意度的量化体系',
          '模型API定价：GPT-4o/Claude/Gemini的定价结构、Token成本计算',
        ] },
        { name: '硬技能：数据分析', points: [
          'SQL能力：能独立提取数据、写复杂查询、做数据透视',
          'Python基础：pandas数据处理、matplotlib可视化、基本统计分析',
          'Excel高级：数据透视表、VLOOKUP、条件格式、宏',
          '数据看板：Amplitude/Mixpanel的使用，核心指标监控',
          'A/B测试：样本量计算、统计显著性、多重比较校正',
          '数据叙事：用数据讲故事，从洞察到行动的闭环',
          'AI数据标注：如何定义标注规范、管理标注质量、控制标注成本',
        ] },
        { name: '硬技能：产品文档', points: [
          'PRD撰写：结构清晰（背景/目标/功能/指标/排期）、逻辑严谨',
          'AI PRD特殊性：效果指标、Bad Case处理、降级方案、成本预估',
          '技术方案评审：能和工程师讨论架构选型和技术可行性',
          '竞品分析报告：功能对比、技术路线对比、差异化策略',
          '数据需求文档：定义数据采集、标注、评估的完整需求',
          'AI产品规范：Prompt模板、评估标准、安全边界的文档化',
          'API文档理解：能读懂API文档，理解参数、限制、错误码',
        ] },
        { name: '软技能：业务与沟通', points: [
          '业务理解：把AI能力翻译成业务价值，"这个AI能帮业务赚多少钱"',
          '技术沟通：和算法工程师同频交流，能说清楚Bad Case、不乱提需求',
          '需求判断：判断什么场景适合用AI、什么不适合，容错率评估',
          '项目管理：协调算法、工程、设计多方资源，把控进度和质量',
          '数据敏感：能从数据中发现问题、验证效果，"准确率从X提升到Y"',
          '向上管理：向老板讲清楚AI产品的价值和风险，管理预期',
          '跨部门协作：和法务/合规/运营/销售协作推进AI产品',
        ] },
        { name: '加分项与差异化', points: [
          'AI项目经验：哪怕是个人项目，有从0到1的AI产品经验',
          'AIGC工具使用：深度使用Copilot/Midjourney/ChatGPT等，有独到见解',
          '技术博客/社区：有AI相关的技术输出，建立个人品牌',
          '开源贡献：参与AI开源项目，理解社区生态',
          '行业洞察：对特定行业（金融/医疗/教育）的AI应用有深度理解',
          '多语言能力：AI产品出海需要英语+本地化能力',
          '设计思维：AI产品的交互设计能力，理解人机协作范式',
        ] },
        { name: '能力自检与提升路径', points: [
          '硬技能自检表：AI技术/数据分析/产品文档，每项1-5分评估',
          '软技能自检表：业务理解/技术沟通/项目管理，每项1-5分评估',
          '短板识别：最低分项就是最需要提升的，优先补短板',
          '3个月提升计划：第1月补基础→第2月做项目→第3月准备面试',
          '学习资源匹配：根据短板选择对应的学习资源（见各节点推荐）',
          '项目实战：找一个真实场景做AI产品方案，从PRD到评估全流程',
          '持续迭代：每2周重新自检，追踪能力提升进度',
        ] },
      ],
      keyQuestions: [
        '你的硬技能短板是什么？最需要补的是AI技术还是数据分析？',
        '你能用产品经理的语言解释LLM/RAG/Agent吗？试试看',
        '你的AI项目经验够吗？如果没有，怎么快速积累？',
        '你和算法工程师沟通顺畅吗？他们觉得你"懂技术"吗？',
        '你的差异化优势是什么？为什么公司要招你而不是传统PM？',
        '3个月后你希望在哪些能力上有明显提升？',
      ],
      mustRead: [
        { title: '《AI产品经理的实战手册》', author: '多个作者', why: 'AI PM能力模型的系统梳理，从入门到进阶' },
        { title: 'Product School: AI PM Certification', author: 'Product School', why: 'AI PM认证课程大纲，了解行业标准的能力要求' },
        { title: '《Cracking the PM Interview》', author: 'Gayle McDowell', why: 'PM面试圣经，能力模型和面试准备的系统方法' },
        { title: 'Andrew Ng: AI for Everyone', author: 'Andrew Ng', why: '非技术人员理解AI的最佳入门，建立AI基础认知' },
        { title: '《Decode and Conquer》', author: 'Lewis Lin', why: 'PM面试的框架化准备方法，适合AI PM求职' },
        { title: 'AI PM Job Market Report 2025', author: '多个来源', why: '了解当前AI PM市场的需求趋势和薪资水平' },
      ],
      tools: ['Notion（能力自检表）', 'GitHub（项目展示）', 'LinkedIn（人脉）', 'Product School', 'AI PM社区', 'LeetCode（SQL练习）', 'Kaggle（数据练习）'],
      pitfalls: [
        '不要只学理论不做项目——面试官看重的是实战经验，不是知识储备',
        '不要忽视软技能——技术PM最缺的不是技术，而是业务理解和沟通',
        '不要追求全栈——AI PM不需要会写模型代码，但需要理解原理和边界',
        '不要忽略数据标注——这是AI PM的日常工作，不是可选项',
        '不要把"对AI有热情"当能力——热情要转化为具体的知识、项目和洞察',
        '不要只关注大模型——传统ML、推荐系统、搜索排序同样是AI PM的战场',
      ],
      caseStudies: [
        { title: '从传统PM到AI PM的转型', company: '某大厂PM', lesson: '6个月从零学习AI，通过做内部AI项目积累经验，成功转型AI PM' },
        { title: 'AI PM面试的核心考察', company: '某AI独角兽', lesson: '面试重点：AI场景判断力、效果评估能力、技术沟通能力，而非算法知识' },
        { title: '数据标注驱动的产品优化', company: '某AI客服公司', lesson: 'PM主导标注规范设计，Bad Case率降低40%，证明数据标注是AI PM的核心能力' },
        { title: 'API定价策略的产品决策', company: '某AI API公司', lesson: 'PM根据用户使用数据和竞品定价，设计阶梯定价方案，收入提升3x' },
      ],
      interviewQs: [
        { question: '你觉得AI PM和传统PM最大的区别是什么？', hint: '核心区别：不确定性管理（AI效果不可控）+ 效果评估（量化AI质量）+ 技术理解力' },
        { question: '你平时怎么学习AI？最近关注什么？', hint: '展示持续学习的习惯：关注的技术博客/论文/项目，最近的技术趋势判断' },
        { question: '如果让你用LLM改造一个业务，你怎么判断值不值得做？', hint: '从容错率/数据可用性/ROI/技术可行性四个维度评估' },
        { question: '你怎么和算法工程师沟通需求？', hint: '用数据说话（Bad Case率/效果指标）、理解技术约束、不提不切实际的需求' },
      ],
      learningTips: [
        '做一个能力自检表，硬技能和软技能各评1-5分，找到最短板',
        '选一个你熟悉的业务场景，设计一个AI改造方案（PRD+评估指标）',
        '深度使用3个AIGC工具，写一篇使用体验和产品分析',
        '练习用通俗语言解释AI概念：向非技术朋友解释LLM/RAG/Agent',
        '找一个AI开源项目，理解它的产品逻辑和技术架构',
      ],
    },
    connections: ['pm-thinking', 'user-research', 'ai-fundamentals'],
  },

  // ── AI 高地 ──
  {
    id: 'ai-fundamentals',
    label: 'AI 技术基础',
    shortLabel: 'AI基础',
    icon: '🤖',
    x: 680, y: 160,
    region: 'ai',
    color: '#ff9500',
    content: {
      summary: '从机器学习基础到大模型原理，从Python编程到RAG/Agent，从框架实战到推理优化。循序渐进构建AI PM的完整技术认知。',
      topics: [
        { name: '机器学习基础范式', points: [
          '监督学习（Supervised Learning）：给定输入X和标签Y学习X→Y映射，应用场景（分类猫狗/回归房价/序列标注NER），代表算法（逻辑回归/SVM/决策树/神经网络）',
          '无监督学习（Unsupervised Learning）：只有X没有Y发现数据内部结构，应用场景（聚类用户分群/降维PCA/异常检测），代表算法（K-Means/DBSCAN/PCA/t-SNE）',
          '强化学习（Reinforcement Learning）：Agent与环境交互获得Reward学习策略，核心概念（State/Action/Reward/Policy/Value Function），RLHF是大模型对齐的关键技术',
          '分类与回归：二分类（是否点击/流失/欺诈）、多分类（商品类目/意图识别/情感分析）、回归（价格/评分/销量连续值预测）、评估指标（Accuracy/Precision/Recall/F1/AUC-ROC/MSE/RMSE/MAE/R²）',
          '聚类与降维：无标签自动分组（和分类的区别：聚类不带标签怎么评估）、高维压缩保留关键信息、PCA最大化投影方差、t-SNE保留局部结构适合可视化',
          '过拟合与欠拟合：过拟合（训练好测试差→正则化/Dropout/增加数据/Early Stopping）、欠拟合（训练就差→增加复杂度/加特征/减少正则）、偏差-方差权衡（High Bias欠拟合/High Variance过拟合/好的模型在两者之间）',
          '传统ML算法：逻辑回归（sigmoid+CrossEntropy/名字带回归实际是分类）、决策树（信息增益/基尼系数/需要剪枝）、随机森林（Bagging多棵树集成/不容易过拟合）、XGBoost/LightGBM（Boosting/工业界最常用/二阶泰勒展开vs直方图加速）',
        ] },
        { name: '深度学习核心概念', points: [
          '神经网络基础：神经元(w·x+b+激活函数)、激活函数选择（Sigmoid输出0-1二分类/Tanh零中心/ReLU计算简单不梯度消失但有死区/Leaky ReLU解决死区/Softmax多分类概率分布）',
          '损失函数与反向传播：CrossEntropy分类首选配Softmax、MSE回归但对异常值敏感、Focal Loss解决类别不平衡；反向传播链式法则计算梯度、梯度下降沿负梯度更新、学习率太大震荡太小慢',
          '正则化方法：L1正则稀疏化做特征选择、L2正则让参数变小防过拟合、Dropout训练时随机丢弃神经元强迫不依赖特定神经元、BatchNorm每层输入归一化加速训练稳定收敛',
          'CNN卷积神经网络：卷积核在图像上滑动提取局部特征、池化(Max/Avg)减少参数量、权值共享、经典架构演进(LeNet→AlexNet→VGG→ResNet残差连接解决深层退化)、为什么CNN适合图像(局部连接+权值共享捕捉空间结构)',
          'RNN/LSTM/GRU序列模型：RNN长期依赖问题与梯度消失/爆炸、LSTM三门(遗忘门决定丢弃/输入门决定存储/输出门决定输出)+细胞状态像传送带长期保存、GRU两门(更新门/重置门)参数少效果相近、序列模型到Transformer的演进动机',
          'Attention机制演进：Seq2Seq瓶颈(最后编码器状态承载全部信息)→Attention(解码器每步看所有编码器状态计算相关性加权)→Self-Attention(Q/K/V来自同一输入捕捉序列内部依赖)→Transformer(纯Self-Attention+FFN无CNN/RNN)',
        ] },
        { name: 'Python编程基础', points: [
          'Python环境搭建：conda/venv虚拟环境管理、pip依赖安装与requirements.txt',
          '数据类型与控制流：列表/字典/集合/元组、列表推导式、条件与循环',
          '函数与模块：参数传递(*args/**kwargs)、装饰器、模块与包的组织',
          '面向对象编程：类与实例、继承与多态、属性与方法的封装',
          '常用库实战：NumPy数组操作、Pandas数据处理与透视、Requests HTTP调用',
          '异步编程：async/await语法、aiohttp异步请求、并发控制与协程调度',
          'Jupyter Notebook：交互式开发与调试、可视化与文档一体化',
        ] },
        { name: '大模型原理与API调用', points: [
          'Transformer架构：自注意力机制(Self-Attention)、位置编码(Positional Encoding)、多头注意力(Multi-Head Attention)、前馈网络与LayerNorm',
          'Tokenization与Embedding：BPE/WordPiece/SentencePiece分词原理、文本→Token→向量的转换链路、上下文窗口(Context Window)的物理含义',
          '大模型推理过程：预填充(Prefill)阶段批量计算KV、解码(Decode)阶段逐Token生成、采样策略(temperature/top_p/top_k)对输出的影响',
          '主流大模型API调用：OpenAI API(Chat Completions/Embeddings)、Anthropic Claude API(Messages)、国产模型API(通义千问/文心一言/DeepSeek)',
          'API参数调优实战：temperature控制随机性(0确定性→1创造性)、top_p核采样截断、max_tokens限制输出长度、stop自定义停止序列',
          '流式输出与错误处理：SSE流式接收与逐块渲染、速率限制(Rate Limit)应对策略、重试机制与超时设置、API Key安全管理',
          'GPT系列演进(Decoder-only)：GPT-1(验证预训练可行性)→GPT-2(Zero-shot能力涌现)→GPT-3(Few-shot+规模跃迁)→GPT-4(多模态+推理增强)、Next Token Prediction自回归生成、In-Context Learning(不更新参数只通过输入示例学习)',
          'BERT系列(Encoder-only)：MLM掩码语言模型(随机遮15%词预测)、双向上下文理解(不像GPT只看左文)、适合分类/标注/问答等理解任务、不适合生成',
          '架构三选一：GPT(Decoder-only/生成强/GPT-4+Llama)、BERT(Encoder-only/理解强/BERT+RoBERTa)、T5(Encoder-Decoder/理解+生成/FLAN-T5)、选择依据取决于任务类型',
          '主流大模型盘点—全球：GPT-4o(多模态+实时语音)、Claude 3.5(长上下文200K+编程最强)、Gemini 1.5 Pro(100K超长上下文)、Llama 3.1 405B(最强开源可商用)',
          '主流大模型盘点—国产：文心一言4.0(中文理解强/企业落地快)、通义千问2.5(开源Qwen/社区活跃)、Kimi(超长上下文200K/2024爆款)、智谱GLM-4(对标GPT-4/开源可商用)、DeepSeek(推理强/开源)、豆包(字节生态/C端落地快)',
          '模型选型决策表：通用对话质量优先→GPT-4o/Claude、中文场景成本优先→Kimi/通义/智谱、超长上下文→Kimi(128K)/Gemini(1M)、编程能力→Claude 3.5 Sonnet、开源私有部署→Llama 3.1/Qwen2',
        ] },
        { name: '主流大模型对比详解', points: [
          'GPT-4o vs Claude 3.5 Sonnet vs Gemini 1.5 Pro：GPT-4o(多模态最强/实时语音/API生态最广/$5输入$15输出/128K上下文)、Claude 3.5 Sonnet(编程最强/长文分析最佳/200K上下文/$3输入$15输出/安全对齐优先)、Gemini 1.5 Pro(超长上下文1M Token/多模态理解强/$1.25输入$5输出/Google生态集成)、三者各有侧重没有绝对赢家',
          'DeepSeek vs Qwen vs GLM-4(国产开源三强)：DeepSeek-V3(推理数学最强/MoE架构/训练成本仅558万美元/开源671B/API极低价)、Qwen2.5(中文最强/开源7B到72B全系列/社区生态活跃/多模态支持)、GLM-4(对标GPT-4/开源可商用/长上下文128K/清华技术背景)、选型：推理选DeepSeek、中文通用选Qwen、商用合规选GLM',
          'Llama 3.1 405B vs Mistral Large(海外开源)：Llama(Meta出品/405B参数最强开源/8B/70B轻量版/社区工具链最全)、Mistral(欧洲团队/效率优先/量化后单卡可跑/商业友好授权)、选型：追求效果上限选Llama、追求部署效率选Mistral',
          '模型选型5维度评估：效果(准确率/推理能力/多模态)、成本(输入输出Token价格/微调成本/推理成本)、延迟(首Token时间/平均响应时间/流式体验)、合规(数据隐私/内容安全/授权协议)、生态(API稳定性/社区支持/工具链丰富度)',
          '场景×模型匹配：客服对话→Kimi/豆包(中文+便宜)、知识问答→Claude/GPT-4o(准确+长上下文)、代码生成→Claude Sonnet(编程最强)、数据分析→GPT-4o(推理+结构化输出)、内容创作→GPT-4o/Claude(创意+质量)、私有部署→Llama/Qwen/GLM(开源可控)',
          '混合方案实战：简单问题→小模型(Qwen2.5-7B/DeepSeek-V3 lite)快+便宜、复杂问题→大模型(GPT-4o/Claude)准+贵、路由层根据问题复杂度自动分流、整体成本降低50-70%效果损失<5%',
        ] },
        { name: '向量数据库与检索基础', points: [
          '向量嵌入原理：文本→向量的语义映射、稠密向量vs稀疏向量、嵌入维度与信息密度',
          '向量相似度计算：余弦相似度(方向比较)、欧氏距离(绝对距离)、点积(综合度量)、各方法的适用场景',
          '向量数据库选型：Milvus(分布式/高性能)、Pinecone(全托管/免运维)、Chroma(轻量/本地开发)、Weaviate(混合搜索/GraphQL)、Qdrant(Rust高性能)',
          '索引类型与原理：HNSW(层次导航小世界图/高召回低延迟)、IVF(倒排文件/适合大规模)、Flat(暴力搜索/精确但慢)',
          '集合管理操作：创建Collection/插入向量/删除更新/元数据Schema定义、分区与分片策略',
          '元数据过滤与混合查询：标量过滤+向量搜索的组合、where条件构建、多字段联合查询',
        ] },
        { name: 'RAG检索增强生成', points: [
          'RAG架构全貌：用户Query→检索→重排序→拼接上下文→LLM生成→后处理的完整链路(基于向量数据库)',
          '文档加载与切分：PDF/Word/HTML/Markdown的解析工具(PyPDF2/python-docx/Unstructured)、固定长度切分/语义切分/递归字符切分、chunk_size与overlap的权衡',
          '嵌入模型选择：OpenAI text-embedding-3、BGE系列(中文优化)、Cohere embed、多语言模型选择策略',
          '检索策略：稠密检索(向量相似度)、稀疏检索(BM25关键词匹配)、混合检索(稠密+稀疏融合)、多查询检索(Query Expansion)',
          '重排序Rerank：Cohere Rerank API、BGE-Reranker本地模型、Cross-Encoder精排原理、重排序对召回率的提升效果',
          '上下文窗口管理：检索结果截断与优先级排序、长文档的摘要压缩、引用溯源与来源标注',
        ] },
        { name: 'Agent智能体基础', points: [
          'Agent核心循环：感知(接收输入)→推理(分析决策)→行动(调用工具)→观察(获取结果)→循环直至完成',
          'ReAct模式：Thought(推理)→Action(执行)→Observation(观察)的交替循环、推理链的可追溯性',
          '工具调用Function Calling：OpenAI Function Calling格式、工具描述(description)的写法技巧、参数JSON Schema定义',
          '规划与分解：Plan-and-Execute(先规划再逐步执行)、任务分解为子任务的策略、动态调整计划应对中间结果',
          '记忆机制：短期记忆(当前对话上下文)、长期记忆(向量库持久化存储)、工作记忆(Scratchpad中间结果)',
          '多Agent协作初探：层级式(Manager分配任务给Worker)、对等式(Agent间直接通信)、混合式协作模式',
        ] },
        { name: 'LangChain与LangGraph框架', points: [
          'LangChain核心组件：ChatModel(模型调用)、ChatPromptTemplate(提示词模板)、OutputParser(输出解析)、LCEL链式调用语法',
          'Tool定义与Agent构建：@tool装饰器定义工具、create_react_agent创建ReAct Agent、AgentExecutor执行与回调',
          'LangGraph状态图建模：StateGraph定义有状态工作流、add_node添加节点、add_edge添加边、add_conditional_edges条件路由',
          '节点与边的设计：每个节点是一个处理函数(接收State返回State)、普通边(无条件转移)、条件边(基于State决策路由)',
          '条件路由与循环控制：基于Agent决策的工具路由、循环执行直到满足退出条件、最大步数限制防止死循环',
          '人机交互Human-in-the-loop：interrupt_before/interrupt_after设置中断点、人工审批后继续执行、Command恢复与修改状态',
          'LangGraph与LangChain的关系：LangChain负责单步调用(模型/工具/解析)、LangGraph负责多步编排(状态/路由/循环)、两者组合覆盖从简单到复杂的全部场景',
        ] },
        { name: '大模型训练全流程', points: [
          '预训练Pre-training：海量无标注文本(网页/书籍/代码/论文TB级)→Next Token Prediction自回归训练→学习语言规律和世界知识、训练成本极高(GPT-4约1亿美元/数万张A100)、只有大厂和头部实验室能做、产出基座模型(Base Model)',
          'SFT监督微调：高质量指令-回答对(数万~数十万条)→在基座模型上继续训练→模型学会按指令回答、数据质量>数量(1万条高质量>10万条低质量)、ChatML/ShareGPT格式、产出对话模型(Chat Model)',
          'RLHF/DPO对齐训练：人类偏好数据(好回答vs差回答)→训练奖励模型→PPO强化学习优化(DPO跳过奖励模型直接优化)、让模型回答更安全/更有用/更符合人类意图、产出对齐模型(Aligned Model)',
          '模型评估与迭代：自动评估(Benchmark/MMLU/HumanEval)→人工评估(安全性/有用性/诚实性)→Bad Case分析→修复→重新评估、多轮迭代直到达标',
          '模型部署与推理：模型量化(GPTQ/AWQ/GGUF降低精度减少显存)→推理引擎(vLLM/TGI/TensorRT-LLM加速推理)→API服务部署→监控(延迟/吞吐/Token消耗/幻觉率)',
          '全流程总结：预训练(学知识)→SFT(学指令)→RLHF/DPO(学偏好)→评估(验证效果)→部署(上线服务)→监控迭代(持续优化)，每一步都有明确输入输出和质量门控',
        ] },
        { name: '模型微调与对齐训练', points: [
          '为什么需要微调：预训练模型通用但不够专→SFT让模型学会任务格式→RLHF/DPO对齐人类偏好→部署为领域专家',
          'SFT监督微调：数据集格式(ChatML/ShareGPT/Alpaca格式)、训练超参数(学习率/epoch/batch_size)、损失函数(CrossEntropy)、SFT的局限(容易过拟合/灾难性遗忘)',
          'RLHF强化学习：奖励模型RM训练(偏好数据→打分模型)→PPO算法(策略优化+KL约束)→KL散度防止偏离太远、RLHF的工程复杂度与替代方案',
          'DPO直接偏好优化：偏好数据构造(chosen vs rejected对)、DPO训练流程(无需RM直接优化策略)、DPO vs RLHF对比(更简单/更稳定/效果接近)',
          'LoRA与QLoRA低秩适配：LoRA原理(冻结原权重+训练低秩分解矩阵)、QLoRA(4bit量化+LoRA进一步降低显存)、rank/alpha参数选择',
          '数据清洗与质量把控：去重(Exact/Semantic去重)、去噪(过滤低质量/无关/有毒数据)、格式校验与统一、人工抽检与标注质量评估',
          '评测集构建：覆盖度设计(功能/场景/难度全覆盖)、难度梯度(简单→中等→困难→边界case)、自动评测+人工评测结合、评测集版本管理与迭代',
          '微调框架实战：LLaMA-Factory(WebUI/命令行/支持多种方法)、Unsloth(2x加速/显存优化)、训练→评估→部署的完整流程',
        ] },
        { name: '推理优化与缓存机制', points: [
          'KV Cache原理：自回归生成时缓存已计算的Key/Value矩阵、避免每步重复计算前面所有Token的KV、KV Cache将推理从O(n²)降到O(n)',
          'PagedAttention与显存管理：vLLM的PagedAttention(将KV Cache分页管理/按需分配/减少碎片)、显存利用率从20%提升到90%+、支持更大batch和更长序列',
          '前缀缓存Prefix Caching：多个请求共享相同system prompt时复用其KV Cache、避免重复计算相同前缀、在多轮对话和模板化请求中效果显著',
          '批量推理与连续批处理：Continuous Batching(请求到达即加入batch/完成即移出)、提升GPU利用率、降低平均延迟',
          '量化技术降低推理成本：GPTQ(训练后量化/4bit/精度损失小)、AWQ(激活感知量化/保护重要权重)、GGUF(llama.cpp格式/CPU+GPU混合推理)、量化对效果的影响评估',
          '推理框架选型：vLLM(高吞吐/PagedAttention)、TGI(HuggingFace官方)、TensorRT-LLM(NVIDIA优化)、llama.cpp(CPU推理/轻量部署)',
        ] },
      ],
      keyQuestions: [
        '这个需求用规则引擎就够了还是真的需要AI？AI的增量价值是什么？',
        '模型的准确率90%够用吗？那10%的错误怎么处理？用户能接受吗？',
        'AI的输出能被验证吗？谁来验证？验证成本是多少？',
        '训练数据有偏见吗？会导致什么后果？如何检测和缓解？',
        '如果模型明天升级了，产品行为会变吗？如何保证一致性？',
        '你的AI产品用的是什么部署模式？成本和延迟的权衡合理吗？',
      ],
      mustRead: [
        { title: '3Blue1Brown: Neural Networks', author: 'Grant Sanderson', why: '最好的神经网络直觉建立视频，可视化讲解极其清晰' },
        { title: '《AI极简史》', author: 'Nick Bostrom等', why: '快速理解AI发展的来龙去脉，建立历史视角' },
        { title: 'State of AI Report', author: 'Nathan Benaich', why: '每年最权威的AI行业全景报告，了解技术前沿' },
        { title: '《Artificial Intelligence: A Guide for Thinking Humans》', author: 'Melanie Mitchell', why: '给非技术人员的AI认知指南，理性而非炒作' },
        { title: 'Andrej Karpathy博客', author: 'Andrej Karpathy', why: '前Tesla AI总监，最清晰的AI技术科普' },
        { title: '《AI Superpowers》', author: 'Kai-Fu Lee', why: '中美AI竞争格局的深度分析，理解AI商业化的全球视角' },
      ],
      tools: ['Google ML Crash Course', 'Fast.ai', 'Hugging Face', 'Kaggle Learn', 'OpenAI Playground', 'Anthropic Console', 'Google AI Studio', 'Together AI'],
      pitfalls: [
        '不要把AI当黑盒用——至少理解输入输出和边界，否则无法做产品决策',
        '不要被demo迷惑——生产环境和demo差距巨大，延迟/成本/边缘case',
        '不要忽视数据质量——垃圾进垃圾出永远成立，数据是AI产品的生命线',
        '不要高估AI的推理能力——它更擅长模式匹配而非逻辑推理',
        '不要低估AI的进化速度——今天做不到的可能明天就可以了',
      ],
      caseStudies: [
        { title: 'GPT-3到ChatGPT的跃迁', company: 'OpenAI', lesson: '同样的底层模型，RLHF让产品体验天差地别。技术≠产品' },
        { title: 'Tesla Autopilot的能力边界', company: 'Tesla', lesson: '95%场景完美+5%场景危险，如何管理用户预期和信任' },
        { title: 'Google Photos的种族偏见', company: 'Google', lesson: '训练数据偏差导致严重的产品事故，AI伦理不是可选项' },
        { title: 'DeepMind AlphaFold的科学突破', company: 'DeepMind', lesson: 'AI从游戏到科学——蛋白质结构预测如何改变生物学研究，AI价值不止于商业' },
      ],
      interviewQs: [
        { question: '如何向非技术背景的人解释大语言模型的工作原理？', hint: '用类比（如"超级自动补全"），但要诚实说明局限，不要过度简化' },
        { question: '一个AI功能准确率95%，你会上线吗？', hint: '取决于5%错误的严重程度、是否有兜底方案、用户预期管理' },
        { question: '如何判断一个需求是否适合用AI实现？', hint: '从数据可用性、问题定义清晰度、容错空间、ROI四个维度评估' },
        { question: '大模型的微调和直接使用API各有什么优劣？如何选择？', hint: '从数据隐私/成本/效果/维护复杂度四个维度对比，没有银弹只有权衡' },
      ],
      learningTips: [
        '先看3Blue1Brown的神经网络系列视频，建立直觉',
        '在OpenAI Playground实际操作，感受不同参数的效果',
        '选一个你常用的AI产品，分析它用了什么AI技术，边界在哪里',
        '读Andrej Karpathy的博客，理解GPT的内部工作原理',
        '对比同一任务在GPT-4和开源模型上的表现差异，理解模型能力的边界',
      ],
    },
    connections: ['pm-thinking', 'prompt-engineering', 'ai-architecture'],
  },
  {
    id: 'prompt-engineering',
    label: 'Prompt 工程',
    shortLabel: 'Prompt',
    icon: '✨',
    x: 900, y: 100,
    region: 'ai',
    color: '#ff9500',
    content: {
      summary: '与大模型高效协作的核心技能：从提示词设计到Agent编排，从RAG组装到工程化。衔接AI技术基础，深入Prompt实战。',
      topics: [
        { name: '提示词设计原则', points: [
          '清晰指令与角色设定：System Prompt定义角色与边界、User Prompt描述具体任务、输出格式约束(JSON/Markdown/表格)',
          '任务分解与约束条件：复杂任务拆为多步骤指令、负面提示(不要做什么)与边界限定、优先级排序(最重要的要求放最前)',
          '输出格式控制：JSON Schema约束输出结构、Markdown格式化长文本、表格格式化对比数据、格式一致性对下游处理的影响',
          '提示词版本管理：每次修改记录原因与效果对比、Git管理Prompt模板文件、回滚方案与A/B测试流程',
        ] },
        { name: 'Few-shot与思维链', points: [
          'Zero-shot→Few-shot→CoT选择策略：简单任务用Zero-shot(直接指令)、格式敏感任务用Few-shot(示例引导)、推理任务用CoT(展示思考过程)',
          'Few-shot示例编排：2-5个示例覆盖典型场景、格式一致性(所有示例用相同格式)、示例顺序影响(最近示例权重更高)',
          'Chain-of-Thought思维链：让模型展示推理步骤(先分析再结论)、提升数学/逻辑/多步任务准确率、CoT与Few-shot结合(Few-shot CoT)',
          'Self-Consistency自洽性：多次采样同一Prompt取多数答案、提升可靠性但增加Token成本、适合高准确率要求的场景',
          'Tree-of-Thought多路径推理：生成多个推理路径→评估→选择最优→继续深入、适合开放式探索任务',
          '自动CoT生成：让模型自动生成推理链作为Few-shot示例、减少人工编写CoT的工作量',
        ] },
        { name: '结构化输出与模板', points: [
          '输出Schema定义与校验：用JSON Schema定义输出结构、Pydantic模型约束类型与字段、自动校验与错误重试机制',
          '多轮对话模板管理：System/User/Assistant消息模板化、模板变量注入(动态替换关键词)、模板库与场景匹配',
          '基于RAG检索结果的提示词组装(衔接AI技术基础的RAG)：将检索到的文档片段注入Prompt上下文、上下文优先级排序与截断策略、引用标注与溯源设计',
          'Agent系统提示词设计(衔接AI技术基础的Agent)：Agent角色定义与能力边界声明、可用工具列表与调用格式、安全约束与行为规范',
        ] },
        { name: 'Prompt调试与优化', points: [
          'A/B测试与效果对比：定义评估维度(准确率/完整性/格式合规)、统计显著性检验、自动化对比框架',
          '提示词敏感度分析：参数微调(temperature/top_p)对输出的影响、措辞变化对效果的波动、模型版本切换的兼容性测试',
          '对抗性提示与注入防御：直接注入(用户输入恶意指令)、间接注入(文档中嵌入恶意Prompt)、防御策略(输入过滤/指令隔离/输出校验)',
          '长上下文提示策略：信息密度优化(减少冗余)、关键信息前置(模型更关注开头)、分段标记(用标题分隔不同部分)',
          '基于评估反馈的迭代优化(衔接AI效果评估)：Bad Case分析→Prompt修改→回归测试→效果验证的闭环、评估驱动的持续改进',
        ] },
        { name: '多模态Prompt', points: [
          '视觉理解Prompt：图片描述/OCR/图表分析的提示词设计',
          '代码生成Prompt：从自然语言到代码的提示词最佳实践',
          '结构化数据Prompt：表格/JSON/CSV的处理和生成',
          '音频处理Prompt：语音转文字/语音合成的提示词设计',
          '视频理解Prompt：视频内容分析/摘要/问答的提示词设计',
          '跨模态Prompt：图文结合/多模态推理的提示词策略',
        ] },
        { name: 'Prompt版本与迭代管理', points: [
          'Prompt变更日志：每次修改的原因、效果对比、回滚方案',
          '效果回归测试：修改Prompt后确保不破坏已有效果的自动化测试',
          '模型兼容性管理：同一Prompt在不同模型上的效果差异和适配策略',
          'Prompt模板化：将通用模式抽象为可复用模板，减少重复设计',
          '团队协作规范：Prompt的评审流程、命名规范、文档标准',
          '成本追踪：不同Prompt版本的Token消耗对比和优化记录',
        ] },
        { name: '上下文工程 Context Engineering', points: [
          '上下文工程定义：比Prompt Engineering更高维度的系统方法——不只是写好一条Prompt，而是设计整个上下文窗口的策略（什么信息放入、什么排除、怎么组织、怎么动态管理）',
          '上下文窗口管理：有限窗口内的信息编排（优先级排序/关键前置/冗余剔除）、长文档的分段注入与摘要替代、多轮对话的上下文压缩与遗忘策略',
          '动态上下文组装：根据用户意图动态选择注入什么上下文（RAG检索结果/工具返回/历史对话/系统指令）、上下文模板引擎与变量注入、运行时上下文裁剪',
          '上下文缓存与复用：Prompt Caching（相同前缀缓存KV减少重复计算）、多请求共享system prompt复用、缓存命中率优化与成本降低',
          '上下文工程 vs Prompt工程：Prompt工程关注单条指令的措辞、上下文工程关注整个信息空间的设计；PE是写一句话，Context Engineering是设计一整本书的目录',
          '实战场景：客服系统(用户问题+检索FAQ+历史对话+系统角色→组装上下文)、数据分析(用户问题+SQL结果+数据描述+格式指令)、代码生成(需求描述+代码风格+相关文件+错误信息)',
        ] },
        { name: 'PE工程体系化', points: [
          'PE工程定义：将Prompt Engineering从"手艺"升级为"工程"——可度量、可复现、可迭代、可协作的系统化实践',
          'PE开发流程：需求分析→Prompt设计→效果评估→A/B测试→上线监控→迭代优化，和软件开发的CI/CD流程对齐',
          'PE自动化工具：DSPy(编程式Prompt优化/自动搜索最优Prompt)、OPRO(LLM优化LLM的元优化)、Promptfoo(自动化评估与回归测试)、LangSmith(Prompt版本管理与效果追踪)',
          'PE度量体系：效果指标(准确率/召回率/格式合规/延迟)、成本指标(Token消耗/每请求成本)、稳定性指标(输出方差/极端case表现)、可维护性指标(变更频率/回归失败率)',
          'PE团队协作：Prompt评审流程(设计→评审→测试→上线)、Prompt知识库(团队共享最佳实践)、跨模型兼容性矩阵(同一Prompt在不同模型上的效果记录)',
          'PE与产品迭代闭环：用户反馈→Bad Case分析→Prompt修改→评估验证→灰度上线→效果监控→持续优化',
        ] },
      ],
      keyQuestions: [
        '你的Prompt能稳定复现效果吗？换一个模型还能用吗？',
        '用户输入恶意Prompt怎么办？安全防护措施是什么？',
        '成本和效果的最优平衡点在哪？什么时候该用大模型，什么时候小模型就够？',
        'Prompt的效果如何量化评估？有回归测试吗？',
        '当模型升级后，你的Prompt还能用吗？如何保证兼容性？',
        '你的Prompt有版本管理吗？修改后如何确保不破坏已有效果？',
      ],
      mustRead: [
        { title: 'OpenAI Prompt Engineering Guide', author: 'OpenAI', why: '官方最佳实践，必读，最权威的Prompt设计指南' },
        { title: '《Building LLM Apps》', author: 'Valentina Alto', why: 'LLM应用开发的实战指南，从Prompt到架构' },
        { title: 'Lilian Weng: LLM Powered Autonomous Agents', author: 'Lilian Weng', why: 'Agent系统最清晰的架构梳理，必读' },
        { title: 'Prompt Engineering Guide (DAIR.AI)', author: 'DAIR.AI', why: '最全面的Prompt技术目录和论文索引' },
        { title: 'Simon Willison博客', author: 'Simon Willison', why: 'LLM应用开发最务实的实践者博客' },
        { title: 'Anthropic: Prompt Engineering Interactive Tutorial', author: 'Anthropic', why: 'Claude官方的交互式Prompt教程，系统化学习Prompt设计' },
      ],
      tools: ['LangChain', 'LlamaIndex', 'Promptfoo', 'DSPy', 'LangSmith', 'Helicone', 'Braintrust', 'Traceloop', 'Parea AI'],
      pitfalls: [
        '不要过度依赖Prompt技巧——架构设计更重要，Prompt只是冰山一角',
        '不要忽略Prompt注入风险——安全是第一位的，不是可选项',
        '不要追求"万能Prompt"——场景化设计更有效，一个Prompt打天下不现实',
        '不要忽略Prompt的可维护性——复杂的Prompt比代码更难维护',
        '不要把业务逻辑都塞进Prompt——该写代码就写代码，Prompt不是编程语言',
        '不要忽视Prompt的版本管理——没有变更日志的Prompt就像没有Git的代码，出问题无法回滚',
      ],
      caseStudies: [
        { title: 'Notion AI的Prompt工程', company: 'Notion', lesson: '每个功能场景独立优化Prompt，而非一个通用Prompt，效果和成本都更优' },
        { title: 'Cursor的Agent设计', company: 'Cursor', lesson: '多Agent协作+工具调用+人工审批的平衡，代码生成的最佳实践' },
        { title: 'Perplexity的RAG架构', company: 'Perplexity', lesson: '查询改写+多路召回+重排序+引用溯源，RAG的教科书实现' },
        { title: 'Vercel v0的Prompt设计', company: 'Vercel', lesson: '将UI生成任务拆解为结构化Prompt，结合shadcn组件库实现高质量代码输出' },
      ],
      interviewQs: [
        { question: '如何设计一个RAG系统？从架构到评估', hint: '从文档处理→向量化→检索→生成→评估的完整链路，每一步的关键决策' },
        { question: '如何防止Prompt注入攻击？', hint: '输入过滤/指令隔离/输出校验/权限控制多层防御，没有银弹' },
        { question: '如何评估Prompt的效果？', hint: '自动化评测+人工抽检+线上A/B，定义清晰的评估维度和阈值' },
        { question: '如何管理Prompt的版本和迭代？', hint: '变更日志+回归测试+模型兼容性+团队评审，像管理代码一样管理Prompt' },
      ],
      learningTips: [
        '在OpenAI Playground实际操作，对比不同Prompt策略的效果差异',
        '用Promptfoo搭建一个Prompt回归测试套件',
        '设计一个简单的RAG系统，用LlamaIndex或LangChain实现',
        '阅读3个开源AI产品的Prompt设计，学习实战经验',
        '为你的Prompt建立版本管理，记录每次修改的效果对比和原因',
      ],
    },
    connections: ['ai-fundamentals', 'ai-evaluation'],
  },
  {
    id: 'ai-architecture',
    label: 'AI 系统架构',
    shortLabel: '系统架构',
    icon: '⚙️',
    x: 820, y: 360,
    region: 'ai',
    color: '#ff9500',
    content: {
      summary: '从RAG架构到Agent集群，从项目全流程到可观测性鉴权。将AI技术基础中的单点能力组合为生产级系统架构。',
      topics: [
        { name: 'RAG架构设计', points: [
          'RAG架构演进(衔接AI技术基础的RAG)：基础RAG(检索→生成)→高级RAG(查询改写+重排序)→模块化RAG(可插拔组件)→Agentic RAG(Agent驱动检索)',
          '混合检索架构：稠密检索(语义相似度)+稀疏检索(BM25关键词)+知识图谱(结构化关系)三路召回、融合排序(Reciprocal Rank Fusion)、各路权重调优',
          '多路召回与融合排序：并行多路检索→结果去重→RRF/加权融合→Rerank精排→TopK截断、召回率与精确率的平衡',
          '知识库更新与版本管理：增量索引(新文档实时入库)、全量重建(Schema变更时)、文档版本控制与过期清理、索引快照与回滚',
          '大规模文档处理管线：分布式文档解析→并行切分与嵌入→批量写入向量库→索引构建与优化、百万级文档的处理架构',
        ] },
        { name: 'Agent架构设计', points: [
          'Agent架构演进(衔接AI技术基础的Agent)：单Agent(ReAct循环)→多Agent(分工协作)→Agent集群(路由+共享记忆+统一调度)',
          'Agent路由策略：基于意图分类的路由(用户Query→意图识别→分派专业Agent)、基于能力匹配的路由(任务需求→Agent能力矩阵→最优匹配)、基于负载均衡的路由(请求量→Agent负载→动态分配)',
          '路由决策模型训练与优化：意图分类器训练(标注数据→微调小模型→部署)、路由准确率评估与迭代、Fallback兜底策略(路由失败时通用Agent接管)',
          '跨Agent记忆共享机制：全局记忆池(所有Agent共享的向量知识库)、分层记忆(个人级/团队级/全局级)、记忆压缩(长对话→摘要→关键事实提取)、记忆一致性(多Agent同时写入的冲突处理)',
          'Agent间通信协议：消息格式定义(发送方/接收方/内容/元数据)、同步vs异步通信、消息队列与事件驱动、死信队列与消息重试',
          'Agent安全与成本控制：沙箱执行环境、审批流与人工介入点、行为约束与权限模型、调用链成本预估与优化',
        ] },
        { name: '多模型协作', points: [
          '模型路由与动态选择：请求复杂度评估→大小模型分流、简单任务用小模型(快+便宜)、复杂任务用大模型(准+贵)、路由阈值调优',
          '大模型+小模型级联架构：小模型快速初筛→大模型精排/兜底、级联延迟与成本的最优平衡、适合高并发低延迟场景',
          '模型网关与统一API层：统一请求格式屏蔽模型差异、模型切换对业务透明、请求路由与负载均衡、降级与熔断策略',
          '成本优化与降级策略：Token用量监控与预算控制、模型降级链(大→中→小)、缓存热门请求减少重复调用、批量请求合并降低API开销',
        ] },
        { name: '项目全流程实战', points: [
          '需求分析与技术选型(衔接AI技术基础的框架选择)：业务需求拆解为AI能力需求、RAG vs Agent vs 工作流的场景选择、LangChain vs LangGraph vs 自研的取舍、向量数据库与模型选型',
          '数据管线搭建：数据采集(爬虫/API/文件上传)→数据清洗(去重/去噪/格式统一)→文本切分(策略选择与参数调优)→向量化(嵌入模型选择)→入库(向量库写入与索引构建)',
          '核心功能开发：RAG模块(检索+重排+生成)、Agent模块(工具定义+推理循环+记忆)、工作流模块(状态图+条件路由+人机交互)、各模块间的集成与联调',
          '联调测试与效果评估(衔接AI效果评估)：端到端功能测试、效果评估(准确率/召回率/延迟)、Bad Case分析与修复、压力测试与性能调优',
          '部署上线与监控运维：容器化部署(Docker/K8s)、模型服务部署(vLLM/TGI)、API网关与负载均衡、监控告警(Prometheus+Grafana)、日志聚合(ELK)',
          '迭代优化与版本管理：用户反馈收集→Bad Case分析→Prompt/参数/数据迭代、A/B测试验证效果、灰度发布与回滚、版本号与变更日志',
        ] },
        { name: '可观测性与鉴权中心', points: [
          '分布式追踪：请求链路全链路追踪(用户请求→API网关→Agent→工具→模型→返回)、TraceID贯穿调用链、OpenTelemetry集成、慢请求定位与瓶颈分析',
          '日志聚合与指标监控：日志采集(Filebeat/Fluentd)→聚合(Logstash)→存储(ES)→展示(Kibana)、指标监控(Prometheus采集+Grafana仪表盘)、告警规则配置(阈值/趋势/异常检测)',
          'AI特有指标监控：推理延迟(P50/P95/P99)、Token消耗(输入/输出/总计)、幻觉率(生成内容与检索源的一致性)、召回率(检索结果的相关性)、工具调用成功率',
          '告警规则与异常检测：延迟突增告警、Token消耗异常(可能被攻击)、幻觉率上升(模型或数据问题)、工具调用失败率飙升、自动告警→自动降级的联动',
          '鉴权中心设计：API Key管理(生成/吊销/轮换/权限绑定)、OAuth2授权流程(Authorization Code/Client Credentials)、RBAC角色权限(Admin/Developer/Viewer)、多租户隔离与配额控制',
          '审计日志与合规：所有API调用记录(谁/何时/调了什么/花了多少)、数据访问审计、合规要求(GDPR/等保)的日志留存策略、审计日志的查询与分析',
        ] },
        { name: 'RAG未来展望', points: [
          'Agentic RAG：从被动检索到主动检索——Agent自主决定何时检索、检索什么、是否需要多次检索、检索结果是否足够、不够就换策略再检索，RAG从管线变为Agent的一个工具',
          'GraphRAG知识图谱增强：传统RAG只检索文本片段、GraphRAG构建实体-关系图谱支持结构化推理、微软GraphRAG从文档中自动抽取实体和社区摘要、适合需要多跳推理的复杂问题',
          '多模态RAG：不只检索文本——检索图片/表格/视频/音频并理解、多模态嵌入(文本+图像统一向量空间)、多模态重排序、应用场景(产品图库检索/医学影像问答/视频知识库)',
          'RAG与长上下文的融合：当模型上下文窗口从4K扩展到1M+，RAG还需要吗？答案是需要但角色变化——长上下文处理整文档、RAG处理跨文档/大规模知识库、两者互补而非替代',
          '自适应RAG：根据问题难度自动选择策略——简单问题直接生成(不检索)、中等问题单次检索+生成、复杂问题多轮检索+重排+验证、系统自动判断走哪条路径，降低不必要的检索成本',
          'RAG工业化：RAG从原型到生产的鸿沟——数据管线自动化(采集→清洗→切分→嵌入→入库全链路CI/CD)、效果回归测试(数据/Prompt/模型任何变更后自动跑评测)、知识库灰度发布与A/B测试',
        ] },
        { name: 'Agent未来展望', points: [
          '从单Agent到多Agent协作：单Agent能力有限→多Agent分工协作(规划Agent+执行Agent+审核Agent)→Agent集群(动态组队/按需分配)→Agent社会(长期协作/信任建立/知识共享)',
          'Agent自主性与可控性平衡：Agent越自主越强大但也越不可控——关键设计：能力边界声明(能做什么不能做什么)、审批流(高风险操作需人工确认)、行为监控(异常行为实时检测与熔断)、审计追溯(每步决策可解释可回溯)',
          'Agent记忆与学习：短期记忆(当前对话上下文)、长期记忆(跨会话的用户偏好/历史总结)、工作记忆(当前任务状态)、元认知(Agent反思自己的决策过程)、从记忆中学习(积累经验避免重复犯错)',
          'Agent与MCP/Skill生态：MCP让Agent即插即用任何工具(无需硬编码)、Skill让Agent组合原子能力为业务流程、未来：Agent自动发现并学习新工具、Agent自动组合Skill完成新任务、工具生态自生长',
          'Agent安全与对齐：Agent权限最小化(只给完成任务所需的最小权限)、Agent行为约束(不能执行超出范围的操作)、Agent对齐(Agent目标必须与人类意图一致)、多Agent间的安全隔离(防止Agent间恶意影响)',
          'Agent商业化：Agent-as-a-Service(按任务完成收费)、垂直Agent(法律/医疗/金融专业Agent)、Agent市场(买卖Agent能力的平台)、企业Agent平台(内部Agent统一管理与调度)',
        ] },
        { name: 'AI伦理与合规', points: [
          'AI伦理四大原则：公平性(算法不对特定群体歧视/性别种族年龄偏见检测)、透明性(用户知道在跟AI交互/决策逻辑可解释)、可解释性(模型为什么这么做能说清楚/XAI可解释AI)、隐私保护(用户数据最小化采集/知情同意/遗忘权)',
          'AI合规法规：欧盟AI Act(全球首部AI综合法规/按风险分级管理/高风险AI强制审计)、中国《生成式AI服务管理暂行办法》(备案制/内容标注/数据来源合规)、美国AI行政令(安全测试/ watermark/联邦采购标准)、跨境业务需同时满足多国法规',
          'AI安全风险：对抗攻击(故意构造输入让模型输出错误/Adversarial Example)、数据投毒(污染训练数据影响模型行为)、Prompt注入(恶意指令绕过安全限制/间接注入通过外部数据)、模型窃取(通过API逆向复制模型能力)、深度伪造(生成虚假内容)',
          'AI产品合规设计：数据合规(采集授权/存储加密/跨境合规/保留期限)、内容安全(输出过滤/敏感检测/人工审核/举报机制)、模型审计(训练数据来源可追溯/模型行为可解释/决策过程可审计)、用户权利(知情权/拒绝权/申诉权/数据删除权)',
          '伦理合规与产品创新的平衡：不是合规阻碍创新、而是合规定义边界让创新可持续、设计阶段就嵌入合规(Privacy by Design/Security by Design)、合规是竞争壁垒(用户信任=商业价值)',
        ] },
        { name: 'AI产品监控与运维', points: [
          '模型性能监控：延迟(P50/P95/P99响应时间/首Token时间TTFT)、吞吐(QPM/并发数)、Token消耗(输入/输出/总消耗趋势)、错误率(API错误/超时/内容过滤触发)',
          '数据漂移检测：输入分布变化(用户问题类型偏移/新话题出现)、输出质量变化(幻觉率上升/格式合规率下降)、概念漂移(业务含义变化导致模型理解偏差)、检测方法(统计检验/嵌入距离/人工抽检)、触发告警→重新评估→是否需要微调',
          '模型版本管理：模型版本号(语义化v1.2.3)、A/B发布(新老模型同时服务分流对比)、灰度发布(1%→10%→50%→全量)、回滚方案(新版本出问题5分钟切回旧版本)、版本效果追踪(每个版本的核心指标对比)',
          '持续改进闭环：监控发现异常→Bad Case分析→定位根因(数据/Prompt/模型)→修复方案→评估验证→灰度上线→监控确认→关闭，形成PDCA循环',
        ] },
      ],
      keyQuestions: [
        '这个架构能支撑10倍用户量吗？瓶颈在哪里？',
        '模型更新时如何保证不中断服务？灰度策略是什么？',
        'AI出错时系统的降级方案是什么？用户体验如何？',
        '技术债务在哪里？什么时候必须还？利息是多少？',
        '如果主要模型提供商明天涨价3倍，你有替代方案吗？',
        'AI系统的输入输出安全防护够吗？Prompt注入和数据泄露的风险评估了吗？',
      ],
      mustRead: [
        { title: '《Designing ML Systems》', author: 'Chip Huyen', why: 'ML系统设计的教科书，从需求到部署的完整框架' },
        { title: '《Building LLM Apps》', author: 'Valentina Alto', why: 'LLM应用架构实战，RAG/Agent/评估' },
        { title: 'Chip Huyen: ML Systems Design', author: 'Stanford CS329S', why: '斯坦福课程讲义，系统化理解ML系统' },
        { title: 'Martin Fowler: Patterns of Enterprise Application Architecture', author: 'Martin Fowler', why: '经典架构模式，AI系统也需要这些基础' },
        { title: '《System Design Interview》', author: 'Alex Xu', why: '系统设计的面试准备，架构思维训练' },
        { title: '《Machine Learning System Design Interview》', author: 'Ali Aminian等', why: 'ML系统设计的面试专项，涵盖推荐/搜索/广告等AI系统架构' },
      ],
      tools: ['LangSmith', 'Weights & Biases', 'MLflow', 'Arize AI', 'Helicone', 'Datadog', 'Grafana', 'OpenTelemetry'],
      pitfalls: [
        '不要过度设计——先跑起来再优化，YAGNI原则',
        '不要忽略可观测性——出了问题你都不知道，监控不是可选项',
        '不要把所有逻辑都塞进Prompt——该写代码就写代码',
        '不要低估AI系统的运维复杂度——比传统软件更难debug',
        '不要只考虑正常路径——AI系统的异常处理比正常流程更重要',
        '不要把安全当事后补丁——AI安全架构要从第一天就设计，出事后修复成本10倍起步',
      ],
      caseStudies: [
        { title: 'ChatGPT的架构演进', company: 'OpenAI', lesson: '从研究demo到亿级用户的架构演进，每一步的关键决策' },
        { title: 'Stripe的AI基础设施', company: 'Stripe', lesson: '模型路由+缓存+降级的完整方案，成本优化10x' },
        { title: 'Netflix的A/B测试平台', company: 'Netflix', lesson: 'AI效果评估的基础设施，实验文化的重要性' },
        { title: 'Shopify的AI模型路由架构', company: 'Shopify', lesson: '根据请求复杂度动态路由到不同规模模型，成本降低60%同时保持体验' },
      ],
      interviewQs: [
        { question: '设计一个RAG系统的架构，从文档到用户', hint: '文档处理→向量化→检索→生成→评估，每一步的选型和权衡' },
        { question: '如何设计AI系统的降级方案？', hint: '从缓存→小模型→规则引擎→人工兜底的多层降级策略' },
        { question: '如何评估AI系统的成本？如何优化？', hint: 'Token成本/计算成本/存储成本，缓存/量化/路由/批处理优化' },
        { question: '如何设计AI系统的安全架构？', hint: '从输入安全→输出安全→访问控制→数据安全→应急响应的多层防护体系' },
      ],
      learningTips: [
        '画一个你熟悉的AI产品的架构图，标注每个组件的选型和原因',
        '用LangSmith搭建一个AI应用的可观测性方案',
        '对比3个向量数据库的选型，理解各自的优劣',
        '设计一个模型路由方案：什么请求用大模型，什么用小模型',
        '为你的AI系统画一个安全架构图，标注输入/输出/数据/访问控制的安全措施',
      ],
    },
    connections: ['ai-fundamentals', 'ai-leadership', 'ai-evaluation'],
  },

  // ── 新增：AI工作流与自动化 ──
  {
    id: 'ai-workflow',
    label: 'AI 工作流与自动化',
    shortLabel: '工作流',
    icon: '🔄',
    x: 960, y: 260,
    region: 'ai',
    color: '#ff9500',
    content: {
      summary: '从工作流设计到Tool/MCP/Skill三层架构，从自动化管线到鉴权体系。衔接AI系统架构，深入工程实现细节。',
      topics: [
        { name: '工作流设计模式', points: [
          '顺序模式：步骤A→B→C依次执行，适合线性流程(数据清洗→向量化→入库)',
          '并行模式：步骤A和B同时执行→汇总结果，适合独立子任务(多路检索并行)',
          '条件分支：基于中间结果选择不同路径(if/else路由)，适合差异化处理',
          '循环模式：重复执行直到满足退出条件(重试/迭代优化)，需设置最大循环次数防止死循环',
          '状态机与DAG工作流：状态机(有限状态+转移条件)适合Agent循环、DAG(有向无环图)适合数据处理管线、LangGraph vs Prefect vs Temporal的选型',
          '错误处理与重试策略：指数退避重试(1s→2s→4s→8s)、熔断(连续失败N次后暂停)、降级(主流程失败时走备选方案)、死信队列(无法处理的消息单独存储)',
          '人工审批节点与超时机制：interrupt_before/interrupt_after设置中断点、审批通过后Command恢复执行、超时自动处理(超时后走默认路径或告警)',
          '工作流版本管理与灰度发布：版本号管理(语义化版本)、灰度发布(新版本先给10%流量)、回滚方案(一键切回旧版本)',
        ] },
        { name: 'Tool与Function Calling', points: [
          'Tool定义规范：name(动词开头如search_docs)、description(说清楚做什么+何时用)、parameters(JSON Schema定义类型与约束)、required字段标注必选参数',
          'JSON Schema参数校验：type/string/number/boolean/array/object、enum限定取值范围、description给模型看每个参数的含义、嵌套对象与数组类型',
          '工具发现与动态注册：工具注册中心(工具名→实现函数的映射)、运行时动态加载/卸载工具、工具能力描述的自动生成',
          '工具执行沙箱与超时控制：Docker容器隔离执行环境、超时设置(防止工具卡死)、资源限制(CPU/内存/网络)、执行结果的安全校验',
          '工具调用结果解析：结构化结果解析(JSON提取)、错误结果处理(工具返回错误时Agent如何应对)、多工具并行调用的结果合并',
          '工具链编排(衔接AI技术基础的Agent)：串行编排(A的输出是B的输入)、并行编排(A和B同时执行后汇总)、条件编排(根据A的结果决定是否调用B)',
        ] },
        { name: 'MCP协议与开发', points: [
          'MCP协议架构：Host(宿主应用如Claude Desktop)→Client(协议客户端/连接管理)→Server(工具服务提供方)、三角色解耦让工具开发与宿主无关',
          'MCP Server开发：Resources(静态资源如文件/数据库记录)、Tools(可执行函数如搜索/计算)、Prompts(预定义提示词模板)、用TypeScript/Python SDK快速开发',
          'MCP传输层：stdio(标准输入输出/本地进程通信)、SSE(Server-Sent Events/HTTP长连接)、Streamable HTTP(双向流式HTTP/推荐新方案)、各传输层的适用场景',
          'MCP客户端集成与工具发现：Client连接Server后自动获取工具列表、工具描述自动注入LLM上下文、多Server连接与工具聚合',
          'MCP鉴权机制：OAuth2 Bearer Token(标准授权流程)、API Key(简单密钥认证)、鉴权在传输层还是应用层的选择、多Server的统一鉴权管理',
          'MCP Server部署与运维：Docker容器化部署、健康检查与自动重启、日志收集与监控、多实例负载均衡',
        ] },
        { name: 'Skill与鉴权体系', points: [
          'Skill定义与封装：Skill=Tool+Prompt+流程的组合(如"JD分析"=文档解析+技能提取+匹配评估)、将原子工具组合为可复用的业务能力、Skill的输入输出Schema定义',
          'Skill注册中心与版本管理：Skill注册中心(名称→实现+版本的映射)、版本号管理(主版本.次版本.补丁)、灰度发布与回滚、Skill依赖关系管理',
          'Skill鉴权(调用权限/频率限制/配额控制)：调用权限(哪些角色可以调用哪些Skill)、频率限制(每分钟/每小时/每天调用次数上限)、配额控制(Token消耗/计算资源配额)',
          'Tool-MCP-Skill三层架构关系：Tool(原子能力/单一功能如搜索)、MCP(工具通信协议/标准化接入)、Skill(业务能力/Tool组合+Prompt+流程)、三层解耦各司其职',
          '鉴权中间件设计：Token校验(JWT解析与验证)→权限检查(RBAC角色权限匹配)→配额检查(剩余额度判断)→审计日志(记录调用)→放行或拒绝',
          '多级鉴权策略：用户级(个人API Key/个人配额)、应用级(应用Secret/应用级限流)、租户级(企业级配额/数据隔离)、三级鉴权的优先级与覆盖关系',
        ] },
        { name: 'RAG/Agent开发框架', points: [
          'LangChain核心组件(衔接AI技术基础)：Model(模型封装统一接口)、Template(Prompt模板管理)、OutputParser(输出解析为结构化数据)、Chain(组件串联)、LCEL链式调用(pipe操作符组合组件)、Tool定义与Agent构建',
          'LangGraph状态图建模：StateGraph定义状态节点、add_node添加处理节点、add_edge/add_conditional_edges定义边与条件路由、节点间状态传递与更新、循环控制(Agent循环直到满足退出条件)、人机交互Human-in-the-loop(interrupt_before/interrupt_after)',
          'LlamaIndex框架：SimpleDirectoryReader加载文档(支持PDF/Word/Markdown/HTML)、VectorStoreIndex构建向量索引(文档→切分→嵌入→存储一站式)、as_query_engine查询引擎(检索+生成)、与LangChain的区别(LlamaIndex专注RAG索引构建/LangChain通用编排)、适合纯RAG场景快速搭建',
          'Dify可视化开发：上传文档→自动Chunking(切分策略可选)→选Embedding模型→创建应用(对话型/Agent型/Completions型)→配置Prompt与变量→发布上线、无需代码可视化配置、支持工作流编排和多模型切换、适合非技术人员快速搭建AI应用',
          'Coze平台：拖拽式Agent构建(定义人设/技能/知识库)、插件市场(搜索/天气/股票/新闻等即插即用)、记忆管理(长期记忆/短期记忆/工作记忆)、工作流编排(可视化拖拽连线)、适合客服/内容生成/数据查询等场景快速落地',
        ] },
        { name: '企业AI自动化', points: [
          '客服自动化：智能路由+AI回答+人工兜底，7×24服务降本',
          '内容生产自动化：AI生成+人工审核+自动发布的流水线',
          '数据分析自动化：自然语言查询→SQL生成→可视化→洞察报告',
          '代码开发自动化：需求→设计→编码→测试→部署的AI辅助流程',
          '文档处理自动化：合同/发票/报告的AI理解和信息提取',
          '营销自动化：AI生成内容+个性化推荐+A/B测试的闭环',
          '合规自动化：AI辅助的合规检查、风险评估和报告生成',
        ] },
        { name: '自动化质量保障', points: [
          '输出质量监控：自动化质量评分，低质量输出的拦截和人工审核',
          '一致性检查：相同输入是否产生一致输出，温度参数和采样策略',
          '延迟监控：端到端延迟的分解和优化，用户可接受的延迟阈值',
          '成本追踪：每次工作流执行的成本计算和预算控制',
          '安全审计：自动化流程的安全合规检查，敏感数据脱敏',
          '回归测试：工作流变更后的自动化回归测试套件',
          '灰度发布：新版本工作流的灰度策略和效果对比',
        ] },
      ],
      keyQuestions: [
        '这个流程哪些步骤需要AI？哪些用规则就够了？',
        'AI出错时工作流如何降级？用户体验是什么？',
        '工作流的成本和延迟是多少？有优化空间吗？',
        '如何保证工作流输出的质量和一致性？',
        '工作流能处理峰值流量吗？弹性伸缩策略是什么？',
        '如何衡量AI自动化的ROI？节省了多少人力？提升了多少效率？',
      ],
      mustRead: [
        { title: 'Lilian Weng: LLM Powered Autonomous Agents', author: 'Lilian Weng', why: 'Agent系统最清晰的架构梳理，工作流设计的基础' },
        { title: 'LangGraph文档', author: 'LangChain', why: '有状态Agent编排的官方文档，实战导向' },
        { title: '《Designing Data-Intensive Applications》', author: 'Martin Kleppmann', why: '数据流和分布式系统设计，AI工作流的底层原理' },
        { title: 'Andrew Ng: Agentic Design Patterns', author: 'Andrew Ng', why: 'AI Agent的4种设计模式，从反思到工具使用到规划到多Agent' },
        { title: 'Harrison Chase: LangChain和LangGraph设计哲学', author: 'Harrison Chase', why: '从创作者视角理解AI编排框架的设计思路' },
        { title: 'Simon Willison: AI自动化实践', author: 'Simon Willison', why: '最务实的AI自动化实践者，大量真实案例' },
      ],
      tools: ['LangGraph', 'CrewAI', 'Dify', 'Coze', 'n8n', 'AutoGen', 'Temporal', 'Inngest', 'Trigger.dev'],
      pitfalls: [
        '不要把所有逻辑都塞进AI——规则引擎+AI的组合比纯AI更可靠',
        '不要忽略错误处理——AI工作流的失败率比传统软件高，必须有降级方案',
        '不要过度自动化——有些步骤人工介入比AI更高效更可靠',
        '不要忽视成本——自动化工作流的推理成本可能远超预期',
        '不要跳过可观测性——出了问题你都不知道哪一步失败了',
        '不要追求一步到位——从半自动化开始，逐步增加自动化程度',
      ],
      caseStudies: [
        { title: 'Klarna的AI客服自动化', company: 'Klarna', lesson: 'AI客服处理2/3的客服请求，节省4000万美元/年，人机协作的边界设计' },
        { title: 'Jasper的AI内容工作流', company: 'Jasper', lesson: '从单次生成到品牌内容工作流，AI+人工审核的流水线设计' },
        { title: 'GitHub Actions+Copilot', company: 'GitHub', lesson: 'AI辅助的CI/CD流水线，从代码到部署的自动化' },
        { title: 'Notion的AI工作流集成', company: 'Notion', lesson: 'AI能力无缝嵌入现有工作流，而非独立的AI功能' },
      ],
      interviewQs: [
        { question: '如何设计一个AI客服自动化系统？', hint: '从路由→AI回答→人工兜底→反馈循环的完整设计，信任度分级' },
        { question: 'AI工作流出错了怎么办？', hint: '重试/降级/跳过/人工介入的多层错误处理，幂等性设计' },
        { question: '如何选择AI编排平台？', hint: '从复杂度/可控性/成本/扩展性四个维度评估，不同场景不同选择' },
        { question: '如何衡量AI自动化的ROI？', hint: '从节省人力/提升效率/减少错误/增加收入四个维度量化' },
      ],
      learningTips: [
        '用Dify或Coze搭建一个简单的AI工作流，体验可视化编排',
        '设计一个RAG工作流，从文档处理到查询到生成',
        '用LangGraph实现一个多步骤Agent，含工具调用和错误处理',
        '分析一个企业AI自动化案例，画出完整的工作流图',
        '对比3个AI编排平台的选型，理解各自的优劣和适用场景',
      ],
    },
    connections: ['prompt-engineering', 'ai-architecture'],
  },
  {
    id: 'conversational-ai',
    label: '对话式AI产品设计',
    shortLabel: '对话式AI',
    icon: '💬',
    x: 1060, y: 360,
    region: 'ai',
    color: '#ff9500',
    content: {
      summary: '从规则引擎到大模型，对话式AI是AI落地最成熟的产品形态。掌握对话流程设计、意图识别、知识库运营、人机协作的全链路方法论。',
      topics: [
        { name: '对话流程设计', points: [
          '对话状态管理：有限状态机(FSM)建模多轮对话跳转逻辑，槽位填充(Slot Filling)驱动信息采集流程',
          '对话策略设计：主动引导式(系统追问缺失信息)vs被动响应式(跟随用户意图)、混合策略根据场景切换',
          '多轮对话管理：上下文窗口设计、指代消解(代词还原为实体)、话题切换与回溯、对话历史摘要',
          '异常流程处理：用户答非所问的兜底策略、超时未响应的重催机制、重复提问的识别与合并处理',
          '对话体验优化：开场白设计(建立预期)、结束语设计(闭环确认)、情感化话术(降低用户焦虑)',
          '端到端对话方案：LLM驱动的端到端对话 vs 传统任务型对话引擎的架构选择与融合策略',
        ] },
        { name: '意图识别体系', points: [
          '意图体系设计：一级意图(大分类)→二级意图(细分场景)→实体抽取(关键参数)，树状结构 vs 扁平结构的取舍',
          '意图覆盖率优化：未识别意图的挖掘与闭环(从日志中发现新意图)、定期意图体系review机制',
          '模糊意图处理：多意图识别(用户一句话包含多个需求)、意图冲突消解、置信度阈值与人工兜底',
          '意图标注规范：标注粒度定义、边界case处理规则、标注一致性Kappa检验、迭代更新流程',
          '情绪识别：用户情绪分类(满意/不满/愤怒/焦虑)、情绪驱动的差异化响应策略、情绪识别模型评估',
          '意图识别模型迭代：Bad Case分析→标注数据补充→模型重训→灰度验证→全量上线的数据飞轮',
        ] },
        { name: '知识库运营', points: [
          '知识库架构设计：FAQ知识对(问答式)→结构化知识(表格/流程图)→非结构化文档(RAG检索)，三层知识体系',
          'RAG知识检索：文档切片策略(固定长度/语义分段/递归切分)、Embedding模型选型、向量数据库对比、检索增强策略(Hybrid Search/Re-ranking)',
          '知识质量治理：知识时效性管理(定期review/自动过期)、知识冲突检测(同问不同答)、知识覆盖率评估',
          '知识运营闭环：用户提问→未命中知识→标注入库→模型更新→效果验证，从日志到知识的自动转化',
          'Function Calling集成：工具调用场景设计(查订单/改地址/转人工)、API定义与参数映射、多工具编排策略',
          '知识库效果评估：命中率、Top-3准确率、用户反馈率(正/负)、知识覆盖率、检索延迟',
        ] },
        { name: '人机协作模式设计', points: [
          'AI自动化边界：哪些场景AI自主解决/哪些必须转人工，基于置信度+场景风险的双重判断',
          '转人工策略：主动转人工(AI识别到无法处理)vs被动转人工(用户主动要求)，转人工触发规则设计',
          '坐席辅助：AI辅助人工坐席(推荐答案/知识检索/用户画像提示)，而非简单替代',
          '人机协作体验：转接时上下文传递(用户不用重复描述问题)、转接后AI继续辅助、回AI时机设计',
          '人机协作效率指标：首次解决率(FCR)、平均处理时长(AHT)、转人工率、坐席利用率、用户满意度(CSAT)',
          '降本增效路径：从全人工→AI预处理+人工兜底→AI为主+人工审核→AI自主解决+人工监督的演进路径',
        ] },
        { name: '用户分层与服务策略', points: [
          '用户分层模型：按价值(VIP/普通)/按需求(售后/咨询/投诉)/按能力(数字原住民/传统用户)的多维分层',
          '差异化响应策略：高价值用户→专属通道+人工优先、普通用户→AI优先+转人工兜底、投诉用户→情感安抚+快速升级',
          '场景路由策略：意图识别→场景匹配→服务策略选择→动态调整的全链路路由',
          '个性化对话策略：基于用户画像调整话术风格(简洁/详细)、信息密度(专业/通俗)、响应节奏',
          '用户生命周期服务：新用户引导→成长期教育→成熟期高效服务→流失预警与挽回',
          '服务质量监控：按用户分层看满意度/解决率/转人工率，识别分层服务策略的薄弱环节',
        ] },
        { name: '核心指标体系', points: [
          '解决率指标：自助解决率(AI独立解决/总咨询)、一次解决率(FCR)、转人工率(转人工/总咨询)',
          '满意度指标：CSAT(满意度评分)、NPS(净推荐值)、DSAT(不满意率)、用户情绪变化趋势',
          '效率指标：平均响应时间、平均对话轮数、首次响应时长、排队等待时长',
          '质量指标：意图识别准确率、知识命中率、幻觉率(编造答案比例)、回答相关性评分',
          '业务指标：成本节约(人工替代率)、收入贡献(交叉销售转化)、客户留存影响',
          '指标看板设计：实时监控→日报→周报→月度复盘的分层指标体系，异常告警机制',
        ] },
      ],
      keyQuestions: [
        '如何设计AI自动解决与人工兜底的边界？哪些场景必须转人工？',
        '用户说"转人工"但AI其实能解决，怎么处理这种冲突？',
        '知识库回答错误比没有回答更危险，如何控制知识库质量？',
        'LLM接入对话系统后，如何平衡"更灵活的回答"和"可控的输出"？',
        '转人工率从40%降到20%，你怎么验证是AI变强了还是用户被劝退了？',
        '如何衡量对话式AI产品的ROI？哪些指标最核心？',
      ],
      mustRead: [
        { title: '《Designing Bots》', author: 'Amir Shevat', why: '对话式产品设计的系统方法论，从用户研究到对话流程到技术架构的全覆盖' },
        { title: '《Conversational AI》', author: 'Andrew Ng等', why: '对话式AI技术栈全景，从NLU到DM到NLG的完整技术理解' },
        { title: 'Google Dialogflow文档', author: 'Google', why: '对话式AI平台的标准参考，理解意图/实体/上下文的最佳实践' },
        { title: 'Rasa开源对话框架文档', author: 'Rasa', why: '理解对话式AI引擎的内部架构——NLU管道、对话策略、动作服务器' },
        { title: '微软Bot Framework指南', author: 'Microsoft', why: '企业级对话式AI的设计规范和最佳实践' },
      ],
      tools: ['Dialogflow', 'Rasa', 'Microsoft Bot Framework', 'LangChain/LlamaIndex', 'Pinecone/Weaviate/Milvus', 'Dify/FastGPT', 'Coze', '飞书智能客服'],
      pitfalls: [
        '不要追求100%自动化——有些场景用户就是想跟人说话，强制AI反而降低满意度',
        '不要忽视对话日志的价值——它是优化意图识别和知识库的最佳数据源',
        '不要把知识库当静态内容——不维护的知识库比没有知识库更危险',
        '不要只看转人工率下降——要同时看解决率和满意度，否则可能是"假优化"',
        '不要忽略转人工时的上下文传递——用户重复描述问题是最大的体验杀手',
      ],
      caseStudies: [
        { title: '招商银行智能客服', company: '招商银行', lesson: '从规则引擎到NLU+知识图谱，转人工率从60%降到25%，核心是意图体系持续迭代+知识库精细化运营' },
        { title: '淘宝智能助手店小蜜', company: '阿里巴巴', lesson: '双11单日千万级对话，分层路由策略(VIP人工优先/普通AI优先)实现资源最优配置' },
        { title: 'OpenAI ChatGPT对话设计', company: 'OpenAI', lesson: '从GPT-3.5到GPT-4的对话能力跃迁，证明LLM可以端到端解决大部分对话场景' },
        { title: 'Klarna AI助手', company: 'Klarna', lesson: '用OpenAI构建客服AI，处理2/3的客服对话，相当于700个全职坐席，同时保持与人工一致的CSAT' },
      ],
      interviewQs: [
        { question: '如何设计一个智能客服的转人工策略？', hint: '从置信度阈值、场景风险等级、用户情绪、用户主动要求四个维度设计触发规则' },
        { question: 'LLM接入传统对话系统，架构上怎么改造？', hint: '不是简单替换，而是LLM做生成+NLU做意图识别+规则引擎做兜底的混合架构' },
        { question: '知识库回答错误率上升，怎么排查和修复？', hint: '先定位是检索问题(召回不到)还是生成问题(检索对了但生成错了)，再针对性优化' },
        { question: '如何评估对话式AI产品的效果？', hint: '不要只看单一指标，解决率+满意度+转人工率+成本四维联合评估' },
      ],
      learningTips: [
        '先用Dialogflow或Coze搭建一个简单对话机器人，理解意图/实体/对话流的基本概念',
        '找一个大厂智能客服的产品分析文章，逆向拆解它的意图体系和转人工策略',
        '研究RAG方案：用LlamaIndex+向量数据库搭一个知识检索问答系统',
        '分析自己跟AI客服的真实对话记录，找出体验不好的点，思考如何改进',
        '读Klarna的AI助手案例，理解LLM在客服场景的ROI计算方法',
      ],
    },
    connections: ['ai-architecture', 'ai-workflow', 'ai-evaluation'],
  },

  // ── 数据海洋 ──
  {
    id: 'data-metrics',
    label: '指标体系与实验',
    shortLabel: '指标体系',
    icon: '📊',
    x: 160, y: 560,
    region: 'data',
    color: '#5856d6',
    content: {
      summary: '没有度量就没有改进。学会设计指标、设计实验、用数据讲故事。AI产品的指标体系有特殊性。',
      topics: [
        { name: 'SQL数据查询能力', points: [
          '基础查询语法：SELECT选字段/FROM指定表/WHERE过滤条件/GROUP BY分组/HAVING分组后过滤/ORDER BY排序/LIMIT限制条数',
          '常用函数：聚合(COUNT计数/SUM求和/AVG均值/MAX/MIN)、日期(DATE_FORMAT格式化/DATEDIFF日期差/DATE_SUB加减)、字符串(CONCAT拼接/SUBSTRING截取/REPLACE替换)、条件(CASE WHEN分支/IFNULL空值替换/COALESCE返回首个非空)',
          '进阶查询：子查询(IN嵌套/EXISTS关联)、窗口函数(ROW_NUMBER行号/RANK排名/DENSE_RANK紧凑排名/LAG上一行/LEAD下一行/SUM OVER累积)、多表JOIN(INNER两边都有/LEFT保留左/RIGHT保留右/FULL OUTER两边全保留)',
          'AI PM SQL能力要求：能独立取数不依赖分析师、能写复杂多表Join和子查询、能用窗口函数做用户路径分析、面试高频题(计算留存率/找连续3天活跃用户/复购间隔/销售额前10%商品)',
        ] },
        { name: '统计学基础', points: [
          '描述性统计：集中趋势(均值Mean易被极端值拉偏/中位数Median不受极端值影响/众数Mode出现最多)、离散程度(方差/标准差/四分位数Q1-Q3)、分布(正态分布均值=中位数=众数/偏态左偏右偏)',
          '假设检验：原假设H0(默认成立)/备择假设H1(要证明)/p值(H0成立时观察到当前结果的概率)/显著性水平α=0.05、检验流程(提假设→选方法→算统计量和p值→p<α则拒绝H0)、常用检验(t检验比较两组均值/卡方检验分类变量相关/A/B测试用t检验)',
          '相关性分析：Pearson线性相关[-1,1]/Spearman单调相关不要求线性、相关≠因果(冰激凌销量和溺水正相关但都是因为夏天)、判断因果需时间先后+控制混淆变量+理论支撑',
        ] },
        { name: '指标体系设计', points: [
          '北极星指标：一个团队一个核心指标，如何选择和捍卫',
          '指标拆解：一级→二级→三级指标树，MECE原则',
          '领先指标vs滞后指标：预测性vs回顾性，组合使用',
          '护栏指标：防止优化A伤害B，增长的底线',
          'AI特有指标：模型效果指标vs业务效果指标的对齐和差异',
          '指标治理：指标定义的一致性、数据质量、口径管理',
        ] },
        { name: '实验设计', points: [
          'A/B测试：假设→分组→指标→显著性，完整流程',
          '样本量计算：MDE/统计功效/分层，如何确定实验时长',
          '多重比较：Bonferroni/FDR校正，避免p-hacking',
          '交错实验：更高效的对比方法，适合高频场景',
          '长期实验：如何评估延迟效应和长期影响',
          '实验文化：如何建立"不实验不上线"的团队文化',
        ] },
        { name: '归因与因果推断', points: [
          '漏斗分析：每一步的转化和流失，微观转化率',
          '路径分析：用户实际走的路vs你设计的路',
          '归因模型：首次/末次/线性/时间衰减，不同场景的选择',
          '因果推断：相关≠因果，DID/IV/PSM方法入门',
          '增量分析：Lift模型和反事实估计，真实增量vs自然增长',
          '混杂因素：如何识别和控制影响结论的混杂变量',
        ] },
        { name: '数据叙事', points: [
          '金字塔原理：结论先行→论据支撑→数据佐证',
          '对比法：与基准/竞品/历史对比，数据没有上下文没有意义',
          '趋势法：变化的方向和速度，拐点的识别和解释',
          '异常法：为什么偏离预期，异常往往是最大的洞察',
          '行动导向：每个数据洞察都指向一个行动，没有行动的洞察是噪音',
          '受众适配：给CEO/给工程师/给设计师讲数据的方式完全不同',
        ] },
        { name: 'AI产品的数据特殊性', points: [
          '模型效果vs用户感知：准确率90%但用户觉得不好用，为什么？',
          '长尾分布：AI产品的指标分布往往有长尾，平均值会骗人',
          '冷启动指标：新用户vs老用户的AI效果差异',
          '反馈循环指标：用户反馈如何改善AI，飞轮转动的速度',
          '成本指标：AI产品的单位经济模型，Token成本/用户/请求',
          '安全指标：AI安全事件的度量和追踪',
        ] },
        { name: '数据基础设施与治理', points: [
          '数据采集：埋点设计/事件定义/数据流架构，采集什么比怎么采集更重要',
          '数据质量：完整性/一致性/及时性/准确性，数据质量是分析的地基',
          '数据仓库：数仓分层(ODS/DWD/DWS/ADS)，指标计算的可复用架构',
          '实时vs离线：实时看板和离线报表的互补，不同决策需要不同时效',
          '数据权限：敏感数据访问控制/脱敏策略/合规审计',
          '数据文化：让团队用数据说话，从"我觉得"到"数据说"的组织转型',
        ] },
      ],
      keyQuestions: [
        '你的北极星指标真的反映用户价值吗？还是只是一个虚荣指标？',
        'A/B测试的结果能推广到全量吗？有没有Simpson悖论？',
        '指标提升但用户满意度下降了吗？护栏指标看了吗？',
        '你是在用数据验证决策还是用决策挑选数据？',
        'AI产品的模型效果和业务效果一致吗？不一致时怎么办？',
        '你的数据基础设施能支撑实时决策吗？还是只能做事后分析？',
      ],
      mustRead: [
        { title: '《精益数据分析》', author: 'Alistair Croll', why: '数据驱动决策的完整框架，不同商业模式的核心指标' },
        { title: '《Hacking Growth》', author: 'Sean Ellis', why: '增长实验的方法论，从假设到验证的闭环' },
        { title: '《Trustworthy Online Controlled Experiments》', author: 'Kohavi等', why: 'A/B测试最权威的教材，Google/Microsoft/LinkedIn的实践' },
        { title: '《Factfulness》', author: 'Hans Rosling', why: '如何用数据理解世界，避免数据误读' },
        { title: '《Thinking, Fast and Slow》', author: 'Daniel Kahneman', why: '理解认知偏差如何影响数据解读和决策' },
        { title: '《Measure What Matters》', author: 'John Doerr', why: 'OKR方法论，如何设定和追踪关键结果，目标与指标的对齐' },
      ],
      tools: ['Amplitude', 'Mixpanel', 'Statsig', 'Eppo', 'GrowthBook', 'BigQuery', 'Looker', 'Metabase', 'Lightdash'],
      pitfalls: [
        '不要只看平均值——分布和尾部更重要，平均值会骗人',
        '不要忽略幸存者偏差——你看到的是活下来的用户，不是流失的',
        '不要把相关性当因果性——A和B一起变化不代表A导致B',
        '不要忽略实验的交互效应——多个实验同时跑可能互相影响',
        '不要追求统计显著性而忽视实际显著性——p<0.05但效果微不足道',
        '不要忽视数据基础设施——没有好的埋点和数据质量，再好的分析方法也是空中楼阁',
      ],
      caseStudies: [
        { title: 'LinkedIn的A/B测试平台', company: 'LinkedIn', lesson: '每天跑上千个实验的基础设施和文化' },
        { title: 'Airbnb的实验框架', company: 'Airbnb', lesson: '如何处理实验的网络效应和溢出效应' },
        { title: 'Netflix的指标体系', company: 'Netflix', lesson: '从观看时长到留存率，北极星指标的演进' },
        { title: 'Meta的实验规模化', company: 'Meta', lesson: '每天同时运行上万个实验的基础设施，如何处理实验间的交互和溢出效应' },
      ],
      interviewQs: [
        { question: '如何为一个AI产品设计指标体系？', hint: '从北极星→拆解→护栏→AI特有指标，展示系统思维' },
        { question: 'A/B测试显示效果提升但用户投诉增加，怎么办？', hint: '护栏指标的重要性，短期vs长期，不同用户群体的差异' },
        { question: '如何判断两个指标之间的因果关系？', hint: '相关不等于因果，需要实验验证或因果推断方法' },
        { question: 'AI产品的模型指标和业务指标不一致时怎么办？', hint: '分析不一致的根因——指标定义偏差/用户行为差异/评估场景错配，以业务指标为准' },
      ],
      learningTips: [
        '为你正在做的产品定义一个完整的指标体系（北极星+拆解+护栏）',
        '在Amplitude中搭建一个漏斗分析，理解每一步的转化率',
        '设计一个A/B测试方案，从假设到样本量到指标',
        '练习用数据讲故事：选一个数据洞察，用1分钟讲给不同受众',
        '搭建一个实时数据看板，监控AI产品的核心指标和异常',
      ],
    },
    connections: ['user-research', 'ai-evaluation'],
  },
  {
    id: 'ai-evaluation',
    label: 'AI 效果评估',
    shortLabel: '效果评估',
    icon: '🎯',
    x: 460, y: 500,
    region: 'data',
    color: '#5856d6',
    content: {
      summary: 'AI产品最大的挑战不是做出来，而是评估它好不好。科学的评估体系是AI产品的生命线。',
      topics: [
        { name: '评测体系设计', points: [
          '评估维度：正确性(回答是否准确)/流畅性(语言是否通顺)/完整性(是否覆盖所有方面)/安全性(有害内容隐私泄露)/相关性(回答和问题关联程度)',
          '评估指标：精确率/召回率/F1/BLEU/ROUGE/Hit Rate/幻觉率/重复率',
          '人工评估流程：制定评估标准(好/中/差三档定义)→准备评估数据集(主流+边缘场景)→培训评估人员→双盲评估(不知道哪个模型)→计算评估者一致性',
          '自动评估（LLM-as-Judge）：用GPT-4/Claude评估模型输出质量、给评分标准让LLM打分、局限是LLM评估本身也有偏见(位置偏差/长度偏差/自我偏好)',
          '行业评测集：MMLU(多学科选择题衡量知识)/HumanEval(编程题衡量代码)/GSM8K(数学应用题衡量推理)/TruthfulQA(真实性衡量幻觉)',
          '评测频率：上线前全量评测/上线后持续监控/定期回归评测/触发式评测(模型更新时)',
        ] },
        { name: '评测集构建与数据清洗', points: [
          '评测集设计原则：覆盖度(主流场景+长尾场景)/难度梯度(简单→中等→困难)/无偏性(不偏向特定群体)',
          '数据采集与标注流程：明确标注标准→给出正负面示例→歧义case处理方式→标注人员培训考核→正式标注',
          '数据清洗：去重(去除重复样本)/去噪(删除明显错误)/格式统一(编码/时间/长度)/质量过滤(低质量样本剔除)',
          '难例挖掘与边界case覆盖：主动学习挑选模型不确定的样本、对抗样本构造、边界条件测试(空输入/超长输入/多语言混合)',
          '评测集版本管理与迭代：类似Git的版本控制、每次模型迭代对应评测集版本、数据增强策略(同义改写/对抗样本)',
        ] },
        { name: 'RAG评估与混合检索优化', points: [
          '检索评估：召回率(Recall)/精确率(Precision)/MRR(首个相关结果排名倒数)/nDCG(归一化折损累积增益)',
          '生成评估：忠实度(Faithfulness答案是否基于检索内容)/答案相关性(Answer Relevancy)/上下文利用率(Context Utilization)',
          'RAGAS框架使用：自动化RAG评估、四大核心指标(答案相关性/上下文相关性/忠实度/上下文利用率)',
          '混合检索提升召回率：稠密检索(语义相似)+稀疏检索(BM25关键词)+重排序Rerank三路融合、检索参数调优(chunk大小/overlap/top_k)',
          '端到端RAG评估管线：Query→检索→生成→评估全链路自动化、A/B对比不同检索策略效果',
        ] },
        { name: 'Agent评估', points: [
          '任务完成率评估：Agent能否成功完成用户指定的任务、成功/部分成功/失败三级判定',
          '工具调用准确性：是否选对了工具、参数是否正确、调用时机是否合适',
          '多轮对话一致性：Agent在多轮对话中是否保持人设和逻辑一致',
          'Agent轨迹评估：规划合理性(任务拆解是否合理)/执行效率(步骤是否冗余)、LLM-as-Judge评估轨迹质量',
          'Agent评估框架与基准测试：SWE-bench(软件工程)/WebArena(网页操作)/ToolBench(工具调用)',
        ] },
        { name: '业务评估与Bad Case管理', points: [
          'AI功能对核心业务指标的贡献：归因分析(AI功能带来多少增量)、增量=实验组指标-对照组指标',
          '用户体验评估：NPS净推荐值(用户愿不愿意推荐)/CSAT满意度(单次体验)/CES费力度(完成任务需要多少步)',
          'Bad Case管理SOP：发现(用户反馈赞踩/客服投诉/日志分析重复生成胡言乱语)→分类(知识错误/理解错误/幻觉/安全/体验/格式)→根因(数据/Prompt/模型能力)→修复→回归测试→预防',
          '处理优先级：P0安全有害内容立即修复→P1高频Bad Case 24h内Hotfix→P2中频按迭代排期→P3低频长尾定期优化',
        ] },
        { name: 'A/B测试与持续优化', points: [
          '实验设计：样本量计算(最小可检测效应)/显著性水平(p<0.05)/分流策略(随机/分层)',
          '在线指标与离线指标对齐：离线指标好不代表在线效果好、建立离线→在线的预测关系',
          '模型版本对比与回滚：新模型vs旧模型A/B对比、效果回归检测(新版本是否在所有场景都不退步)、一键回滚机制',
          '评估驱动的迭代闭环：评估→发现问题→优化→再评估(衔接AI系统架构的项目全流程)',
        ] },
        { name: '线上效果监控', points: [
          '效果监控：实时指标/趋势/异常检测，效果下降的早期预警',
          '数据漂移：输入分布变化检测，PSI/KS检验/特征监控',
          '模型退化：效果随时间下降的预警，概念漂移和数据漂移',
          '成本监控：Token用量/延迟/错误率，成本异常检测',
          '用户反馈：显式(点赞/踩)/隐式(复制/编辑/放弃)反馈的收集和分析',
          '对比基线：与上一版本/规则引擎/竞品的效果对比',
        ] },
        { name: 'AI安全评估', points: [
          '红队测试：主动寻找AI的弱点，系统化的攻击方法',
          '对抗样本：精心构造的恶意输入，越狱和注入攻击',
          '安全边界：AI不应该做什么的明确清单，边界测试',
          '偏见审计：公平性指标的系统性评估，不同人群的效果差异',
          '合规检查：AI法案/GDPR/行业监管要求，合规评估框架',
          '安全事件响应：AI安全事件的处理流程和复盘方法',
        ] },
        { name: '评估工程化', points: [
          '评估流水线：自动化评测的CI/CD集成，每次变更都跑评测',
          '评估数据管理：版本化/标注/清洗/更新，数据集的生命周期',
          '评估报告：自动化生成评测报告，趋势对比和异常标注',
          '评估标准：团队统一的评估标准和流程，减少主观性',
          '评估成本：人工评测的成本优化，主动学习选择最有价值的样本',
          '评估文化：建立"不评估不上线"的团队文化',
        ] },
        { name: 'AI产品用户体验评估', points: [
          '满意度测量：CSAT/NPS/CES在AI产品中的适配和特殊考量',
          '信任度评估：用户对AI输出的信任程度，信任建立和信任损失指标',
          '感知质量vs客观质量：用户觉得好vs评测分数高，两者的差距分析',
          'AI疲劳度：用户长期使用AI后是否产生依赖或疲劳，如何测量',
          '替代行为分析：用户绕过AI直接人工操作的频率和原因',
          '净推荐值在AI场景的局限：用户推荐AI产品的原因可能和AI无关',
        ] },
      ],
      keyQuestions: [
        '你的评测能发现真实的问题吗？还是只是数字好看？',
        'Bad Case的根因是什么？是数据、Prompt还是模型能力？修复方案是什么？',
        '线上效果和离线评测一致吗？如果不一致，哪个更可信？',
        'AI的安全边界在哪里？谁来定义？如何测试？',
        '评测的成本是多少？有没有更高效的方法获得同样的信号？',
        '用户觉得AI好用和AI客观评测分数高是一回事吗？两者差距怎么解释？',
      ],
      mustRead: [
        { title: 'OpenAI Evals框架文档', author: 'OpenAI', why: '官方评测框架，了解最佳实践和设计思路' },
        { title: 'Hamel Husain: Evaluate LLMs', author: 'Hamel Husain', why: '实战派的LLM评估方法论，不搞学术派' },
        { title: '《Reliable ML》', author: '多个作者', why: '让ML系统可靠运行的工程实践' },
        { title: 'Eugene Yan: Evaluating LLM Applications', author: 'Eugene Yan', why: '最务实的LLM应用评估指南' },
        { title: 'Jason Wei: Emergent Abilities of LLMs', author: 'Jason Wei', why: '理解涌现能力对评估的影响' },
        { title: '《Evaluation of LLMs》综述', author: 'Chang等', why: 'LLM评估方法的全面综述，从任务评测到能力评测到安全评测' },
      ],
      tools: ['Promptfoo', 'LangSmith', 'Arize AI', 'Weights & Biases Weave', 'Braintrust', 'Ragas', 'TruLens', 'Patronus AI', 'Scale AI'],
      pitfalls: [
        '不要只看自动评测分数——人工抽检不可省，自动评测有盲区',
        '不要忽略Bad Case——它们往往揭示系统性问题，而非个别异常',
        '不要一次测太多维度——聚焦最关键的质量指标，避免分析瘫痪',
        '不要用静态数据集评测动态系统——评测数据要持续更新',
        '不要把评测当成一次性项目——持续评测才是正确姿势',
        '不要只关注客观评测分数——用户感知质量同样重要，两者都要追踪',
      ],
      caseStudies: [
        { title: 'OpenAI的模型评测', company: 'OpenAI', lesson: '从内部红队到公开评测，多层次评估体系的设计' },
        { title: 'Google的AI安全评估', company: 'Google', lesson: '系统化的安全评估框架，从偏见到毒性到事实性' },
        { title: 'Anthropic的Constitutional AI', company: 'Anthropic', lesson: '用AI评估AI，自动化安全评估的创新方法' },
        { title: 'Tesla的自动驾驶安全报告', company: 'Tesla', lesson: '如何向公众和监管机构报告AI安全指标，透明度和信任的平衡' },
      ],
      interviewQs: [
        { question: '如何设计一个AI产品的评估体系？', hint: '从自动评测→人工评测→线上监控→安全评估的完整框架' },
        { question: 'LLM-as-Judge有什么局限？如何弥补？', hint: '位置偏差/长度偏差/自我偏好，用校准和混合方法弥补' },
        { question: '如何处理线上效果和离线评测不一致的情况？', hint: '分析不一致的原因——数据分布差异/用户行为差异/评估指标差异' },
        { question: '如何评估AI产品的用户体验质量？', hint: '从满意度→信任度→感知质量→替代行为，多维度评估而非只看NPS' },
      ],
      learningTips: [
        '用Promptfoo搭建一个Prompt评测套件，体验自动化评测的流程',
        '收集50个Bad Case，尝试分类和根因分析',
        '设计一个LLM-as-Judge的评测方案，测试它的偏差',
        '阅读3个AI公司的评测博客，学习他们的评估框架',
        '设计一个AI产品的用户体验评估方案，包含满意度、信任度和感知质量三个维度',
      ],
    },
    connections: ['prompt-engineering', 'data-metrics', 'product-design', 'ai-architecture'],
  },

  // ── 领导力群岛 ──
  {
    id: 'product-strategy',
    label: '产品战略规划',
    shortLabel: '产品战略',
    icon: '🏔️',
    x: 620, y: 560,
    region: 'leadership',
    color: '#af52de',
    content: {
      summary: '从做好一个功能到定义一个方向：产品战略的核心思维。AI时代的战略思考有新的维度。',
      topics: [
        { name: '市场分析框架', points: [
          'TAM/SAM/SOM：市场规模的估算方法，自上而下vs自下而上',
          '波特五力：行业竞争格局分析，供应商/买方/替代品/新进入者/现有竞争者',
          'PEST分析：宏观环境扫描，政治/经济/社会/技术',
          '技术成熟度曲线：Gartner Hype Cycle的实战应用，判断技术时机',
          'AI市场特殊性：技术驱动vs需求驱动的差异，供给创造需求',
          '市场进入时机：太早是先烈，太晚是红海，如何判断最佳时机',
        ] },
        { name: '竞争策略', points: [
          '差异化定位：为什么用户选你不选别人，可持续的差异化来源',
          '护城河分析：网络效应/数据飞轮/转换成本/品牌/规模效应',
          '蓝海策略：创造新需求而非在红海厮杀，价值创新框架',
          'AI竞争壁垒：数据/人才/算力/生态，AI时代的护城河',
          '平台vs工具：商业模式的选择，从工具到平台的路径',
          '防御策略：当大厂进入你的赛道，如何防守',
        ] },
        { name: '商业模式设计', points: [
          '商业模式画布：9个要素的系统思考，从价值主张到收入模型',
          '定价策略：SaaS/AI API/按量计费/结果导向定价的设计',
          '增长飞轮：自增强的增长循环设计，Amazon飞轮的启示',
          '单位经济模型：LTV/CAC/Payback Period，健康的增长指标',
          'AI商业模式创新：结果导向定价/人机协作定价/能力平台化',
          '第二曲线：在第一曲线还在增长时启动第二曲线',
        ] },
        { name: 'AI趋势判断', points: [
          '技术成熟度判断：哪些AI能力已经成熟，哪些还在早期',
          '应用场景预判：AI将如何改变不同行业，时间线估计',
          '投资逻辑：AI投资的热点和泡沫，如何判断真需求',
          '政策影响：AI监管对产品的影响，合规即竞争力',
          '范式迁移：从GUI到LUI，从搜索到对话，从工具到Agent',
          'AGI影响预判：通用人工智能对产品和社会的影响',
        ] },
        { name: '产品组合管理', points: [
          '产品矩阵：现金牛/明星/问题/瘦狗，BCG矩阵的实战应用',
          '创新平衡：70%核心/20%相邻/10%突破，资源配置的黄金比例',
          '资源分配：ROI驱动的投资组合优化，数据驱动的资源决策',
          '技术债管理：何时还债vs何时前行，债务的量化',
          'AI产品组合：模型复用/数据共享/能力平台化，1+1>2',
          '产品线规划：从单品到产品线的演进路径',
        ] },
        { name: 'AI产品国际化战略', points: [
          '市场选择：AI产品出海的目标市场评估，技术基础设施和监管环境的考量',
          '本地化策略：语言/文化/法规/数据主权的多维度本地化',
          '模型本地化：多语言模型选择/本地数据训练/文化适配',
          '合规差异：不同国家AI监管的差异，GDPR/中国AI法/美国AI行政令',
          '竞争格局：全球AI市场的竞争态势，大厂vs创业公司的不同策略',
          '出海节奏：从单一市场验证到多市场扩展的节奏控制',
        ] },
      ],
      keyQuestions: [
        '你的产品在3年后还有存在的必要吗？如果AI继续进化呢？',
        '如果竞品明天免费，你的护城河是什么？用户会留下吗？',
        'AI是让你的产品更好还是让进入门槛更低？对谁更有利？',
        '你的商业模式在用户10倍后还成立吗？成本结构会变吗？',
        '你在做"正确的事"还是"把事做正确"？战略比执行更重要',
        'AI产品出海面临的最大障碍是什么？技术、法规还是文化？',
      ],
      mustRead: [
        { title: '《好战略，坏战略》', author: 'Richard Rumelt', why: '什么是真正的战略，什么是空话，战略思维的基础' },
        { title: '《创新者的窘境》', author: 'Clayton Christensen', why: '为什么好公司会被颠覆，AI时代的警示' },
        { title: 'a16z AI行业报告', author: 'a16z', why: '最前沿的AI行业洞察和趋势判断' },
        { title: '《Zero to One》', author: 'Peter Thiel', why: '从0到1的创业思维，垄断vs竞争' },
        { title: '《Playing to Win》', author: 'A.G. Lafley', why: '宝洁前CEO的战略框架，可执行的战略制定方法' },
        { title: '《The Lean Startup》中文版', author: 'Eric Ries', why: '精益创业方法论在AI产品战略中的应用，快速验证战略假设' },
      ],
      tools: ['CB Insights', 'ProductPlan', 'Miro战略画布', 'Gartner', 'Statista', 'SimilarWeb', 'Crunchbase', 'PitchBook'],
      pitfalls: [
        '不要把战略当口号——要有可执行的计划和可衡量的里程碑',
        '不要忽略执行——再好的战略没有执行都是零，战略和执行要匹配',
        '不要只看竞品做什么——要看用户需要什么，竞品导向vs用户导向',
        '不要追求大而全——聚焦是战略的本质，什么都做等于没有战略',
        '不要忽视AI的范式迁移——用旧范式思考新问题会错过机会',
        '不要低估国际化的复杂度——AI产品出海不只是翻译，还有法规、数据主权和文化适配',
      ],
      caseStudies: [
        { title: 'OpenAI的战略选择', company: 'OpenAI', lesson: '从非营利到营利，从研究到产品，每一步的战略取舍' },
        { title: '字节跳动的AI布局', company: '字节跳动', lesson: '从推荐算法到AIGC，数据飞轮和平台化战略' },
        { title: 'NVIDIA的护城河', company: 'NVIDIA', lesson: 'CUDA生态+算力垄断，AI时代最深的护城河' },
        { title: 'Canva的AI功能战略', company: 'Canva', lesson: 'AI功能不是独立产品而是增强现有工作流，从工具到平台的渐进式AI战略' },
      ],
      interviewQs: [
        { question: '如何评估一个AI产品的市场机会？', hint: '从TAM/技术成熟度/竞争格局/商业模式四个维度系统分析' },
        { question: 'AI产品的护城河是什么？', hint: '数据飞轮/网络效应/转换成本/生态锁定，不同阶段不同护城河' },
        { question: '如何制定AI产品的定价策略？', hint: '从价值定价vs成本定价，SaaS/API/按量/结果导向的不同模式' },
        { question: 'AI产品如何制定国际化战略？', hint: '从市场选择→本地化→合规→竞争分析，AI产品出海的特殊考量' },
      ],
      learningTips: [
        '选一个AI赛道，做完整的市场分析（TAM+竞争+趋势）',
        '为你熟悉的产品画一个商业模式画布',
        '分析3个AI产品的护城河，哪些是可持续的',
        '读a16z最新的AI行业报告，理解当前的投资热点和趋势',
        '选一个AI产品，分析它的国际化策略和本地化挑战',
      ],
    },
    connections: ['product-design', 'ai-leadership', 'ai-evaluation', 'ai-commercialization'],
  },
  {
    id: 'ai-leadership',
    label: 'AI 产品领导力',
    shortLabel: '领导力',
    icon: '👑',
    x: 880, y: 560,
    region: 'leadership',
    color: '#af52de',
    content: {
      summary: '从做好一个产品到引领一个方向：AI时代的领导力新范式。技术判断力+组织能力+行业影响力。',
      topics: [
        { name: 'AI团队建设', points: [
          '跨职能团队：PM+工程师+研究员+设计师的协作模式',
          'AI人才画像：什么人适合做AI PM，技术理解力>技术能力',
          '能力培养：从传统PM到AI PM的转型路径，6个月培养计划',
          '团队文化：实验文化/数据文化/安全文化，AI团队的特殊文化需求',
          '远程协作：AI团队的特殊协作挑战，异步沟通和知识共享',
          '绩效评估：AI PM的绩效如何评估，过程指标vs结果指标',
        ] },
        { name: '技术决策力', points: [
          'Make vs Buy：自研vs采购的决策框架，TCO分析和战略考量',
          '技术选型：模型/API/框架的选择逻辑，评估维度和决策流程',
          '技术债务：何时还债vs何时前行，债务的量化和管理',
          '架构演进：从单体到微服务到AI原生，何时重构',
          '技术沟通：用工程师的语言对话，建立技术信任',
          '技术预判：判断技术趋势，提前布局vs跟进行动',
        ] },
        { name: 'AI治理与合规', points: [
          'AI伦理委员会：组织架构和决策流程，跨职能治理',
          '合规框架：EU AI Act/中国AI监管/行业规范，合规即竞争力',
          '负责任AI：公平性/透明性/可问责性，不只是口号',
          '数据治理：数据来源/使用权/隐私保护，数据合规',
          '审计追踪：模型决策的可追溯性，满足监管要求',
          '危机管理：AI安全事件的处理流程和公关策略',
        ] },
        { name: '行业影响力', points: [
          '技术写作：博客/白皮书/行业报告，建立思想领导力',
          '公开演讲：技术会议/行业论坛/播客，传播影响力',
          '开源贡献：开源项目/社区运营/标准制定，技术影响力',
          '人才培养：导师制/培训体系/知识传承，组织影响力',
          '跨界合作：学术/产业/政府的跨界连接，生态影响力',
          '个人品牌：持续输出独特观点，成为领域权威',
        ] },
        { name: 'AI产品管理进阶', points: [
          '产品组合管理：从单品到产品线的战略规划',
          'AI平台化：从AI功能到AI平台，能力复用和生态建设',
          '国际化：AI产品的国际化挑战，本地化和合规',
          '组织变革：推动组织AI转型的策略和路径',
          '创新管理：在大型组织中推动AI创新的方法',
          '未来预判：AGI影响/人机协作演进/产品范式迁移',
        ] },
        { name: 'AI产品危机管理', points: [
          'AI事故分级：从轻微偏差到严重安全事故的分级响应机制',
          '应急响应流程：发现→评估→止损→修复→复盘的标准SOP',
          '跨部门协调：工程/法务/公关/高层的危机协作机制',
          '用户沟通策略：透明vs恐慌的平衡，如何向用户解释AI事故',
          '监管应对：AI事故后的监管沟通和合规整改',
          '预防体系：从危机中学习，建立AI事故的预防性检测和预警',
        ] },
      ],
      keyQuestions: [
        '你的团队有AI实验文化吗？还是只有执行文化？',
        '当AI出事时，谁来负责？流程是什么？有没有演练过？',
        '你在行业中的独特观点是什么？别人为什么要听你的？',
        '5年后AI PM这个角色会变成什么样？你准备好了吗？',
        '你的组织能吸引和留住AI人才吗？凭什么？',
        'AI产品出了严重事故，你的团队有应急响应SOP吗？多久演练一次？',
      ],
      mustRead: [
        { title: '《The Hard Thing About Hard Things》', author: 'Ben Horowitz', why: '管理最难的事情没有标准答案，实战管理智慧' },
        { title: 'Stanford HAI年度报告', author: 'Stanford', why: 'AI对社会的全面影响分析，领导者的必读参考' },
        { title: 'Andrew Ng: AI for Everyone', author: 'Andrew Ng', why: 'AI领导者的沟通框架，如何向组织传递AI愿景' },
        { title: '《High Output Management》', author: 'Andy Grove', why: '英特尔前CEO的管理圣经，产出导向的管理方法' },
        { title: '《The Innovator\'s DNA》', author: 'Jeff Dyer等', why: '创新者的五种技能，如何培养创新领导力' },
        { title: '《Team Topologies》', author: 'Matthew Skelton等', why: '团队拓扑理论，AI时代如何组织跨职能团队实现快速交付' },
      ],
      tools: ['Notion', 'Lattice', 'Culture Amp', 'Substack/Medium', 'LinkedIn', 'Twitter/X', 'Coda', 'Miro'],
      pitfalls: [
        '不要用管理传统产品的方式管理AI产品——不确定性是常态',
        '不要忽视AI伦理——出事后修复成本远高于预防，声誉损失不可逆',
        '不要只关注技术——组织和人才同样重要，甚至更重要',
        '不要等完美再行动——AI领域速度比完美更重要',
        '不要忽视一线的声音——最好的洞察往往来自离用户最近的人',
      ],
      caseStudies: [
        { title: 'Satya Nadella的AI转型', company: 'Microsoft', lesson: '从云计算到AI优先的组织转型，文化先行技术跟进' },
        { title: 'Google的AI伦理委员会风波', company: 'Google', lesson: 'AI治理的组织挑战，伦理和商业的平衡' },
        { title: 'Stripe的AI文化', company: 'Stripe', lesson: '如何在金融领域建立AI实验文化，合规和创新并行' },
        { title: 'Samsung的AI危机应对', company: 'Samsung', lesson: '员工使用ChatGPT泄露代码后的快速响应——从禁止到自建安全AI工具的策略转变' },
      ],
      interviewQs: [
        { question: '如何推动一个传统团队向AI转型？', hint: '从文化→人才→流程→工具的渐进式转型，不要一步到位' },
        { question: 'AI产品出了安全事故，你作为负责人怎么处理？', hint: '从应急响应→根因分析→修复→预防→沟通的完整流程' },
        { question: '如何在大型组织中推动AI创新？', hint: '从试点→推广→制度化的路径，找到创新和合规的平衡点' },
        { question: 'AI产品发生严重事故后，你如何领导团队应对？', hint: '从应急响应→跨部门协调→用户沟通→根因分析→预防体系，展示危机领导力' },
      ],
      learningTips: [
        '在团队内推行一个AI最佳实践，从一个小项目开始',
        '写一篇关于AI产品管理的深度文章，建立你的观点',
        '找一个AI伦理案例做深度分析，理解治理的复杂性',
        '制定个人6个月的AI学习计划，持续精进',
        '为你的团队制定一个AI事故应急响应SOP，并做一次模拟演练',
      ],
    },
    connections: ['ai-architecture', 'product-strategy'],
  },

  // ── 新增：JD拆解与求职备战 ──
  {
    id: 'job-preparation',
    label: 'JD 拆解与求职备战',
    shortLabel: '求职备战',
    icon: '🎯',
    x: 960, y: 560,
    region: 'leadership',
    color: '#af52de',
    content: {
      summary: 'AI PM求职不是靠运气，是靠系统准备。从JD拆解到简历优化，从面试技巧到谈薪策略，每一步都有方法论。',
      topics: [
        { name: 'JD深度拆解', points: [
          '典型JD结构：职责（做什么）+ 要求（需要什么），重点读职责部分',
          '"AI能力产品化"：你怎么把AI能力包装成用户能用的产品，需要RAG/Agent/对话类经验',
          '"需求规范"：你怎么定义AI产品的需求，能画出PRD结构、说清楚评估指标',
          '"监控产品效果"：你怎么量化AI做得好不好，懂AI评估指标、会设计Bad Case体系',
          '"探索落地场景"：你有没有场景洞察能力，有AI落地案例的思考',
          '"对AI有热情"：你平时关注AI吗、自学了吗，关注AI资讯、有个人项目',
          '"数据驱动"：你怎么用数据做决策，举例子：做了XX分析发现XX问题',
        ] },
        { name: '简历优化策略', points: [
          'AI PM简历结构：摘要→核心技能→项目经验→教育背景，AI项目放最前',
          '项目描述STAR法：Situation（背景）→ Task（任务）→ Action（行动）→ Result（结果）',
          '数据化表达：不用"优化了效果"，用"准确率从85%提升到92%，Bad Case减少40%"',
          'AI关键词密度：LLM/RAG/Agent/评估/Prompt/微调，确保ATS系统识别',
          '差异化亮点：你有而其他候选人没有的经历——AI项目/技术背景/行业洞察',
          '简历长度：1页最佳，最多2页，每一条都有存在的价值',
          '简历自检：给一个非AI领域的朋友看，5秒内能理解你做什么吗？',
        ] },
        { name: '面试核心题型', points: [
          '技术理解类高频题：大模型能力边界、RAG vs微调适用场景、幻觉处理方案、AI效果评估方法、LLM vs传统ML区别、Agent核心技术点',
          '产品设计类高频题：AI客服产品设计思路、AI需求评审关注点(业务价值/技术可行性/数据可行性/成本收益/风险)',
          '场景案例类高频题：模型效果不好排查流程(确认问题→收集Bad Case→分类→根因→方案→验证)、用户反馈答非所问处理(定位→意图识别→知识库→Prompt→数据补充)',
          '场景题："如果让你用LLM改造XX业务，你怎么做？"——考察AI场景判断力',
          '项目深挖："你当时怎么推进的？遇到什么困难？"——考察执行力和方法论',
          '技术理解："RAG和微调的区别是什么？什么时候用哪个？"——考察技术深度',
          '效果评估："你怎么量化AI的效果？Bad Case怎么处理？"——考察评估能力',
          '产品设计："设计一个AI客服产品，从需求到评估"——考察系统思维',
          '反问环节："这个场景的容错率如何？数据情况怎样？"——展示你的判断力',
          '行为面试："描述一次你和算法团队意见不一致的经历"——考察协作能力',
        ] },
        { name: 'Case Study面试方法论', points: [
          'Case解题框架：问题适配度(适合LLM吗)→数据可行性(有数据吗)→成本接受度(LLM成本能覆盖吗)→风险容忍度(能接受幻觉吗)',
          '模型选型Case：效果×成本×合规×延迟×定制的多维度对比、混合方案(简单问题小模型+复杂问题大模型)',
          '项目经验STAR法：Situation(背景)→Task(任务)→Action(行动)→Result(结果量化)、每个AI项目准备5个维度(背景/技术方案/核心挑战/效果数据/方法论沉淀)',
          'AI产品Case常见类型：智能客服/内容生成/知识问答/数据分析/推荐系统，每种类型有标准分析框架',
          'Case回答结构：先定义问题边界→再分析可行性→然后给方案→最后说评估和风险，展示系统思维',
        ] },
        { name: '分阶段备战攻略', points: [
          '第1-2周：构建知识体系——能用PM语言解释AI概念，理解LLM/RAG/Agent',
          '第3-4周：项目实战——做一个完整的AI产品方案，从PRD到评估',
          '第5-6周：面试准备——整理项目故事、练习常见题型、模拟面试',
          '第7-8周：投递与面试——精准投递、面试复盘、持续优化',
          '知识体系构建：读2-3本核心书+3Blue1Brown视频+OpenAI官方文档',
          '项目实战：选一个真实场景，输出PRD+技术方案+评估指标+数据需求',
          '面试练习：找3-5个朋友做模拟面试，录音复盘，每次迭代',
        ] },
        { name: '4阶段完整学习规划(0→1)', points: [
          '第1阶段(1-2月)AI基础+Python+Prompt：机器学习基础范式(监督/无监督/强化学习)、深度学习核心概念(神经网络/CNN/RNN/Attention)、Python编程(Pandas/Matplotlib/Git/API调用)、大模型原理(Transformer/GPT/BERT/主流模型盘点)、Prompt Engineering(设计原则/Few-shot CoT/结构化输出)、目标：能读懂AI技术文档、能用PM语言解释AI概念',
          '第2阶段(3-4月)RAG+Agent+向量数据库+框架：向量数据库原理与选型(Milvus/Pinecone/Chroma)、RAG架构(文档切分/嵌入/检索/重排序)、Agent核心循环(ReAct/Function Calling/规划/记忆)、LangChain+LangGraph实战(LCEL/状态图/条件路由)、LlamaIndex/Dify/Coze上手、目标：能独立搭建一个RAG/Agent应用',
          '第3阶段(5-6月)模型微调+强化学习+数据：SFT监督微调(数据集准备/训练配置/损失函数)、RLHF强化学习(奖励模型/PPO算法/KL散度)、DPO直接偏好优化(偏好数据构造/与RLHF对比)、数据清洗与标注规范(去重/去噪/质量控制/Kappa一致性)、评测集构建(覆盖度/难度梯度/自动+人工评估)、微调框架实战(LLaMA-Factory/Unsloth)、目标：理解模型训练全流程、能参与数据质量把控',
          '第4阶段(7-8月)项目实战+面试冲刺：做一个完整的AI产品项目(需求分析→技术选型→数据管线→核心开发→联调测试→部署上线)、整理项目故事(STAR法)、面试题系统准备(技术理解/产品设计/场景案例)、模拟面试3-5轮+录音复盘、精准投递+面试复盘+持续优化、目标：拿到满意的AI PM offer',
          '学习节奏建议：每天2-3小时(工作日1-2h+周末3-4h)、每阶段结束做一次自检(能独立完成什么)、遇到不懂的先跳过标记、后续阶段会自然理解、不要追求完美先完成再迭代',
        ] },
        { name: '面试技巧与心态', points: [
          '结构化回答：先给结论，再给2-3个论据，最后总结——金字塔原理',
          '数据先行：每个观点都带数据，"我观察到XX数据，所以做了XX决策"',
          '承认不知道：不懂的技术直接说"这个我不太熟悉，但我的理解是..."',
          '反问展示判断力：面试官描述场景后，先问容错率/数据量/用户预期',
          '项目故事模板：背景→挑战→方案→结果→反思，5分钟讲完一个项目',
          '心态管理：AI PM面试不是考算法，是考判断力和方法论，展示思考过程',
          '面试复盘：每次面试后记录问题，分析哪里答得好哪里可以更好',
        ] },
        { name: '薪资谈判与选择', points: [
          'AI PM薪资区间：初级30-50w/中级50-80w/高级80-120w（一线城市参考）',
          '薪资构成：Base+Bonus+期权，AI创业公司的期权价值评估',
          '谈判策略：先让对方出价，用竞品offer做筹码，关注总包而非Base',
          '公司选择维度：技术氛围/团队水平/业务前景/个人成长空间',
          '大厂vs创业：大厂稳定+资源多，创业成长快+风险高，根据阶段选择',
          'AI公司类型：基础模型/API平台/垂直应用/AI工具，不同类型不同机会',
          '长期价值：选能让你积累AI项目经验和行业认知的机会，而非短期高薪',
        ] },
      ],
      keyQuestions: [
        '你的简历上有没有AI项目经验？如果没有，怎么快速积累？',
        '你能3分钟讲清楚一个AI项目吗？背景-挑战-方案-结果-反思',
        '面试官问"用LLM改造XX业务"，你的分析框架是什么？',
        '你的AI技术理解够吗？能解释RAG和微调的区别吗？',
        '你的差异化优势是什么？为什么公司要招你而不是传统PM？',
        '你准备好反问面试官了吗？你的问题能展示你的判断力吗？',
      ],
      mustRead: [
        { title: '《Cracking the PM Interview》', author: 'Gayle McDowell', why: 'PM面试圣经，系统化的面试准备方法' },
        { title: '《Decode and Conquer》', author: 'Lewis Lin', why: 'PM面试的框架化回答方法，适合AI PM' },
        { title: '《The Product Manager Interview》', author: 'Lewis Lin', why: '164道PM面试题+回答框架，大量练习素材' },
        { title: 'AI PM面试题合集', author: '社区整理', why: 'AI PM特有的面试题和回答思路' },
        { title: '《Swipe to Unlock》', author: 'Parth Detroja等', why: '科技行业入门，理解科技公司如何运作' },
        { title: 'Levels.fyi薪资数据', author: 'Levels.fyi', why: '最准确的科技公司薪资数据，谈判参考' },
      ],
      tools: ['LinkedIn', 'Boss直聘', 'Levels.fyi', 'Glassdoor', 'Notion（面试准备）', 'Excalidraw（白板面试）', 'Pramp（模拟面试）'],
      pitfalls: [
        '不要背答案——面试官能听出来，要展示真实的思考过程',
        '不要只准备技术问题——AI PM面试更看重业务判断力和产品思维',
        '不要忽视项目故事——"你做过什么"比"你知道什么"更重要',
        '不要在面试中装懂——承认不知道+展示学习能力比装懂更加分',
        '不要只投大厂——AI创业公司的成长机会可能更大',
        '不要忽视文化匹配——AI团队的文化和传统产品团队很不一样',
      ],
      caseStudies: [
        { title: 'AI PM面试全流程', company: '某AI独角兽', lesson: '4轮面试：HR初筛→业务面（场景题）→技术面（AI理解）→CEO面（判断力），每轮重点不同' },
        { title: '从0准备到拿到offer', company: '社区案例', lesson: '8周准备：2周知识+2周项目+2周面试练习+2周投递，系统化准备比海投有效10倍' },
        { title: '薪资谈判实战', company: '某大厂', lesson: '用竞品offer做筹码，Base+Bonus+RSU总包谈判，最终比初始offer高30%' },
        { title: 'AI PM vs 传统PM面试差异', company: '某互联网公司', lesson: 'AI PM面试多了技术理解+效果评估+场景判断三轮，传统PM经验不够用' },
      ],
      interviewQs: [
        { question: '如果让你用LLM改造客服系统，你怎么做？', hint: '从容错率评估→技术方案选择（RAG vs 微调）→效果指标定义→降级方案设计' },
        { question: '你怎么判断一个场景适不适合用AI？', hint: '四维评估：容错率/数据可用性/ROI/技术可行性，给出量化标准' },
        { question: '描述你做过的最有挑战的AI项目', hint: 'STAR法：背景→挑战→方案→结果，重点讲你做对了什么和学到了什么' },
        { question: 'AI产品的效果下降了，你怎么排查？', hint: '从数据漂移→模型退化→Prompt变更→用户行为变化四步排查' },
      ],
      learningTips: [
        '整理一份AI PM常见面试题清单，每题写一个回答框架',
        '选一个业务场景，写一份完整的AI改造方案（PRD+评估指标+技术方案）',
        '找3个朋友做模拟面试，录音复盘，每次迭代回答',
        '在LinkedIn上关注10个AI PM，学习他们的职业路径和分享',
        '投递前研究目标公司的AI产品，准备针对性的问题和见解',
      ],
    },
    connections: ['ai-leadership', 'product-strategy', 'pm-capability'],
  },
  {
    id: 'learning-resources',
    label: '推荐资源与学习路径',
    shortLabel: '学习资源',
    icon: '📚',
    x: 480, y: 280,
    region: 'leadership',
    color: '#af52de',
    content: {
      summary: '从入门到进阶的完整资源地图：精选书籍、课程、社区和工具，配合4阶段学习规划，让每一步都有方向。',
      topics: [
        { name: '必读书单', points: [
          '《AI产品经理的实战手册》——AI PM能力模型的系统梳理，从入门到进阶',
          '《精益数据分析》——数据驱动决策的完整框架，不同商业模式的核心指标',
          '《Designing Machine Learning Systems》Chip Huyen——ML系统设计，从数据到部署的全流程',
          '《深度学习》Ian Goodfellow——深度学习圣经，理解模型原理的权威参考',
          '《百面机器学习》——算法面试必备，覆盖传统ML和深度学习核心问题',
          '《Cracking the PM Interview》Gayle McDowell——PM面试圣经，系统化面试准备方法',
          '《商业模式新生代》Alexander Osterwalder——商业模式画布的完整方法论',
        ] },
        { name: '在线课程', points: [
          'Andrew Ng Machine Learning(Coursera)——机器学习入门第一课，全球500万+学习者',
          'Andrew Ng Deep Learning Specialization(Coursera)——深度学习5门课专项，从神经网络到序列模型',
          '3Blue1Brown神经网络可视化(YouTube)——最直观的神经网络原理讲解，数学恐惧症友好',
          'LangChain官方教程(docs.langchain.com)——从LCEL到LangGraph的实战教程',
          'Hugging Face NLP Course——Transformer和NLP的实战课程，免费开源',
          'DeepLearning.AI Short Courses——ChatGPT Prompt Engineering/Building RAG/Agent等短期课程',
          'Stanford CS229/CS224N——机器学习和NLP的顶级课程，适合想深入理解原理的同学',
        ] },
        { name: '社区与资讯', points: [
          'WaytoAGI(waytoagi.com)——中文AI知识库和社区，AI PM必关注',
          'Latent Cat——AI产品经理社区，案例分享和职业讨论',
          'Hugging Face社区——模型/数据集/Spaces，AI开发者的GitHub',
          'Reddit r/MachineLearning/r/LocalLLaMA——英文AI社区，前沿讨论',
          'Twitter/X AI圈——关注Andrew Ng/Karpathy/Simon Willison/Elon Musk等',
          '即刻App AI圈子——中文AI产品讨论，产品视角为主',
          '各公司AI博客：OpenAI Blog/Anthropic Research/Google AI Blog/DeepMind Blog',
        ] },
        { name: '实战工具', points: [
          '开发框架：LangChain/LangGraph/LlamaIndex——RAG和Agent开发三件套',
          '低代码平台：Dify/Coze/FastGPT——无需代码搭建AI应用',
          '模型服务：OpenAI API/Anthropic API/智谱API/通义千问API——主流模型API',
          '向量数据库：Milvus/Pinecone/Chroma——RAG场景必备',
          '评估工具：RAGAS/LangSmith/Promptfoo——AI效果评估和监控',
          '微调框架：LLaMA-Factory/Unsloth——低成本微调开源模型',
          '可视化：Streamlit/Gradio——快速搭建AI Demo和原型',
        ] },
        { name: '4阶段学习路径总览', points: [
          '第1阶段(1-2月)AI基础+Python+Prompt：机器学习基础→深度学习核心→Python编程→大模型原理→Prompt Engineering，目标：能读懂AI技术文档、能用PM语言解释AI概念',
          '第2阶段(3-4月)RAG+Agent+向量数据库+框架：向量数据库→RAG架构→Agent核心循环→LangChain+LangGraph→LlamaIndex/Dify/Coze上手，目标：能独立搭建一个RAG/Agent应用',
          '第3阶段(5-6月)模型微调+强化学习+数据：SFT→RLHF→DPO→数据清洗与标注→评测集构建→微调框架实战，目标：理解模型训练全流程、能参与数据质量把控',
          '第4阶段(7-8月)项目实战+面试冲刺：完整AI产品项目→整理项目故事(STAR法)→面试题系统准备→模拟面试→精准投递，目标：拿到满意的AI PM offer',
          '学习节奏：每天2-3小时(工作日1-2h+周末3-4h)、每阶段结束自检、先完成再迭代',
        ] },
        { name: '6周速成路线(高强度)', points: [
          '第1周 AI技术认知周：Day1-2机器学习基础(监督/无监督/强化学习)→Day3-4深度学习+Transformer→Day5-6大模型原理与API调用→Day7整理笔记+完成API调用练习',
          '第2周 Prompt+RAG实战周：Day1-2 Prompt Engineering(设计原则/Few-shot/CoT/结构化输出)→Day3-4 RAG架构(文档切分/嵌入/检索/重排序)→Day5-6向量数据库+LangChain实战→Day7搭建一个简易RAG问答系统',
          '第3周 Agent+工作流周：Day1-2 Agent核心循环(ReAct/Function Calling/规划/记忆)→Day3-4 LangGraph+MCP协议→Day5-6 Skill编排+工作流自动化→Day7搭建一个多工具Agent应用',
          '第4周 产品设计+项目管理周：Day1-2 AI产品思维(AI-Native vs AI-Enabled/需求分析)→Day3-4 AI交互设计(对话式/嵌入式/代理式)→Day5-6 AI项目管理全流程(需求→数据→模型→上线)→Day7输出一份AI产品PRD',
          '第5周 数据+评估+微调周：Day1-2 SQL+统计学基础(查询/假设检验/相关性)→Day3-4 AI评估体系(评测集/评估指标/Bad Case管理)→Day5-6模型微调入门(SFT/RLHF/DPO/数据标注)→Day7完成一次微调实验',
          '第6周 面试冲刺+项目打包周：Day1-2面试题型系统准备(技术理解/产品设计/场景案例)→Day3-4 Case Study方法论+STAR法→Day5整理项目故事+简历优化→Day6模拟面试2轮→Day7复盘+精准投递',
          '每日学习节奏：早上30min理论(读文档/看视频)→中午30min实践(写代码/做练习)→晚上60min输出(写笔记/做项目)，周末集中4-6小时做项目',
        ] },
        { name: '核心技能矩阵', points: [
          '技术理解力(必备)：大模型原理/LLM能力边界/RAG vs微调选型/Agent架构 → 熟练掌握，能解释给非技术人员听',
          'Prompt Engineering(必备)：提示词设计/Few-shot CoT/结构化输出/上下文工程 → 熟练掌握，能设计高质量系统提示词',
          '产品设计力(核心)：AI交互范式/AI-Native设计/信任设计/效果驱动迭代 → 熟练掌握，能输出完整AI产品方案',
          '数据能力(核心)：SQL查询/统计分析/A/B测试/数据标注规范 → 中等掌握，能独立取数和做基础分析',
          '评估能力(核心)：评估体系设计/评测集构建/Bad Case管理/RAGAS → 中等掌握，能设计AI效果评估方案',
          '工程理解(加分)：Python/RAG开发/Agent开发/LangChain/MCP → 了解即可，能看懂代码和与工程协作',
          '模型训练(加分)：SFT/RLHF/DPO/微调框架/数据清洗 → 了解即可，能参与数据质量把控',
          '商业判断(必备)：AI产品商业化/竞争分析/成本核算/合规风险 → 熟练掌握，能做AI产品商业决策',
        ] },
        { name: '2026趋势重点', points: [
          '大模型原生化：从"AI-Enabled"(传统产品加AI功能)→"AI-Native"(产品从设计开始围绕AI)，AI不再是锦上添花而是核心价值',
          '多模态融合：GPT-4o实时语音+视觉、Gemini原生多模态、产品需支持文/图/音/视频混合输入输出',
          'Agent化：从单轮对话→多轮任务执行→自主Agent，Agent将成为AI产品主流形态，MCP协议推动Agent生态标准化',
          'RAG工业化：从实验性RAG→生产级RAG，Agentic RAG/GraphRAG/自适应RAG成为标配，检索质量成为核心竞争力',
          '成本效率革命：模型成本持续下降(DeepSeek/Qwen开源)、小模型+大模型级联架构、推理优化(量化/缓存/批处理)',
          'AI产品经理角色进化：从"懂AI的PM"→"能搭建AI产品的PM"，工程理解力和评估能力要求越来越高',
        ] },
        { name: '学习关键成功因素', points: [
          '时间管理策略：番茄工作法(25min专注+5min休息)、批量学习(周末集中做项目)、碎片时间(通勤听播客/看文章)',
          '高效学习方法：费曼学习法(学完能讲给别人听)、项目驱动(带着真实问题学)、输出倒逼输入(写笔记/做分享)',
          '知识管理：Notion/Obsidian做学习笔记、按主题而非时间组织、定期回顾和更新、建立个人知识图谱',
          '学习社区：加入AI PM社群(即刻/WaytoAGI/Latent Cat)、找到学习伙伴互相督促、参加线上Hackathon练手',
          '心态调整：接受"学不完"的现实(AI迭代太快)、专注核心概念而非追逐热点、先广度后深度、每个阶段有明确产出',
          '避坑指南：不要一上来就学微调(先搞懂RAG和Agent)、不要只看视频不动手(项目驱动)、不要追求完美(先完成再迭代)',
        ] },
      ],
      keyQuestions: [
        '你的学习目标是什么？转行AI PM还是提升现有能力？',
        '你每天能投入多少时间学习？2小时和4小时的节奏完全不同',
        '你更擅长从理论入手还是从项目入手？选适合自己的路径',
        '你有没有一个真实的AI产品想法？用它驱动学习比纯看书有效10倍',
      ],
      mustRead: [
        { title: 'Andrew Ng: AI for Everyone', author: 'Andrew Ng', why: '非技术人员理解AI的最佳入门，1小时建立AI全局认知' },
        { title: 'State of AI Report', author: 'Nathan Benaich', why: '每年更新的AI行业全景报告，了解最新趋势' },
        { title: 'a16z: AI商业模式报告', author: 'a16z', why: '最前沿的AI商业模式分析和趋势判断' },
        { title: 'Sequoia AI Map', author: 'Sequoia Capital', why: 'AI行业生态全景图，理解产业链和竞争格局' },
      ],
      tools: ['Notion(学习笔记)', 'Anki(间隔重复记忆)', 'GitHub(代码实践)', 'Kaggle(数据竞赛)', 'Streamlit(快速Demo)', 'Excalidraw(架构图)'],
      pitfalls: [
        '不要只看不做——看10篇教程不如动手做1个项目',
        '不要追求完美——先完成再迭代，60分的项目比100分的计划有用',
        '不要孤军奋战——加入社区，找学习伙伴，互相督促',
        '不要贪多——每个阶段聚焦2-3个核心主题，学透比学多重要',
        '不要忽视基础——跳过ML基础直接学LLM，遇到问题会频繁卡住',
      ],
      caseStudies: [
        { title: '从传统PM转行AI PM', company: '社区案例', lesson: '4个月系统学习：2月基础+1月RAG/Agent实战+1月面试准备，成功拿到AI独角兽offer' },
        { title: '零基础8个月上岸', company: '社区案例', lesson: '每天3小时，按4阶段规划执行，关键是在第2阶段做了3个RAG/Agent项目' },
        { title: '技术背景转AI PM', company: '社区案例', lesson: '优势是技术理解快，劣势是产品思维弱，重点补用户研究和产品设计' },
      ],
      interviewQs: [
        { question: '你怎么规划自己的AI学习路径？', hint: '展示你的系统思考：4阶段规划+每阶段目标+自检方式+调整策略' },
        { question: '你最近在学什么AI技术？为什么选这个？', hint: '展示学习动力和判断力：不是什么都学，而是有选择地学最相关的' },
        { question: '推荐一本你觉得对AI PM最有价值的书', hint: '不要只说书名，要说为什么对你有价值、你从中学到了什么、怎么应用的' },
      ],
      learningTips: [
        '制定一个8周学习计划，每周有明确的学习目标和产出',
        '每天花15分钟浏览AI资讯，保持对行业的敏感度',
        '每学一个技术概念，试着用一句话向非技术人员解释',
        '找一个学习伙伴，每周互相分享学到了什么',
        '建立个人知识库，用Notion/Obsidian记录学习笔记和心得',
      ],
    },
    connections: ['pm-capability', 'ai-fundamentals', 'job-preparation'],
  },
  // ── 新增节点：技能树有但学习地图缺少 ──
  {
    id: 'ai-requirement-spec',
    label: 'AI 需求拆解与规格定义',
    shortLabel: '需求规格',
    icon: '📐',
    x: 400, y: 480,
    region: 'product',
    color: '#34c759',
    content: {
      summary: 'AI产品需求拆解、模型规格定义、验收标准设计、Bad Case驱动迭代。这是AI PM区别于传统PM的核心能力。',
      topics: [
        { name: 'AI需求拆解方法', points: [
          'AI需求与传统需求差异：不确定性、效果导向、迭代驱动',
          '拆解维度：功能需求/模型需求/数据需求/评测需求',
          '需求优先级：ROI排序 × 效果不确定性评估',
          '需求变更管理：AI项目需求变更频繁，变更流程与影响评估',
        ] },
        { name: '模型规格定义', points: [
          '模型能力规格书：输入输出定义、能力边界、约束条件',
          '性能指标要求：准确率/延迟/吞吐量/成本的目标值',
          '安全规格：内容安全/隐私保护/合规要求的定义',
          '版本管理：模型版本与需求版本的对应关系',
        ] },
        { name: 'AI验收标准设计', points: [
          '验收维度：准确率/延迟/覆盖率/安全性',
          '分级标准：必须达标/建议达标/可选优化的三级标准',
          'Bad Case容忍度：可接受的错误率和错误类型定义',
          '验收流程：从离线评测到灰度验证到全量上线的验收门禁',
        ] },
        { name: 'Bad Case驱动迭代', points: [
          'Bad Case收集机制：用户反馈/自动检测/人工抽检',
          'Case优先级排序：频率×严重度×修复成本',
          '迭代验证：修复后的回归测试和效果追踪',
          '效果闭环：从发现到修复到验证的数据驱动闭环',
        ] },
        { name: 'AI PRD实战', points: [
          'AI PRD模板：标准结构 + AI特殊章节',
          '模型行为规范：正常case/边界case/异常case的处理规则',
          '降级方案设计：大模型→小模型→规则→人工的分层降级',
          '上线Checklist：模型版本锁定/效果验证/降级测试/监控告警',
        ] },
      ],
      keyQuestions: [
        '你如何定义AI功能的"完成"标准？效果指标达标意味着什么？',
        'AI需求和传统需求最大的区别是什么？你的PRD如何体现？',
        'Bad Case出现后，你的完整处理流程是什么？',
      ],
      mustRead: [
        { title: '《AI Product Management》', author: 'Sameer Dholakia', why: 'AI产品管理的系统化方法论，需求拆解和规格定义的实战指南' },
      ],
      tools: ['Notion(PRD模板)', 'Promptfoo(回归测试)', 'LangSmith(效果追踪)', 'Excalidraw(架构图)'],
      pitfalls: [
        '不要用传统PRD模板写AI需求——缺少模型行为规范和降级方案',
        '不要忽略Bad Case——AI产品的质量由最差的case决定',
        '不要把验收标准定得太死——AI效果有波动，需要容忍度设计',
      ],
      caseStudies: [
        { title: '某AI客服的验收灾难', company: '某电商平台', lesson: '验收只看平均准确率，忽略了高频Bad Case，上线后用户投诉激增，紧急回滚' },
        { title: 'AI写作助手的规格设计', company: '某内容平台', lesson: '明确定义了"不可接受输出"的白名单和黑名单，上线后Bad Case率降低60%' },
      ],
      interviewQs: [
        { question: 'AI PRD和传统PRD最大的区别是什么？', hint: '模型行为规范/效果指标/降级方案/Bad Case处理，四个核心差异' },
        { question: '如何设计AI功能的验收标准？', hint: '多维度指标+分级标准+Bad Case容忍度+验收门禁' },
      ],
      learningTips: [
        '写一份AI PRD，对照传统PRD模板，找出缺失的AI特殊章节',
        '收集10个Bad Case，按类型和严重度分类，设计修复优先级',
      ],
    },
    connections: ['pm-thinking', 'ai-product-design', 'ai-evaluation'],
  },
  {
    id: 'rag-architecture',
    label: 'RAG 架构理解',
    shortLabel: 'RAG架构',
    icon: '🔍',
    x: 560, y: 200,
    region: 'ai',
    color: '#ff9500',
    content: {
      summary: '检索增强生成的核心架构：从文档切分到向量检索到生成优化，掌握RAG系统的设计、评测和迭代方法论。',
      topics: [
        { name: 'RAG基本原理', points: [
          'RAG为什么有效：知识外置+实时检索，解决幻觉和时效性问题',
          'RAG vs 微调：适用场景对比，何时用RAG何时微调何时混合',
          'RAG架构演进：Naive RAG → Advanced RAG → Modular RAG → Agentic RAG',
          'RAG适用场景：知识库问答/智能客服/文档分析/代码搜索',
        ] },
        { name: '向量数据库与Embedding', points: [
          '向量数据库对比：Milvus/Pinecone/Weaviate/Qdrant/Chroma选型',
          'Embedding模型选择：OpenAI/BGE/E5/Cohere的维度与性能权衡',
          '索引类型：HNSW/IVF/Flat的选择策略，召回率vs延迟',
          '元数据过滤：结合向量检索和结构化过滤的混合查询',
        ] },
        { name: 'Chunk策略与文档处理', points: [
          '切分策略：固定长度/语义切分/递归切分/Markdown结构切分',
          'Chunk大小选择：256/512/1024 Token的效果对比',
          '多格式处理：PDF/Word/HTML/Markdown/表格的解析策略',
          '元数据标注：来源/页码/章节/时间等元数据的设计',
        ] },
        { name: '检索优化策略', points: [
          '混合检索：BM25关键词+向量语义的融合检索',
          '重排序：Cross-Encoder/Cohere Rerank/BGE-Reranker',
          'Query改写：HyDE/多Query生成/Query扩展',
          '多路召回：不同检索策略的召回结果融合',
        ] },
        { name: 'RAG评测体系', points: [
          '检索评测：召回率/精确率/MRR/NDCG',
          '生成评测：回答相关性/忠实度/完整性',
          '端到端评测：RAGAS/TruLens自动化评测框架',
          'Bad Case分析：检索失败/生成失败/幻觉的归因方法',
        ] },
      ],
      keyQuestions: [
        '你的RAG系统检索准确率是多少？怎么测的？',
        'Chunk大小怎么选的？有没有做过对比实验？',
        '检索不到相关文档时怎么处理？',
      ],
      mustRead: [
        { title: 'Retrieval-Augmented Generation for Knowledge-Intensive NLP Tasks', author: 'Lewis et al.', why: 'RAG架构的原始论文，理解RAG的理论基础' },
      ],
      tools: ['LangChain', 'LlamaIndex', 'Milvus', 'RAGAS', 'Chroma'],
      pitfalls: [
        '不要忽视检索质量——RAG的瓶颈往往是检索而非生成',
        '不要用固定Chunk大小——不同文档类型需要不同切分策略',
        '不要只看离线评测——线上用户Query的分布往往和评测集不同',
      ],
      caseStudies: [
        { title: '企业知识库RAG落地', company: '某金融机构', lesson: '从Naive RAG到Advanced RAG，检索准确率从65%提升到92%，关键在混合检索+重排序' },
        { title: '法律文档RAG系统', company: '某法律科技公司', lesson: 'Chunk策略从512改为语义切分，配合元数据过滤，回答准确率提升40%' },
      ],
      interviewQs: [
        { question: 'RAG和微调分别适合什么场景？', hint: 'RAG适合知识密集/实时更新，微调适合风格/格式定制，混合方案兼顾两者' },
        { question: 'RAG系统检索不到相关文档怎么办？', hint: 'Query改写/多路召回/降级到通用回答/提示用户换关键词' },
      ],
      learningTips: [
        '用LlamaIndex搭建一个简易RAG，体验从文档切分到检索到生成的全流程',
        '对比不同Chunk大小（256/512/1024）在相同数据集上的检索效果',
      ],
    },
    connections: ['ai-fundamentals', 'ai-architecture', 'ai-evaluation'],
  },
  {
    id: 'ai-agent-design',
    label: 'AI Agent 设计',
    shortLabel: 'Agent设计',
    icon: '🤖',
    x: 760, y: 100,
    region: 'ai',
    color: '#ff9500',
    content: {
      summary: 'AI Agent的架构设计：从ReAct到多Agent协作，掌握工具调用、规划执行、记忆系统的产品设计方法论。',
      topics: [
        { name: 'Agent基本概念', points: [
          '什么是Agent：自主感知环境、做出决策、执行行动的AI系统',
          'Agent vs Chatbot vs Copilot：自主性等级和能力差异',
          'Agent核心组件：感知→规划→行动→记忆→学习',
          'Agent适用场景：工作流自动化/智能助手/自主决策系统',
        ] },
        { name: 'Agent架构模式', points: [
          'ReAct：推理+行动的循环，最经典的Agent范式',
          'Plan-and-Execute：先规划后执行，适合复杂多步任务',
          'Reflexion：自我反思和改进，Agent从错误中学习',
          'LATS：语言Agent树搜索，蒙特卡洛树搜索+LLM',
        ] },
        { name: '工具调用设计', points: [
          'Function Calling：工具定义规范、参数设计、调用策略',
          'MCP协议：Model Context Protocol标准化工具接口',
          '工具选择策略：基于意图/上下文/能力的工具路由',
          '错误处理：工具调用失败的降级和重试策略',
        ] },
        { name: '多Agent协作', points: [
          '分工策略：基于能力/任务/区域的Agent分工',
          '通信协议：Agent间消息传递和状态同步',
          '冲突解决：多Agent意见不一致时的仲裁机制',
          'AutoGen/CrewAI：主流多Agent框架对比和选型',
        ] },
        { name: 'Agent评测与安全', points: [
          '评测指标：任务完成率/工具调用准确率/规划合理性',
          '安全边界：权限控制/操作审批/异常检测',
          '成本控制：Agent调用链的Token消耗估算和优化',
          '可观测性：Agent行为链路的追踪和调试',
        ] },
      ],
      keyQuestions: [
        '你的Agent能处理什么任务？不能处理什么？边界在哪里？',
        '多Agent协作时如何保证一致性和避免冲突？',
        'Agent出错时如何快速定位和修复？',
      ],
      mustRead: [
        { title: 'ReAct: Synergizing Reasoning and Acting', author: 'Yao et al.', why: 'Agent范式的奠基论文，理解ReAct循环的核心思想' },
      ],
      tools: ['LangGraph', 'AutoGen', 'CrewAI', 'Dify', 'Coze'],
      pitfalls: [
        '不要让Agent权限过大——每次操作都需要用户确认或自动审批',
        '不要忽视Agent的成本——多步调用Token消耗是指数级的',
        '不要追求完全自主——人机协作比全自动更可靠',
      ],
      caseStudies: [
        { title: '客服Agent从规则到AI', company: '某电商平台', lesson: '规则引擎处理80%常见问题，AI Agent处理20%复杂问题，人机协作效果最佳' },
        { title: '多Agent协作做研究', company: '某AI公司', lesson: '搜索Agent+分析Agent+写作Agent分工协作，研究报告质量提升3倍' },
      ],
      interviewQs: [
        { question: '如何设计一个可靠的Agent系统？', hint: '工具边界定义/错误处理/人机协作/成本控制四维度' },
        { question: 'Agent和RAG怎么结合？', hint: 'Agentic RAG——Agent自主决定何时检索、检索什么、如何整合' },
      ],
      learningTips: [
        '用Dify/Coze搭建一个简单Agent，体验工具调用和规划循环',
        '对比ReAct和Plan-and-Execute在相同任务上的表现差异',
      ],
    },
    connections: ['ai-fundamentals', 'prompt-engineering', 'ai-workflow'],
  },
  {
    id: 'cn-llm-ecosystem',
    label: '国产大模型生态与选型',
    shortLabel: '国产模型',
    icon: '🇨🇳',
    x: 1060, y: 200,
    region: 'ai',
    color: '#ff9500',
    content: {
      summary: '国产大模型全景：文心/通义/智谱/Kimi/DeepSeek的对比评估、API生态、私有化部署和选型决策方法论。',
      topics: [
        { name: '国产大模型全景', points: [
          '文心一言（百度）：中文理解强、企业级服务成熟、生态完善',
          '通义千问（阿里）：开源生态活跃、Qwen系列模型性能优秀',
          '智谱GLM：学术背景强、ChatGLM系列、MaaS平台完善',
          'Kimi/月之暗面：长上下文优势、用户体验好',
          'DeepSeek：开源能力领先、推理能力强、成本优势明显',
          '百川/MiniMax/零一万物：差异化定位、各有特色',
        ] },
        { name: '模型能力对比评估', points: [
          '通用能力评测：MMLU/C-Eval/CMMLU中文基准',
          '垂直能力评测：代码/数学/推理/写作专项评测',
          '性价比分析：API定价/Token成本/效果比',
          '场景适配度：不同业务场景的模型选型建议',
        ] },
        { name: 'API生态与集成', points: [
          'API兼容性：OpenAI格式适配、迁移成本评估',
          'SDK生态：Python/Java/Go SDK成熟度',
          '定价对比：输入/输出Token价格、批量折扣',
          '服务稳定性：SLA承诺、实际可用性、故障响应',
        ] },
        { name: '私有化部署方案', points: [
          '开源模型选择：Qwen/ChatGLM/DeepSeek的开源版本',
          '模型压缩：量化/蒸馏/剪枝的效果和成本权衡',
          '硬件需求：GPU显存/推理速度/并发能力的评估',
          '运维成本：部署/监控/升级的人力成本',
        ] },
        { name: '选型决策实战', points: [
          '需求分析：业务场景/性能要求/成本预算/合规要求',
          '候选模型筛选：3-5个候选模型的对比矩阵',
          'POC验证：评测集设计/通过标准/时间规划',
          '最终决策：综合评分/风险评估/迁移方案',
        ] },
      ],
      keyQuestions: [
        '你的产品用哪个国产模型？为什么选它？',
        '国产模型和GPT-4的差距在哪里？怎么弥补？',
        '模型迁移的成本有多大？需要多长时间？',
      ],
      mustRead: [
        { title: 'SuperCLUE中文评测报告', author: 'CLUE团队', why: '中文大模型最权威的评测报告，持续更新的选型参考' },
      ],
      tools: ['OpenAI兼容API', 'ModelScope', 'HuggingFace中文区'],
      pitfalls: [
        '不要只看评测分数——实际业务场景的表现才是王道',
        '不要忽视迁移成本——换模型的隐性成本往往被低估',
        '不要只选最贵的——国产模型的性价比优势是真实的',
      ],
      caseStudies: [
        { title: '某企业从GPT-4迁移到国产模型', company: '某SaaS公司', lesson: '3个月完成迁移，成本降低70%，效果损失5%可接受，关键是评测集覆盖全面' },
        { title: '私有化部署的坑', company: '某金融机构', lesson: '开源模型部署容易运维难，需要专职团队和持续优化' },
      ],
      interviewQs: [
        { question: '如何评估国产大模型是否适合你的产品？', hint: '场景适配度/性价比/合规/生态四维度评估' },
        { question: '模型迁移的风险有哪些？如何降低？', hint: '评测集覆盖/灰度迁移/双跑验证/回滚方案' },
      ],
      learningTips: [
        '对比3个国产模型的API，用相同Prompt测试效果差异',
        '画一个模型选型决策矩阵，包含你的产品关键指标',
      ],
    },
    connections: ['ai-fundamentals', 'ai-vendor-evaluation'],
  },
  {
    id: 'ai-vendor-evaluation',
    label: 'AI 技术选型与供应商评估',
    shortLabel: '技术选型',
    icon: '📊',
    x: 1160, y: 300,
    region: 'ai',
    color: '#ff9500',
    content: {
      summary: 'AI技术选型的系统化方法论：评估框架、供应商对比、POC验证、成本效益分析、技术风险管理。',
      topics: [
        { name: '技术选型评估框架', points: [
          '评估维度：能力/成本/稳定性/生态/合规五维评估',
          '权重设计：不同业务场景的维度权重差异化',
          '评分体系：量化评分+定性评估的混合方法',
          '决策流程：从候选筛选到POC验证到最终决策',
        ] },
        { name: '供应商对比分析', points: [
          '供应商能力矩阵：功能/性能/服务/生态的对比',
          'SLA对比：可用性/响应时间/故障恢复的承诺对比',
          '技术支持评估：文档质量/社区活跃度/工单响应',
          '生态成熟度：SDK/插件/集成/社区的完善程度',
        ] },
        { name: 'POC验证方法', points: [
          'POC范围界定：核心场景/关键指标/时间资源',
          '评测集设计：覆盖度/难度分层/对抗样本',
          '通过标准：量化指标+定性评估的通过门槛',
          '时间与资源：1-2周POC的节奏和资源规划',
        ] },
        { name: '成本效益分析', points: [
          'TCO计算：API成本+集成成本+运维成本+迁移成本',
          'ROI预估：效率提升/收入增长/风险降低的量化',
          '隐性成本识别：学习成本/锁定风险/升级成本',
          '长期成本趋势：用量增长/模型迭代/价格变动',
        ] },
        { name: '技术风险评估', points: [
          '供应商锁定风险：数据/模型/集成的迁移难度',
          '技术路线风险：技术方向变化/替代方案出现',
          '合规风险：数据出境/内容审核/算法备案',
          '迁移风险：换供应商的时间成本和效果损失',
        ] },
      ],
      keyQuestions: [
        '你的AI技术选型标准是什么？最重要的3个维度？',
        '如何评估供应商的真实能力而非营销话术？',
        '技术选型失败后的Plan B是什么？',
      ],
      mustRead: [
        { title: '《评估AI供应商的21个问题》', author: 'a16z', why: '最实用的AI供应商评估清单，每个问题都直击要害' },
      ],
      tools: ['评测集管理', '成本计算器', 'SLA监控'],
      pitfalls: [
        '不要只看Demo效果——真实场景和Demo差距巨大',
        '不要忽视供应商锁定——迁移成本可能是你想象10倍',
        '不要省略POC——没有POC的选型是赌博不是决策',
      ],
      caseStudies: [
        { title: '某公司AI供应商选型', company: '某互联网公司', lesson: '3个候选/2周POC/50个评测用例，最终选了不是最便宜但最稳定的方案' },
        { title: '供应商锁定的教训', company: '某AI创业公司', lesson: '深度绑定一家供应商后涨价50%，迁移需要6个月，损失巨大' },
      ],
      interviewQs: [
        { question: '如何设计AI技术的POC验证方案？', hint: '核心场景/评测集/通过标准/时间规划四要素' },
        { question: 'AI供应商的隐性成本有哪些？', hint: '学习成本/锁定风险/升级成本/迁移成本' },
      ],
      learningTips: [
        '为你的产品设计一个AI技术选型评分矩阵',
        '对比3个AI供应商的API文档和定价，做成本测算',
      ],
    },
    connections: ['cn-llm-ecosystem', 'ai-commercialization'],
  },
  {
    id: 'data-quality-annotation',
    label: '数据质量与标注',
    shortLabel: '数据标注',
    icon: '🏷️',
    x: 320, y: 650,
    region: 'data',
    color: '#5856d6',
    content: {
      summary: 'AI产品的数据基石：标注管理、质量管控、数据飞轮设计。理解数据如何驱动模型效果和产品迭代。',
      topics: [
        { name: '数据标注基础', points: [
          '标注类型：分类/抽取/生成/排序/偏好',
          '标注流程：需求→规范→培训→标注→抽检→交付',
          '标注工具：Label Studio/Prodigy/Scale AI选型',
          '标注成本：人力/工具/时间/质量的成本预算',
        ] },
        { name: '标注规范设计', points: [
          '规范结构：定义/示例/边界Case/常见错误',
          '边界Case定义：模糊场景的标注规则和决策树',
          '一致性检验：IAA/Kappa系数的监控和提升',
          '规范迭代：基于标注员反馈和Bad Case的持续更新',
        ] },
        { name: '质量抽检与管理', points: [
          '抽检策略：全量/随机/重点/分层抽检',
          '一致性指标：标注员间一致性/与金标准一致性',
          '标注员培训：培训流程/考核标准/淘汰机制',
          '质量闭环：抽检→反馈→重标→再检的质量循环',
        ] },
        { name: '数据飞轮设计', points: [
          '用户反馈收集：显式/隐式反馈的设计和采集',
          '自动标注：利用模型辅助标注，降低人力成本',
          '主动学习：选择最有价值的样本优先标注',
          '闭环设计：标注→训练→评估→部署→反馈→标注',
        ] },
        { name: 'Bad Case管理', points: [
          'Bad Case分类：幻觉/偏题/安全/格式等类型',
          '归因分析：数据/模型/Prompt/系统的根因定位',
          '修复优先级：频率×严重度×修复成本排序',
          '回归验证：修复后的自动化回归测试机制',
        ] },
      ],
      keyQuestions: [
        '你的标注规范多长时间更新一次？谁负责维护？',
        '标注一致性Kappa系数是多少？低于0.7怎么办？',
        '数据飞轮转一圈需要多长时间？',
      ],
      mustRead: [
        { title: '《Data Quality for AI》', author: 'O\'Reilly', why: 'AI数据质量的系统化方法论，标注到评估的完整指南' },
      ],
      tools: ['Label Studio', 'Prodigy', 'Scale AI', 'Labelbox'],
      pitfalls: [
        '不要忽视标注规范——模糊规范导致的返工成本是规范设计的10倍',
        '不要只看标注数量——1000条高质量标注胜过10000条低质量标注',
        '不要跳过一致性检验——Kappa<0.7的标注数据不可信',
      ],
      caseStudies: [
        { title: '标注规范的力量', company: '某AI公司', lesson: '花2周写标注规范vs直接标注：规范组3周完成且质量高，无规范组5周还在返工' },
        { title: '数据飞轮实践', company: '某搜索引擎', lesson: '用户反馈→自动标注→模型优化→效果提升，4周一个完整飞轮周期' },
      ],
      interviewQs: [
        { question: '如何设计标注规范？', hint: '定义/示例/边界Case/常见错误四部分，持续迭代' },
        { question: '标注质量如何保证？', hint: '规范+培训+抽检+一致性检验的四层保障' },
      ],
      learningTips: [
        '为一个小任务设计标注规范，找2个人标注，计算一致性',
        '画一个数据飞轮图，标注每个环节的数据流和时间周期',
      ],
    },
    connections: ['data-metrics', 'ai-evaluation'],
  },
  {
    id: 'badcase-analysis',
    label: 'Bad Case 分析与迭代',
    shortLabel: 'Bad Case',
    icon: '🐛',
    x: 540, y: 620,
    region: 'data',
    color: '#5856d6',
    content: {
      summary: 'AI产品质量的守护体系：Bad Case的分类、归因、修复、回归验证闭环。这是AI PM日常最重要的工作之一。',
      topics: [
        { name: 'Bad Case分类体系', points: [
          '类型分类：幻觉/偏题/安全/格式/一致性/逻辑错误',
          '严重度分级：P0(必须修)/P1(应该修)/P2(可以修)/P3(观察)',
          '频率分类：偶发/规律/系统性，不同频率不同处理策略',
          '来源分类：用户反馈/自动检测/人工抽检/评测发现',
        ] },
        { name: 'Bad Case归因分析', points: [
          '根因分析：数据/模型/Prompt/系统四维归因',
          '归因树：5-Why深度追问找到根本原因',
          '量化归因：各类原因的占比和趋势分析',
          '系统性vs偶发：区分系统性问题和个别Case',
        ] },
        { name: 'Case驱动迭代流程', points: [
          '收集机制：用户反馈/自动检测/评测发现的Case收集',
          '优先级排序：频率×严重度×修复成本的ROI排序',
          '修复验证：修复后必须通过回归测试',
          '上线节奏：修复→回归→灰度→全量的发布流程',
        ] },
        { name: '回归测试与质量守护', points: [
          '回归测试集：核心场景+历史Bad Case的测试集维护',
          '自动化回归：每次变更自动跑回归测试',
          '质量门禁：上线前必须通过的评测指标门槛',
          '效果追踪：上线后的效果监控和异常告警',
        ] },
        { name: '效果追踪与数据看板', points: [
          '核心指标看板：准确率/Bad Case率/用户满意度',
          '趋势分析：按日/周/月的效果趋势和异常检测',
          '异常告警：效果下降超过阈值的自动告警',
          '效果归因：变化的原因分析和归因报告',
        ] },
      ],
      keyQuestions: [
        '你的产品Bad Case率是多少？P0级别的有多少？',
        '从发现Bad Case到修复上线需要多长时间？',
        '回归测试集有多少用例？覆盖率如何？',
      ],
      mustRead: [
        { title: '《ML Test Score》', author: 'Google', why: 'Google提出的ML系统测试评分体系，量化质量守护能力' },
      ],
      tools: ['LangSmith', 'Promptfoo', '自定义回归框架'],
      pitfalls: [
        '不要只修不防——没有回归测试的修复等于没修',
        '不要忽视偶发Case——今天偶发明天可能变系统性的',
        '不要只看数量不看严重度——1个P0比100个P3重要',
      ],
      caseStudies: [
        { title: 'Bad Case驱动迭代实践', company: '某AI公司', lesson: '建立Case→归因→修复→回归的48小时闭环，产品效果月均提升5%' },
        { title: '回归测试救了产品', company: '某搜索公司', lesson: 'Prompt变更后自动回归测试发现3个效果退化，避免了一次线上事故' },
      ],
      interviewQs: [
        { question: 'Bad Case的处理流程是什么？', hint: '收集→分类→归因→排序→修复→回归→上线，7步闭环' },
        { question: '如何判断一个Bad Case是系统性问题还是偶发问题？', hint: '频率/复现性/根因分析，偶发观察/系统性必修' },
      ],
      learningTips: [
        '收集10个Bad Case，按P0-P3分级，选最高优先级的做归因分析',
        '为你的产品设计一个回归测试集，至少覆盖10个核心场景',
      ],
    },
    connections: ['ai-evaluation', 'data-quality-annotation'],
  },
  {
    id: 'hitl-design',
    label: '人机协同设计',
    shortLabel: '人机协同',
    icon: '🤝',
    x: 720, y: 640,
    region: 'leadership',
    color: '#af52de',
    content: {
      summary: 'Human-in-the-Loop设计方法论：人机分工策略、人工审核流程、渐进式自动化、效率与质量平衡。',
      topics: [
        { name: '人机协同基本概念', points: [
          'HITL定义：人在AI决策链路中的介入方式和程度',
          '自动化程度选择：全自动/半自动/人工为主的策略选择',
          '人机分工原则：人擅长判断/创意/异常，机擅长速度/规模/一致',
          '成本效益分析：人工成本vs错误成本vs自动化成本的三方权衡',
        ] },
        { name: '人机分工策略', points: [
          '任务分类：人优/机优/协同三类任务的识别方法',
          '置信度阈值：模型输出置信度低于阈值时转人工',
          '动态调整：根据模型效果变化动态调整人机比例',
          '分级处理：简单自动/复杂人工/关键审批的三级策略',
        ] },
        { name: '人工审核流程设计', points: [
          '审核队列：优先级排序/批量处理/并行审核的队列设计',
          '审核界面：信息密度/操作效率/疲劳管理',
          '效率指标：审核速度/准确率/一致性的监控',
          '审核员管理：培训/考核/轮换/激励的团队管理',
        ] },
        { name: '渐进式自动化', points: [
          '阶段1：全人工，积累数据和规则',
          '阶段2：AI辅助，人工审批，提升效率',
          '阶段3：AI为主，人工抽检，降低成本',
          '阶段4：全自动+异常转人工，规模化',
        ] },
        { name: '人机协同实战案例', points: [
          '内容审核：AI预审+人工复审+用户举报三层体系',
          '智能客服：AI处理80%+人工20%复杂问题',
          'AI写作助手：AI生成+人工编辑+AI润色的协作模式',
          '数据分析：AI分析+人工解读+AI报告的协作流程',
        ] },
      ],
      keyQuestions: [
        '你的产品人机比例是多少？为什么这样设计？',
        'AI出错时人工接管的平均响应时间是多少？',
        '如何决定一个任务从人工转为自动化？',
      ],
      mustRead: [
        { title: '《Human-in-the-Loop Machine Learning》', author: 'Robert Monarch', why: 'HITL ML的实战指南，标注到部署的完整方法论' },
      ],
      tools: ['审核后台', '置信度监控', 'A/B测试平台'],
      pitfalls: [
        '不要追求100%自动化——有些场景人工比AI更高效更可靠',
        '不要忽视审核员体验——疲劳和低效是质量下降的主因',
        '不要固定人机比例——应该随模型效果提升动态调整',
      ],
      caseStudies: [
        { title: '渐进式自动化实践', company: '某内容平台', lesson: '3个月从全人工到70%自动化，审核效率提升5倍，错误率不变' },
        { title: '人机协同的平衡点', company: '某客服中心', lesson: 'AI处理80%+人工20%是最佳比例，再提升自动化率错误率急剧上升' },
      ],
      interviewQs: [
        { question: '如何设计人机协同方案？', hint: '任务分类→置信度阈值→审核流程→渐进式自动化四步走' },
        { question: '人工审核如何保证效率和质量？', hint: '审核界面优化/优先级排序/一致性检验/疲劳管理' },
      ],
      learningTips: [
        '画一个你熟悉产品的人机分工图，标注每个环节的自动化程度',
        '设计一个渐进式自动化方案：从全人工到70%自动化的3个月路线图',
      ],
    },
    connections: ['ai-workflow', 'conversational-ai'],
  },
  {
    id: 'content-compliance',
    label: '内容合规与审核',
    shortLabel: '合规审核',
    icon: '⚖️',
    x: 1060, y: 500,
    region: 'leadership',
    color: '#af52de',
    content: {
      summary: '中国AI内容合规体系：生成式AI管理办法、算法备案、内容审核策略、敏感词体系、合规评审流程。',
      topics: [
        { name: '中国AI合规框架', points: [
          '生成式AI管理办法：备案/标注/审核/安全评估要求',
          '算法推荐规定：算法备案/评估/透明度义务',
          '数据安全法：数据分类分级/出境安全评估',
          '个人信息保护法：用户知情权/删除权/数据最小化',
        ] },
        { name: '内容审核策略设计', points: [
          '多层审核：前置过滤/实时审核/后置复审/用户举报',
          '审核规则引擎：关键词/正则/语义匹配的多层规则',
          '灰度策略：新模型/新功能的内容审核灰度方案',
          '紧急响应：违规内容发现的应急处理流程',
        ] },
        { name: '敏感词体系构建', points: [
          '敏感词分类：政治/色情/暴力/歧视/广告/隐私',
          '词库管理：分级分类/动态更新/模糊匹配',
          '对抗检测：绕过审核的对抗样本检测',
          '多语言支持：不同语言的敏感词体系差异',
        ] },
        { name: '合规评审流程', points: [
          '评审节点：需求评审/设计评审/上线评审的合规检查',
          '评审清单：合规checklist的标准化和自动化',
          '风险分级：高/中/低风险的不同评审深度',
          '整改流程：合规问题的整改和复评机制',
        ] },
        { name: '合规实战案例', points: [
          '大模型备案：备案流程/材料准备/评审要点',
          '算法推荐合规：算法评估报告/透明度说明',
          '内容安全体系：从0到1搭建内容安全团队和流程',
          '跨境合规：数据出境/多国合规的实践经验',
        ] },
      ],
      keyQuestions: [
        '你的产品做过算法备案吗？流程是什么？',
        '内容审核的误杀率和漏杀率分别是多少？',
        '合规要求对产品功能有多大影响？如何平衡？',
      ],
      mustRead: [
        { title: '《生成式人工智能服务管理暂行办法》', author: '国家网信办', why: '中国AI合规的核心法规，必须逐条理解' },
      ],
      tools: ['内容审核API', '敏感词库', '合规Checklist'],
      pitfalls: [
        '不要等上线后才做合规——合规应该从产品设计阶段就介入',
        '不要只依赖AI审核——AI审核+人工复审的混合方案最可靠',
        '不要忽视合规变化——法规在持续更新，需要定期审查',
      ],
      caseStudies: [
        { title: '大模型备案全流程', company: '某AI公司', lesson: '从准备材料到通过备案用了4个月，关键是提前理解评审要点' },
        { title: '内容审核体系搭建', company: '某内容平台', lesson: '3层审核(关键词+AI+人工)+2周灰度，违规内容减少90%' },
      ],
      interviewQs: [
        { question: 'AI产品需要做哪些合规？', hint: '算法备案/内容审核/数据安全/个人信息保护四方面' },
        { question: '如何平衡合规要求和产品体验？', hint: '合规是底线不是天花板，创新在合规框架内寻找空间' },
      ],
      learningTips: [
        '阅读《生成式AI管理办法》原文，标注和你产品相关的条款',
        '为你的产品设计一个合规Checklist，包含上线前的所有合规检查项',
      ],
    },
    connections: ['ai-architecture', 'ai-leadership'],
  },
  {
    id: 'ai-growth',
    label: 'AI 产品运营与增长',
    shortLabel: '运营增长',
    icon: '🚀',
    x: 480, y: 280,
    region: 'product',
    color: '#34c759',
    content: {
      summary: 'AI产品的增长不是烧钱买量，而是靠数据飞轮和口碑传播。掌握AI产品特有的冷启动、留存、定价和增长策略。',
      topics: [
        { name: 'AI 产品冷启动策略', points: [
          '种子用户选择：谁是最早的AI产品受益者？如何识别和触达',
          '冷启动内容策略：预填充高质量内容/模板降低首次使用门槛',
          '免费增值模式：免费额度设计(按token/按次/按天)、付费转化节点',
          '场景化引导：首次使用时用真实场景演示价值而非功能罗列',
          '社区冷启动：从技术社区(知乎/GitHub/V2EX)获取早期用户',
        ] },
        { name: 'AI 产品留存与活跃', points: [
          '留存指标体系：次留/7留/30留 + AI特有指标(模型使用深度/功能采纳率)',
          '流失预警：使用频率下降→功能使用单一→停止使用的流失漏斗',
          '习惯养成设计：定期推送(Prompt模板/行业报告/能力更新)召回用户',
          '功能发现机制：新功能引导/使用场景推荐/高级用法提示',
          '社交化留存：分享Prompt/协作空间/团队workspace降低个人流失',
        ] },
        { name: 'AI 产品定价策略', points: [
          '定价模型对比：按token计费(OpenAI)/按次订阅(Copilot)/按席位(Enterprise)/混合模式',
          '价格弹性测试：不同价位下的转化率/使用量/流失率实验',
          '免费额度设计：够用但不够爽→付费解锁更多能力',
          '企业版差异化：SSO/审计日志/SLA/私有部署/定制模型',
          '成本结构分析：推理成本/存储成本/人工成本 → 定价底线',
        ] },
        { name: 'AI 产品增长实验', points: [
          '增长实验框架：假设→MVP实验→数据验证→规模化推广',
          'A/B测试在AI产品中的特殊性：模型版本切换的实验设计、网络效应控制的分流策略',
          '病毒系数优化：分享→注册→激活的转化漏斗优化',
          '增长黑客案例：Notion AI模板分享/ChatGPT插件生态/Claude Artifacts传播',
        ] },
        { name: 'AI 产品增长指标', points: [
          '北极星指标选择：DAU/MAU/付费用户/模型调用量/任务完成率',
          'AI特有增长指标：Prompt使用深度/功能覆盖度/模型效果满意度/人工接管率',
          '增长看板设计：核心指标+辅助指标+领先指标+滞后指标',
          '数据驱动的增长决策：从看数据到做决策的闭环',
        ] },
      ],
      keyQuestions: [
        '你的AI产品的北极星指标是什么？为什么选它？',
        '免费用户和付费用户的核心差异在哪里？如何设计转化路径？',
        'AI产品的增长飞轮是什么？用户增长如何反哺产品改进？',
      ],
      mustRead: [
        { title: '《增长黑客》', author: 'Sean Ellis', why: '增长实验方法论的经典，适用于AI产品的快速迭代' },
        { title: '《Hacking Growth》', author: 'Sean Ellis & Morgan Brown', why: '系统化的增长框架：从获客到留存到变现' },
      ],
      tools: ['Amplitude', 'Mixpanel', 'PostHog', 'Statsig', 'GrowthBook', 'Optimizely'],
      pitfalls: [
        '不要用烧钱补贴换增长——AI产品核心靠效果和口碑',
        '不要忽视模型成本——增长越快推理成本越高，需要定价和成本的平衡',
        '不要只看DAU——AI产品的价值在于使用深度而非使用频次',
      ],
      caseStudies: [
        { title: 'ChatGPT的爆发式增长', company: 'OpenAI', lesson: '产品即营销——真正好用的产品自带传播力，5天100万用户' },
        { title: 'Notion AI的功能化增长', company: 'Notion', lesson: '在已有产品中嵌入AI能力，降低新用户门槛，提升老用户价值' },
      ],
      interviewQs: [
        { question: '如何设计一个AI产品的冷启动策略？', hint: '从种子用户、免费额度、场景引导三个维度设计，关键是让用户快速感受到AI的价值' },
        { question: 'AI产品的留存和传统产品有什么不同？', hint: 'AI产品更依赖使用深度而非频次，模型效果持续提升是留存的关键驱动力' },
      ],
      learningTips: [
        '选一个你常用的AI产品，画出它的增长飞轮图',
        '对比3个AI产品的定价策略，分析各自的定价逻辑和目标用户',
      ],
    },
    connections: ['ai-commercialization', 'data-metrics', 'product-strategy'],
  },
  {
    id: 'ai-safety',
    label: 'AI 安全与对齐',
    shortLabel: '安全对齐',
    icon: '🛡️',
    x: 560, y: 360,
    region: 'ai',
    color: '#ff9500',
    content: {
      summary: 'AI安全不是可选项，是AI PM的必修课。从Prompt注入防御到模型对齐，从数据隐私到偏见公平，构建安全可信的AI产品。',
      topics: [
        { name: 'Prompt 注入与防御', points: [
          '直接注入：用户在输入中嵌入恶意指令覆盖系统提示',
          '间接注入：通过外部数据源(网页/文档/API)注入恶意内容',
          '防御策略：输入过滤/输出校验/权限隔离/系统提示加固',
          '红队测试：模拟攻击者的Prompt注入测试，评估防御效果',
          '案例：Bing Chat的Prompt泄露事件、GitHub Copilot的代码注入',
        ] },
        { name: '越狱攻击与防护', points: [
          '越狱类型：角色扮演/编码绕过/多轮诱导/多语言绕过',
          '越狱防御：系统提示强化/输出过滤器/内容安全API/拒绝策略',
          '对抗测试：自动化越狱测试框架(如Promptfoo的red-team功能)',
          '安全评估：定期评估模型的安全性指标和边界',
        ] },
        { name: '数据隐私与合规', points: [
          '训练数据隐私：模型记忆/数据泄露/成员推断攻击',
          '用户数据保护：输入内容的使用范围/存储策略/删除机制',
          '隐私增强技术：差分隐私/联邦学习/同态加密/安全多方计算',
          '合规要求：GDPR/CCPA/中国个人信息保护法对AI产品的要求',
          '数据跨境：AI服务涉及的数据出境评估和合规',
        ] },
        { name: '模型偏见与公平性', points: [
          '偏见来源：训练数据偏差/标注者偏见/模型放大效应',
          '偏见类型：性别/种族/年龄/地域/社会经济地位',
          '偏见检测：公平性指标(等机会/人口平价/预测平价)',
          '偏见缓解：数据重采样/对抗训练/后处理校准/RLHF对齐',
          '公平性权衡：不同公平性指标之间的冲突和取舍',
        ] },
        { name: '模型对齐技术', points: [
          'RLHF：人类反馈强化学习——标注偏好→训练奖励模型→PPO优化',
          'Constitutional AI：用AI原则自我评判和修正',
          'DPO：直接偏好优化——跳过奖励模型的简化对齐方法',
          '对齐的挑战：过度对齐(过度拒绝)/对齐税(能力损失)/价值观冲突',
          '可扩展监督：用AI辅助人类评估AI输出(即AI辅助标注)',
        ] },
        { name: 'AI 安全工程实践', points: [
          '安全开发生命周期：需求阶段的安全评估→设计阶段的威胁建模→测试阶段的安全测试',
          '内容安全策略：输入过滤→模型层安全→输出审核的三层防御',
          '应急响应：AI安全事故的分类分级和应急处理流程',
          '安全监控：实时监控异常输出/滥用模式/安全指标',
        ] },
      ],
      keyQuestions: [
        '你的AI产品最可能被如何攻击？防御措施是什么？',
        '如何平衡AI的安全性和有用性？过度安全会带来什么问题？',
        '模型对齐在你的产品中意味着什么？如何衡量对齐效果？',
      ],
      mustRead: [
        { title: 'OWASP Top 10 for LLM Applications', author: 'OWASP', why: 'AI应用安全风险的标准清单，PM必须了解' },
        { title: 'Anthropic: Core Views on AI Safety', author: 'Anthropic', why: 'AI安全公司如何看待安全对齐，理解行业前沿思考' },
      ],
      tools: ['Promptfoo', 'LangKit', 'Fiddler AI', 'Arthur AI', 'CaliberAI', 'Content Safety API'],
      pitfalls: [
        '不要以为部署了内容审核就安全了——Prompt注入可以绕过审核',
        '不要忽视间接注入——通过RAG检索的文档可能包含恶意指令',
        '不要过度对齐——过度拒绝合法请求会严重影响用户体验',
      ],
      caseStudies: [
        { title: 'ChatGPT数据泄露事件', company: 'OpenAI', lesson: 'Redis bug导致用户看到他人对话，暴露了AI服务的数据隔离风险' },
        { title: 'Bing Chat越狱事件', company: 'Microsoft', lesson: '长对话诱导模型暴露系统提示，说明多轮对话安全的重要性' },
      ],
      interviewQs: [
        { question: '如何防御Prompt注入攻击？', hint: '分层防御：输入过滤+权限隔离+输出校验，没有银弹需要纵深防御' },
        { question: 'AI产品的公平性如何衡量和保障？', hint: '先定义公平性指标，再设计检测流程，最后建立持续监控机制' },
      ],
      learningTips: [
        '用Promptfoo对你的AI产品做一次Prompt注入红队测试',
        '阅读OWASP LLM Top 10，为你的产品做一次威胁建模',
      ],
    },
    connections: ['ai-fundamentals', 'content-compliance', 'ai-architecture'],
  },
  {
    id: 'data-flywheel',
    label: 'AI 产品数据飞轮',
    shortLabel: '数据飞轮',
    icon: '🔄',
    x: 400, y: 560,
    region: 'data',
    color: '#5856d6',
    content: {
      summary: '数据是AI产品的燃料，飞轮是AI产品的引擎。学会设计从用户反馈到模型改进的闭环，让数据驱动产品越用越好。',
      topics: [
        { name: '数据飞轮原理', points: [
          '飞轮效应：更多用户→更多数据→更好模型→更好体验→更多用户',
          '飞轮启动：冷启动阶段如何获取第一批高质量数据',
          '飞轮加速：数据质量提升→模型效果提升→用户满意度提升的正反馈',
          '飞轮阻力：数据噪声/标注成本/模型退化/用户流失的负反馈',
          '飞轮护城河：数据飞轮带来的竞争壁垒——后来者难以复制',
        ] },
        { name: '用户反馈采集体系', points: [
          '显式反馈：点赞/点踩/评分/纠错/举报的采集设计',
          '隐式反馈：停留时长/重新生成/编辑修改/复制/分享的行为埋点',
          '反馈质量：如何过滤噪声反馈、识别高质量反馈、激励用户反馈',
          '反馈闭环：从采集→标注→训练→上线→验证的完整链路',
          'A/B测试中的反馈设计：避免反馈偏差影响实验结论',
        ] },
        { name: '主动学习与数据选择', points: [
          '主动学习：模型主动选择最有价值的样本请求人工标注',
          '不确定性采样：选择模型最不确定的样本优先标注',
          '多样性采样：确保标注数据覆盖各种场景和边界情况',
          '委员会查询：多个模型不一致的样本优先标注',
          '成本效率：有限标注预算下的最优数据获取策略',
        ] },
        { name: '人机协同标注', points: [
          '标注流程设计：预标注(AI)→人工审核→质量抽检→迭代优化',
          '标注质量控制：一致性检验/金标数据/标注者能力评估',
          '标注工具链：Label Studio/Prodigy/Labelbox/AWS SageMaker Ground Truth',
          '标注效率提升：AI辅助标注/主动学习/弱监督学习',
          '标注团队管理：标注规范/培训体系/绩效评估',
        ] },
        { name: '数据驱动的模型迭代', points: [
          '迭代节奏：数据收集→标注→训练→评估→灰度→全量的周期管理',
          '效果回归测试：新模型是否在旧场景上退化(A/B + 回归测试集)',
          '数据版本管理：训练数据版本化+模型版本化+效果版本化',
          '在线学习：实时用户反馈如何快速融入模型更新',
          '灾难性遗忘：新数据训练导致旧能力退化的检测和预防',
        ] },
      ],
      keyQuestions: [
        '你的AI产品的数据飞轮是什么？转起来了吗？',
        '用户反馈如何转化为模型改进？中间有哪些环节？',
        '如何衡量数据质量对模型效果的影响？',
      ],
      mustRead: [
        { title: 'Data Flywheel: The Secret Behind Great AI Products', author: 'a16z', why: '理解AI产品数据飞轮的核心文章' },
        { title: '《Building Machine Learning Powered Applications》', author: 'Emmanuel Ameisen', why: '从数据到产品的完整闭环实践' },
      ],
      tools: ['Label Studio', 'Prodigy', 'Labelbox', 'Snorkel', 'Weights & Biases', 'MLflow', 'DVC'],
      pitfalls: [
        '不要忽视反馈噪声——用户反馈不等于标注数据，需要清洗和验证',
        '不要只追求数据量——数据质量比数量更重要，脏数据会让模型退化',
        '不要忘记回归测试——新模型可能在旧场景上退化',
      ],
      caseStudies: [
        { title: 'Tesla自动驾驶数据飞轮', company: 'Tesla', lesson: '百万车队持续采集edge case数据→标注→训练→OTA更新，飞轮越转越快' },
        { title: 'Midjourney的偏好学习', company: 'Midjourney', lesson: '用户选择/放大/下载行为作为隐式反馈，持续优化生成效果' },
      ],
      interviewQs: [
        { question: '如何设计一个AI产品的数据飞轮？', hint: '从用户反馈采集→数据标注→模型训练→效果验证→产品上线的完整闭环设计' },
        { question: '数据质量和数据量哪个更重要？为什么？', hint: '在飞轮初期质量优先，成熟后量和质并重，关键是建立质量保障机制' },
      ],
      learningTips: [
        '画一个你熟悉的AI产品的数据飞轮图，标注每个环节的数据流向',
        '设计一个用户反馈采集方案：显式+隐式反馈各3种，并评估采集成本',
      ],
    },
    connections: ['data-quality-annotation', 'badcase-analysis', 'ai-evaluation'],
  },
  {
    id: 'ai-frontier',
    label: 'AI 前沿技术跟踪',
    shortLabel: '前沿技术',
    icon: '🔭',
    x: 1000, y: 160,
    region: 'ai',
    color: '#ff9500',
    content: {
      summary: 'AI领域日新月异，保持技术敏感度是AI PM的核心竞争力。学会高效跟踪前沿、判断技术成熟度、识别产品化机会。',
      topics: [
        { name: 'Agent 开发框架', points: [
          'AutoGen(Microsoft)：多Agent对话框架，支持人类参与的Agent协作循环',
          'CrewAI：角色驱动的多Agent框架，定义Agent角色+目标+工具即可编排协作',
          'LangGraph：状态图驱动的Agent编排，适合复杂工作流和条件路由',
          'OpenAI Agents SDK：官方Agent框架，内置工具调用/护栏/追踪',
          '框架选型：简单任务用LangChain/复杂编排用LangGraph/多Agent协作用CrewAI或AutoGen',
        ] },
        { name: 'MCP 生态与开放协议', points: [
          'MCP(Model Context Protocol)：Anthropic提出的AI工具调用开放协议',
          'MCP架构：Host(Claude Desktop等)→Client(协议适配)→Server(工具实现)',
          'MCP Server开发：定义工具/资源/提示词，stdio或SSE通信',
          'MCP生态：官方/社区MCP Server目录，覆盖数据库/API/文件系统等',
          '开放协议趋势：MCP→统一工具调用标准，类似USB-C对AI的意义',
        ] },
        { name: 'AI 工程化前沿', points: [
          'Skills与工具链：Tool(原子能力)→MCP(通信协议)→Skill(业务流程)三层架构',
          'Harness(测试框架)：Promptfoo/LangSmith/Braintrust评估和回归测试',
          'Open Design：开放API/插件生态/社区驱动的AI产品设计范式',
          'AI应用架构演进：单模型调用→RAG→Agent→多Agent→Agent集群',
        ] },
        { name: '前沿跟踪方法论', points: [
          '每日信息源：GitHub Trending/Hugging Face Daily/arXiv/Twitter AI圈/技术播客',
          '高效阅读策略：标题速筛→摘要判断→精读关键论文/博文',
          '技术成熟度判断：Gartner曲线位置/开源Star增长/大厂投入力度/实际落地案例',
          '技术→产品转化评估：技术可行性×市场需求×竞争格局的三维评估',
          '信息管理：用Notion/Obsidian构建个人AI技术知识库，定期整理和回顾',
        ] },
        { name: '多模态与新兴方向', points: [
          '多模态产品化：GPT-4V/Gemini/Claude的视觉能力在产品中的应用',
          '语音交互：Voice Mode/实时语音的产品场景和用户体验设计',
          'AI生成视频：Sora/Kling/Runway的产品化机会和版权挑战',
          '端侧AI：Apple Intelligence/高通AI引擎的产品化路径',
          'AI Agent自主性：从Copilot→Agent→ Autonomous的产品化边界',
        ] },
      ],
      keyQuestions: [
        '你如何保持对AI前沿的敏感度？信息源有哪些？',
        '一项新的AI技术从论文到产品化，通常需要多久？如何判断时机？',
        'MCP/Skills这类开放协议对AI产品生态意味着什么？',
      ],
      mustRead: [
        { title: 'State of AI Report', author: 'Nathan Benaich', why: '年度AI行业全景报告，了解技术趋势和投资方向' },
        { title: 'The Architecture of Open Source Applications', author: 'AI章节', why: '理解主流AI开源项目的架构设计' },
      ],
      tools: ['GitHub Trending', 'Hugging Face', 'arXiv', 'Papers With Code', 'Twitter/X AI List', 'AI Newsletters', 'Obsidian/Notion'],
      pitfalls: [
        '不要追每个热点——判断哪些技术会沉淀为基础设施，哪些只是泡沫',
        '不要只看论文不看落地——从论文到产品有很大距离，关注实际应用案例',
        '不要忽视工程化——前沿技术的产品化瓶颈往往在工程而非算法',
      ],
      caseStudies: [
        { title: 'MCP从发布到生态', company: 'Anthropic', lesson: '开放协议快速吸引开发者生态，3个月内数百个MCP Server上线' },
        { title: 'LangChain的快速崛起', company: 'LangChain', lesson: '开发者工具的PMF——解决AI开发痛点，快速获得社区认可' },
      ],
      interviewQs: [
        { question: '你最近关注的AI技术趋势是什么？如何判断它的产品化机会？', hint: '从技术成熟度、市场需求、竞争格局三个维度分析，给出具体判断依据' },
        { question: 'AutoGen、CrewAI、LangGraph各自的适用场景是什么？', hint: '从任务复杂度、协作模式、可控性三个维度对比选型' },
      ],
      learningTips: [
        '订阅3个AI技术Newsletter，坚持每天花15分钟快速扫描',
        '用CrewAI或AutoGen搭建一个简单的多Agent协作demo，体验框架差异',
      ],
    },
    connections: ['ai-fundamentals', 'ai-agent-design', 'ai-workflow', 'cn-llm-ecosystem'],
  },
  {
    id: 'job-practice',
    label: 'AI PM 求职实战',
    shortLabel: '求职实战',
    icon: '🎯',
    x: 1060, y: 640,
    region: 'leadership',
    color: '#af52de',
    content: {
      summary: '从理论到实战：作品集搭建、面试项目展示、AI PM岗位趋势解读。让求职准备从"刷题"升级为"作品驱动"。',
      topics: [
        { name: 'AI PM 作品集搭建', points: [
          '作品集结构：项目背景→问题定义→方案设计→数据验证→效果复盘',
          'AI产品Demo：用Dify/Coze/Streamlit快速搭建可交互的产品原型',
          '案例文档化：将实习/项目经验转化为结构化的产品案例(Problem→Solution→Impact)',
          '技术博客：在Medium/知乎/掘金输出AI PM方法论，建立专业影响力',
          'GitHub项目：开源AI工具/数据集/教程，展示技术理解和工程能力',
        ] },
        { name: '面试项目展示', points: [
          'STAR法则升级：Situation→Task→Action→Result + 数据量化',
          'AI项目叙事：从技术选型→方案设计→效果评估→迭代优化的完整故事线',
          '失败项目价值：如何从失败项目中提取有价值的经验教训',
          '现场白板：30分钟内完成一个AI产品方案的从0到1设计',
          '数据驱动叙事：用数据证明你的产品决策，而非主观判断',
        ] },
        { name: 'AI PM 岗位趋势', points: [
          '岗位分类：AI产品经理/大模型产品经理/AI商业化PM/Agent产品经理',
          '行业分布：互联网大厂/AI创业公司/传统企业AI转型/海外AI公司',
          '能力要求变化：从"懂AI"到"能落地"，从"写PRD"到"懂技术栈"',
          '薪资趋势：AI PM薪资溢价和职级对标',
          '远程机会：海外AI公司的远程AI PM岗位',
        ] },
        { name: '求职策略与渠道', points: [
          '简历优化：AI PM简历的关键词/项目描述/量化指标的优化策略',
          '内推网络：如何通过社区/活动/内容建立AI PM内推网络',
          '面试准备清单：技术理解/产品思维/数据能力/领导力四维准备',
          'Offer评估：薪资/成长/团队/方向的四维评估框架',
          '入职前准备：90天计划——前30天学习→中间30天贡献→后30天引领',
        ] },
        { name: 'AI PM 职业发展', points: [
          '职业路径：PM→Senior PM→Lead PM→Director→VP→CPO',
          'AI PM vs 传统PM：能力差异、转型路径、薪资对比',
          '技术深度选择：T型人才(广度+一个深度方向)vs π型人才(两个深度方向)',
          '持续学习：AI领域变化快，如何保持竞争力——社区/论文/实践',
          '个人品牌：技术博客/演讲/开源/社区运营的职业加速器',
        ] },
      ],
      keyQuestions: [
        '你的AI PM作品集里最亮眼的项目是什么？能3分钟讲清楚吗？',
        '你如何证明自己不是一个只会写PRD的传统PM？',
        'AI PM岗位在3年后会变成什么样？你现在在为那个未来做准备吗？',
      ],
      mustRead: [
        { title: 'AI PM求职指南', author: '知乎AI PM专栏', why: '国内AI PM求职的实战经验合集' },
        { title: 'Cracking the PM Interview', author: 'Gayle McDowell', why: 'PM面试方法论的经典，AI PM同样适用' },
      ],
      tools: ['Dify', 'Coze', 'Streamlit', 'Gradio', 'Notion', 'GitHub Pages', 'Framer'],
      pitfalls: [
        '不要只刷面试题——作品集和项目经验比题海更有效',
        '不要忽视软技能——AI PM的核心能力是沟通和协调，不是纯技术',
        '不要盲目追热点——选择与自身背景匹配的AI PM方向',
      ],
      caseStudies: [
        { title: '从传统PM转型AI PM', company: '某互联网大厂', lesson: '6个月自学AI基础+做2个AI项目Demo+输出10篇技术博客，成功拿到AI PM Offer' },
        { title: '用作品集拿到创业公司Offer', company: 'AI创业公司', lesson: '3个可交互的AI产品Demo比任何简历都有效，展示理解力和执行力' },
      ],
      interviewQs: [
        { question: '你做过最有挑战的AI产品决策是什么？', hint: '用STAR法则讲述，重点在决策逻辑和数据依据，而非技术细节' },
        { question: '你如何保持对AI领域的学习和敏感度？', hint: '展示具体的学习方法、信息源、实践项目，而非空谈热爱' },
      ],
      learningTips: [
        '花一周时间搭建一个AI产品Demo，作为作品集的第一个项目',
        '写一篇AI产品分析文章发布到知乎或Medium，练习结构化表达',
      ],
    },
    connections: ['job-preparation', 'ai-leadership', 'product-strategy'],
  },
];

const LEARNING_PATHS = [
  {
    id: 'product-first',
    name: '产品优先',
    color: '#34c759',
    nodes: ['learning-resources', 'pm-capability', 'pm-thinking', 'user-research', 'product-design', 'ai-requirement-spec', 'ai-commercialization', 'ai-growth', 'data-metrics', 'ai-evaluation', 'badcase-analysis', 'product-strategy', 'hitl-design', 'content-compliance', 'ai-leadership', 'job-preparation'],
  },
  {
    id: 'ai-first',
    name: 'AI 技术优先',
    color: '#ff9500',
    nodes: ['learning-resources', 'ai-fundamentals', 'ai-frontier', 'ai-agent-design', 'prompt-engineering', 'rag-architecture', 'ai-workflow', 'ai-evaluation', 'ai-architecture', 'ai-safety', 'cn-llm-ecosystem', 'ai-vendor-evaluation', 'product-design', 'ai-leadership', 'job-preparation'],
  },
  {
    id: 'balanced',
    name: '均衡发展',
    color: '#af52de',
    nodes: ['learning-resources', 'pm-capability', 'pm-thinking', 'user-research', 'product-design', 'ai-requirement-spec', 'ai-fundamentals', 'ai-frontier', 'ai-agent-design', 'prompt-engineering', 'rag-architecture', 'ai-commercialization', 'ai-growth', 'data-metrics', 'data-quality-annotation', 'data-flywheel', 'ai-workflow', 'ai-evaluation', 'badcase-analysis', 'ai-architecture', 'ai-safety', 'cn-llm-ecosystem', 'ai-vendor-evaluation', 'product-strategy', 'hitl-design', 'content-compliance', 'ai-leadership', 'job-practice', 'job-preparation'],
  },
];

// ─── Component ──────────────────────────────────────────────────────

export default function LearningMapPage() {
  // Merge extra data into nodes
  const ENRICHED_NODES = NODES.map((n) => ({
    ...n,
    content: {
      ...n.content,
      topics: [...n.content.topics, ...(EXTRA_TOPICS[n.id] || [])],
      caseStudies: [...n.content.caseStudies, ...(EXTRA_CASES[n.id] || [])],
      mustRead: [...n.content.mustRead, ...(EXTRA_MUSTREAD[n.id] || [])],
      interviewQs: [...n.content.interviewQs, ...(EXTRA_INTERVIEWQS[n.id] || [])],
      pitfalls: [...n.content.pitfalls, ...(EXTRA_PITFALLS[n.id] || [])],
      keyQuestions: [...n.content.keyQuestions, ...(EXTRA_KEYQUESTIONS[n.id] || [])],
      learningTips: [...n.content.learningTips, ...(EXTRA_LEARNINGTIPS[n.id] || [])],
    },
  }));

  const [selectedNode, setSelectedNode] = useState<string | null>(null);
  const [hoveredNode, setHoveredNode] = useState<string | null>(null);
  const [activePath, setActivePath] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'topics' | 'resources' | 'pitfalls'>('topics');
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [hasMoved, setHasMoved] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [dragTarget, setDragTarget] = useState<'map' | string>('map');
  const [lastMouse, setLastMouse] = useState({ x: 0, y: 0 });

  // Node positions as state so they can be dragged
  const [nodePositions, setNodePositions] = useState<Record<string, { x: number; y: number }>>(() => {
    const pos: Record<string, { x: number; y: number }> = {};
    NODES.forEach((n) => { pos[n.id] = { x: n.x, y: n.y }; });
    return pos;
  });

  const containerRef = useRef<HTMLDivElement>(null);

  const node = NODES.find((n) => n.id === selectedNode);

  const isNodeInPath = useCallback(
    (nodeId: string) => {
      if (!activePath) return true;
      const path = LEARNING_PATHS.find((p) => p.id === activePath);
      return path?.nodes.includes(nodeId) ?? false;
    },
    [activePath],
  );

  const isConnectionInPath = useCallback(
    (fromId: string, toId: string) => {
      if (!activePath) return true;
      const path = LEARNING_PATHS.find((p) => p.id === activePath);
      if (!path) return true;
      const fi = path.nodes.indexOf(fromId);
      const ti = path.nodes.indexOf(toId);
      return fi !== -1 && ti !== -1 && Math.abs(fi - ti) === 1;
    },
    [activePath],
  );

  // Use native event listener for wheel (React's is passive and can't preventDefault)
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const handler = (e: WheelEvent) => {
      e.preventDefault();
      const delta = e.deltaY > 0 ? 0.92 : 1.08;
      setZoom((z) => Math.min(Math.max(z * delta, 0.4), 2.5));
    };
    el.addEventListener('wheel', handler, { passive: false });
    return () => el.removeEventListener('wheel', handler);
  }, []);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (e.button !== 0) return;
    setIsDragging(true);
    setHasMoved(false);
    setDragTarget('map');
    setDragStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
    setLastMouse({ x: e.clientX, y: e.clientY });
  }, [pan]);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!isDragging) return;
    const dx = e.clientX - lastMouse.x;
    const dy = e.clientY - lastMouse.y;
    if (Math.abs(dx) > 1 || Math.abs(dy) > 1) {
      setHasMoved(true);
    }
    if (dragTarget === 'map') {
      setPan({ x: e.clientX - dragStart.x, y: e.clientY - dragStart.y });
    } else {
      // Dragging a node — use incremental movement
      const nodeId = dragTarget;
      setNodePositions((prev) => {
        const node = NODES.find((n) => n.id === nodeId);
        if (!node) return prev;
        const curPos = prev[nodeId] || { x: node.x, y: node.y };
        return {
          ...prev,
          [nodeId]: {
            x: curPos.x + dx / zoom,
            y: curPos.y + dy / zoom,
          },
        };
      });
    }
    setLastMouse({ x: e.clientX, y: e.clientY });
  }, [isDragging, dragStart, dragTarget, lastMouse, zoom]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
    setDragTarget('map');
    setTimeout(() => setHasMoved(false), 10);
  }, []);

  // Start dragging a node
  const handleNodeDragStart = useCallback((e: React.MouseEvent, nodeId: string) => {
    e.stopPropagation();
    if (e.button !== 0) return;
    setIsDragging(true);
    setHasMoved(false);
    setDragTarget(nodeId);
    setLastMouse({ x: e.clientX, y: e.clientY });
  }, []);

  const SVG_BASE_W = 1100;
  const SVG_BASE_H = 700;

  // Dynamic SVG size based on node positions
  const svgW = Math.max(SVG_BASE_W, ...Object.values(nodePositions).map((p) => p.x + 100));
  const svgH = Math.max(SVG_BASE_H, ...Object.values(nodePositions).map((p) => p.y + 100));

  // Reset node positions to original
  const resetLayout = useCallback(() => {
    const pos: Record<string, { x: number; y: number }> = {};
    NODES.forEach((n) => { pos[n.id] = { x: n.x, y: n.y }; });
    setNodePositions(pos);
  }, []);

  return (
    <div className="flex h-full flex-col bg-background">
      {/* Top bar */}
      <div className="flex items-center justify-between border-b border-border bg-card/80 px-4 py-2.5 backdrop-blur-sm">
        <div className="flex items-center gap-3">
          <h1 className="text-sm font-bold text-foreground">AI PM 学习地图</h1>
          <span className="text-[10px] text-muted-foreground">14 个知识领域 · 拖拽平移 · 滚轮缩放 · 点击节点查看详情</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setActivePath(null)}
              className={`rounded-full px-3 py-1 text-[10px] font-semibold transition-all ${
                !activePath ? 'bg-foreground/10 text-foreground' : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              全部
            </button>
            {LEARNING_PATHS.map((p) => (
              <button
                key={p.id}
                onClick={() => setActivePath(activePath === p.id ? null : p.id)}
                className={`flex items-center gap-1 rounded-full px-3 py-1 text-[10px] font-semibold transition-all ${
                  activePath === p.id ? 'shadow-sm' : ''
                }`}
                style={{
                  backgroundColor: activePath === p.id ? p.color + '15' : 'transparent',
                  color: activePath === p.id ? p.color : 'var(--muted-foreground)',
                  border: activePath === p.id ? `1px solid ${p.color}40` : '1px solid transparent',
                }}
              >
                <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: p.color }} />
                {p.name}
              </button>
            ))}
          </div>
          <div className="h-4 w-px bg-border" />
          <button onClick={() => setZoom((z) => Math.min(z * 1.2, 2.5))} className="rounded p-1 text-muted-foreground hover:bg-secondary hover:text-foreground">+</button>
          <span className="w-10 text-center text-[10px] text-muted-foreground">{Math.round(zoom * 100)}%</span>
          <button onClick={() => setZoom((z) => Math.max(z * 0.8, 0.4))} className="rounded p-1 text-muted-foreground hover:bg-secondary hover:text-foreground">−</button>
          <button onClick={() => { setZoom(1); setPan({ x: 0, y: 0 }); }} className="rounded px-2 py-1 text-[10px] text-muted-foreground hover:bg-secondary hover:text-foreground">重置视图</button>
          <button onClick={resetLayout} className="rounded px-2 py-1 text-[10px] text-muted-foreground hover:bg-secondary hover:text-foreground">重置布局</button>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Map canvas */}
        <div
          ref={containerRef}
          className="flex-1 overflow-hidden"
          style={{ cursor: isDragging ? 'grabbing' : 'grab' }}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
        >
          <div
            style={{
              transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
              transformOrigin: '0 0',
              transition: isDragging ? 'none' : 'transform 0.1s ease-out',
            }}
          >
            <svg
              width={svgW}
              height={svgH}
              viewBox={`0 0 ${svgW} ${svgH}`}
              className="block"
            >
            <g>
              <defs>
                <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
                  <path d="M 40 0 L 0 0 0 40" fill="none" stroke="currentColor" strokeWidth="0.3" opacity="0.06" />
                </pattern>
                <filter id="glow">
                  <feGaussianBlur stdDeviation="6" result="coloredBlur" />
                  <feMerge><feMergeNode in="coloredBlur" /><feMergeNode in="SourceGraphic" /></feMerge>
                </filter>
              </defs>
              <rect width={svgW} height={svgH} fill="var(--background)" />
              <rect width={svgW} height={svgH} fill="url(#grid)" />

              {/* Region labels */}
              {REGIONS.map((r) => {
                const regionNodes = NODES.filter((n) => n.region === r.id);
                const cx = regionNodes.reduce((s, n) => s + (nodePositions[n.id]?.x || n.x), 0) / regionNodes.length;
                const cy = regionNodes.reduce((s, n) => s + (nodePositions[n.id]?.y || n.y), 0) / regionNodes.length;
                return (
                  <text key={r.id} x={cx} y={cy - 70} textAnchor="middle" fontSize={16} fontWeight={800} fill={r.color} opacity={0.07}>
                    {r.name}
                  </text>
                );
              })}

              {/* Connections */}
              {NODES.flatMap((n) =>
                n.connections.map((targetId) => {
                  const target = NODES.find((t) => t.id === targetId);
                  if (!target) return null;
                  const fromPos = nodePositions[n.id] || { x: n.x, y: n.y };
                  const toPos = nodePositions[targetId] || { x: target.x, y: target.y };
                  const inPath = isConnectionInPath(n.id, targetId);
                  const bothInPath = isNodeInPath(n.id) && isNodeInPath(targetId);
                  const dx = toPos.x - fromPos.x;
                  const dy = toPos.y - fromPos.y;
                  const d = `M ${fromPos.x} ${fromPos.y} C ${fromPos.x + dx * 0.4} ${fromPos.y}, ${toPos.x - dx * 0.4} ${toPos.y}, ${toPos.x} ${toPos.y}`;
                  return (
                    <g key={`${n.id}-${targetId}`}>
                      <path d={d} fill="none" stroke={n.color} strokeWidth={2.5} strokeLinecap="round" opacity={inPath && bothInPath ? 0.2 : 0.05} />
                      {activePath && inPath && bothInPath && (
                        <path d={d} fill="none" stroke={n.color} strokeWidth={2} strokeLinecap="round" strokeDasharray="6 8" opacity={0.5}>
                          <animate attributeName="stroke-dashoffset" from="0" to="-28" dur="2s" repeatCount="indefinite" />
                        </path>
                      )}
                    </g>
                  );
                })
              )}

              {/* Nodes */}
              {NODES.map((n) => {
                const pos = nodePositions[n.id] || { x: n.x, y: n.y };
                const inPath = isNodeInPath(n.id);
                const isSelected = selectedNode === n.id;
                const isHovered = hoveredNode === n.id;
                return (
                  <g
                    key={n.id}
                    style={{ cursor: 'pointer', transition: 'opacity 0.3s' }}
                    opacity={inPath ? 1 : 0.12}
                    onClick={() => { if (hasMoved) return; setSelectedNode(isSelected ? null : n.id); setActiveTab('topics'); }}
                    onMouseDown={(e) => handleNodeDragStart(e, n.id)}
                    onMouseEnter={() => setHoveredNode(n.id)}
                    onMouseLeave={() => setHoveredNode(null)}
                  >
                    {(isSelected || isHovered) && <circle cx={pos.x} cy={pos.y} r={42} fill={n.color} opacity={0.08} filter="url(#glow)" />}
                    <circle cx={pos.x} cy={pos.y} r={32} fill="var(--card)" stroke={n.color} strokeWidth={isSelected ? 3 : 2} />
                    <circle cx={pos.x} cy={pos.y} r={24} fill={isSelected ? n.color : n.color + '15'} style={{ transition: 'fill 0.2s' }} />
                    <text x={pos.x} y={pos.y + 1} textAnchor="middle" dominantBaseline="central" fontSize={18}>{n.icon}</text>
                    <text x={pos.x} y={pos.y + 46} textAnchor="middle" fontSize={11} fontWeight={700} fill="var(--foreground)">{n.shortLabel}</text>
                    <g transform={`translate(${pos.x + 22}, ${pos.y - 22})`}>
                      <rect x={-14} y={-9} width={28} height={18} rx={9} fill={n.color} opacity={0.9} />
                      <text textAnchor="middle" dominantBaseline="central" fontSize={8} fontWeight={700} fill="#fff">{n.content.topics.length}</text>
                    </g>
                    {isHovered && !isSelected && (
                      <g>
                        <rect x={pos.x - 90} y={pos.y - 68} width={180} height={26} rx={6} fill="var(--card)" stroke="var(--border)" strokeWidth={1} />
                        <text x={pos.x} y={pos.y - 55} textAnchor="middle" fontSize={9} fill="var(--muted-foreground)">{n.content.summary.slice(0, 22)}...</text>
                      </g>
                    )}
                  </g>
                );
              })}
            </g>
            </svg>
          </div>
        </div>

        {/* Detail panel */}
        <AnimatePresence mode="wait">
          {node && (
            <motion.div
              key={node.id}
              initial={{ opacity: 0, x: 40 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 40 }}
              transition={{ duration: 0.2 }}
              className="w-[440px] shrink-0 overflow-y-auto border-l border-border bg-card"
            >
              {/* Header */}
              <div className="sticky top-0 z-10 border-b border-border bg-card px-5 py-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl text-xl" style={{ backgroundColor: node.color + '15' }}>{node.icon}</div>
                    <div>
                      <h2 className="text-base font-bold text-foreground">{node.label}</h2>
                      <p className="text-xs text-muted-foreground">{node.content.topics.length} 个主题 · {node.content.mustRead.length} 本必读 · {node.content.caseStudies.length} 个案例</p>
                    </div>
                  </div>
                  <button onClick={() => setSelectedNode(null)} className="rounded-lg p-1.5 text-muted-foreground hover:bg-secondary hover:text-foreground">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6L6 18M6 6l12 12" /></svg>
                  </button>
                </div>
                <p className="mt-2 text-xs leading-relaxed text-muted-foreground">{node.content.summary}</p>
                <div className="mt-3 flex gap-1">
                  {([
                    { key: 'topics' as const, label: '知识详解' },
                    { key: 'resources' as const, label: '必读资源' },
                    { key: 'pitfalls' as const, label: '避坑指南' },
                  ]).map((tab) => (
                    <button
                      key={tab.key}
                      onClick={() => setActiveTab(tab.key)}
                      className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors ${
                        activeTab === tab.key ? 'bg-foreground/10 text-foreground' : 'text-muted-foreground hover:text-foreground'
                      }`}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Content */}
              <div className="p-5">
                <AnimatePresence mode="wait">
                  {activeTab === 'topics' && (
                    <motion.div key="topics" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-5">
                      {node.content.topics.map((topic, i) => (
                        <div key={i}>
                          <div className="mb-2 flex items-center gap-2">
                            <span className="flex h-5 w-5 items-center justify-center rounded text-[10px] font-bold" style={{ backgroundColor: node.color + '15', color: node.color }}>{i + 1}</span>
                            <h3 className="text-sm font-bold text-foreground">{topic.name}</h3>
                          </div>
                          <div className="ml-7 space-y-1.5">
                            {topic.points.map((point, j) => (
                              <div key={j} className="flex items-start gap-2">
                                <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full" style={{ backgroundColor: node.color, opacity: 0.5 }} />
                                <p className="text-xs leading-relaxed text-muted-foreground">{point}</p>
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}

                      {/* Key questions */}
                      <div className="rounded-xl border border-dashed border-border p-4">
                        <h4 className="mb-2 text-xs font-bold text-foreground">🎯 核心问题</h4>
                        <div className="space-y-2">
                          {node.content.keyQuestions.map((q, i) => (
                            <p key={i} className="text-xs leading-relaxed text-muted-foreground">• {q}</p>
                          ))}
                        </div>
                      </div>

                      {/* Case studies */}
                      {node.content.caseStudies.length > 0 && (
                        <div>
                          <h4 className="mb-2 text-xs font-bold text-foreground">📋 案例研究</h4>
                          <div className="space-y-2">
                            {node.content.caseStudies.map((cs, i) => (
                              <div key={i} className="rounded-xl border border-border p-3">
                                <div className="flex items-center gap-2">
                                  <span className="text-xs font-semibold text-foreground">{cs.title}</span>
                                  <span className="rounded-full bg-secondary px-2 py-0.5 text-[10px] text-muted-foreground">{cs.company}</span>
                                </div>
                                <p className="mt-1 text-[11px] leading-relaxed text-muted-foreground">{cs.lesson}</p>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Interview questions */}
                      {node.content.interviewQs.length > 0 && (
                        <div>
                          <h4 className="mb-2 text-xs font-bold text-foreground">💼 面试高频题</h4>
                          <div className="space-y-2">
                            {node.content.interviewQs.map((iq, i) => (
                              <details key={i} className="group rounded-xl border border-border">
                                <summary className="cursor-pointer px-3 py-2 text-xs font-medium text-foreground hover:bg-secondary">
                                  {iq.question}
                                </summary>
                                <div className="border-t border-border px-3 py-2">
                                  <p className="text-[11px] leading-relaxed text-muted-foreground">💡 {iq.hint}</p>
                                </div>
                              </details>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Learning tips */}
                      {node.content.learningTips.length > 0 && (
                        <div className="rounded-xl border border-border p-4">
                          <h4 className="mb-2 text-xs font-bold text-foreground">📝 学习建议</h4>
                          <div className="space-y-1.5">
                            {node.content.learningTips.map((tip, i) => (
                              <p key={i} className="text-xs leading-relaxed text-muted-foreground">{i + 1}. {tip}</p>
                            ))}
                          </div>
                        </div>
                      )}
                    </motion.div>
                  )}

                  {activeTab === 'resources' && (
                    <motion.div key="resources" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-3">
                      <h4 className="text-xs font-bold text-foreground">📚 必读</h4>
                      {node.content.mustRead.map((r, i) => (
                        <div key={i} className="rounded-xl border border-border p-3">
                          <p className="text-xs font-semibold text-foreground">{r.title}</p>
                          <p className="text-[10px] text-muted-foreground">{r.author}</p>
                          <p className="mt-1 text-[11px] leading-relaxed text-muted-foreground/80">{r.why}</p>
                        </div>
                      ))}
                      <h4 className="mt-4 text-xs font-bold text-foreground">🛠️ 推荐工具</h4>
                      <div className="flex flex-wrap gap-1.5">
                        {node.content.tools.map((t, i) => (
                          <span key={i} className="rounded-full border border-border px-2.5 py-1 text-[10px] font-medium text-muted-foreground">{t}</span>
                        ))}
                      </div>
                    </motion.div>
                  )}

                  {activeTab === 'pitfalls' && (
                    <motion.div key="pitfalls" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-3">
                      <h4 className="text-xs font-bold text-foreground">⚠️ 常见误区</h4>
                      {node.content.pitfalls.map((p, i) => (
                        <div key={i} className="flex items-start gap-2 rounded-xl border border-red-500/10 bg-red-500/5 p-3">
                          <span className="mt-0.5 text-xs text-red-500">✕</span>
                          <p className="text-xs leading-relaxed text-foreground/80">{p}</p>
                        </div>
                      ))}
                      <div className="mt-6 rounded-xl border border-border p-4">
                        <h4 className="mb-2 text-xs font-bold text-foreground">🎯 达标自检</h4>
                        <p className="text-xs leading-relaxed text-muted-foreground">能回答以下所有核心问题，说明你已经掌握了这个模块：</p>
                        <div className="mt-2 space-y-1.5">
                          {node.content.keyQuestions.map((q, i) => (
                            <div key={i} className="flex items-start gap-2">
                              <span className="mt-0.5 text-[10px] text-muted-foreground">☐</span>
                              <p className="text-xs text-muted-foreground">{q}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
