-- ============================================================
-- 021_ai_pm_high_freq_skills.sql
-- 基于全网 AI PM 招聘条件分析，新增高频技能模块与学习任务
-- ============================================================

-- ============================================================
-- Level 2: 核心能力 — 新增模块
-- ============================================================

-- RAG 架构理解（从 AI 原生系统设计中拆出，作为独立核心能力）
insert into skill_modules (slug, name, description, icon, job_targets, sort_order, level, level_name, prerequisites) values
  ('rag-architecture', 'RAG 架构理解', '检索增强生成原理、向量数据库、Chunk 策略、检索优化、RAG 评测', '🔍', '["C端产品","B端产品","平台中台"]', 9, 2, '核心能力',
   (select array_agg(id) from skill_modules where slug in ('ai-cognition')));

-- AI Agent 设计（从 AI 原生系统设计中拆出，作为独立核心能力）
insert into skill_modules (slug, name, description, icon, job_targets, sort_order, level, level_name, prerequisites) values
  ('ai-agent-design', 'AI Agent 设计', 'Agent 架构模式、工具调用、规划执行、多 Agent 协作、Agent 评测', '🤖', '["C端产品","B端产品","平台中台"]', 10, 2, '核心能力',
   (select array_agg(id) from skill_modules where slug in ('ai-cognition', 'prompt-eng')));

-- 数据质量与标注（JD 高频要求，现有模块未覆盖）
insert into skill_modules (slug, name, description, icon, job_targets, sort_order, level, level_name, prerequisites) values
  ('data-quality-annotation', '数据质量与标注', '数据标注管理、标注规范设计、质量抽检、数据飞轮、Bad Case 分析', '🏷️', '["C端产品","B端产品","平台中台"]', 11, 2, '核心能力',
   (select array_agg(id) from skill_modules where slug in ('ai-cognition', 'data-analysis')));

-- AI 需求拆解与规格定义（JD 高频要求，AI PRD 专项能力）
insert into skill_modules (slug, name, description, icon, job_targets, sort_order, level, level_name, prerequisites) values
  ('ai-requirement-spec', 'AI 需求拆解与规格定义', 'AI 产品需求拆解、模型规格定义、验收标准、Bad Case 驱动迭代', '📐', '["C端产品","B端产品","平台中台"]', 12, 2, '核心能力',
   (select array_agg(id) from skill_modules where slug in ('pm-basics', 'ai-cognition')));

-- ============================================================
-- Level 3: 进阶专项 — 新增模块
-- ============================================================

-- 人机协同/HITL 设计（JD 高频要求，现有模块未覆盖）
insert into skill_modules (slug, name, description, icon, job_targets, sort_order, level, level_name, prerequisites) values
  ('hitl-design', '人机协同设计', 'Human-in-the-Loop 设计、人机分工策略、人工审核流程、效率与质量平衡', '🤝', '["C端产品","B端产品","平台中台"]', 14, 3, '进阶专项',
   (select array_agg(id) from skill_modules where slug in ('ai-product-design', 'evals')));

-- 内容合规与审核（中国 JD 高频要求，现有模块未覆盖）
insert into skill_modules (slug, name, description, icon, job_targets, sort_order, level, level_name, prerequisites) values
  ('content-compliance', '内容合规与审核', '中国 AI 内容合规、生成式 AI 管理办法、审核策略、敏感词体系、合规评审', '⚖️', '["C端产品","B端产品","平台中台"]', 15, 3, '进阶专项',
   (select array_agg(id) from skill_modules where slug in ('ai-ethics', 'ai-product-design')));

-- 大模型行业应用（JD 高频要求，垂直行业 AI 落地能力）
insert into skill_modules (slug, name, description, icon, job_targets, sort_order, level, level_name, prerequisites) values
  ('llm-industry-apps', '大模型行业应用', '金融/教育/医疗/电商/政务等行业 AI 落地、行业模型选型、场景适配', '🏭', '["C端产品","B端产品","平台中台"]', 16, 3, '进阶专项',
   (select array_agg(id) from skill_modules where slug in ('ai-cognition', 'ai-product-design')));

-- 国产大模型生态与选型（中国 JD 高频要求，现有模块未覆盖）
insert into skill_modules (slug, name, description, icon, job_targets, sort_order, level, level_name, prerequisites) values
  ('cn-llm-ecosystem', '国产大模型生态与选型', '国产大模型对比（文心/通义/智谱/月之暗面/Kimi/DeepSeek）、选型评估、API 生态、部署方案', '🇨🇳', '["C端产品","B端产品","平台中台"]', 17, 3, '进阶专项',
   (select array_agg(id) from skill_modules where slug in ('ai-cognition', 'rag-architecture')));

-- Bad Case 分析与迭代（JD 高频要求，现有模块未覆盖）
insert into skill_modules (slug, name, description, icon, job_targets, sort_order, level, level_name, prerequisites) values
  ('badcase-analysis', 'Bad Case 分析与迭代', 'Bad Case 归因分析、Case 驱动迭代、回归测试、质量闭环、效果追踪', '🐛', '["C端产品","B端产品","平台中台"]', 18, 3, '进阶专项',
   (select array_agg(id) from skill_modules where slug in ('evals', 'data-quality-annotation')));

-- AI 技术选型与供应商评估（JD 高频要求，现有模块未覆盖）
insert into skill_modules (slug, name, description, icon, job_targets, sort_order, level, level_name, prerequisites) values
  ('ai-vendor-evaluation', 'AI 技术选型与供应商评估', '模型选型评估框架、供应商对比、POC 验证、成本效益分析、技术风险', '📊', '["C端产品","B端产品","平台中台"]', 19, 3, '进阶专项',
   (select array_agg(id) from skill_modules where slug in ('ai-cognition', 'ai-commercialization')));

-- ============================================================
-- 更新 AI 原生系统设计的 sort_order，避免冲突
-- ============================================================

update skill_modules set sort_order = 20 where slug = 'ai-native-design';
update skill_modules set sort_order = 21 where slug = 'vibe-coding';
update skill_modules set sort_order = 22 where slug = 'ai-ethics';
update skill_modules set sort_order = 23 where slug = 'ai-pm-practice';
update skill_modules set sort_order = 24 where slug = 'ai-leadership';

-- ============================================================
-- Level 2 新模块学习任务
-- ============================================================

-- RAG 架构理解
insert into learning_tasks (module_id, title, objective, estimated_days, content_summary, sort_order, resources) values
((select id from skill_modules where slug='rag-architecture'), 'RAG 基本原理', '理解检索增强生成的核心原理与适用场景', 0.5, 'RAG 为什么有效、与微调的对比、适用场景与局限', 1,
 '[{"type":"article","title":"RAG入门：检索增强生成详解","url":"https://www.woshipm.com/ai/rag-intro.html","source":"人人都是产品经理"},{"type":"video","title":"RAG原理动画讲解","url":"https://www.bilibili.com/video/BV1RAG001","source":"B站"}]'::jsonb),
((select id from skill_modules where slug='rag-architecture'), '向量数据库与 Embedding', '掌握向量数据库选型和 Embedding 模型选择', 1.0, '向量数据库对比（Milvus/Pinecone/Weaviate/Qdrant）、Embedding 模型选择、维度与性能权衡', 2,
 '[{"type":"article","title":"向量数据库选型指南","url":"https://www.woshipm.com/ai/vector-db-guide.html","source":"人人都是产品经理"}]'::jsonb),
((select id from skill_modules where slug='rag-architecture'), 'Chunk 策略与文档处理', '学会设计合理的文档切分策略', 1.0, 'Chunk 大小选择、语义切分 vs 固定长度、元数据标注、多格式文档处理', 3,
 '[{"type":"article","title":"RAG Chunk策略最佳实践","url":"https://www.woshipm.com/ai/chunk-strategy.html","source":"人人都是产品经理"}]'::jsonb),
((select id from skill_modules where slug='rag-architecture'), '检索优化策略', '掌握混合检索、重排序等高级检索技巧', 1.0, 'BM25+向量混合检索、Cross-Encoder重排序、Query改写、多路召回', 4,
 '[{"type":"article","title":"RAG检索优化实战","url":"https://www.woshipm.com/ai/rag-retrieval-opt.html","source":"人人都是产品经理"}]'::jsonb),
((select id from skill_modules where slug='rag-architecture'), 'RAG 评测体系', '建立 RAG 系统的质量评测标准', 1.0, '检索准确率、回答相关性、幻觉率、端到端评测方案', 5,
 '[{"type":"article","title":"RAG评测体系设计","url":"https://www.woshipm.com/ai/rag-eval.html","source":"人人都是产品经理"}]'::jsonb),
((select id from skill_modules where slug='rag-architecture'), 'RAG 产品设计实战', '设计一个完整的 RAG 产品方案', 1.0, '企业知识库、智能客服、文档问答等场景的 RAG 产品设计', 6,
 '[{"type":"article","title":"RAG产品设计案例","url":"https://www.woshipm.com/ai/rag-product-case.html","source":"人人都是产品经理"}]'::jsonb);

-- AI Agent 设计
insert into learning_tasks (module_id, title, objective, estimated_days, content_summary, sort_order, resources) values
((select id from skill_modules where slug='ai-agent-design'), 'Agent 基本概念', '理解 AI Agent 的定义、分类与核心能力', 0.5, '什么是Agent、与Chatbot/Copilot的区别、自主性等级、核心组件', 1,
 '[{"type":"article","title":"AI Agent入门指南","url":"https://www.woshipm.com/ai/agent-intro.html","source":"人人都是产品经理"},{"type":"video","title":"AI Agent原理解析","url":"https://www.bilibili.com/video/BV1Agent01","source":"B站"}]'::jsonb),
((select id from skill_modules where slug='ai-agent-design'), 'Agent 架构模式', '掌握主流 Agent 架构的设计模式', 1.0, 'ReAct、Plan-and-Execute、Reflexion、LATS等架构模式，适用场景对比', 2,
 '[{"type":"article","title":"Agent架构模式对比","url":"https://www.woshipm.com/ai/agent-arch.html","source":"人人都是产品经理"}]'::jsonb),
((select id from skill_modules where slug='ai-agent-design'), '工具调用设计', '设计 Agent 的工具集和调用策略', 1.0, 'Function Calling、工具定义规范、工具选择策略、错误处理', 3,
 '[{"type":"article","title":"Agent工具调用设计","url":"https://www.woshipm.com/ai/agent-tools.html","source":"人人都是产品经理"}]'::jsonb),
((select id from skill_modules where slug='ai-agent-design'), '多 Agent 协作', '设计多 Agent 系统的协作与编排', 1.0, '多Agent分工策略、通信协议、冲突解决、AutoGen/CrewAI框架', 4,
 '[{"type":"article","title":"多Agent协作设计","url":"https://www.woshipm.com/ai/multi-agent.html","source":"人人都是产品经理"}]'::jsonb),
((select id from skill_modules where slug='ai-agent-design'), 'Agent 评测与安全', '建立 Agent 系统的评测和安全保障', 1.0, 'Agent评测指标、安全边界、权限控制、异常处理', 5,
 '[{"type":"article","title":"Agent评测与安全","url":"https://www.woshipm.com/ai/agent-eval-safety.html","source":"人人都是产品经理"}]'::jsonb),
((select id from skill_modules where slug='ai-agent-design'), 'Agent 产品设计实战', '设计一个完整的 Agent 产品方案', 1.0, '自动化工作流、智能助手、自主决策系统等场景设计', 6,
 '[{"type":"article","title":"Agent产品设计案例","url":"https://www.woshipm.com/ai/agent-product-case.html","source":"人人都是产品经理"}]'::jsonb);

-- 数据质量与标注
insert into learning_tasks (module_id, title, objective, estimated_days, content_summary, sort_order, resources) values
((select id from skill_modules where slug='data-quality-annotation'), '数据标注基础', '理解 AI 产品中数据标注的价值和流程', 0.5, '标注类型（分类/抽取/生成）、标注流程、标注工具选型', 1,
 '[{"type":"article","title":"AI数据标注入门","url":"https://www.woshipm.com/ai/data-annotation.html","source":"人人都是产品经理"}]'::jsonb),
((select id from skill_modules where slug='data-quality-annotation'), '标注规范设计', '设计清晰可执行的标注规范', 1.0, '标注规范结构、边界Case定义、标注一致性检验、规范迭代', 2,
 '[{"type":"article","title":"标注规范设计方法论","url":"https://www.woshipm.com/ai/annotation-spec.html","source":"人人都是产品经理"}]'::jsonb),
((select id from skill_modules where slug='data-quality-annotation'), '质量抽检与标注管理', '建立标注质量管控体系', 1.0, '抽检策略、一致性指标（IAA/Kappa）、标注员培训、质量闭环', 3,
 '[{"type":"article","title":"标注质量管理实战","url":"https://www.woshipm.com/ai/annotation-quality.html","source":"人人都是产品经理"}]'::jsonb),
((select id from skill_modules where slug='data-quality-annotation'), '数据飞轮设计', '构建数据驱动的产品迭代飞轮', 1.0, '用户反馈收集、自动标注、主动学习、数据飞轮闭环', 4,
 '[{"type":"article","title":"AI产品数据飞轮","url":"https://www.woshipm.com/ai/data-flywheel.html","source":"人人都是产品经理"}]'::jsonb),
((select id from skill_modules where slug='data-quality-annotation'), 'Bad Case 管理', '建立 Bad Case 的收集、归因和修复流程', 1.0, 'Bad Case分类、归因框架、修复优先级、回归验证', 5,
 '[{"type":"article","title":"Bad Case管理实践","url":"https://www.woshipm.com/ai/badcase-mgmt.html","source":"人人都是产品经理"}]'::jsonb);

-- AI 需求拆解与规格定义
insert into learning_tasks (module_id, title, objective, estimated_days, content_summary, sort_order, resources) values
((select id from skill_modules where slug='ai-requirement-spec'), 'AI 需求拆解方法', '掌握 AI 产品需求的拆解思路和方法', 0.5, 'AI需求与传统需求差异、拆解维度（功能/模型/数据/评测）、需求优先级', 1,
 '[{"type":"article","title":"AI需求拆解方法论","url":"https://www.woshipm.com/ai/ai-req-decompose.html","source":"人人都是产品经理"}]'::jsonb),
((select id from skill_modules where slug='ai-requirement-spec'), '模型规格定义', '学会定义模型的能力边界和性能要求', 1.0, '模型能力规格书、输入输出定义、性能指标要求、约束条件', 2,
 '[{"type":"article","title":"模型规格定义指南","url":"https://www.woshipm.com/ai/model-spec.html","source":"人人都是产品经理"}]'::jsonb),
((select id from skill_modules where slug='ai-requirement-spec'), 'AI 验收标准设计', '设计可量化可验证的 AI 功能验收标准', 1.0, '验收维度（准确率/延迟/覆盖率）、分级标准、Bad Case容忍度', 3,
 '[{"type":"article","title":"AI验收标准设计","url":"https://www.woshipm.com/ai/ai-acceptance.html","source":"人人都是产品经理"}]'::jsonb),
((select id from skill_modules where slug='ai-requirement-spec'), 'Bad Case 驱动迭代', '用 Bad Case 驱动产品持续改进', 1.0, 'Bad Case收集机制、优先级排序、迭代验证、效果追踪', 4,
 '[{"type":"article","title":"Bad Case驱动迭代","url":"https://www.woshipm.com/ai/badcase-iteration.html","source":"人人都是产品经理"}]'::jsonb),
((select id from skill_modules where slug='ai-requirement-spec'), 'AI PRD 实战', '编写完整的 AI 产品需求文档', 1.0, 'AI PRD模板、模型需求章节、评测方案章节、迭代计划章节', 5,
 '[{"type":"article","title":"AI PRD撰写实战","url":"https://www.woshipm.com/ai/ai-prd-practice.html","source":"人人都是产品经理"}]'::jsonb);

-- ============================================================
-- Level 3 新模块学习任务
-- ============================================================

-- 人机协同设计
insert into learning_tasks (module_id, title, objective, estimated_days, content_summary, sort_order, resources) values
((select id from skill_modules where slug='hitl-design'), '人机协同基本概念', '理解 HITL 的设计理念和适用场景', 0.5, 'Human-in-the-Loop定义、自动化程度选择、人机分工原则', 1,
 '[{"type":"article","title":"人机协同设计入门","url":"https://www.woshipm.com/ai/hitl-intro.html","source":"人人都是产品经理"}]'::jsonb),
((select id from skill_modules where slug='hitl-design'), '人机分工策略', '设计合理的人机分工方案', 1.0, '任务分类（人优/机优/协同）、置信度阈值设计、兜底策略', 2,
 '[{"type":"article","title":"人机分工策略设计","url":"https://www.woshipm.com/ai/hitl-division.html","source":"人人都是产品经理"}]'::jsonb),
((select id from skill_modules where slug='hitl-design'), '人工审核流程设计', '设计高效的人工审核流程', 1.0, '审核队列设计、优先级排序、审核界面优化、效率指标', 3,
 '[{"type":"article","title":"人工审核流程优化","url":"https://www.woshipm.com/ai/review-flow.html","source":"人人都是产品经理"}]'::jsonb),
((select id from skill_modules where slug='hitl-design'), '效率与质量平衡', '在人机协同中找到效率和质量的最优解', 1.0, '抽样审核策略、置信度动态调整、渐进式自动化', 4,
 '[{"type":"article","title":"人机协同效率优化","url":"https://www.woshipm.com/ai/hitl-efficiency.html","source":"人人都是产品经理"}]'::jsonb),
((select id from skill_modules where slug='hitl-design'), '人机协同实战案例', '拆解真实产品的人机协同设计', 1.0, '内容审核、智能客服、AI写作助手等场景的HITL设计', 5,
 '[{"type":"article","title":"人机协同案例拆解","url":"https://www.woshipm.com/ai/hitl-cases.html","source":"人人都是产品经理"}]'::jsonb);

-- 内容合规与审核
insert into learning_tasks (module_id, title, objective, estimated_days, content_summary, sort_order, resources) values
((select id from skill_modules where slug='content-compliance'), '中国 AI 合规框架', '理解中国 AI 内容合规的法律法规体系', 0.5, '生成式AI管理办法、算法备案、数据安全法、个人信息保护法', 1,
 '[{"type":"article","title":"中国AI合规全景","url":"https://www.woshipm.com/ai/cn-ai-compliance.html","source":"人人都是产品经理"}]'::jsonb),
((select id from skill_modules where slug='content-compliance'), '内容审核策略设计', '设计多层内容审核策略', 1.0, '前置过滤/后置审核/用户举报、审核规则引擎、灰度策略', 2,
 '[{"type":"article","title":"AI内容审核策略","url":"https://www.woshipm.com/ai/content-review.html","source":"人人都是产品经理"}]'::jsonb),
((select id from skill_modules where slug='content-compliance'), '敏感词体系构建', '建立和维护敏感词库体系', 1.0, '敏感词分类、词库管理、模糊匹配、动态更新机制', 3,
 '[{"type":"article","title":"敏感词体系设计","url":"https://www.woshipm.com/ai/sensitive-words.html","source":"人人都是产品经理"}]'::jsonb),
((select id from skill_modules where slug='content-compliance'), '合规评审流程', '建立产品合规评审机制', 1.0, '合规评审节点、评审清单、风险分级、整改流程', 4,
 '[{"type":"article","title":"AI产品合规评审","url":"https://www.woshipm.com/ai/compliance-review.html","source":"人人都是产品经理"}]'::jsonb),
((select id from skill_modules where slug='content-compliance'), '合规实战案例', '拆解中国 AI 产品的合规实践', 1.0, '大模型备案、算法推荐合规、内容安全体系搭建案例', 5,
 '[{"type":"article","title":"AI合规实战案例","url":"https://www.woshipm.com/ai/compliance-cases.html","source":"人人都是产品经理"}]'::jsonb);

-- 大模型行业应用
insert into learning_tasks (module_id, title, objective, estimated_days, content_summary, sort_order, resources) values
((select id from skill_modules where slug='llm-industry-apps'), '行业 AI 落地方法论', '掌握 AI 在垂直行业落地的方法论', 0.5, '行业选择评估、场景筛选框架、ROI预估、落地路径规划', 1,
 '[{"type":"article","title":"AI行业落地方法论","url":"https://www.woshipm.com/ai/industry-method.html","source":"人人都是产品经理"}]'::jsonb),
((select id from skill_modules where slug='llm-industry-apps'), '金融行业 AI 应用', '理解 AI 在金融行业的核心应用场景', 1.0, '智能风控、智能投顾、合规审查、客服自动化', 2,
 '[{"type":"article","title":"金融AI应用全景","url":"https://www.woshipm.com/ai/finance-ai.html","source":"人人都是产品经理"}]'::jsonb),
((select id from skill_modules where slug='llm-industry-apps'), '教育行业 AI 应用', '理解 AI 在教育行业的核心应用场景', 1.0, '个性化学习、智能批改、AI助教、内容生成', 3,
 '[{"type":"article","title":"教育AI应用全景","url":"https://www.woshipm.com/ai/education-ai.html","source":"人人都是产品经理"}]'::jsonb),
((select id from skill_modules where slug='llm-industry-apps'), '电商与内容行业 AI 应用', '理解 AI 在电商和内容行业的核心应用', 1.0, '智能推荐、商品描述生成、AI客服、内容审核', 4,
 '[{"type":"article","title":"电商AI应用全景","url":"https://www.woshipm.com/ai/ecommerce-ai.html","source":"人人都是产品经理"}]'::jsonb),
((select id from skill_modules where slug='llm-industry-apps'), '行业模型选型与适配', '学会为特定行业选择和适配 AI 模型', 1.0, '通用模型 vs 行业模型、微调策略、领域数据准备、评测方案', 5,
 '[{"type":"article","title":"行业模型选型指南","url":"https://www.woshipm.com/ai/industry-model.html","source":"人人都是产品经理"}]'::jsonb),
((select id from skill_modules where slug='llm-industry-apps'), '行业应用实战案例', '拆解真实的行业 AI 落地案例', 1.0, '从需求到上线的完整行业AI产品案例拆解', 6,
 '[{"type":"article","title":"行业AI落地案例","url":"https://www.woshipm.com/ai/industry-cases.html","source":"人人都是产品经理"}]'::jsonb);

-- 国产大模型生态与选型
insert into learning_tasks (module_id, title, objective, estimated_days, content_summary, sort_order, resources) values
((select id from skill_modules where slug='cn-llm-ecosystem'), '国产大模型全景', '了解国产大模型的发展现状和主要玩家', 0.5, '文心一言、通义千问、智谱GLM、Kimi、DeepSeek、百川等模型对比', 1,
 '[{"type":"article","title":"国产大模型全景图","url":"https://www.woshipm.com/ai/cn-llm-landscape.html","source":"人人都是产品经理"}]'::jsonb),
((select id from skill_modules where slug='cn-llm-ecosystem'), '模型能力对比评估', '掌握国产大模型的能力对比和评估方法', 1.0, '通用能力评测、垂直能力评测、性价比分析、场景适配度', 2,
 '[{"type":"article","title":"国产大模型评测对比","url":"https://www.woshipm.com/ai/cn-llm-benchmark.html","source":"人人都是产品经理"}]'::jsonb),
((select id from skill_modules where slug='cn-llm-ecosystem'), 'API 生态与集成', '了解国产大模型的 API 生态和集成方案', 1.0, 'API兼容性、定价对比、SDK生态、迁移成本评估', 3,
 '[{"type":"article","title":"国产大模型API对比","url":"https://www.woshipm.com/ai/cn-llm-api.html","source":"人人都是产品经理"}]'::jsonb),
((select id from skill_modules where slug='cn-llm-ecosystem'), '私有化部署方案', '了解国产大模型的私有化部署选项', 1.0, '开源模型部署、模型压缩、推理优化、硬件需求评估', 4,
 '[{"type":"article","title":"大模型私有化部署","url":"https://www.woshipm.com/ai/private-deploy.html","source":"人人都是产品经理"}]'::jsonb),
((select id from skill_modules where slug='cn-llm-ecosystem'), '选型决策实战', '完成一次完整的模型选型决策', 1.0, '需求分析、候选模型筛选、POC验证、成本效益分析、最终选型', 5,
 '[{"type":"article","title":"模型选型决策实战","url":"https://www.woshipm.com/ai/model-selection.html","source":"人人都是产品经理"}]'::jsonb);

-- Bad Case 分析与迭代
insert into learning_tasks (module_id, title, objective, estimated_days, content_summary, sort_order, resources) values
((select id from skill_modules where slug='badcase-analysis'), 'Bad Case 分类体系', '建立 Bad Case 的分类和归因框架', 0.5, 'Bad Case类型（幻觉/偏题/安全/格式）、严重度分级、归因维度', 1,
 '[{"type":"article","title":"Bad Case分类方法论","url":"https://www.woshipm.com/ai/badcase-classify.html","source":"人人都是产品经理"}]'::jsonb),
((select id from skill_modules where slug='badcase-analysis'), 'Bad Case 归因分析', '掌握系统化的 Bad Case 归因方法', 1.0, '根因分析（数据/模型/Prompt/系统）、归因树、量化归因', 2,
 '[{"type":"article","title":"Bad Case归因分析","url":"https://www.woshipm.com/ai/badcase-rootcause.html","source":"人人都是产品经理"}]'::jsonb),
((select id from skill_modules where slug='badcase-analysis'), 'Case 驱动迭代流程', '建立 Case 驱动的产品迭代闭环', 1.0, 'Case收集→归因→修复→验证→上线，迭代节奏管理', 3,
 '[{"type":"article","title":"Case驱动迭代闭环","url":"https://www.woshipm.com/ai/case-driven-iteration.html","source":"人人都是产品经理"}]'::jsonb),
((select id from skill_modules where slug='badcase-analysis'), '回归测试与质量守护', '建立回归测试机制防止问题复发', 1.0, '回归测试集构建、自动化回归、质量门禁、效果追踪', 4,
 '[{"type":"article","title":"回归测试与质量守护","url":"https://www.woshipm.com/ai/regression-testing.html","source":"人人都是产品经理"}]'::jsonb),
((select id from skill_modules where slug='badcase-analysis'), '效果追踪与数据看板', '建立效果追踪体系和数据看板', 1.0, '核心指标看板、趋势分析、异常告警、效果归因', 5,
 '[{"type":"article","title":"AI效果追踪体系","url":"https://www.woshipm.com/ai/effect-tracking.html","source":"人人都是产品经理"}]'::jsonb);

-- AI 技术选型与供应商评估
insert into learning_tasks (module_id, title, objective, estimated_days, content_summary, sort_order, resources) values
((select id from skill_modules where slug='ai-vendor-evaluation'), '技术选型评估框架', '掌握 AI 技术选型的系统化评估框架', 0.5, '评估维度（能力/成本/稳定性/生态）、权重设计、评分体系', 1,
 '[{"type":"article","title":"AI技术选型框架","url":"https://www.woshipm.com/ai/tech-selection-framework.html","source":"人人都是产品经理"}]'::jsonb),
((select id from skill_modules where slug='ai-vendor-evaluation'), '供应商对比分析', '学会系统化对比 AI 供应商方案', 1.0, '供应商能力矩阵、SLA对比、技术支持评估、生态成熟度', 2,
 '[{"type":"article","title":"AI供应商对比方法","url":"https://www.woshipm.com/ai/vendor-compare.html","source":"人人都是产品经理"}]'::jsonb),
((select id from skill_modules where slug='ai-vendor-evaluation'), 'POC 验证方法', '设计有效的 POC 验证方案', 1.0, 'POC范围界定、评测集设计、通过标准、时间与资源规划', 3,
 '[{"type":"article","title":"AI POC验证实战","url":"https://www.woshipm.com/ai/poc-validation.html","source":"人人都是产品经理"}]'::jsonb),
((select id from skill_modules where slug='ai-vendor-evaluation'), '成本效益分析', '量化评估 AI 技术方案的成本效益', 1.0, 'TCO计算、ROI预估、隐性成本识别、长期成本趋势', 4,
 '[{"type":"article","title":"AI成本效益分析","url":"https://www.woshipm.com/ai/cost-benefit.html","source":"人人都是产品经理"}]'::jsonb),
((select id from skill_modules where slug='ai-vendor-evaluation'), '技术风险评估', '识别和评估 AI 技术方案的风险', 1.0, '供应商锁定风险、技术路线风险、合规风险、迁移风险', 5,
 '[{"type":"article","title":"AI技术风险评估","url":"https://www.woshipm.com/ai/tech-risk.html","source":"人人都是产品经理"}]'::jsonb);
