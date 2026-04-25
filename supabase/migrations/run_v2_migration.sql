-- ============================================================
-- 006_skills_v2_schema.sql
-- 技能树重构：增加层级/前置条件/资源 + JD 分析功能
-- ============================================================

-- 1. skill_modules 增加字段
alter table skill_modules add column if not exists level integer not null default 1 check (level between 1 and 4);
alter table skill_modules add column if not exists level_name text not null default '基础入门';
alter table skill_modules add column if not exists prerequisites uuid[] not null default '{}';

-- 2. learning_tasks 增加字段
alter table learning_tasks add column if not exists resources jsonb not null default '[]';
alter table learning_tasks add column if not exists prerequisites uuid[] not null default '{}';

-- 3. jd_analyses: JD 文本 + AI 提取结果
create table jd_analyses (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  jd_text text not null,
  company_name text,
  position_name text,
  extracted_skills jsonb not null default '[]',
  skill_module_matches jsonb not null default '[]',
  gaps jsonb not null default '[]',
  created_at timestamptz not null default now()
);
create index idx_jd_analyses_user on jd_analyses(user_id);

-- 4. jd_skills: 跨 JD 技能频次聚合
create table jd_skills (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  skill_name text not null,
  category text,
  frequency integer not null default 1,
  first_seen_at timestamptz not null default now(),
  last_seen_at timestamptz not null default now(),
  unique (user_id, skill_name)
);
create index idx_jd_skills_user_freq on jd_skills(user_id, frequency desc);

-- 5. user_custom_tasks: 用户确认的自定义学习任务
create table user_custom_tasks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  module_id uuid references skill_modules(id) on delete set null,
  title text not null,
  objective text not null,
  resources jsonb not null default '[]',
  source_jd_id uuid references jd_analyses(id) on delete set null,
  status text not null default 'not_started' check (status in ('not_started', 'in_progress', 'completed')),
  completed_at timestamptz,
  created_at timestamptz not null default now()
);
create index idx_user_custom_tasks_user on user_custom_tasks(user_id);

-- 6. RLS
alter table jd_analyses enable row level security;
create policy "Users can manage own jd_analyses" on jd_analyses for all using (auth.uid() = user_id);

alter table jd_skills enable row level security;
create policy "Users can manage own jd_skills" on jd_skills for all using (auth.uid() = user_id);

alter table user_custom_tasks enable row level security;
create policy "Users can manage own user_custom_tasks" on user_custom_tasks for all using (auth.uid() = user_id);

-- 7. 删除趋势表
drop table if exists trend_progress cascade;
drop table if exists trend_briefs cascade;
-- ============================================================
-- 007_skills_v2_seed.sql
-- 重构技能树：4 等级 13 模块 ~120 任务 + 学习资源
-- ============================================================

-- 清空旧数据
delete from learning_progress;
delete from learning_tasks;
delete from skill_modules;

-- ============================================================
-- Level 1: 基础入门
-- ============================================================

insert into skill_modules (slug, name, description, icon, job_targets, sort_order, level, level_name, prerequisites) values
  ('pm-basics', '产品经理基础', '产品思维、需求分析、PRD 撰写、项目管理入门', '📋', '["C端产品","B端产品","平台中台"]', 1, 1, '基础入门', '{}'),
  ('user-research', '用户研究方法', '用户访谈、问卷设计、用户画像、可用性测试', '👥', '["C端产品","B端产品"]', 2, 1, '基础入门', '{}'),
  ('data-analysis', '数据分析基础', '指标体系搭建、SQL 基础、数据可视化、A/B 测试入门', '📊', '["C端产品","B端产品","平台中台"]', 3, 1, '基础入门', '{}'),
  ('ai-cognition', 'AI 基础认知', '大模型原理、AI 产品形态、能力边界、行业应用概览', '🤖', '["C端产品","B端产品","平台中台"]', 4, 1, '基础入门', '{}');

-- ============================================================
-- Level 2: 核心能力 (prerequisites: Level 1 modules)
-- ============================================================

insert into skill_modules (slug, name, description, icon, job_targets, sort_order, level, level_name, prerequisites) values
  ('prompt-eng', 'Prompt Engineering', '系统提示词设计、Few-shot/CoT、模板管理、注入防御', '✍️', '["C端产品","B端产品","平台中台"]', 5, 2, '核心能力',
   (select array_agg(id) from skill_modules where slug in ('ai-cognition'))),
  ('evals', 'AI 评测能力', '评测集编写、幻觉检测、质量基准设计、自动化评测', '🎯', '["C端产品","B端产品","平台中台"]', 6, 2, '核心能力',
   (select array_agg(id) from skill_modules where slug in ('ai-cognition', 'data-analysis'))),
  ('ai-product-design', 'AI 产品设计', 'AI 原生产品思维、交互设计、用户体验、产品策略', '🎨', '["C端产品","B端产品"]', 7, 2, '核心能力',
   (select array_agg(id) from skill_modules where slug in ('pm-basics', 'user-research', 'ai-cognition'))),
  ('ai-commercialization', 'AI 商业化与 ROI', 'Token 成本优化、单位经济学、定价策略、ROI 评估', '💰', '["C端产品","B端产品"]', 8, 2, '核心能力',
   (select array_agg(id) from skill_modules where slug in ('pm-basics', 'data-analysis', 'ai-cognition')));

-- ============================================================
-- Level 3: 进阶专项
-- ============================================================

insert into skill_modules (slug, name, description, icon, job_targets, sort_order, level, level_name, prerequisites) values
  ('ai-native-design', 'AI 原生系统设计', 'Agent 架构、RAG 优化、MCP 协议、多模态交互', '🏗️', '["C端产品","B端产品","平台中台"]', 9, 3, '进阶专项',
   (select array_agg(id) from skill_modules where slug in ('prompt-eng', 'ai-product-design'))),
  ('vibe-coding', 'AI 编码能力', 'AI 辅助编程、原型开发、MVP 搭建、代码审查', '💻', '["C端产品","平台中台"]', 10, 3, '进阶专项',
   (select array_agg(id) from skill_modules where slug in ('prompt-eng'))),
  ('ai-ethics', 'AI 伦理与安全', '模型合规、隐私保护、可解释性、对齐安全', '🛡️', '["C端产品","B端产品","平台中台"]', 11, 3, '进阶专项',
   (select array_agg(id) from skill_modules where slug in ('ai-product-design', 'evals')));

-- ============================================================
-- Level 4: 实战综合
-- ============================================================

insert into skill_modules (slug, name, description, icon, job_targets, sort_order, level, level_name, prerequisites) values
  ('ai-pm-practice', 'AI PM 综合实战', '端到端项目实战、跨团队协作、技术评审、产品复盘', '🚀', '["C端产品","B端产品","平台中台"]', 12, 4, '实战综合',
   (select array_agg(id) from skill_modules where slug in ('ai-native-design', 'ai-commercialization', 'evals'))),
  ('ai-leadership', 'AI 产品领导力', 'AI 战略规划、团队搭建、技术选型决策、行业洞察', '👑', '["C端产品","B端产品","平台中台"]', 13, 4, '实战综合',
   (select array_agg(id) from skill_modules where slug in ('ai-pm-practice')));

-- ============================================================
-- Level 1 学习任务
-- ============================================================

-- 产品经理基础
insert into learning_tasks (module_id, title, objective, estimated_days, content_summary, sort_order, resources) values
((select id from skill_modules where slug='pm-basics'), '产品思维入门', '理解产品经理的核心职责和思维方式', 0.5, '什么是产品思维、产品经理的日常工作、与其他角色的协作', 1,
 '[{"type":"book","title":"启示录：打造用户喜爱的产品","url":"","source":"Marty Cagan"},{"type":"article","title":"产品经理入门指南","url":"https://www.woshipm.com/pmd/5487Mo.html","source":"人人都是产品经理"},{"type":"video","title":"产品经理必修课","url":"https://www.bilibili.com/video/BV1xW411K7Pn","source":"B站"}]'::jsonb),
((select id from skill_modules where slug='pm-basics'), '需求分析方法', '掌握需求收集、分析和优先级排序的方法', 1.0, '需求来源、KANO模型、MoSCoW优先级、用户故事编写', 2,
 '[{"type":"article","title":"需求分析的5种经典方法","url":"https://www.woshipm.com/pmd/5612345.html","source":"人人都是产品经理"},{"type":"book","title":"用户故事地图","url":"","source":"Jeff Patton"}]'::jsonb),
((select id from skill_modules where slug='pm-basics'), 'PRD 文档撰写', '能够编写清晰完整的产品需求文档', 1.0, 'PRD结构、功能描述、交互说明、验收标准、版本管理', 3,
 '[{"type":"article","title":"PRD文档模板与撰写指南","url":"https://www.woshipm.com/pmd/4567890.html","source":"人人都是产品经理"},{"type":"video","title":"手把手教你写PRD","url":"https://www.bilibili.com/video/BV1Ks411E7mP","source":"B站"}]'::jsonb),
((select id from skill_modules where slug='pm-basics'), '竞品分析实践', '掌握竞品调研和分析的系统方法', 1.0, '竞品选择、功能对比、SWOT分析、差异化定位', 4,
 '[{"type":"article","title":"竞品分析完全指南","url":"https://www.woshipm.com/evaluating/5234567.html","source":"人人都是产品经理"}]'::jsonb),
((select id from skill_modules where slug='pm-basics'), '项目管理基础', '了解敏捷开发流程和项目管理工具', 1.0, 'Scrum/Kanban、Sprint规划、站会、复盘、JIRA/飞书使用', 5,
 '[{"type":"book","title":"Scrum精髓","url":"","source":"Kenneth Rubin"},{"type":"article","title":"敏捷开发入门","url":"https://www.woshipm.com/pd/5345678.html","source":"人人都是产品经理"}]'::jsonb),
((select id from skill_modules where slug='pm-basics'), '产品路线图规划', '学会制定产品路线图和版本规划', 1.0, '产品愿景、OKR设定、路线图工具、版本节奏', 6,
 '[{"type":"article","title":"如何制定产品路线图","url":"https://www.woshipm.com/pd/5456789.html","source":"人人都是产品经理"}]'::jsonb),
((select id from skill_modules where slug='pm-basics'), '沟通与汇报技巧', '提升跨部门沟通和向上汇报的能力', 0.5, '需求评审技巧、技术沟通、向上管理、数据汇报', 7,
 '[{"type":"article","title":"产品经理沟通术","url":"https://www.woshipm.com/zhichang/5567890.html","source":"人人都是产品经理"}]'::jsonb),
((select id from skill_modules where slug='pm-basics'), '产品经理面试准备', '了解PM面试常见问题和准备策略', 1.0, '简历优化、案例准备、常见问题类型、模拟面试', 8,
 '[{"type":"article","title":"产品经理面试全攻略","url":"https://www.woshipm.com/zhichang/5678901.html","source":"人人都是产品经理"}]'::jsonb);

-- 用户研究方法
insert into learning_tasks (module_id, title, objective, estimated_days, content_summary, sort_order, resources) values
((select id from skill_modules where slug='user-research'), '用户研究概述', '理解用户研究的价值和常用方法', 0.5, '定性vs定量、研究方法选择、研究计划制定', 1,
 '[{"type":"book","title":"洞察力：让营销直指人心","url":"","source":"Mohanbir Sawhney"},{"type":"article","title":"用户研究方法全景图","url":"https://www.woshipm.com/user-research/5123456.html","source":"人人都是产品经理"}]'::jsonb),
((select id from skill_modules where slug='user-research'), '用户访谈技巧', '掌握一对一深度访谈的设计和执行', 1.0, '访谈提纲设计、提问技巧、记录方法、洞察提炼', 2,
 '[{"type":"article","title":"用户访谈实战指南","url":"https://www.woshipm.com/user-research/5234567.html","source":"人人都是产品经理"},{"type":"video","title":"用户访谈技巧","url":"https://www.bilibili.com/video/BV1Ab4y1k7Hs","source":"B站"}]'::jsonb),
((select id from skill_modules where slug='user-research'), '问卷设计与分析', '设计有效的调查问卷并分析结果', 1.0, '问卷结构、题目设计、样本量、数据分析方法', 3,
 '[{"type":"article","title":"问卷设计的10个原则","url":"https://www.woshipm.com/user-research/5345678.html","source":"人人都是产品经理"}]'::jsonb),
((select id from skill_modules where slug='user-research'), '用户画像构建', '学会创建数据驱动的用户画像', 1.0, '画像维度、数据来源、聚类方法、画像应用', 4,
 '[{"type":"article","title":"用户画像实战","url":"https://www.woshipm.com/user-research/5456789.html","source":"人人都是产品经理"}]'::jsonb),
((select id from skill_modules where slug='user-research'), '可用性测试', '掌握可用性测试的设计和执行', 1.0, '测试方案、任务设计、观察记录、问题分级', 5,
 '[{"type":"book","title":"Don''t Make Me Think","url":"","source":"Steve Krug"},{"type":"article","title":"可用性测试入门","url":"https://www.woshipm.com/user-research/5567890.html","source":"人人都是产品经理"}]'::jsonb),
((select id from skill_modules where slug='user-research'), '用户旅程地图', '绘制用户旅程地图发现体验痛点', 1.0, '触点识别、情绪曲线、痛点机会点、改进方案', 6,
 '[{"type":"article","title":"用户旅程地图绘制指南","url":"https://www.woshipm.com/user-research/5678901.html","source":"人人都是产品经理"}]'::jsonb);

-- 数据分析基础
insert into learning_tasks (module_id, title, objective, estimated_days, content_summary, sort_order, resources) values
((select id from skill_modules where slug='data-analysis'), '数据指标体系', '理解产品核心指标和北极星指标', 0.5, 'AARRR模型、北极星指标、指标拆解、数据看板', 1,
 '[{"type":"article","title":"产品经理必懂的数据指标","url":"https://www.woshipm.com/data-analysis/5123456.html","source":"人人都是产品经理"},{"type":"book","title":"精益数据分析","url":"","source":"Alistair Croll"}]'::jsonb),
((select id from skill_modules where slug='data-analysis'), 'SQL 基础查询', '掌握基本的 SQL 查询能力', 1.0, 'SELECT/WHERE/JOIN/GROUP BY、常用函数、实战练习', 2,
 '[{"type":"video","title":"SQL入门到精通","url":"https://www.bilibili.com/video/BV1UE411L7EF","source":"B站"},{"type":"article","title":"产品经理SQL速成","url":"https://www.woshipm.com/data-analysis/5234567.html","source":"人人都是产品经理"}]'::jsonb),
((select id from skill_modules where slug='data-analysis'), '数据可视化', '学会用图表清晰表达数据洞察', 1.0, '图表选择、可视化原则、常用工具(ECharts/Tableau)', 3,
 '[{"type":"article","title":"数据可视化最佳实践","url":"https://www.woshipm.com/data-analysis/5345678.html","source":"人人都是产品经理"}]'::jsonb),
((select id from skill_modules where slug='data-analysis'), 'A/B 测试入门', '理解 A/B 测试的设计和统计原理', 1.0, '实验设计、样本量计算、统计显著性、常见陷阱', 4,
 '[{"type":"article","title":"A/B测试完全指南","url":"https://www.woshipm.com/data-analysis/5456789.html","source":"人人都是产品经理"},{"type":"book","title":"A/B测试：创新始于试验","url":"","source":"Dan Siroker"}]'::jsonb),
((select id from skill_modules where slug='data-analysis'), '数据驱动决策', '学会用数据支撑产品决策', 1.0, '假设验证、归因分析、数据陷阱、决策框架', 5,
 '[{"type":"article","title":"数据驱动的产品决策","url":"https://www.woshipm.com/data-analysis/5567890.html","source":"人人都是产品经理"}]'::jsonb),
((select id from skill_modules where slug='data-analysis'), '漏斗分析与留存', '掌握转化漏斗和留存分析方法', 1.0, '漏斗搭建、转化优化、留存曲线、队列分析', 6,
 '[{"type":"article","title":"漏斗分析实战","url":"https://www.woshipm.com/data-analysis/5678901.html","source":"人人都是产品经理"}]'::jsonb);

-- AI 基础认知
insert into learning_tasks (module_id, title, objective, estimated_days, content_summary, sort_order, resources) values
((select id from skill_modules where slug='ai-cognition'), '大模型基础原理', '理解 Transformer、GPT、Claude 等大模型的基本原理', 1.0, 'Transformer架构、预训练与微调、Token与上下文窗口、模型能力边界', 1,
 '[{"type":"video","title":"3Blue1Brown: GPT是什么","url":"https://www.bilibili.com/video/BV1TZ421j7Ke","source":"B站"},{"type":"article","title":"大模型入门：从Transformer到GPT","url":"https://www.woshipm.com/ai/5789012.html","source":"人人都是产品经理"}]'::jsonb),
((select id from skill_modules where slug='ai-cognition'), 'AI 产品形态概览', '了解当前主流 AI 产品的形态和分类', 1.0, 'Chatbot、Copilot、Agent、AI Native App的区别与适用场景', 2,
 '[{"type":"article","title":"AI产品形态全景图","url":"https://www.woshipm.com/ai/5890123.html","source":"人人都是产品经理"}]'::jsonb),
((select id from skill_modules where slug='ai-cognition'), 'AI 能力边界认知', '理解当前 AI 能做什么、不能做什么', 1.0, '幻觉问题、推理局限、多模态能力、安全边界', 3,
 '[{"type":"article","title":"AI的能力与局限","url":"https://www.woshipm.com/ai/5901234.html","source":"人人都是产品经理"},{"type":"book","title":"AI 3.0","url":"","source":"Melanie Mitchell"}]'::jsonb),
((select id from skill_modules where slug='ai-cognition'), 'AI 行业应用案例', '学习各行业 AI 落地的成功案例', 1.0, '医疗、教育、金融、电商、内容等领域的AI应用', 4,
 '[{"type":"article","title":"2024年AI行业应用报告","url":"https://www.woshipm.com/ai/5012345.html","source":"人人都是产品经理"}]'::jsonb),
((select id from skill_modules where slug='ai-cognition'), 'AI 工具链认知', '了解主流 AI 开发工具和平台', 0.5, 'OpenAI/Anthropic API、LangChain、向量数据库、AI IDE', 5,
 '[{"type":"article","title":"AI工具链全景","url":"https://www.woshipm.com/ai/5123456.html","source":"人人都是产品经理"},{"type":"video","title":"AI开发工具入门","url":"https://www.bilibili.com/video/BV1Pm4y1A7Gq","source":"B站"}]'::jsonb),
((select id from skill_modules where slug='ai-cognition'), 'AI 产品经理 vs 传统 PM', '理解 AI PM 的独特技能要求', 0.5, 'AI PM的核心差异、技能栈对比、职业发展路径', 6,
 '[{"type":"article","title":"AI产品经理的核心能力模型","url":"https://www.woshipm.com/ai/5234567.html","source":"人人都是产品经理"}]'::jsonb);

-- ============================================================
-- Level 2 学习任务
-- ============================================================

-- Prompt Engineering
insert into learning_tasks (module_id, title, objective, estimated_days, content_summary, sort_order, resources) values
((select id from skill_modules where slug='prompt-eng'), 'Prompt 基础概念', '理解 Prompt 的作用、结构和常见误区', 0.5, 'Prompt的角色、结构要素、常见错误与最佳实践', 1,
 '[{"type":"article","title":"Prompt Engineering Guide","url":"https://www.promptingguide.ai/zh","source":"DAIR.AI"},{"type":"video","title":"Prompt工程入门","url":"https://www.bilibili.com/video/BV1No4y1t7Zn","source":"B站"}]'::jsonb),
((select id from skill_modules where slug='prompt-eng'), '系统提示词设计', '掌握 System Prompt 的分层管理与版本控制', 1.0, 'System Prompt设计原则、分层策略、版本管理', 2,
 '[{"type":"article","title":"System Prompt最佳实践","url":"https://docs.anthropic.com/en/docs/build-with-claude/prompt-engineering","source":"Anthropic"}]'::jsonb),
((select id from skill_modules where slug='prompt-eng'), 'Few-shot 与 CoT 技巧', '实践少量示例与思维链提示的方法', 1.0, 'Few-shot选择策略、CoT设计模式、Self-consistency', 3,
 '[{"type":"article","title":"Chain-of-Thought Prompting","url":"https://www.promptingguide.ai/zh/techniques/cot","source":"DAIR.AI"}]'::jsonb),
((select id from skill_modules where slug='prompt-eng'), 'Prompt 模板管理', '实现 Prompt 的模板化、参数化与复用', 1.0, '模板语法、变量注入、多场景复用、A/B测试', 4,
 '[{"type":"article","title":"Prompt模板化实践","url":"https://www.woshipm.com/ai/5345678.html","source":"人人都是产品经理"}]'::jsonb),
((select id from skill_modules where slug='prompt-eng'), 'Prompt 评测与迭代', '系统化评测 Prompt 效果并持续优化', 1.0, '评测指标定义、自动化评测、迭代优化流程', 5,
 '[{"type":"article","title":"如何评测Prompt质量","url":"https://www.woshipm.com/ai/5456789.html","source":"人人都是产品经理"}]'::jsonb),
((select id from skill_modules where slug='prompt-eng'), 'Prompt 安全与注入防御', '识别 Prompt Injection 风险并设计防御措施', 1.0, '注入攻击类型、防御策略、输入验证与沙箱', 6,
 '[{"type":"article","title":"Prompt Injection防御指南","url":"https://www.woshipm.com/ai/5567890.html","source":"人人都是产品经理"}]'::jsonb);

-- AI 评测能力
insert into learning_tasks (module_id, title, objective, estimated_days, content_summary, sort_order, resources) values
((select id from skill_modules where slug='evals'), '理解 AI 评测的基本概念', '掌握 Evals 的定义、目的和核心作用', 0.5, '什么是Evals，为什么AI产品需要评测，评测与传统测试的区别', 1,
 '[{"type":"article","title":"AI评测入门","url":"https://www.woshipm.com/ai/5678901.html","source":"人人都是产品经理"},{"type":"video","title":"OpenAI Evals详解","url":"https://www.bilibili.com/video/BV1Cs4y1o7xP","source":"B站"}]'::jsonb),
((select id from skill_modules where slug='evals'), '评测集编写实践', '能够编写结构化评测集，定义输入和预期输出', 1.0, '评测集的结构设计、输入输出定义、边界用例覆盖', 2,
 '[{"type":"article","title":"评测集设计方法论","url":"https://www.woshipm.com/ai/5789012.html","source":"人人都是产品经理"}]'::jsonb),
((select id from skill_modules where slug='evals'), '幻觉检测方法', '掌握常见幻觉类型、检测策略与自动化方案', 1.0, 'LLM幻觉的类型分类、自动检测Pipeline、人工审核流程', 3,
 '[{"type":"article","title":"LLM幻觉检测实战","url":"https://www.woshipm.com/ai/5890123.html","source":"人人都是产品经理"}]'::jsonb),
((select id from skill_modules where slug='evals'), '质量基准设计', '学会定义质量标准和构建评估基准', 1.0, '如何定义好的标准，构建质量评估基准，基线对比方法', 4,
 '[{"type":"article","title":"AI质量基准设计","url":"https://www.woshipm.com/ai/5901234.html","source":"人人都是产品经理"}]'::jsonb),
((select id from skill_modules where slug='evals'), '自动化评测流水线', '实现 CI/CD 中的评测集成与自动化回归检测', 1.0, '评测与CI/CD集成、自动化回归、评测报告生成', 5,
 '[{"type":"article","title":"自动化评测Pipeline搭建","url":"https://www.woshipm.com/ai/5012345.html","source":"人人都是产品经理"}]'::jsonb),
((select id from skill_modules where slug='evals'), '评测体系实战案例', '拆解真实产品的评测体系', 1.0, '搜索、推荐、对话等场景的评测体系拆解', 6,
 '[{"type":"article","title":"大厂AI评测体系拆解","url":"https://www.woshipm.com/ai/5123456.html","source":"人人都是产品经理"}]'::jsonb);

-- AI 产品设计
insert into learning_tasks (module_id, title, objective, estimated_days, content_summary, sort_order, resources) values
((select id from skill_modules where slug='ai-product-design'), 'AI 原生产品思维', '从加AI到AI原生的思维转变', 0.5, 'AI原生vs AI包装、设计原则、用户体验范式变化', 1,
 '[{"type":"article","title":"AI原生产品设计方法论","url":"https://www.woshipm.com/ai/5234567.html","source":"人人都是产品经理"}]'::jsonb),
((select id from skill_modules where slug='ai-product-design'), 'AI 交互设计模式', '掌握 AI 产品的核心交互模式', 1.0, '对话式交互、生成式交互、辅助式交互、自主式交互', 2,
 '[{"type":"article","title":"AI交互设计模式","url":"https://www.woshipm.com/ai/5345678.html","source":"人人都是产品经理"}]'::jsonb),
((select id from skill_modules where slug='ai-product-design'), 'AI 产品用户体验', '设计让用户信任和喜爱的 AI 体验', 1.0, '期望管理、透明度设计、错误处理、渐进式信任', 3,
 '[{"type":"article","title":"AI产品UX设计原则","url":"https://www.woshipm.com/ai/5456789.html","source":"人人都是产品经理"}]'::jsonb),
((select id from skill_modules where slug='ai-product-design'), 'AI 功能规划方法', '学会规划 AI 功能的优先级和路线图', 1.0, '场景筛选、可行性评估、MVP定义、迭代策略', 4,
 '[{"type":"article","title":"AI功能规划框架","url":"https://www.woshipm.com/ai/5567890.html","source":"人人都是产品经理"}]'::jsonb),
((select id from skill_modules where slug='ai-product-design'), 'AI 产品需求文档', '编写包含 AI 特性的 PRD', 1.0, 'AI PRD模板、模型需求描述、评测标准定义', 5,
 '[{"type":"article","title":"AI产品PRD撰写指南","url":"https://www.woshipm.com/ai/5678901.html","source":"人人都是产品经理"}]'::jsonb),
((select id from skill_modules where slug='ai-product-design'), 'AI 产品设计实战', '端到端设计一个 AI 产品方案', 1.0, '综合案例：从场景到方案的完整AI产品设计', 6,
 '[{"type":"article","title":"AI产品设计案例拆解","url":"https://www.woshipm.com/ai/5789012.html","source":"人人都是产品经理"}]'::jsonb);

-- AI 商业化与 ROI
insert into learning_tasks (module_id, title, objective, estimated_days, content_summary, sort_order, resources) values
((select id from skill_modules where slug='ai-commercialization'), 'AI 产品成本结构', '理解 Token 计费、推理成本、训练成本', 0.5, 'AI产品的成本构成、计费模型、成本预测方法', 1,
 '[{"type":"article","title":"AI产品成本全解析","url":"https://www.woshipm.com/ai/5890123.html","source":"人人都是产品经理"}]'::jsonb),
((select id from skill_modules where slug='ai-commercialization'), 'Token 成本优化策略', '掌握缓存、模型选择、批处理等降本方法', 1.0, 'Prompt缓存、模型路由、批处理、蒸馏降本', 2,
 '[{"type":"article","title":"Token成本优化实战","url":"https://www.woshipm.com/ai/5901234.html","source":"人人都是产品经理"}]'::jsonb),
((select id from skill_modules where slug='ai-commercialization'), '单位经济学模型', '拆解 AI 产品的 unit economics', 1.0, '边际成本、固定成本、盈亏平衡分析', 3,
 '[{"type":"article","title":"AI产品单位经济学","url":"https://www.woshipm.com/ai/5012345.html","source":"人人都是产品经理"}]'::jsonb),
((select id from skill_modules where slug='ai-commercialization'), 'AI 功能定价策略', '设计 SaaS + AI 的混合定价模型', 1.0, '用量定价、席位定价、混合模型、定价心理学', 4,
 '[{"type":"article","title":"AI产品定价策略","url":"https://www.woshipm.com/ai/5123456.html","source":"人人都是产品经理"}]'::jsonb),
((select id from skill_modules where slug='ai-commercialization'), 'AI 产品 ROI 评估', '建立投资回报率的量化评估框架', 1.0, 'ROI计算模型、无形价值量化、长期收益评估', 5,
 '[{"type":"article","title":"AI产品ROI评估框架","url":"https://www.woshipm.com/ai/5234567.html","source":"人人都是产品经理"}]'::jsonb),
((select id from skill_modules where slug='ai-commercialization'), 'AI 商业化实战案例', '拆解成功与失败的 AI 商业化案例', 1.0, 'Notion AI、GitHub Copilot、Jasper等案例', 6,
 '[{"type":"article","title":"AI商业化案例拆解","url":"https://www.woshipm.com/ai/5345678.html","source":"人人都是产品经理"}]'::jsonb);

-- ============================================================
-- Level 3 学习任务
-- ============================================================

-- AI 原生系统设计
insert into learning_tasks (module_id, title, objective, estimated_days, content_summary, sort_order, resources) values
((select id from skill_modules where slug='ai-native-design'), 'Agent 架构设计', '掌握单Agent与多Agent架构的选择与设计', 1.0, '单Agent vs 多Agent、规划与执行解耦、工具调用设计', 1,
 '[{"type":"article","title":"AI Agent架构设计指南","url":"https://www.woshipm.com/ai/5456789.html","source":"人人都是产品经理"}]'::jsonb),
((select id from skill_modules where slug='ai-native-design'), 'RAG 系统优化', '理解检索增强生成的架构选择与优化策略', 1.0, 'RAG架构模式、检索策略、Chunk优化、重排序', 2,
 '[{"type":"article","title":"RAG系统优化实战","url":"https://www.woshipm.com/ai/5567890.html","source":"人人都是产品经理"}]'::jsonb),
((select id from skill_modules where slug='ai-native-design'), 'MCP 协议理解与实践', '掌握 Model Context Protocol 的设计理念', 1.0, 'MCP协议规范、Server/Client模式、工具集成实践', 3,
 '[{"type":"article","title":"MCP协议详解","url":"https://modelcontextprotocol.io","source":"Anthropic"}]'::jsonb),
((select id from skill_modules where slug='ai-native-design'), '多模态交互设计', '设计文本、图像、语音的多模态产品体验', 1.0, '多模态输入输出设计、模态转换、用户体验优化', 4,
 '[{"type":"article","title":"多模态AI产品设计","url":"https://www.woshipm.com/ai/5678901.html","source":"人人都是产品经理"}]'::jsonb),
((select id from skill_modules where slug='ai-native-design'), 'AI 系统可观测性', '保障 AI 系统稳定运行的可观测性方案', 1.0, '日志、追踪、指标体系，AI特有的可观测性需求', 5,
 '[{"type":"article","title":"AI系统可观测性实践","url":"https://www.woshipm.com/ai/5789012.html","source":"人人都是产品经理"}]'::jsonb),
((select id from skill_modules where slug='ai-native-design'), '容错与降级策略', '设计 AI 不可用时的产品降级方案', 1.0, '降级策略、重试机制、Fallback设计、用户体验保障', 6,
 '[{"type":"article","title":"AI产品容错设计","url":"https://www.woshipm.com/ai/5890123.html","source":"人人都是产品经理"}]'::jsonb);

-- AI 编码能力
insert into learning_tasks (module_id, title, objective, estimated_days, content_summary, sort_order, resources) values
((select id from skill_modules where slug='vibe-coding'), 'AI 辅助编程基础', '理解 Vibe Coding 的理念与工具链', 0.5, 'Vibe Coding概念、工具生态、适用场景', 1,
 '[{"type":"article","title":"Vibe Coding入门","url":"https://www.woshipm.com/ai/5901234.html","source":"人人都是产品经理"},{"type":"video","title":"AI编程工具对比","url":"https://www.bilibili.com/video/BV1Km4y1A7Gq","source":"B站"}]'::jsonb),
((select id from skill_modules where slug='vibe-coding'), 'Claude Code / Cursor 实践', '掌握主流 AI 编码工具的使用', 1.0, 'Claude Code、Cursor、Windsurf的使用技巧', 2,
 '[{"type":"article","title":"Claude Code使用指南","url":"https://docs.anthropic.com/en/docs/claude-code","source":"Anthropic"}]'::jsonb),
((select id from skill_modules where slug='vibe-coding'), 'AI 辅助原型开发', '用 AI 快速搭建可交互的产品原型', 1.0, '原型设计思路、AI辅助前端开发、交互验证', 3,
 '[{"type":"article","title":"AI辅助原型开发实战","url":"https://www.woshipm.com/ai/5012345.html","source":"人人都是产品经理"}]'::jsonb),
((select id from skill_modules where slug='vibe-coding'), 'MVP 快速搭建', '从想法到可演示 MVP 的 AI 加速路径', 1.0, 'MVP范围界定、AI辅助全栈开发、部署上线', 4,
 '[{"type":"article","title":"用AI 48小时搭建MVP","url":"https://www.woshipm.com/ai/5123456.html","source":"人人都是产品经理"}]'::jsonb),
((select id from skill_modules where slug='vibe-coding'), 'AI 生成代码审查', '学会审查 AI 生成的代码，保证质量与安全', 1.0, '代码审查要点、安全漏洞识别、性能问题发现', 5,
 '[{"type":"article","title":"AI代码审查指南","url":"https://www.woshipm.com/ai/5234567.html","source":"人人都是产品经理"}]'::jsonb);

-- AI 伦理与安全
insert into learning_tasks (module_id, title, objective, estimated_days, content_summary, sort_order, resources) values
((select id from skill_modules where slug='ai-ethics'), 'AI 伦理基础框架', '理解 AI 伦理的核心原则与常见困境', 0.5, '公平性、透明性、隐私、问责制等核心原则', 1,
 '[{"type":"article","title":"AI伦理框架概述","url":"https://www.woshipm.com/ai/5345678.html","source":"人人都是产品经理"},{"type":"book","title":"AI伦理","url":"","source":"Mark Coeckelbergh"}]'::jsonb),
((select id from skill_modules where slug='ai-ethics'), '模型合规要求', '了解全球主要 AI 法规与合规框架', 1.0, 'EU AI Act、中国生成式AI管理办法、NIST框架', 2,
 '[{"type":"article","title":"全球AI法规对比","url":"https://www.woshipm.com/ai/5456789.html","source":"人人都是产品经理"}]'::jsonb),
((select id from skill_modules where slug='ai-ethics'), '隐私保护与数据治理', '设计 AI 产品中的隐私保护策略', 1.0, '差分隐私、数据脱敏、联邦学习、用户数据控制', 3,
 '[{"type":"article","title":"AI产品隐私保护实践","url":"https://www.woshipm.com/ai/5567890.html","source":"人人都是产品经理"}]'::jsonb),
((select id from skill_modules where slug='ai-ethics'), '对齐安全', '理解 AI 对齐问题、红队测试与安全评估', 1.0, '对齐问题、RLHF/DPO、红队测试、安全评估', 4,
 '[{"type":"article","title":"AI对齐安全入门","url":"https://www.woshipm.com/ai/5678901.html","source":"人人都是产品经理"}]'::jsonb),
((select id from skill_modules where slug='ai-ethics'), '有害内容防控', '设计内容安全策略与过滤机制', 1.0, '内容分类、过滤Pipeline、人工审核、误判优化', 5,
 '[{"type":"article","title":"AI内容安全策略","url":"https://www.woshipm.com/ai/5789012.html","source":"人人都是产品经理"}]'::jsonb);

-- ============================================================
-- Level 4 学习任务
-- ============================================================

-- AI PM 综合实战
insert into learning_tasks (module_id, title, objective, estimated_days, content_summary, sort_order, resources) values
((select id from skill_modules where slug='ai-pm-practice'), '端到端 AI 产品项目', '完成一个完整的 AI 产品从0到1', 2.0, '需求定义、技术选型、原型开发、评测上线的全流程', 1,
 '[{"type":"article","title":"AI产品从0到1实战","url":"https://www.woshipm.com/ai/5890123.html","source":"人人都是产品经理"}]'::jsonb),
((select id from skill_modules where slug='ai-pm-practice'), '跨团队协作实践', '掌握与算法、工程、设计团队的协作方法', 1.0, '需求对齐、技术评审、进度管理、冲突解决', 2,
 '[{"type":"article","title":"AI PM跨团队协作","url":"https://www.woshipm.com/ai/5901234.html","source":"人人都是产品经理"}]'::jsonb),
((select id from skill_modules where slug='ai-pm-practice'), '技术评审与决策', '学会在技术方案评审中做出合理判断', 1.0, '模型选型评审、架构方案评估、技术风险识别', 3,
 '[{"type":"article","title":"AI技术评审指南","url":"https://www.woshipm.com/ai/5012345.html","source":"人人都是产品经理"}]'::jsonb),
((select id from skill_modules where slug='ai-pm-practice'), '产品复盘方法论', '建立系统化的产品复盘和迭代机制', 1.0, '复盘框架、数据回顾、经验沉淀、迭代规划', 4,
 '[{"type":"article","title":"AI产品复盘方法","url":"https://www.woshipm.com/ai/5123456.html","source":"人人都是产品经理"}]'::jsonb),
((select id from skill_modules where slug='ai-pm-practice'), 'AI 产品面试模拟', '通过模拟面试检验综合能力', 1.0, '案例面试、系统设计面试、行为面试的综合准备', 5,
 '[{"type":"article","title":"AI PM面试通关指南","url":"https://www.woshipm.com/ai/5234567.html","source":"人人都是产品经理"}]'::jsonb);

-- AI 产品领导力
insert into learning_tasks (module_id, title, objective, estimated_days, content_summary, sort_order, resources) values
((select id from skill_modules where slug='ai-leadership'), 'AI 战略规划', '制定公司级 AI 产品战略', 1.0, 'AI战略框架、机会评估、资源规划、路线图', 1,
 '[{"type":"article","title":"AI战略规划方法论","url":"https://www.woshipm.com/ai/5345678.html","source":"人人都是产品经理"}]'::jsonb),
((select id from skill_modules where slug='ai-leadership'), 'AI 团队搭建', '了解 AI 产品团队的组建和管理', 1.0, '团队结构、人才画像、招聘策略、文化建设', 2,
 '[{"type":"article","title":"AI产品团队搭建","url":"https://www.woshipm.com/ai/5456789.html","source":"人人都是产品经理"}]'::jsonb),
((select id from skill_modules where slug='ai-leadership'), '技术选型决策', '在多种 AI 技术方案中做出最优选择', 1.0, '自研vs外采、模型选型、架构决策、成本权衡', 3,
 '[{"type":"article","title":"AI技术选型决策框架","url":"https://www.woshipm.com/ai/5567890.html","source":"人人都是产品经理"}]'::jsonb),
((select id from skill_modules where slug='ai-leadership'), '行业洞察与趋势判断', '建立持续的行业洞察和趋势判断能力', 1.0, '信息源管理、趋势分析框架、战略预判方法', 4,
 '[{"type":"article","title":"AI行业洞察方法","url":"https://www.woshipm.com/ai/5678901.html","source":"人人都是产品经理"}]'::jsonb);
