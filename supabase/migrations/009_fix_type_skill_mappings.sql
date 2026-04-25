-- ============================================================
-- 009_fix_type_skill_mappings.sql
-- 修复 type_skill_mappings：用真实 skill_modules ID 替换占位符 UUID
-- 支持多对多映射（一种题型可映射到多个技能模块）
-- ============================================================

-- 1. 删除旧的占位符数据
delete from type_skill_mappings;

-- 2. 添加外键约束（如果不存在）
do $$
begin
  if not exists (
    select 1 from information_schema.table_constraints
    where constraint_name = 'fk_tsm_skill_module'
    and table_name = 'type_skill_mappings'
  ) then
    alter table type_skill_mappings
      add constraint fk_tsm_skill_module
      foreign key (skill_module_id) references skill_modules(id) on delete cascade;
  end if;
end $$;

-- 3. 插入正确的多对多映射（使用真实 skill_modules slug）
-- recommended_tasks 引用真实 learning_tasks 的 title

insert into type_skill_mappings (type_id, skill_module_id, recommended_tasks) values

-- 产品设计类 → pm-basics, ai-product-design
((select id from question_types where name = '产品设计类'),
 (select id from skill_modules where slug = 'pm-basics'),
 (select jsonb_agg(jsonb_build_object('task_id', t.id, 'task_name', t.title))
  from learning_tasks t where t.module_id = (select id from skill_modules where slug = 'pm-basics')
  and t.title in ('需求分析方法', 'PRD 文档撰写', '产品路线图规划') limit 3)),

((select id from question_types where name = '产品设计类'),
 (select id from skill_modules where slug = 'ai-product-design'),
 (select jsonb_agg(jsonb_build_object('task_id', t.id, 'task_name', t.title))
  from learning_tasks t where t.module_id = (select id from skill_modules where slug = 'ai-product-design')
  and t.title in ('AI 原生产品思维', 'AI 功能规划方法', 'AI 产品设计实战') limit 3)),

-- 数据指标类 → data-analysis
((select id from question_types where name = '数据指标类'),
 (select id from skill_modules where slug = 'data-analysis'),
 (select jsonb_agg(jsonb_build_object('task_id', t.id, 'task_name', t.title))
  from learning_tasks t where t.module_id = (select id from skill_modules where slug = 'data-analysis')
  and t.title in ('数据指标体系', 'A/B 测试入门', '数据驱动决策') limit 3)),

-- AI工具使用类 → ai-cognition, prompt-eng
((select id from question_types where name = 'AI 工具使用类'),
 (select id from skill_modules where slug = 'ai-cognition'),
 (select jsonb_agg(jsonb_build_object('task_id', t.id, 'task_name', t.title))
  from learning_tasks t where t.module_id = (select id from skill_modules where slug = 'ai-cognition')
  and t.title in ('AI 工具链认知', 'AI 产品形态概览') limit 2)),

((select id from question_types where name = 'AI 工具使用类'),
 (select id from skill_modules where slug = 'prompt-eng'),
 (select jsonb_agg(jsonb_build_object('task_id', t.id, 'task_name', t.title))
  from learning_tasks t where t.module_id = (select id from skill_modules where slug = 'prompt-eng')
  and t.title in ('Prompt 基础概念', '系统提示词设计') limit 2)),

-- 对AI看法/趋势类 → ai-cognition, ai-leadership
((select id from question_types where name = '对 AI 看法/趋势类'),
 (select id from skill_modules where slug = 'ai-cognition'),
 (select jsonb_agg(jsonb_build_object('task_id', t.id, 'task_name', t.title))
  from learning_tasks t where t.module_id = (select id from skill_modules where slug = 'ai-cognition')
  and t.title in ('AI 能力边界认知', 'AI 行业应用案例') limit 2)),

((select id from question_types where name = '对 AI 看法/趋势类'),
 (select id from skill_modules where slug = 'ai-leadership'),
 (select jsonb_agg(jsonb_build_object('task_id', t.id, 'task_name', t.title))
  from learning_tasks t where t.module_id = (select id from skill_modules where slug = 'ai-leadership')
  and t.title in ('行业洞察与趋势判断', 'AI 战略规划') limit 2)),

-- AI效果评估类 → evals
((select id from question_types where name = 'AI 效果评估类'),
 (select id from skill_modules where slug = 'evals'),
 (select jsonb_agg(jsonb_build_object('task_id', t.id, 'task_name', t.title))
  from learning_tasks t where t.module_id = (select id from skill_modules where slug = 'evals')
  and t.title in ('评测集编写实践', '质量基准设计') limit 2)),

-- 场景分析类 → pm-basics, user-research
((select id from question_types where name = '场景分析类'),
 (select id from skill_modules where slug = 'pm-basics'),
 (select jsonb_agg(jsonb_build_object('task_id', t.id, 'task_name', t.title))
  from learning_tasks t where t.module_id = (select id from skill_modules where slug = 'pm-basics')
  and t.title in ('产品思维入门', '需求分析方法') limit 2)),

((select id from question_types where name = '场景分析类'),
 (select id from skill_modules where slug = 'user-research'),
 (select jsonb_agg(jsonb_build_object('task_id', t.id, 'task_name', t.title))
  from learning_tasks t where t.module_id = (select id from skill_modules where slug = 'user-research')
  and t.title in ('用户画像构建', '用户旅程地图') limit 2)),

-- 竞品分析类 → pm-basics
((select id from question_types where name = '竞品分析类'),
 (select id from skill_modules where slug = 'pm-basics'),
 (select jsonb_agg(jsonb_build_object('task_id', t.id, 'task_name', t.title))
  from learning_tasks t where t.module_id = (select id from skill_modules where slug = 'pm-basics')
  and t.title in ('竞品分析实践', '产品路线图规划') limit 2)),

-- 需求分析类 → pm-basics, user-research
((select id from question_types where name = '需求分析类'),
 (select id from skill_modules where slug = 'pm-basics'),
 (select jsonb_agg(jsonb_build_object('task_id', t.id, 'task_name', t.title))
  from learning_tasks t where t.module_id = (select id from skill_modules where slug = 'pm-basics')
  and t.title in ('需求分析方法', 'PRD 文档撰写') limit 2)),

((select id from question_types where name = '需求分析类'),
 (select id from skill_modules where slug = 'user-research'),
 (select jsonb_agg(jsonb_build_object('task_id', t.id, 'task_name', t.title))
  from learning_tasks t where t.module_id = (select id from skill_modules where slug = 'user-research')
  and t.title in ('用户访谈技巧', '可用性测试') limit 2)),

-- 平衡/权衡类 → ai-product-design, ai-commercialization
((select id from question_types where name = '平衡/权衡类'),
 (select id from skill_modules where slug = 'ai-product-design'),
 (select jsonb_agg(jsonb_build_object('task_id', t.id, 'task_name', t.title))
  from learning_tasks t where t.module_id = (select id from skill_modules where slug = 'ai-product-design')
  and t.title in ('AI 功能规划方法', 'AI 产品需求文档') limit 2)),

((select id from question_types where name = '平衡/权衡类'),
 (select id from skill_modules where slug = 'ai-commercialization'),
 (select jsonb_agg(jsonb_build_object('task_id', t.id, 'task_name', t.title))
  from learning_tasks t where t.module_id = (select id from skill_modules where slug = 'ai-commercialization')
  and t.title in ('AI 产品 ROI 评估', '单位经济学模型') limit 2)),

-- 开放性问题 → pm-basics
((select id from question_types where name = '开放性问题'),
 (select id from skill_modules where slug = 'pm-basics'),
 (select jsonb_agg(jsonb_build_object('task_id', t.id, 'task_name', t.title))
  from learning_tasks t where t.module_id = (select id from skill_modules where slug = 'pm-basics')
  and t.title in ('产品思维入门', '沟通与汇报技巧') limit 2)),

-- 行为面试类 → pm-basics
((select id from question_types where name = '行为面试类'),
 (select id from skill_modules where slug = 'pm-basics'),
 (select jsonb_agg(jsonb_build_object('task_id', t.id, 'task_name', t.title))
  from learning_tasks t where t.module_id = (select id from skill_modules where slug = 'pm-basics')
  and t.title in ('产品经理面试准备', '沟通与汇报技巧') limit 2)),

-- 系统设计类 → ai-native-design
((select id from question_types where name = '系统设计类'),
 (select id from skill_modules where slug = 'ai-native-design'),
 (select jsonb_agg(jsonb_build_object('task_id', t.id, 'task_name', t.title))
  from learning_tasks t where t.module_id = (select id from skill_modules where slug = 'ai-native-design')
  and t.title in ('Agent 架构设计', 'RAG 系统优化') limit 2)),

-- 商业化/ROI类 → ai-commercialization
((select id from question_types where name = '商业化/ROI 类'),
 (select id from skill_modules where slug = 'ai-commercialization'),
 (select jsonb_agg(jsonb_build_object('task_id', t.id, 'task_name', t.title))
  from learning_tasks t where t.module_id = (select id from skill_modules where slug = 'ai-commercialization')
  and t.title in ('AI 产品 ROI 评估', 'AI 功能定价策略') limit 2)),

-- AI伦理与安全类 → ai-ethics
((select id from question_types where name = 'AI 伦理与安全类'),
 (select id from skill_modules where slug = 'ai-ethics'),
 (select jsonb_agg(jsonb_build_object('task_id', t.id, 'task_name', t.title))
  from learning_tasks t where t.module_id = (select id from skill_modules where slug = 'ai-ethics')
  and t.title in ('AI 伦理基础框架', '模型合规要求') limit 2)),

-- 用户增长类 → data-analysis, ai-commercialization
((select id from question_types where name = '用户增长类'),
 (select id from skill_modules where slug = 'data-analysis'),
 (select jsonb_agg(jsonb_build_object('task_id', t.id, 'task_name', t.title))
  from learning_tasks t where t.module_id = (select id from skill_modules where slug = 'data-analysis')
  and t.title in ('漏斗分析与留存', '数据指标体系') limit 2)),

((select id from question_types where name = '用户增长类'),
 (select id from skill_modules where slug = 'ai-commercialization'),
 (select jsonb_agg(jsonb_build_object('task_id', t.id, 'task_name', t.title))
  from learning_tasks t where t.module_id = (select id from skill_modules where slug = 'ai-commercialization')
  and t.title in ('AI 产品成本结构', 'AI 商业化实战案例') limit 2));
