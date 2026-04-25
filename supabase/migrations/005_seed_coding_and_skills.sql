-- ============================================================
-- 005_seed_coding_and_skills.sql
-- 开发模式 + 技能模块 + 学习任务 + 趋势简报 种子数据
-- ============================================================

-- -----------------------------------------------------------
-- 开发模式（6 种）
-- -----------------------------------------------------------
insert into dev_modes (slug, name, description, sort_order) values
  ('spec-md', '手写 spec.md', '从零编写功能规范文档，再基于规范进行开发', 1),
  ('claude-code-plan', 'Claude Code Plan', '使用 Claude Code 的 /plan 命令进行规划和开发', 2),
  ('speckit', 'Speckit', '使用 Speckit 工作流：specify → plan → tasks → implement', 3),
  ('superpowers', 'Using Superpowers', '利用 using-superpowers 技能进行头脑风暴和需求探索', 4),
  ('tdd', 'TDD 驱动', '先编写失败的测试用例，再让 AI 生成实现代码，红-绿-重构循环', 5),
  ('prompt-engineering', 'Prompt Engineering', '通过纯提示词迭代与 AI 对话完成开发，聚焦高质量 prompt 编写', 6);

-- -----------------------------------------------------------
-- 技能模块（7 个）
-- -----------------------------------------------------------
insert into skill_modules (slug, name, description, icon, job_targets, sort_order) values
  ('evals', 'AI 评测（Evals）能力', '评测集编写、幻觉检测、质量基准设计', '📊', '["C端产品","B端产品","平台中台"]', 1),
  ('ai-native-design', 'AI 原生系统设计', 'Agent 架构、RAG 优化、MCP 协议、多模态交互', '🏗️', '["C端产品","B端产品","平台中台"]', 2),
  ('prompt-eng', 'Prompt Engineering', 'Prompt 基础、高级技巧、分层管理、Few-shot/CoT', '✍️', '["C端产品","B端产品","平台中台"]', 3),
  ('ai-commercialization', 'AI 商业化与 ROI', 'Token 成本优化、单位经济学、落地场景闭环', '💰', '["C端产品","B端产品"]', 4),
  ('vibe-coding', 'AI 编码能力（Vibe Coding）', 'AI 辅助原型开发、MVP 快速搭建、代码审查', '💻', '["C端产品","平台中台"]', 5),
  ('ai-ethics', 'AI 伦理与安全', '模型合规、隐私保护、可解释性、对齐安全', '🛡️', '["C端产品","B端产品","平台中台"]', 6),
  ('ai-tech-trends', 'AI 技术前沿趋势', '实时追踪最新 AI 技术动态、新模型发布、行业应用案例', '🚀', '["C端产品","B端产品","平台中台"]', 7);

-- -----------------------------------------------------------
-- 学习任务（52 个，每模块 7-8 个）
-- -----------------------------------------------------------

-- AI 评测（Evals）能力
insert into learning_tasks (module_id, title, objective, estimated_days, content_summary, sort_order) values
  ((select id from skill_modules where slug='evals'), '理解 AI 评测的基本概念', '掌握 Evals 的定义、目的和在 AI 产品中的核心作用', 0.5, '什么是 Evals，为什么 AI 产品需要评测，评测与传统测试的区别', 1),
  ((select id from skill_modules where slug='evals'), '评测集编写实践', '能够编写结构化评测集，定义输入和预期输出', 1.0, '评测集的结构设计、输入输出定义、边界用例覆盖', 2),
  ((select id from skill_modules where slug='evals'), '幻觉检测方法', '掌握常见幻觉类型、检测策略与自动化方案', 1.0, 'LLM 幻觉的类型分类、自动检测 Pipeline、人工审核流程', 3),
  ((select id from skill_modules where slug='evals'), '质量基准设计', '学会定义质量标准和构建评估基准', 1.0, '如何定义"好"的标准，构建质量评估基准，基线对比方法', 4),
  ((select id from skill_modules where slug='evals'), 'A/B 测试与 AI 效果评估', '掌握 AI 功能的 A/B 测试设计与效果归因', 1.0, 'AI 功能的实验设计、指标选择、统计显著性判断', 5),
  ((select id from skill_modules where slug='evals'), '自动化评测流水线', '实现 CI/CD 中的评测集成与自动化回归检测', 1.0, '评测与 CI/CD 集成、自动化回归、评测报告生成', 6),
  ((select id from skill_modules where slug='evals'), '评测结果分析与迭代', '从评测数据中提炼洞察，驱动产品改进', 0.5, '评测数据可视化、问题定位、迭代优化闭环', 7),
  ((select id from skill_modules where slug='evals'), '评测体系实战案例', '拆解真实产品的评测体系', 1.0, '搜索、推荐、对话等场景的评测体系拆解', 8);

-- AI 原生系统设计
insert into learning_tasks (module_id, title, objective, estimated_days, content_summary, sort_order) values
  ((select id from skill_modules where slug='ai-native-design'), 'AI 原生产品思维', '从"加 AI"到"AI 原生"的思维转变', 0.5, 'AI 原生 vs AI 包装、设计原则、用户体验范式变化', 1),
  ((select id from skill_modules where slug='ai-native-design'), 'Agent 架构设计', '掌握单 Agent 与多 Agent 架构的选择与设计', 1.0, '单 Agent vs 多 Agent、规划与执行解耦、工具调用设计', 2),
  ((select id from skill_modules where slug='ai-native-design'), 'RAG 系统优化', '理解检索增强生成的架构选择与优化策略', 1.0, 'RAG 架构模式、检索策略、Chunk 优化、重排序', 3),
  ((select id from skill_modules where slug='ai-native-design'), 'MCP 协议理解与实践', '掌握 Model Context Protocol 的设计理念与应用场景', 1.0, 'MCP 协议规范、Server/Client 模式、工具集成实践', 4),
  ((select id from skill_modules where slug='ai-native-design'), '多模态交互设计', '设计文本、图像、语音、视频的多模态产品体验', 1.0, '多模态输入输出设计、模态转换、用户体验优化', 5),
  ((select id from skill_modules where slug='ai-native-design'), 'AI 系统可观测性', '保障 AI 系统稳定运行的可观测性方案', 1.0, '日志、追踪、指标体系，AI 特有的可观测性需求', 6),
  ((select id from skill_modules where slug='ai-native-design'), '容错与降级策略', '设计 AI 不可用时的产品降级方案', 1.0, '降级策略、重试机制、Fallback 设计、用户体验保障', 7),
  ((select id from skill_modules where slug='ai-native-design'), 'AI 产品架构实战', '端到端设计一个 AI 原生产品架构', 1.0, '综合案例：从需求到架构的完整 AI 原生产品设计', 8);

-- Prompt Engineering
insert into learning_tasks (module_id, title, objective, estimated_days, content_summary, sort_order) values
  ((select id from skill_modules where slug='prompt-eng'), 'Prompt 基础概念', '理解 Prompt 的作用、结构和常见误区', 0.5, 'Prompt 的角色、结构要素、常见错误与最佳实践', 1),
  ((select id from skill_modules where slug='prompt-eng'), '系统提示词设计', '掌握 System Prompt 的分层管理与版本控制', 1.0, 'System Prompt 设计原则、分层策略、版本管理', 2),
  ((select id from skill_modules where slug='prompt-eng'), 'Few-shot 与 CoT 技巧', '实践少量示例与思维链提示的方法', 1.0, 'Few-shot 选择策略、CoT 设计模式、Self-consistency', 3),
  ((select id from skill_modules where slug='prompt-eng'), 'Prompt 模板管理', '实现 Prompt 的模板化、参数化与复用', 1.0, '模板语法、变量注入、多场景复用、A/B 测试', 4),
  ((select id from skill_modules where slug='prompt-eng'), 'Prompt 评测与迭代', '系统化评测 Prompt 效果并持续优化', 1.0, '评测指标定义、自动化评测、迭代优化流程', 5),
  ((select id from skill_modules where slug='prompt-eng'), '多语言与多场景 Prompt', '实现跨语言、跨场景的 Prompt 适配', 0.5, '多语言 Prompt 策略、场景适配、本地化考量', 6),
  ((select id from skill_modules where slug='prompt-eng'), 'Prompt 安全与注入防御', '识别 Prompt Injection 风险并设计防御措施', 1.0, '注入攻击类型、防御策略、输入验证与沙箱', 7),
  ((select id from skill_modules where slug='prompt-eng'), '高级 Prompt Engineering 实战', '综合案例：为真实产品场景设计 Prompt 体系', 1.0, '完整 Prompt 体系设计案例，包含多轮对话、工具调用', 8);

-- AI 商业化与 ROI
insert into learning_tasks (module_id, title, objective, estimated_days, content_summary, sort_order) values
  ((select id from skill_modules where slug='ai-commercialization'), 'AI 产品成本结构', '理解 Token 计费、推理成本、训练成本', 0.5, 'AI 产品的成本构成、计费模型、成本预测方法', 1),
  ((select id from skill_modules where slug='ai-commercialization'), 'Token 成本优化策略', '掌握缓存、模型选择、批处理等降本方法', 1.0, 'Prompt 缓存、模型路由、批处理、蒸馏降本', 2),
  ((select id from skill_modules where slug='ai-commercialization'), '单位经济学模型', '拆解 AI 产品的 unit economics', 1.0, '边际成本、固定成本、盈亏平衡分析', 3),
  ((select id from skill_modules where slug='ai-commercialization'), 'AI 功能定价策略', '设计 SaaS + AI 的混合定价模型', 1.0, '用量定价、席位定价、混合模型、定价心理学', 4),
  ((select id from skill_modules where slug='ai-commercialization'), '落地场景闭环设计', '从 MVP 到规模化的产品-商业闭环', 1.0, '场景选择、MVP 验证、增长飞轮设计', 5),
  ((select id from skill_modules where slug='ai-commercialization'), 'AI 产品 ROI 评估', '4建立投资回报率的量化评估框架', 1.0, 'ROI 计算模型、无形价值量化、长期收益评估', 6),
  ((select id from skill_modules where slug='ai-commercialization'), 'AI 商业化实战案例', '拆解成功与失败的 AI 商业化案例', 1.0, 'Notion AI、GitHub Copilot、Jasper 等案例', 7);

-- AI 编码能力（Vibe Coding）
insert into learning_tasks (module_id, title, objective, estimated_days, content_summary, sort_order) values
  ((select id from skill_modules where slug='vibe-coding'), 'AI 辅助编程基础', '理解 Vibe Coding 的理念与工具链', 0.5, 'Vibe Coding 概念、工具生态、适用场景', 1),
  ((select id from skill_modules where slug='vibe-coding'), 'Claude Code / Cursor 实践', '掌握主流 AI 编码工具的使用', 1.0, 'Claude Code、Cursor、Windsurf 的使用技巧与效率提升', 2),
  ((select id from skill_modules where slug='vibe-coding'), 'AI 辅助原型开发', '用 AI 快速搭建可交互的产品原型', 1.0, '原型设计思路、AI 辅助前端开发、交互验证', 3),
  ((select id from skill_modules where slug='vibe-coding'), 'MVP 快速搭建', '从想法到可演示 MVP 的 AI 加速路径', 1.0, 'MVP 范围界定、AI 辅助全栈开发、部署上线', 4),
  ((select id from skill_modules where slug='vibe-coding'), 'AI 生成代码审查', '学会审查 AI 生成的代码，保证质量与安全', 1.0, '代码审查要点、安全漏洞识别、性能问题发现', 5),
  ((select id from skill_modules where slug='vibe-coding'), 'AI 辅助调试与优化', '用 AI 定位 bug、优化性能', 1.0, 'AI 辅助 Debug、性能分析、重构建议', 6),
  ((select id from skill_modules where slug='vibe-coding'), 'Vibe Coding 实战项目', '完成一个完整的 AI 辅助开发流程', 1.0, '端到端项目实战：从需求到部署的 AI 辅助全流程', 7);

-- AI 伦理与安全
insert into learning_tasks (module_id, title, objective, estimated_days, content_summary, sort_order) values
  ((select id from skill_modules where slug='ai-ethics'), 'AI 伦理基础框架', '理解 AI 伦理的核心原则与常见困境', 0.5, '公平性、透明性、隐私、问责制等核心原则', 1),
  ((select id from skill_modules where slug='ai-ethics'), '模型合规要求', '了解全球主要 AI 法规与合规框架', 1.0, 'EU AI Act、中国生成式 AI 管理办法、NIST 框架', 2),
  ((select id from skill_modules where slug='ai-ethics'), '隐私保护与数据治理', '设计 AI 产品中的隐私保护与数据治理策略', 1.0, '差分隐私、数据脱敏、联邦学习、用户数据控制', 3),
  ((select id from skill_modules where slug='ai-ethics'), '可解释性与透明度', '实现模型决策的可解释性与产品透明度', 1.0, '可解释性方法、LIME/SHAP、产品透明度设计', 4),
  ((select id from skill_modules where slug='ai-ethics'), '对齐安全', '理解 AI 对齐问题、红队测试与安全评估', 1.0, '对齐问题、RLHF/DPO、红队测试、安全评估', 5),
  ((select id from skill_modules where slug='ai-ethics'), '有害内容防控', '设计内容安全策略与过滤机制', 1.0, '内容分类、过滤 Pipeline、人工审核、误判优化', 6),
  ((select id from skill_modules where slug='ai-ethics'), 'AI 伦理产品实践', '将伦理考量嵌入产品开发全流程', 1.0, '伦理审查清单、影响评估、持续监控机制', 7);

-- AI 技术前沿趋势
insert into learning_tasks (module_id, title, objective, estimated_days, content_summary, sort_order) values
  ((select id from skill_modules where slug='ai-tech-trends'), '大模型技术演进', '了解 Transformer 到 GPT/Claude/Gemini 的技术路线', 0.5, '模型架构演进、训练范式变化、能力跃迁', 1),
  ((select id from skill_modules where slug='ai-tech-trends'), 'Agent 框架生态', '对比主流 Agent 框架的特点与适用场景', 1.0, 'LangChain、CrewAI、AutoGen 等框架对比与选型', 2),
  ((select id from skill_modules where slug='ai-tech-trends'), '多模态 AI 进展', '跟踪图像、视频、语音生成的最新突破', 1.0, '多模态模型进展、生成质量评估、产品化路径', 3),
  ((select id from skill_modules where slug='ai-tech-trends'), 'AI Infra 与部署', '了解推理优化、边缘部署、模型蒸馏趋势', 1.0, '推理加速、量化部署、边缘计算、成本优化', 4),
  ((select id from skill_modules where slug='ai-tech-trends'), 'AI 产品化新范式', '理解从 Chatbot 到 Agent 到 Workflow 的产品演进', 1.0, '产品形态演进、交互范式变化、用户习惯迁移', 5),
  ((select id from skill_modules where slug='ai-tech-trends'), 'AI 行业应用案例', '学习医疗、教育、金融等领域的 AI 应用', 1.0, '各行业 AI 落地案例、成功因素、挑战与启示', 6),
  ((select id from skill_modules where slug='ai-tech-trends'), 'AI 趋势追踪方法', '建立个人的 AI 趋势追踪体系', 1.0, '信息源选择、追踪工具、知识管理、持续学习策略', 7);

-- -----------------------------------------------------------
-- 趋势简报种子数据（5 条示例）
-- -----------------------------------------------------------
insert into trend_briefs (title, published_at, summary_points, impact_analysis, learning_suggestion, source_ref) values
  ('Claude 4 系列发布：Opus 4.6 与 Sonnet 4.6', '2026-04-10',
   '["Claude Opus 4.6 在复杂推理任务上显著提升", "Sonnet 4.6 速度提升 40% 同时保持高质量", "新增多模态理解能力"]'::jsonb,
   '更强的推理能力意味着 AI PM 可以将更复杂的产品分析任务交给 AI，但需要重新评估哪些工作流适合自动化',
   '建议体验 Claude 4 系列的新能力，特别是长文档理解和复杂推理场景', 'https://www.anthropic.com'),

  ('MCP 协议正式成为行业标准', '2026-04-08',
   '["Model Context Protocol 被主要 AI 厂商采纳", "工具生态快速扩展，已有 500+ MCP Server", "标准化促进跨平台工具复用"]'::jsonb,
   'MCP 标准化大幅降低了 AI 产品集成外部工具的成本，AI PM 需要理解 MCP 以设计更好的工具调用体验',
   '学习 MCP 协议规范，尝试搭建一个简单的 MCP Server', 'https://modelcontextprotocol.io'),

  ('AI Agent 从单任务走向多 Agent 协作', '2026-04-05',
   '["多 Agent 架构在复杂任务中表现优于单 Agent", "Agent 间通信协议逐步标准化", "编排层（Orchestration）成为新的设计焦点"]'::jsonb,
   '多 Agent 架构为复杂 AI 产品提供了新的设计范式，AI PM 需要掌握 Agent 编排和任务分解能力',
   '研究 CrewAI 和 AutoGen 的多 Agent 模式，思考在产品中如何应用', 'https://arxiv.org'),

  ('AI 评测（Evals）成为产品经理核心技能', '2026-04-03',
   '["大厂 JD 中 Evals 出现频率增长 300%", "评测驱动开发（Eval-Driven Dev）成为新范式", "自动化评测工具链快速成熟"]'::jsonb,
   'Evals 从"可选"变为"必选"，AI PM 必须掌握评测集设计和质量基准定义，这是面试高频考点',
   '重点学习评测集编写实践和质量基准设计，这是当前最紧缺的 AI PM 技能', 'https://aieval.org'),

  ('Vibe Coding 进入主流开发流程', '2026-04-01',
   '["AI 辅助编码工具采用率超过 60%", "Vibe Coding 从原型开发扩展到生产代码", "代码审查中 AI 生成代码占比持续上升"]'::jsonb,
   'AI PM 需要理解 Vibe Coding 的能力边界和最佳实践，以便在技术评审中做出合理判断',
   '尝试用 Claude Code 或 Cursor 完成一个小项目，体验 AI 辅助开发全流程', 'https://github.com');
