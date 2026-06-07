-- 新增5个学习地图节点对应的技能模块
INSERT INTO skill_modules (slug, name, description, icon, job_targets, sort_order, level, level_name, prerequisites) VALUES
  ('ai-growth', 'AI 产品运营与增长', '冷启动策略、留存活跃、定价策略、增长实验、数据飞轮', '🚀', '["C端产品","B端产品"]', 29, 3, '进阶专项', '{}'),
  ('ai-safety', 'AI 安全与对齐', 'Prompt注入防御、越狱防护、数据隐私、偏见公平、模型对齐', '🛡️', '["C端产品","B端产品","平台中台"]', 30, 3, '进阶专项', '{}'),
  ('data-flywheel', 'AI 产品数据飞轮', '用户反馈采集、主动学习、人机协同标注、数据驱动迭代', '🔄', '["C端产品","B端产品","平台中台"]', 31, 3, '进阶专项', '{}'),
  ('ai-frontier', 'AI 前沿技术跟踪', 'Agent框架(AutoGen/CrewAI/LangGraph)、MCP生态、前沿跟踪方法论', '🔭', '["C端产品","B端产品","平台中台"]', 32, 2, '核心能力', '{}'),
  ('job-practice', 'AI PM 求职实战', '作品集搭建、面试项目展示、岗位趋势、求职策略、职业发展', '🎯', '["C端产品","B端产品","平台中台"]', 33, 4, '实战综合', '{}')
ON CONFLICT (slug) DO NOTHING;

-- 为每个新模块添加学习任务
-- ai-growth 任务
INSERT INTO learning_tasks (module_id, title, objective, estimated_days, content_summary, sort_order, resources)
SELECT id, '设计AI产品冷启动方案', '掌握AI产品冷启动策略和免费增值模式设计', 3, '种子用户选择、冷启动内容策略、免费增值模式设计、场景化引导', 1, '[]'
FROM skill_modules WHERE slug = 'ai-growth';

INSERT INTO learning_tasks (module_id, title, objective, estimated_days, content_summary, sort_order, resources)
SELECT id, '分析AI产品留存指标', '理解AI产品特有留存指标和流失预警机制', 3, '留存指标体系、流失预警、习惯养成设计、功能发现机制', 2, '[]'
FROM skill_modules WHERE slug = 'ai-growth';

INSERT INTO learning_tasks (module_id, title, objective, estimated_days, content_summary, sort_order, resources)
SELECT id, '设计AI产品定价策略', '掌握AI产品定价模型和价格弹性测试方法', 3, '定价模型对比、价格弹性测试、免费额度设计、企业版差异化、成本结构分析', 3, '[]'
FROM skill_modules WHERE slug = 'ai-growth';

INSERT INTO learning_tasks (module_id, title, objective, estimated_days, content_summary, sort_order, resources)
SELECT id, '执行增长实验', '学会设计和执行AI产品增长实验', 2, '增长实验框架、A/B测试在AI产品中的特殊性、病毒系数优化', 4, '[]'
FROM skill_modules WHERE slug = 'ai-growth';

INSERT INTO learning_tasks (module_id, title, objective, estimated_days, content_summary, sort_order, resources)
SELECT id, '构建增长看板', '设计AI产品增长看板和数据驱动决策流程', 2, '北极星指标选择、AI特有增长指标、增长看板设计', 5, '[]'
FROM skill_modules WHERE slug = 'ai-growth';

-- ai-safety 任务
INSERT INTO learning_tasks (module_id, title, objective, estimated_days, content_summary, sort_order, resources)
SELECT id, '防御Prompt注入攻击', '理解Prompt注入原理并设计分层防御方案', 3, '直接注入、间接注入、防御策略、红队测试', 1, '[]'
FROM skill_modules WHERE slug = 'ai-safety';

INSERT INTO learning_tasks (module_id, title, objective, estimated_days, content_summary, sort_order, resources)
SELECT id, '设计越狱防护方案', '掌握越狱攻击类型和多层防护策略', 2, '越狱类型、越狱防御、对抗测试、安全评估', 2, '[]'
FROM skill_modules WHERE slug = 'ai-safety';

INSERT INTO learning_tasks (module_id, title, objective, estimated_days, content_summary, sort_order, resources)
SELECT id, '梳理数据隐私合规', '理解AI产品数据隐私要求和隐私增强技术', 3, '训练数据隐私、用户数据保护、隐私增强技术、合规要求', 3, '[]'
FROM skill_modules WHERE slug = 'ai-safety';

INSERT INTO learning_tasks (module_id, title, objective, estimated_days, content_summary, sort_order, resources)
SELECT id, '检测模型偏见与公平性', '学会检测和缓解AI模型偏见', 2, '偏见来源、偏见类型、偏见检测、偏见缓解、公平性权衡', 4, '[]'
FROM skill_modules WHERE slug = 'ai-safety';

INSERT INTO learning_tasks (module_id, title, objective, estimated_days, content_summary, sort_order, resources)
SELECT id, '理解模型对齐技术', '掌握RLHF、Constitutional AI、DPO等对齐方法', 3, 'RLHF、Constitutional AI、DPO、对齐挑战、可扩展监督', 5, '[]'
FROM skill_modules WHERE slug = 'ai-safety';

-- data-flywheel 任务
INSERT INTO learning_tasks (module_id, title, objective, estimated_days, content_summary, sort_order, resources)
SELECT id, '设计数据飞轮闭环', '理解数据飞轮原理并设计产品数据闭环', 3, '飞轮效应、飞轮启动、飞轮加速、飞轮阻力、飞轮护城河', 1, '[]'
FROM skill_modules WHERE slug = 'data-flywheel';

INSERT INTO learning_tasks (module_id, title, objective, estimated_days, content_summary, sort_order, resources)
SELECT id, '搭建用户反馈采集体系', '设计显式和隐式反馈采集方案', 3, '显式反馈、隐式反馈、反馈质量、反馈闭环', 2, '[]'
FROM skill_modules WHERE slug = 'data-flywheel';

INSERT INTO learning_tasks (module_id, title, objective, estimated_days, content_summary, sort_order, resources)
SELECT id, '实施主动学习策略', '掌握主动学习在数据获取中的应用', 2, '主动学习、不确定性采样、多样性采样、成本效率', 3, '[]'
FROM skill_modules WHERE slug = 'data-flywheel';

INSERT INTO learning_tasks (module_id, title, objective, estimated_days, content_summary, sort_order, resources)
SELECT id, '优化人机协同标注流程', '设计AI辅助标注流程和质量控制方案', 3, '标注流程设计、标注质量控制、标注工具链、标注效率提升', 4, '[]'
FROM skill_modules WHERE slug = 'data-flywheel';

INSERT INTO learning_tasks (module_id, title, objective, estimated_days, content_summary, sort_order, resources)
SELECT id, '管理模型迭代周期', '掌握数据驱动的模型迭代和回归测试', 2, '迭代节奏、效果回归测试、数据版本管理、灾难性遗忘', 5, '[]'
FROM skill_modules WHERE slug = 'data-flywheel';

-- ai-frontier 任务
INSERT INTO learning_tasks (module_id, title, objective, estimated_days, content_summary, sort_order, resources)
SELECT id, '对比Agent开发框架', '理解AutoGen、CrewAI、LangGraph等框架的适用场景', 3, 'AutoGen多Agent对话、CrewAI角色驱动、LangGraph状态图、框架选型', 1, '[]'
FROM skill_modules WHERE slug = 'ai-frontier';

INSERT INTO learning_tasks (module_id, title, objective, estimated_days, content_summary, sort_order, resources)
SELECT id, '探索MCP生态', '理解MCP协议架构和生态发展', 2, 'MCP协议、MCP架构、MCP Server开发、MCP生态', 2, '[]'
FROM skill_modules WHERE slug = 'ai-frontier';

INSERT INTO learning_tasks (module_id, title, objective, estimated_days, content_summary, sort_order, resources)
SELECT id, '跟踪AI工程化前沿', '了解Skills/Harness/Open Design等AI工程化趋势', 2, 'Skills与工具链、Harness测试框架、Open Design、AI应用架构演进', 3, '[]'
FROM skill_modules WHERE slug = 'ai-frontier';

INSERT INTO learning_tasks (module_id, title, objective, estimated_days, content_summary, sort_order, resources)
SELECT id, '建立前沿跟踪方法论', '学会高效跟踪AI前沿和判断技术成熟度', 2, '每日信息源、高效阅读、技术成熟度判断、技术产品化评估', 4, '[]'
FROM skill_modules WHERE slug = 'ai-frontier';

INSERT INTO learning_tasks (module_id, title, objective, estimated_days, content_summary, sort_order, resources)
SELECT id, '评估多模态与新兴方向', '了解多模态、语音交互、端侧AI等新兴方向的产品化机会', 2, '多模态产品化、语音交互、AI生成视频、端侧AI、AI Agent自主性', 5, '[]'
FROM skill_modules WHERE slug = 'ai-frontier';

-- job-practice 任务
INSERT INTO learning_tasks (module_id, title, objective, estimated_days, content_summary, sort_order, resources)
SELECT id, '搭建AI PM作品集', '学会搭建结构化的AI PM作品集和产品Demo', 3, '作品集结构、AI产品Demo、案例文档化、技术博客、GitHub项目', 1, '[]'
FROM skill_modules WHERE slug = 'job-practice';

INSERT INTO learning_tasks (module_id, title, objective, estimated_days, content_summary, sort_order, resources)
SELECT id, '优化面试项目展示', '掌握STAR法则和AI项目叙事技巧', 2, 'STAR法则升级、AI项目叙事、失败项目价值、现场白板', 2, '[]'
FROM skill_modules WHERE slug = 'job-practice';

INSERT INTO learning_tasks (module_id, title, objective, estimated_days, content_summary, sort_order, resources)
SELECT id, '分析AI PM岗位趋势', '了解AI PM岗位分类、行业分布和薪资趋势', 1, '岗位分类、行业分布、能力要求变化、薪资趋势', 3, '[]'
FROM skill_modules WHERE slug = 'job-practice';

INSERT INTO learning_tasks (module_id, title, objective, estimated_days, content_summary, sort_order, resources)
SELECT id, '制定求职策略', '学会简历优化、内推网络和Offer评估', 2, '简历优化、内推网络、面试准备清单、Offer评估、入职前准备', 4, '[]'
FROM skill_modules WHERE slug = 'job-practice';

INSERT INTO learning_tasks (module_id, title, objective, estimated_days, content_summary, sort_order, resources)
SELECT id, '规划AI PM职业发展', '理解AI PM职业路径和持续学习策略', 1, '职业路径、AI PM vs 传统PM、技术深度选择、持续学习、个人品牌', 5, '[]'
FROM skill_modules WHERE slug = 'job-practice';
