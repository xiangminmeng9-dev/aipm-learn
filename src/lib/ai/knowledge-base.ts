// AI PM 面试知识库 — 硬编码核心知识条目
// 基于 ai-interview-qa 项目知识库 + 行业最新动态

export interface KnowledgeEntry {
  id: string;
  title: string;
  category: string;
  content: string;
  keywords: string[];
}

export const KNOWLEDGE_BASE: KnowledgeEntry[] = [
  // ── LLM 基础 ──
  {
    id: 'kb-llm-01',
    title: '大语言模型（LLM）核心原理',
    category: 'LLM 技术',
    keywords: ['LLM', '大模型', 'Transformer', 'GPT', 'Claude'],
    content: `大语言模型基于 Transformer 架构，通过自注意力机制（Self-Attention）处理序列数据。核心训练流程：预训练（海量文本学习语言模式）→ SFT（监督微调，学习遵循指令）→ RLHF/DPO（人类偏好对齐）。

关键概念：
- Token：文本最小单位，中文约 1.5 字/token
- 上下文窗口：模型一次能处理的最大 token 数（Claude 4 支持 200K）
- Temperature：控制输出随机性，0=确定性，1=创造性
- Top-p：核采样，控制候选 token 范围

产品经理需要理解：上下文窗口决定了产品能处理多长的输入，Temperature 影响产品输出的稳定性和创造性。`,
  },
  {
    id: 'kb-llm-02',
    title: 'Prompt Engineering 核心技巧',
    category: 'LLM 技术',
    keywords: ['prompt', '提示词', 'prompt-engineering', 'few-shot', 'CoT'],
    content: `Prompt Engineering 是通过优化输入文本来提升 LLM 输出质量的技术。

核心技巧：
1. **系统提示词**：设定 AI 的角色、行为边界和输出格式
2. **Few-shot 示例**：给出 2-3 个输入输出示例，让 AI 学习模式
3. **思维链（CoT）**：要求 AI "一步步思考"，提升推理准确率
4. **结构化输出**：要求 AI 输出 JSON/Markdown 等结构化格式
5. **角色设定**：给 AI 一个专业角色（如"你是一位资深产品经理"）

产品经理应用：
- 用系统提示词控制 AI 产品的行为边界
- 用 Few-shot 让 AI 学习特定业务场景的回答模式
- 用 CoT 提升 AI 在复杂决策场景的推理质量
- 用结构化输出确保 AI 返回可解析的数据`,
  },
  {
    id: 'kb-llm-03',
    title: 'RAG（检索增强生成）',
    category: 'LLM 技术',
    keywords: ['RAG', '检索增强', '知识库', '向量搜索', 'embedding'],
    content: `RAG 是让 LLM 基于外部知识库回答问题的技术，解决 LLM 知识截止和幻觉问题。

核心流程：
1. 文档切分 → 2. 向量化（Embedding）→ 3. 存储到向量数据库 → 4. 用户提问 → 5. 语义检索相关文档 → 6. 拼接上下文 → 7. LLM 生成回答

关键技术选型：
- Embedding 模型：OpenAI text-embedding-3-small / BGE / Cohere
- 向量数据库：Pinecone / Weaviate / Supabase pgvector / Chroma
- 切分策略：按段落/标题/固定 token 数，带重叠
- 检索策略：纯语义搜索 vs 混合搜索（语义+关键词）

产品经理关注点：
- RAG 的核心价值是让 AI 产品回答基于真实数据，而非编造
- 检索质量直接决定回答质量——"垃圾进，垃圾出"
- 需要关注：切分粒度、检索精度、来源引用、无结果时的降级策略`,
  },
  {
    id: 'kb-llm-04',
    title: 'AI Agent 与工具调用',
    category: 'LLM 技术',
    keywords: ['Agent', '工具调用', 'tool-use', 'ReAct', '自主'],
    content: `AI Agent 是能自主规划、调用工具、完成多步骤任务的 AI 系统。

核心模式：
- **ReAct**：推理（Reasoning）+ 行动（Acting）循环
- **工具调用（Tool Use）**：AI 选择并调用预定义的工具（搜索、代码执行、API 调用等）
- **规划（Planning）**：AI 将复杂任务拆解为子步骤

Agent 架构：
1. 单 Agent：一个 AI + 多工具，适合简单任务
2. 多 Agent：多个专业 Agent 协作，适合复杂任务
3. 人机协作：Agent 执行，人类审批关键步骤

产品经理关注点：
- Agent 的核心价值是自动化——让 AI 完成原本需要人工的多步骤操作
- 关键风险：幻觉导致错误操作、无限循环、成本失控
- 产品设计要点：明确 Agent 能力边界、提供人工审批节点、展示执行过程
- 典型应用：AI 编程助手、自动客服、数据分析 Agent`,
  },
  {
    id: 'kb-llm-05',
    title: 'MCP（Model Context Protocol）',
    category: 'LLM 技术',
    keywords: ['MCP', 'Model Context Protocol', 'Anthropic', '工具协议'],
    content: `MCP 是 Anthropic 提出的开放协议，标准化 AI 模型与外部工具/数据源的连接方式。

核心概念：
- **MCP Server**：提供工具和数据的服务端（如数据库连接、API 封装）
- **MCP Client**：调用 MCP Server 的 AI 应用
- **Tools**：Server 暴露的可调用函数
- **Resources**：Server 暴露的可读取数据
- **Prompts**：Server 提供的预设提示词模板

产品经理关注点：
- MCP 让 AI 产品能标准化接入各种工具和数据源
- 类似 USB 协议统一了外设连接，MCP 统一了 AI 工具连接
- 对产品意味着：可以快速集成新工具，无需为每个工具写定制代码
- 生态效应：MCP Server 越多，AI 产品能力越强`,
  },
  {
    id: 'kb-llm-06',
    title: 'LLM 评估与测试',
    category: 'LLM 技术',
    keywords: ['评估', 'evaluation', 'benchmark', 'LLM测试', '效果评估'],
    content: `LLM 评估是衡量 AI 产品效果的关键环节。

评估维度：
1. **准确性**：回答是否正确（事实性、逻辑性）
2. **相关性**：回答是否切题
3. **完整性**：回答是否覆盖所有要点
4. **安全性**：是否有有害输出
5. **一致性**：相同输入是否得到相似输出

评估方法：
- **人工评估**：标注员打分，最准确但成本高
- **LLM-as-Judge**：用强模型评估弱模型，成本低但可能有偏见
- **自动化指标**：BLEU/ROUGE（文本相似度）、Exact Match（精确匹配）
- **A/B 测试**：线上对比不同模型/提示词的效果

产品经理关注点：
- 评估是 AI 产品的"北极星指标"，决定了优化方向
- 评估数据集要覆盖核心场景和边界情况
- 评估要持续进行，不能只在上线前做一次
- 建立评估-迭代闭环：评估→发现问题→优化→再评估`,
  },

  // ── AI 产品设计 ──
  {
    id: 'kb-prod-01',
    title: 'AI 产品设计方法论',
    category: 'AI 产品',
    keywords: ['AI产品', '产品设计', '用户体验', '交互设计'],
    content: `AI 产品设计的核心挑战：AI 输出不确定，需要设计容错和引导机制。

核心原则：
1. **人机协作 > 全自动**：让 AI 辅助人类，而非完全替代
2. **渐进式披露**：先给简单结果，用户需要时再展示推理过程
3. **可解释性**：让用户理解 AI 为什么这样回答
4. **可纠正性**：用户能轻松修正 AI 的错误
5. **预期管理**：明确告知用户 AI 能做什么、不能做什么

关键设计模式：
- **Copilot 模式**：AI 在旁边建议，用户决定是否采纳
- **Agent 模式**：AI 自主执行，关键节点人工审批
- **对话模式**：通过多轮对话逐步明确需求
- **生成+编辑模式**：AI 生成初稿，用户编辑修改

产品经理关注点：
- AI 产品的核心体验是"信任"——用户信任 AI 的输出才会使用
- 错误处理比成功路径更重要——AI 一定会犯错，关键是犯错时怎么办
- 冷启动问题：新用户没有历史数据，AI 推荐质量低`,
  },
  {
    id: 'kb-prod-02',
    title: 'AI 产品商业模式',
    category: 'AI 产品',
    keywords: ['商业模式', 'SaaS', 'API', '订阅', 'AI产品'],
    content: `AI 产品的主要商业模式：

1. **SaaS 订阅**：月费/年费，按功能分级（免费/专业/企业）
   - 优势：收入可预测，用户粘性高
   - 挑战：AI 成本随使用量增长，需要控制毛利率
   - 代表：ChatGPT Plus、Claude Pro、Midjourney

2. **API 按量计费**：按 token/请求/月活收费
   - 优势：与成本对齐，用量大的客户贡献更多收入
   - 挑战：客户成本不可预测，可能因成本切换竞品
   - 代表：OpenAI API、Anthropic API

3. **增值服务**：基础功能免费，高级 AI 功能付费
   - 优势：降低门槛，快速获客
   - 挑战：免费用户成本压力，转化率优化
   - 代表：Notion AI、GitHub Copilot

4. **企业定制**：私有化部署 + 定制开发
   - 优势：客单价高，数据安全
   - 挑战：交付周期长，规模化难
   - 代表：各种行业 AI 解决方案

产品经理关注点：
- AI 产品的核心成本是推理成本（GPU 算力），需要精细控制
- 免费用户的 AI 成本可能吞噬利润，需要设置合理的使用限制
- 定价要考虑用户价值感知，而非单纯成本加成`,
  },
  {
    id: 'kb-prod-03',
    title: 'AI 产品数据指标体系',
    category: 'AI 产品',
    keywords: ['数据指标', 'A/B测试', '效果评估', '北极星指标'],
    content: `AI 产品需要两套指标体系：产品指标 + AI 效果指标。

产品指标：
- DAU/MAU、留存率、使用时长
- AI 功能使用率（有多少用户使用了 AI 功能）
- AI 辅助完成率（AI 建议被采纳的比例）
- 任务完成时间（有 AI vs 无 AI 的对比）

AI 效果指标：
- 准确率/召回率（分类、检索场景）
- 用户满意度评分（thumbs up/down）
- 人工修正率（AI 输出被用户修改的比例，越低越好）
- 幻觉率（AI 编造信息的比例，越低越好）
- 响应延迟（首 token 时间 + 完整响应时间）

A/B 测试要点：
- 对照组：无 AI / 旧模型 / 旧提示词
- 实验组：新 AI / 新模型 / 新提示词
- 核心指标：任务完成率、用户满意度、使用时长
- 注意：AI 输出有随机性，需要足够样本量

产品经理关注点：
- AI 效果指标是 AI 产品的"质量门禁"，上线前必须达标
- 人工修正率是最直观的 AI 效果指标——用户改得越少，AI 越好
- 数据飞轮：更多使用→更多数据→更好的模型→更好的体验→更多使用`,
  },

  // ── AI 工程实践 ──
  {
    id: 'kb-eng-01',
    title: 'MLOps 与模型部署',
    category: 'AI 工程',
    keywords: ['MLOps', '模型部署', '推理优化', 'GPU', '量化'],
    content: `MLOps 是 AI 模型从训练到上线的工程实践。

模型部署方式：
1. **云端 API**：调用 OpenAI/Anthropic 等云服务，最简单
2. **私有化部署**：自建推理服务，数据不出域
3. **端侧部署**：模型运行在用户设备，延迟最低

推理优化技术：
- **量化（Quantization）**：降低模型精度（FP16→INT8→INT4），减少内存和加速推理
- **KV Cache**：缓存注意力计算的中间结果，加速自回归生成
- **Speculative Decoding**：小模型猜、大模型验证，加速生成
- **Batching**：合并多个请求一起推理，提高 GPU 利用率

产品经理关注点：
- 推理延迟直接影响用户体验，P95 延迟要 < 3 秒
- 推理成本是 AI 产品最大的运营成本
- 模型更新需要灰度发布和回滚机制
- 需要监控模型漂移（数据分布变化导致效果下降）`,
  },
  {
    id: 'kb-eng-02',
    title: 'AI 安全与合规',
    category: 'AI 工程',
    keywords: ['AI安全', '合规', '隐私', '对齐', '红队测试'],
    content: `AI 安全是 AI 产品上线前必须解决的问题。

安全维度：
1. **内容安全**：防止生成暴力、色情、违法内容
2. **隐私保护**：用户数据不被泄露或滥用
3. **公平性**：AI 不因种族、性别等产生歧视
4. **可解释性**：AI 决策过程可追溯
5. **鲁棒性**：AI 对对抗性输入有防御能力

合规要求（中国）：
- 《生成式人工智能服务管理暂行办法》：算法备案、安全评估
- 《个人信息保护法》：用户数据收集和使用规范
- 《数据安全法》：数据分类分级管理

产品经理关注点：
- AI 安全是底线问题，不是"nice to have"
- 上线前必须做红队测试（模拟恶意用户攻击）
- 用户数据不能用于训练模型，除非明确授权
- 建立内容审核机制，人工+AI 双重保障`,
  },
];

// 搜索知识库
export function searchKnowledgeBase(query: string, topK = 3): KnowledgeEntry[] {
  const queryLower = query.toLowerCase();
  const scored = KNOWLEDGE_BASE.map(entry => {
    let score = 0;
    // 关键词匹配
    for (const kw of entry.keywords) {
      if (queryLower.includes(kw.toLowerCase())) score += 3;
    }
    // 标题匹配
    if (entry.title.toLowerCase().includes(queryLower)) score += 2;
    // 内容匹配
    if (entry.content.toLowerCase().includes(queryLower)) score += 1;
    return { entry, score };
  });
  return scored
    .filter(s => s.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, topK)
    .map(s => s.entry);
}
