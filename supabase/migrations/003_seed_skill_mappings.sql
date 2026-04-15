-- ============================================================
-- 003_seed_skill_mappings.sql — 15 种种子类型与技能模块映射
-- ============================================================

-- 创建临时技能模块 ID（使用确定性 UUID）
-- 在实际应用中，这些应来自技能学习模块

insert into type_skill_mappings (type_id, skill_module_id, recommended_tasks) values
-- 产品设计类
((select id from question_types where name = '产品设计类'), 'a0000000-0000-0000-0000-000000000001',
 '[{"task_id": "t001", "task_name": "产品需求文档撰写"}, {"task_id": "t002", "task_name": "用户体验设计基础"}, {"task_id": "t003", "task_name": "产品策略制定"}]'::jsonb),

-- 数据指标类
((select id from question_types where name = '数据指标类'), 'a0000000-0000-0000-0000-000000000002',
 '[{"task_id": "t004", "task_name": "数据指标体系搭建"}, {"task_id": "t005", "task_name": "AB测试设计"}, {"task_id": "t006", "task_name": "数据驱动决策"}]'::jsonb),

-- AI 工具使用类
((select id from question_types where name = 'AI 工具使用类'), 'a0000000-0000-0000-0000-000000000003',
 '[{"task_id": "t007", "task_name": "AI 工具选型评估"}, {"task_id": "t008", "task_name": "Prompt 工程实践"}]'::jsonb),

-- 对 AI 看法/趋势类
((select id from question_types where name = '对 AI 看法/趋势类'), 'a0000000-0000-0000-0000-000000000004',
 '[{"task_id": "t009", "task_name": "AI 行业趋势分析"}, {"task_id": "t010", "task_name": "AI 技术发展理解"}]'::jsonb),

-- AI 效果评估类
((select id from question_types where name = 'AI 效果评估类'), 'a0000000-0000-0000-0000-000000000005',
 '[{"task_id": "t011", "task_name": "AI 模型评测方法"}, {"task_id": "t012", "task_name": "评测集设计"}]'::jsonb),

-- 场景分析类
((select id from question_types where name = '场景分析类'), 'a0000000-0000-0000-0000-000000000006',
 '[{"task_id": "t013", "task_name": "业务场景拆解"}, {"task_id": "t014", "task_name": "用户分层方法"}]'::jsonb),

-- 竞品分析类
((select id from question_types where name = '竞品分析类'), 'a0000000-0000-0000-0000-000000000007',
 '[{"task_id": "t015", "task_name": "竞品调研方法"}, {"task_id": "t016", "task_name": "差异化定位策略"}]'::jsonb),

-- 需求分析类
((select id from question_types where name = '需求分析类'), 'a0000000-0000-0000-0000-000000000008',
 '[{"task_id": "t017", "task_name": "需求优先级排序"}, {"task_id": "t018", "task_name": "用户验证方法"}]'::jsonb),

-- 平衡/权衡类
((select id from question_types where name = '平衡/权衡类'), 'a0000000-0000-0000-0000-000000000009',
 '[{"task_id": "t019", "task_name": "决策框架"}, {"task_id": "t020", "task_name": "风险评估方法"}]'::jsonb),

-- 开放性问题
((select id from question_types where name = '开放性问题'), 'a0000000-0000-0000-0000-000000000010',
 '[{"task_id": "t021", "task_name": "结构化思维训练"}, {"task_id": "t022", "task_name": "深度思考方法"}]'::jsonb),

-- 行为面试类
((select id from question_types where name = '行为面试类'), 'a0000000-0000-0000-0000-000000000011',
 '[{"task_id": "t023", "task_name": "STAR 框架练习"}, {"task_id": "t024", "task_name": "团队协作案例准备"}]'::jsonb),

-- 系统设计类
((select id from question_types where name = '系统设计类'), 'a0000000-0000-0000-0000-000000000012',
 '[{"task_id": "t025", "task_name": "系统架构设计"}, {"task_id": "t026", "task_name": "流程设计方法"}]'::jsonb),

-- 商业化/ROI 类
((select id from question_types where name = '商业化/ROI 类'), 'a0000000-0000-0000-0000-000000000013',
 '[{"task_id": "t027", "task_name": "商业模式设计"}, {"task_id": "t028", "task_name": "ROI 分析方法"}]'::jsonb),

-- AI 伦理与安全类
((select id from question_types where name = 'AI 伦理与安全类'), 'a0000000-0000-0000-0000-000000000014',
 '[{"task_id": "t029", "task_name": "AI 伦理框架"}, {"task_id": "t030", "task_name": "安全合规要求"}]'::jsonb),

-- 用户增长类
((select id from question_types where name = '用户增长类'), 'a0000000-0000-0000-0000-000000000015',
 '[{"task_id": "t031", "task_name": "增长实验设计"}, {"task_id": "t032", "task_name": "渠道策略制定"}]'::jsonb);
