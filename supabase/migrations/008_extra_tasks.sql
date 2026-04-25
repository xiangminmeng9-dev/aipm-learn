-- ============================================================
-- 008_skills_v2_extra_tasks.sql
-- 补充每个模块到 10 个任务
-- ============================================================

-- user-research 补 4 个 (当前 6)
insert into learning_tasks (module_id, title, objective, estimated_days, content_summary, sort_order, resources) values
((select id from skill_modules where slug='user-research'), 'A/B 测试中的用户行为分析', '通过实验数据理解用户行为差异', 1.0, '行为指标定义、漏斗分析、热力图、Session回放', 7,
 '[{"type":"article","title":"用户行为分析实战","url":"https://www.woshipm.com/data-analysis/5789012.html","source":"人人都是产品经理"}]'::jsonb),
((select id from skill_modules where slug='user-research'), '用户反馈收集与管理', '建立系统化的用户反馈收集和处理机制', 1.0, '反馈渠道、分类标签、优先级排序、闭环管理', 8,
 '[{"type":"article","title":"用户反馈管理体系","url":"https://www.woshipm.com/user-research/5890123.html","source":"人人都是产品经理"}]'::jsonb),
((select id from skill_modules where slug='user-research'), '竞品用户体验对比', '系统化对比竞品的用户体验差异', 1.0, '体验走查、对比维度、评分体系、改进建议', 9,
 '[{"type":"article","title":"竞品UX对比方法","url":"https://www.woshipm.com/evaluating/5901234.html","source":"人人都是产品经理"}]'::jsonb),
((select id from skill_modules where slug='user-research'), '用户研究报告撰写', '输出有说服力的用户研究报告', 1.0, '报告结构、数据呈现、洞察提炼、行动建议', 10,
 '[{"type":"article","title":"用户研究报告模板","url":"https://www.woshipm.com/user-research/5012345.html","source":"人人都是产品经理"}]'::jsonb);

-- data-analysis 补 4 个 (当前 6)
insert into learning_tasks (module_id, title, objective, estimated_days, content_summary, sort_order, resources) values
((select id from skill_modules where slug='data-analysis'), '用户分群与队列分析', '掌握用户分群方法和队列分析技巧', 1.0, 'RFM模型、行为分群、队列留存、生命周期分析', 7,
 '[{"type":"article","title":"用户分群实战指南","url":"https://www.woshipm.com/data-analysis/5123456.html","source":"人人都是产品经理"}]'::jsonb),
((select id from skill_modules where slug='data-analysis'), '数据埋点设计', '设计完整的数据埋点方案', 1.0, '埋点规范、事件设计、属性定义、埋点验证', 8,
 '[{"type":"article","title":"数据埋点设计指南","url":"https://www.woshipm.com/data-analysis/5234567.html","source":"人人都是产品经理"}]'::jsonb),
((select id from skill_modules where slug='data-analysis'), '数据异常排查', '快速定位和排查数据异常问题', 1.0, '异常检测、归因分析、排查流程、案例复盘', 9,
 '[{"type":"article","title":"数据异常排查方法论","url":"https://www.woshipm.com/data-analysis/5345678.html","source":"人人都是产品经理"}]'::jsonb),
((select id from skill_modules where slug='data-analysis'), '数据分析报告与汇报', '用数据讲好故事，驱动业务决策', 1.0, '报告结构、图表选择、故事线、决策建议', 10,
 '[{"type":"article","title":"数据分析报告撰写","url":"https://www.woshipm.com/data-analysis/5456789.html","source":"人人都是产品经理"},{"type":"book","title":"用数据讲故事","url":"","source":"Cole Nussbaumer Knaflic"}]'::jsonb);

-- ai-cognition 补 4 个 (当前 6)
insert into learning_tasks (module_id, title, objective, estimated_days, content_summary, sort_order, resources) values
((select id from skill_modules where slug='ai-cognition'), 'AI 产品的用户心智', '理解用户对 AI 产品的认知和期望', 1.0, '用户对AI的信任模型、期望管理、拟人化陷阱', 7,
 '[{"type":"article","title":"AI产品用户心智研究","url":"https://www.woshipm.com/ai/5567890.html","source":"人人都是产品经理"}]'::jsonb),
((select id from skill_modules where slug='ai-cognition'), 'AI 产品的数据飞轮', '理解数据如何驱动 AI 产品持续改进', 1.0, '数据飞轮模型、冷启动策略、数据质量管理', 8,
 '[{"type":"article","title":"AI产品数据飞轮","url":"https://www.woshipm.com/ai/5678901.html","source":"人人都是产品经理"}]'::jsonb),
((select id from skill_modules where slug='ai-cognition'), 'AI 与传统产品的协同', '学会在传统产品中合理引入 AI 能力', 1.0, '场景识别、渐进式引入、效果评估、用户教育', 9,
 '[{"type":"article","title":"传统产品AI化路径","url":"https://www.woshipm.com/ai/5789012.html","source":"人人都是产品经理"}]'::jsonb),
((select id from skill_modules where slug='ai-cognition'), 'AI 产品竞争格局', '了解当前 AI 产品市场的竞争态势', 1.0, '主要玩家、技术路线、商业模式、护城河分析', 10,
 '[{"type":"article","title":"AI产品竞争格局分析","url":"https://www.woshipm.com/ai/5890123.html","source":"人人都是产品经理"}]'::jsonb);

-- prompt-eng 补 4 个 (当前 6)
insert into learning_tasks (module_id, title, objective, estimated_days, content_summary, sort_order, resources) values
((select id from skill_modules where slug='prompt-eng'), '结构化输出控制', '让 AI 按指定格式输出 JSON/表格等结构化数据', 1.0, 'JSON Schema约束、输出格式指令、解析与容错', 7,
 '[{"type":"article","title":"结构化输出最佳实践","url":"https://docs.anthropic.com/en/docs/build-with-claude/tool-use","source":"Anthropic"}]'::jsonb),
((select id from skill_modules where slug='prompt-eng'), '多轮对话 Prompt 设计', '设计支持多轮对话的 Prompt 体系', 1.0, '上下文管理、记忆压缩、对话状态追踪', 8,
 '[{"type":"article","title":"多轮对话Prompt设计","url":"https://www.woshipm.com/ai/5901234.html","source":"人人都是产品经理"}]'::jsonb),
((select id from skill_modules where slug='prompt-eng'), '工具调用 Prompt 设计', '设计让 AI 正确调用外部工具的 Prompt', 1.0, '工具描述编写、参数约束、错误处理、重试策略', 9,
 '[{"type":"article","title":"Tool Use Prompt设计","url":"https://docs.anthropic.com/en/docs/build-with-claude/tool-use","source":"Anthropic"}]'::jsonb),
((select id from skill_modules where slug='prompt-eng'), 'Prompt 版本管理与协作', '在团队中管理和迭代 Prompt', 1.0, '版本控制、变更记录、团队协作流程、回滚策略', 10,
 '[{"type":"article","title":"Prompt版本管理实践","url":"https://www.woshipm.com/ai/5012345.html","source":"人人都是产品经理"}]'::jsonb);

-- evals 补 4 个 (当前 6)
insert into learning_tasks (module_id, title, objective, estimated_days, content_summary, sort_order, resources) values
((select id from skill_modules where slug='evals'), 'LLM-as-Judge 评测', '使用 LLM 作为评测工具评估输出质量', 1.0, 'LLM评分设计、评分一致性、与人工评分对比', 7,
 '[{"type":"article","title":"LLM-as-Judge实践","url":"https://www.woshipm.com/ai/5123456.html","source":"人人都是产品经理"}]'::jsonb),
((select id from skill_modules where slug='evals'), '安全性评测', '评测 AI 产品的安全性和鲁棒性', 1.0, '对抗测试、越狱检测、边界输入、安全评分', 8,
 '[{"type":"article","title":"AI安全性评测方法","url":"https://www.woshipm.com/ai/5234567.html","source":"人人都是产品经理"}]'::jsonb),
((select id from skill_modules where slug='evals'), '用户满意度评测', '将用户反馈纳入评测体系', 1.0, '满意度指标、隐式反馈、评测与用户数据关联', 9,
 '[{"type":"article","title":"AI产品满意度评测","url":"https://www.woshipm.com/ai/5345678.html","source":"人人都是产品经理"}]'::jsonb),
((select id from skill_modules where slug='evals'), '评测驱动开发实践', '将评测融入日常开发迭代流程', 1.0, '评测驱动开发流程、持续评测、评测看板', 10,
 '[{"type":"article","title":"评测驱动开发","url":"https://www.woshipm.com/ai/5456789.html","source":"人人都是产品经理"}]'::jsonb);

-- ai-product-design 补 4 个 (当前 6)
insert into learning_tasks (module_id, title, objective, estimated_days, content_summary, sort_order, resources) values
((select id from skill_modules where slug='ai-product-design'), 'AI 产品的信任设计', '设计让用户信任 AI 输出的产品机制', 1.0, '置信度展示、来源引用、可编辑输出、反馈机制', 7,
 '[{"type":"article","title":"AI产品信任设计","url":"https://www.woshipm.com/ai/5567890.html","source":"人人都是产品经理"}]'::jsonb),
((select id from skill_modules where slug='ai-product-design'), 'AI 产品的错误处理', '设计优雅的 AI 错误和降级体验', 1.0, '错误分类、降级方案、用户引导、重试机制', 8,
 '[{"type":"article","title":"AI产品错误处理设计","url":"https://www.woshipm.com/ai/5678901.html","source":"人人都是产品经理"}]'::jsonb),
((select id from skill_modules where slug='ai-product-design'), 'AI 产品的个性化策略', '设计基于用户画像的个性化 AI 体验', 1.0, '个性化维度、偏好学习、冷启动、隐私平衡', 9,
 '[{"type":"article","title":"AI个性化策略设计","url":"https://www.woshipm.com/ai/5789012.html","source":"人人都是产品经理"}]'::jsonb),
((select id from skill_modules where slug='ai-product-design'), 'AI 产品竞品分析方法', '针对 AI 产品的竞品分析框架', 1.0, 'AI能力对比、模型效果对比、用户体验对比、成本对比', 10,
 '[{"type":"article","title":"AI产品竞品分析框架","url":"https://www.woshipm.com/ai/5890123.html","source":"人人都是产品经理"}]'::jsonb);

-- ai-commercialization 补 4 个 (当前 6)
insert into learning_tasks (module_id, title, objective, estimated_days, content_summary, sort_order, resources) values
((select id from skill_modules where slug='ai-commercialization'), '免费增值模型设计', '设计 AI 产品的免费与付费边界', 1.0, '功能分层、用量限制、转化漏斗、付费触发点', 7,
 '[{"type":"article","title":"AI产品免费增值设计","url":"https://www.woshipm.com/ai/5901234.html","source":"人人都是产品经理"}]'::jsonb),
((select id from skill_modules where slug='ai-commercialization'), 'AI 产品增长策略', '设计 AI 产品的增长飞轮', 1.0, '产品驱动增长、网络效应、数据飞轮、口碑传播', 8,
 '[{"type":"article","title":"AI产品增长策略","url":"https://www.woshipm.com/ai/5012345.html","source":"人人都是产品经理"}]'::jsonb),
((select id from skill_modules where slug='ai-commercialization'), 'AI 产品的竞争壁垒', '构建 AI 产品的长期竞争优势', 1.0, '数据壁垒、模型壁垒、生态壁垒、品牌壁垒', 9,
 '[{"type":"article","title":"AI产品竞争壁垒分析","url":"https://www.woshipm.com/ai/5123456.html","source":"人人都是产品经理"}]'::jsonb),
((select id from skill_modules where slug='ai-commercialization'), 'AI 产品商业计划书', '编写完整的 AI 产品商业计划', 1.0, '市场分析、商业模式、财务预测、融资策略', 10,
 '[{"type":"article","title":"AI产品商业计划书模板","url":"https://www.woshipm.com/ai/5234567.html","source":"人人都是产品经理"}]'::jsonb);

-- ai-native-design 补 4 个 (当前 6)
insert into learning_tasks (module_id, title, objective, estimated_days, content_summary, sort_order, resources) values
((select id from skill_modules where slug='ai-native-design'), 'AI 工作流编排', '设计复杂的 AI 工作流和任务编排', 1.0, '工作流引擎、DAG设计、条件分支、错误重试', 7,
 '[{"type":"article","title":"AI工作流编排实践","url":"https://www.woshipm.com/ai/5345678.html","source":"人人都是产品经理"}]'::jsonb),
((select id from skill_modules where slug='ai-native-design'), '向量数据库与检索', '理解向量数据库的选型和检索优化', 1.0, '向量数据库对比、索引策略、混合检索、性能优化', 8,
 '[{"type":"article","title":"向量数据库选型指南","url":"https://www.woshipm.com/ai/5456789.html","source":"人人都是产品经理"}]'::jsonb),
((select id from skill_modules where slug='ai-native-design'), 'AI 产品的缓存策略', '设计 AI 产品的多级缓存方案', 1.0, '语义缓存、结果缓存、模型缓存、缓存失效策略', 9,
 '[{"type":"article","title":"AI产品缓存策略","url":"https://www.woshipm.com/ai/5567890.html","source":"人人都是产品经理"}]'::jsonb),
((select id from skill_modules where slug='ai-native-design'), 'AI 系统架构实战', '端到端设计一个 AI 原生产品架构', 1.0, '综合案例：从需求到架构的完整AI原生产品设计', 10,
 '[{"type":"article","title":"AI系统架构案例","url":"https://www.woshipm.com/ai/5678901.html","source":"人人都是产品经理"}]'::jsonb);

-- vibe-coding 补 5 个 (当前 5)
insert into learning_tasks (module_id, title, objective, estimated_days, content_summary, sort_order, resources) values
((select id from skill_modules where slug='vibe-coding'), 'AI 辅助调试与优化', '用 AI 定位 bug、优化性能', 1.0, 'AI辅助Debug、性能分析、重构建议', 6,
 '[{"type":"article","title":"AI辅助调试实战","url":"https://www.woshipm.com/ai/5789012.html","source":"人人都是产品经理"}]'::jsonb),
((select id from skill_modules where slug='vibe-coding'), 'AI 辅助测试编写', '用 AI 生成测试用例和测试代码', 1.0, '单元测试生成、E2E测试、测试覆盖率提升', 7,
 '[{"type":"article","title":"AI辅助测试实践","url":"https://www.woshipm.com/ai/5890123.html","source":"人人都是产品经理"}]'::jsonb),
((select id from skill_modules where slug='vibe-coding'), 'AI 辅助文档编写', '用 AI 生成技术文档和产品文档', 1.0, 'README生成、API文档、变更日志、用户指南', 8,
 '[{"type":"article","title":"AI辅助文档编写","url":"https://www.woshipm.com/ai/5901234.html","source":"人人都是产品经理"}]'::jsonb),
((select id from skill_modules where slug='vibe-coding'), 'AI 编码工具链集成', '搭建完整的 AI 辅助开发工具链', 1.0, 'IDE插件、CLI工具、CI/CD集成、团队规范', 9,
 '[{"type":"article","title":"AI开发工具链搭建","url":"https://www.woshipm.com/ai/5012345.html","source":"人人都是产品经理"}]'::jsonb),
((select id from skill_modules where slug='vibe-coding'), 'Vibe Coding 实战项目', '完成一个完整的 AI 辅助开发流程', 1.0, '端到端项目实战：从需求到部署的AI辅助全流程', 10,
 '[{"type":"article","title":"Vibe Coding实战","url":"https://www.woshipm.com/ai/5123456.html","source":"人人都是产品经理"}]'::jsonb);

-- ai-ethics 补 5 个 (当前 5)
insert into learning_tasks (module_id, title, objective, estimated_days, content_summary, sort_order, resources) values
((select id from skill_modules where slug='ai-ethics'), 'AI 偏见检测与缓解', '识别和缓解 AI 系统中的偏见', 1.0, '偏见类型、检测方法、缓解策略、公平性指标', 6,
 '[{"type":"article","title":"AI偏见检测实践","url":"https://www.woshipm.com/ai/5234567.html","source":"人人都是产品经理"}]'::jsonb),
((select id from skill_modules where slug='ai-ethics'), 'AI 产品的用户知情权', '设计让用户了解 AI 参与的透明机制', 1.0, 'AI标识、决策解释、数据使用说明、退出机制', 7,
 '[{"type":"article","title":"AI透明度设计","url":"https://www.woshipm.com/ai/5345678.html","source":"人人都是产品经理"}]'::jsonb),
((select id from skill_modules where slug='ai-ethics'), 'AI 版权与知识产权', '理解 AI 生成内容的版权问题', 1.0, 'AI生成内容版权、训练数据合规、商用授权', 8,
 '[{"type":"article","title":"AI版权问题解析","url":"https://www.woshipm.com/ai/5456789.html","source":"人人都是产品经理"}]'::jsonb),
((select id from skill_modules where slug='ai-ethics'), '负责任的 AI 发布', '设计安全的 AI 产品发布流程', 1.0, '灰度发布、风险评估、应急预案、监控告警', 9,
 '[{"type":"article","title":"负责任AI发布指南","url":"https://www.woshipm.com/ai/5567890.html","source":"人人都是产品经理"}]'::jsonb),
((select id from skill_modules where slug='ai-ethics'), 'AI 伦理产品实践', '将伦理考量嵌入产品开发全流程', 1.0, '伦理审查清单、影响评估、持续监控机制', 10,
 '[{"type":"article","title":"AI伦理实践指南","url":"https://www.woshipm.com/ai/5678901.html","source":"人人都是产品经理"}]'::jsonb);

-- ai-pm-practice 补 5 个 (当前 5)
insert into learning_tasks (module_id, title, objective, estimated_days, content_summary, sort_order, resources) values
((select id from skill_modules where slug='ai-pm-practice'), '从0到1 AI 产品立项', '完成一个 AI 产品的立项全流程', 1.0, '机会发现、可行性分析、立项报告、资源申请', 6,
 '[{"type":"article","title":"AI产品立项方法","url":"https://www.woshipm.com/ai/5789012.html","source":"人人都是产品经理"}]'::jsonb),
((select id from skill_modules where slug='ai-pm-practice'), 'AI 产品数据运营', '建立 AI 产品的数据运营体系', 1.0, '数据看板、异常监控、效果归因、迭代决策', 7,
 '[{"type":"article","title":"AI产品数据运营","url":"https://www.woshipm.com/ai/5890123.html","source":"人人都是产品经理"}]'::jsonb),
((select id from skill_modules where slug='ai-pm-practice'), 'AI 产品用户运营', '设计 AI 产品的用户运营策略', 1.0, '用户分层、激活策略、留存提升、社区运营', 8,
 '[{"type":"article","title":"AI产品用户运营","url":"https://www.woshipm.com/ai/5901234.html","source":"人人都是产品经理"}]'::jsonb),
((select id from skill_modules where slug='ai-pm-practice'), 'AI 产品国际化', '了解 AI 产品出海的关键考量', 1.0, '多语言适配、合规差异、文化差异、本地化策略', 9,
 '[{"type":"article","title":"AI产品国际化指南","url":"https://www.woshipm.com/ai/5012345.html","source":"人人都是产品经理"}]'::jsonb),
((select id from skill_modules where slug='ai-pm-practice'), 'AI PM 职业发展规划', '规划 AI 产品经理的长期职业路径', 1.0, '能力模型、晋升路径、行业选择、个人品牌', 10,
 '[{"type":"article","title":"AI PM职业发展","url":"https://www.woshipm.com/ai/5123456.html","source":"人人都是产品经理"}]'::jsonb);

-- ai-leadership 补 6 个 (当前 4)
insert into learning_tasks (module_id, title, objective, estimated_days, content_summary, sort_order, resources) values
((select id from skill_modules where slug='ai-leadership'), 'AI 产品组合管理', '管理多个 AI 产品线的优先级和资源分配', 1.0, '产品组合矩阵、资源分配、协同效应、砍线决策', 5,
 '[{"type":"article","title":"AI产品组合管理","url":"https://www.woshipm.com/ai/5234567.html","source":"人人都是产品经理"}]'::jsonb),
((select id from skill_modules where slug='ai-leadership'), 'AI 产品的技术债管理', '平衡快速迭代与技术债务', 1.0, '技术债识别、优先级评估、还债策略、预防机制', 6,
 '[{"type":"article","title":"AI技术债管理","url":"https://www.woshipm.com/ai/5345678.html","source":"人人都是产品经理"}]'::jsonb),
((select id from skill_modules where slug='ai-leadership'), '向上管理与汇报', '向高管有效汇报 AI 产品进展和价值', 1.0, '汇报框架、ROI展示、风险沟通、资源争取', 7,
 '[{"type":"article","title":"AI产品向上汇报","url":"https://www.woshipm.com/ai/5456789.html","source":"人人都是产品经理"}]'::jsonb),
((select id from skill_modules where slug='ai-leadership'), 'AI 产品文化建设', '在团队中建立 AI-first 的产品文化', 1.0, '文化塑造、知识分享、实验精神、失败容忍', 8,
 '[{"type":"article","title":"AI产品文化建设","url":"https://www.woshipm.com/ai/5567890.html","source":"人人都是产品经理"}]'::jsonb),
((select id from skill_modules where slug='ai-leadership'), 'AI 生态合作策略', '设计 AI 产品的生态合作方案', 1.0, '合作模式、API开放、平台策略、生态治理', 9,
 '[{"type":"article","title":"AI生态合作策略","url":"https://www.woshipm.com/ai/5678901.html","source":"人人都是产品经理"}]'::jsonb),
((select id from skill_modules where slug='ai-leadership'), 'AI 产品领导力实战', '综合案例：带领团队完成 AI 产品战略落地', 1.0, '战略制定、团队组建、执行推进、复盘迭代', 10,
 '[{"type":"article","title":"AI产品领导力案例","url":"https://www.woshipm.com/ai/5789012.html","source":"人人都是产品经理"}]'::jsonb);

-- pm-basics 补 2 个 (当前 8)
insert into learning_tasks (module_id, title, objective, estimated_days, content_summary, sort_order, resources) values
((select id from skill_modules where slug='pm-basics'), '产品生命周期管理', '理解产品从引入到衰退的全生命周期', 1.0, '引入期、成长期、成熟期、衰退期的策略差异', 9,
 '[{"type":"article","title":"产品生命周期管理","url":"https://www.woshipm.com/pmd/5789012.html","source":"人人都是产品经理"}]'::jsonb),
((select id from skill_modules where slug='pm-basics'), '产品思维案例拆解', '通过经典案例深化产品思维', 1.0, '微信、抖音、Notion等产品的设计决策拆解', 10,
 '[{"type":"article","title":"经典产品案例拆解","url":"https://www.woshipm.com/pmd/5890123.html","source":"人人都是产品经理"}]'::jsonb);
