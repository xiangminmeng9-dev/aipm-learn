# 学习地图节点修改方案

## 修改原则
- 不新增节点，将用户要求的4个阶段内容融入现有14个节点中
- 保持循序渐进，在topics描述中体现前后衔接关系
- 每个topic要详细列出子学习内容

## 具体修改

### 节点6: ai-fundamentals (AI技术基础)
**现有topics**: 大模型原理、Transformer架构、Tokenization与Embedding
**需要补充**: Python基础、RAG、Agent、向量数据库、LangChain、LangGraph、大模型API、模型微调训练、KV缓存、前缀缓存

修改后topics:
1. Python编程基础 → Python环境搭建、数据类型与控制流、函数与模块、面向对象编程、常用库(NumPy/Pandas/Requests)、异步编程asyncio
2. 大模型原理与API → Transformer架构(自注意力机制/位置编码/多头注意力)、Tokenization与Embedding、大模型推理过程(预填充与解码)、主流大模型API调用(OpenAI/Anthropic/国产模型)、API参数调优(temperature/top_p/max_tokens)、流式输出与错误处理
3. 向量数据库与检索 → 向量嵌入原理(文本→向量的转换)、向量相似度计算(余弦/欧氏/点积)、向量数据库选型(Milvus/Pinecone/Chroma/Weaviate)、索引类型(HNSW/IVF)、集合管理与CRUD操作、元数据过滤与混合查询
4. RAG检索增强生成 → 基于向量数据库的RAG架构、文档加载与切分策略(固定长度/语义切分/递归切分)、嵌入模型选择与微调、检索策略(稠密检索/稀疏检索/BM25)、重排序Rerank(Cohere/BGE-Reranker)、上下文窗口管理与引用溯源
5. Agent智能体基础 → Agent核心循环(感知→推理→行动→观察)、ReAct模式、工具调用Function Calling、规划与分解(Plan-and-Execute)、记忆机制(短期/长期/工作记忆)、多Agent协作初探
6. LangChain与LangGraph框架 → LangChain核心组件(Model/Template/OutputParser/Chain)、LCEL链式调用、Tool定义与Agent构建、LangGraph状态图建模、节点与边的设计、条件路由与循环控制、人机交互Human-in-the-loop
7. 模型微调训练入门 → 为什么需要微调(预训练→微调→推理)、数据集准备格式(ChatML/ShareGPT)、LoRA与QLoRA低秩适配原理、微调训练流程(数据准备→配置→训练→评估→部署)、常见微调框架(LLaMA-Factory/Unsloth)、微调效果验证与过拟合识别
8. 推理优化与缓存 → KV Cache原理(避免重复计算)、PagedAttention与显存管理、前缀缓存Prefix Caching(共享prompt复用)、批量推理与连续批处理、量化技术(GPTQ/AWQ/GGUF)降低推理成本

### 节点7: prompt-engineering (Prompt工程)
**现有topics**: 提示词设计原则、Few-shot与CoT、结构化输出、Prompt调试与优化
**已包含提示词工程**，但需要补充与RAG/Agent的衔接

修改后topics:
1. 提示词设计原则 → 清晰指令与角色设定、任务分解与约束条件、输出格式控制(JSON/Markdown)、负面提示与边界限定、提示词版本管理
2. Few-shot与思维链 → Zero-shot/Few-shot/CoT选择策略、自洽性解码Self-Consistency、Tree-of-Thought多路径推理、自动CoT生成、从简单到复杂的示例编排
3. 结构化输出与模板 → 输出Schema定义与校验、Pydantic模型约束输出、多轮对话模板管理、基于RAG检索结果的提示词组装(衔接节点6的RAG)、Agent系统提示词设计(衔接节点6的Agent)
4. Prompt调试与优化 → A/B测试与效果对比、提示词敏感度分析、对抗性提示与注入防御、长上下文提示策略、基于评估反馈的迭代优化(衔接节点11的评估体系)

### 节点8: ai-architecture (AI系统架构)
**现有topics**: RAG架构设计、Agent架构设计、多模型协作、系统可靠性
**需要补充**: 项目全流程、Agent路由、跨Agent记忆、可观测性、鉴权中心

修改后topics:
1. RAG架构设计 → 基础RAG→高级RAG→模块化RAG演进(衔接节点6的RAG基础)、混合检索架构(稠密+稀疏+知识图谱)、多路召回与融合排序、知识库更新与版本管理、大规模文档处理管线
2. Agent架构设计 → 单Agent→多Agent→Agent集群演进(衔接节点6的Agent基础)、Agent路由策略(基于意图分类/能力匹配/负载均衡)、路由决策模型训练与优化、跨Agent记忆共享机制(全局记忆池/分层记忆/记忆压缩)、Agent间通信协议与消息格式
3. 多模型协作 → 模型路由与动态选择、大模型+小模型级联架构、专家混合MoE应用、模型网关与统一API层、成本优化与降级策略
4. 项目全流程实战 → 需求分析与技术选型(衔接节点6的框架选择)、数据管线搭建(采集→清洗→向量化→入库)、核心功能开发(RAG/Agent/工作流)、联调测试与效果评估(衔接节点11)、部署上线与监控运维、迭代优化与版本管理
5. 可观测性与鉴权 → 分布式追踪(请求链路全链路追踪)、日志聚合与指标监控(Prometheus/Grafana)、AI特有指标(延迟/Token消耗/幻觉率/召回率)、告警规则与异常检测、鉴权中心设计(API Key管理/OAuth2/RBAC)、多租户隔离与配额控制、审计日志与合规

### 节点9: ai-workflow (AI工作流与自动化)
**现有topics**: 工作流设计模式、Tool与Function Calling、MCP协议、自动化管线
**需要补充**: Tool/MCP/Skill鉴权、更详细的MCP开发

修改后topics:
1. 工作流设计模式 → 顺序/并行/条件分支/循环模式、状态机与DAG工作流、错误处理与重试策略、人工审批节点与超时机制、工作流版本管理与灰度发布
2. Tool与Function Calling → Tool定义规范(name/description/parameters)、JSON Schema参数校验、工具发现与动态注册、工具执行沙箱与超时控制、工具调用结果解析与错误恢复、工具链编排(串行/并行/条件)
3. MCP协议与开发 → MCP协议架构(Host/Client/Server)、MCP Server开发(Resources/Tools/Prompts)、MCP传输层(stdio/SSE/Streamable HTTP)、MCP客户端集成与工具发现、MCP鉴权机制(OAuth2 Bearer Token/API Key)、MCP Server部署与运维
4. Skill与鉴权体系 → Skill定义与封装(将Tool组合为可复用能力)、Skill注册中心与版本管理、Skill鉴权(调用权限/频率限制/配额控制)、Tool-MCP-Skill三层架构关系、鉴权中间件设计(Token校验/权限检查/审计日志)、多级鉴权策略(用户级/应用级/租户级)

### 节点11: ai-evaluation (AI效果评估)
**现有topics**: 评估体系设计、RAG评估、Agent评估、A/B测试
**需要补充**: 评测集构建、数据清洗、混合检索召回率提升

修改后topics:
1. 评估体系设计 → 评估维度定义(准确性/相关性/完整性/安全性)、评估指标设计(精确率/召回率/F1/BLEU/ROUGE)、自动化评估与人工评估结合、评估基准Benchmark选择、评估结果可视化与报告
2. 评测集构建与数据清洗 → 评测集设计原则(覆盖度/难度梯度/无偏性)、数据采集与标注流程、数据清洗(去重/去噪/格式统一/质量过滤)、难例挖掘与边界case覆盖、评测集版本管理与迭代、数据增强策略(同义改写/对抗样本)
3. RAG评估与混合检索优化 → 检索评估(召回率/精确率/MRR/nDCG)、生成评估(忠实度/答案相关性/上下文利用率)、RAGAS框架使用、混合检索提升召回率(稠密+稀疏+重排序)、检索参数调优(chunk大小/overlap/top_k)、端到端RAG评估管线
4. Agent评估 → 任务完成率评估、工具调用准确性、多轮对话一致性、Agent轨迹评估(规划合理性/执行效率)、Agent评估框架与基准测试
5. A/B测试与持续优化 → 实验设计(样本量/显著性/分流策略)、在线指标与离线指标对齐、模型版本对比与回滚、效果回归检测、评估驱动的迭代闭环(衔接节点8的项目全流程)

### 节点6补充: 模型微调进阶(强化学习/SFT/DPO)
这部分内容放在ai-fundamentals节点中，因为它是模型微调训练的深入

在节点6的topic 7"模型微调训练入门"之后，需要扩展为更详细的内容，包含SFT/强化学习/DPO：

修改节点6的topic 7为:
7. 模型微调与对齐训练 → 为什么需要微调(预训练→SFT→RLHF→部署)、SFT监督微调(数据集准备/训练配置/损失函数)、RLHF强化学习(奖励模型训练/PPO算法/KL散度约束)、DPO直接偏好优化(偏好数据构造/训练流程/与RLHF对比)、数据清洗与质量把控(去重/去噪/格式校验/人工抽检)、评测集构建(覆盖度/难度梯度/自动+人工评估)、微调框架实战(LLaMA-Factory/Unsloth)、微调效果验证与过拟合识别

这样把用户第三阶段的"模型微调 强化学习 sft dpo 数据清洗 评测集怎么构建"都整合进来了。
