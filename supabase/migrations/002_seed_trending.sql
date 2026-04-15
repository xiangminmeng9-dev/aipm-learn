-- ============================================================
-- 002_seed_trending.sql — 30 条初始热门面试问题
-- ============================================================

insert into trending_questions (text, type_id, rank, source) values
-- 产品设计类
('如何设计一个 AI 辅助的产品需求文档生成工具？', (select id from question_types where name = '产品设计类'), 1, 'editorial'),
('如果你是微信产品经理，会如何将 AI 能力融入朋友圈功能？', (select id from question_types where name = '产品设计类'), 2, 'editorial'),
('设计一个面向老年人的 AI 健康管理产品，你会怎么做？', (select id from question_types where name = '产品设计类'), 3, 'editorial'),

-- 数据指标类
('如何搭建一个 AI 推荐系统的效果评估体系？', (select id from question_types where name = '数据指标类'), 4, 'editorial'),
('DAU 下降 20%，你会如何排查原因？', (select id from question_types where name = '数据指标类'), 5, 'editorial'),
('如何设计 A/B 测试来验证 AI 功能对用户留存的影响？', (select id from question_types where name = '数据指标类'), 6, 'editorial'),

-- AI 工具使用类
('你平时使用哪些 AI 工具？如何评估它们的适用场景？', (select id from question_types where name = 'AI 工具使用类'), 7, 'editorial'),
('如何选择合适的 LLM 来完成特定的产品功能？', (select id from question_types where name = 'AI 工具使用类'), 8, 'editorial'),

-- 对 AI 看法/趋势类
('你认为 AI 会取代产品经理吗？为什么？', (select id from question_types where name = '对 AI 看法/趋势类'), 9, 'editorial'),
('如何看待大模型在垂直领域的应用前景？', (select id from question_types where name = '对 AI 看法/趋势类'), 10, 'editorial'),
('AI 产品和传统互联网产品在方法论上有什么本质区别？', (select id from question_types where name = '对 AI 看法/趋势类'), 11, 'editorial'),

-- AI 效果评估类
('如何评估一个对话式 AI 产品的回答质量？', (select id from question_types where name = 'AI 效果评估类'), 12, 'editorial'),
('设计一个评测集来衡量 AI 客服的满意度，你会怎么做？', (select id from question_types where name = 'AI 效果评估类'), 13, 'editorial'),

-- 场景分析类
('某电商平台想用 AI 做智能客服，但用户满意度一直上不去，你会怎么分析？', (select id from question_types where name = '场景分析类'), 14, 'editorial'),
('如何用 AI 提升内容平台的创作者体验？', (select id from question_types where name = '场景分析类'), 15, 'editorial'),

-- 竞品分析类
('对比 ChatGPT 和文心一言，你认为各自的核心优势是什么？', (select id from question_types where name = '竞品分析类'), 16, 'editorial'),
('如何分析一个 AI 竞品的战略意图？', (select id from question_types where name = '竞品分析类'), 17, 'editorial'),

-- 需求分析类
('用户说"想要一个更智能的搜索"，你如何判断这是真需求还是伪需求？', (select id from question_types where name = '需求分析类'), 18, 'editorial'),
('如何用 AI 能力重新定义一个传统功能的用户需求？', (select id from question_types where name = '需求分析类'), 19, 'editorial'),

-- 平衡/权衡类
('AI 功能的准确率和响应速度如何平衡？', (select id from question_types where name = '平衡/权衡类'), 20, 'editorial'),
('当 AI 生成内容可能存在偏见时，产品经理该如何决策？', (select id from question_types where name = '平衡/权衡类'), 21, 'editorial'),

-- 开放性问题
('如果你可以无限制地使用 AI，你最想创造什么产品？', (select id from question_types where name = '开放性问题'), 22, 'editorial'),
('AI 时代，产品经理最核心的能力是什么？', (select id from question_types where name = '开放性问题'), 23, 'editorial'),

-- 行为面试类
('描述一次你推动 AI 功能落地的经历，遇到了什么困难？', (select id from question_types where name = '行为面试类'), 24, 'editorial'),
('你如何与算法团队沟通需求？举一个具体例子。', (select id from question_types where name = '行为面试类'), 25, 'editorial'),

-- 系统设计类
('设计一个 AI 内容审核系统的架构，你会怎么考虑？', (select id from question_types where name = '系统设计类'), 26, 'editorial'),

-- 商业化/ROI 类
('如何评估一个 AI 功能的商业价值？', (select id from question_types where name = '商业化/ROI 类'), 27, 'editorial'),
('AI 产品的成本结构与传统产品有什么不同？如何控制成本？', (select id from question_types where name = '商业化/ROI 类'), 28, 'editorial'),

-- AI 伦理与安全类
('AI 产品如何防范生成有害内容？你的策略是什么？', (select id from question_types where name = 'AI 伦理与安全类'), 29, 'editorial'),

-- 用户增长类
('如何利用 AI 提升产品的用户留存率？', (select id from question_types where name = '用户增长类'), 30, 'editorial');
