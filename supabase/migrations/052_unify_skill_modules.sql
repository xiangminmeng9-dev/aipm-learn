-- 打通三系统：补充学习地图有但技能树缺少的4个模块
INSERT INTO skill_modules (slug, name, description, icon, job_targets, sort_order, level, level_name, prerequisites) VALUES
  ('pm-capability', 'AI PM 能力模型', '软技能与职业素养、职业路径、工具链、常见困惑', '🎯', '["C端产品","B端产品","平台中台"]', 25, 2, '核心能力', '{}'),
  ('conversational-ai', '对话式AI产品设计', '对话流设计、意图体系、知识库运营、人机协作', '💬', '["C端产品","B端产品"]', 26, 3, '进阶专项', '{}'),
  ('product-strategy', '产品战略规划', '竞争分析、组合战略、国际化、护城河设计', '♟️', '["C端产品","B端产品","平台中台"]', 27, 4, '实战综合', '{}'),
  ('job-preparation', 'JD 拆解与求职备战', '面试流程、作品集、职业规划、薪资谈判', '💼', '["C端产品","B端产品","平台中台"]', 28, 4, '实战综合', '{}')
ON CONFLICT (slug) DO NOTHING;
