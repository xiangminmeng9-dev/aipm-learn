# 数据模型: AI 产品经理面试助手

**功能**: 001-ai-pm-interview-assistant
**日期**: 2026-04-14
**数据库**: Supabase (PostgreSQL)

## 实体关系图

```
User 1──N ChatSession
User 1──N MockInterview
User 1──N QuestionAnalysis
User 1──N InterviewMethodology
User 1──N Progress (技能学习板块)

ChatSession 1──N ChatMessage
ChatSession 1──1 JD/简历 (内嵌字段)

MockInterview 1──N InterviewAnswer
MockInterview 1──1 MockSummary (内嵌字段)

InterviewQuestion 1──N QuestionAnalysis
InterviewQuestion N──1 QuestionType

QuestionType 1──N InterviewMethodology
QuestionType N──N SkillModule (映射表)

TrendingQuestion N──1 QuestionType
```

## 实体定义

### 1. User（用户）

| 字段 | 类型 | 约束 | 说明 |
|------|------|------|------|
| id | uuid | PK, 由 Supabase Auth 管理 | 用户唯一标识 |
| email | text | NOT NULL, UNIQUE | 注册邮箱 |
| created_at | timestamptz | NOT NULL, DEFAULT now() | 注册时间 |
| last_login_at | timestamptz | | 最后登录时间 |

**说明**: 用户表由 Supabase Auth 自动管理（`auth.users`），业务表通过 `user_id` 外键关联。

---

### 2. QuestionType（问题类型）

| 字段 | 类型 | 约束 | 说明 |
|------|------|------|------|
| id | uuid | PK, DEFAULT gen_random_uuid() | 类型唯一标识 |
| name | text | NOT NULL, UNIQUE | 类型名称（如"产品设计类"） |
| description | text | | 类型描述 |
| is_seed | boolean | NOT NULL, DEFAULT false | 是否为种子类型（预置） |
| created_by | uuid | FK → auth.users, NULLABLE | 由哪个用户的练习触发创建（种子类型为 NULL） |
| created_at | timestamptz | NOT NULL, DEFAULT now() | 创建时间 |

**生命周期**: 系统初始化时预置 15 种种子类型（is_seed=true）。用户练习中 AI 识别新类型时动态创建（is_seed=false, created_by=触发用户）。类型为全局共享，所有用户可见。

---

### 3. ChatSession（对话 Session）

| 字段 | 类型 | 约束 | 说明 |
|------|------|------|------|
| id | uuid | PK, DEFAULT gen_random_uuid() | Session 唯一标识 |
| user_id | uuid | FK → auth.users, NOT NULL | 所属用户 |
| title | text | NOT NULL, DEFAULT '新对话' | Session 标题 |
| jd_text | text | | 岗位 JD 文本（选填） |
| resume_text | text | | 简历文本（选填） |
| compressed_summary | text | | 压缩后的历史摘要 |
| total_tokens | integer | NOT NULL, DEFAULT 0 | 当前累计 token 数 |
| is_compressed | boolean | NOT NULL, DEFAULT false | 是否已触发过压缩 |
| created_at | timestamptz | NOT NULL, DEFAULT now() | 创建时间 |
| updated_at | timestamptz | NOT NULL, DEFAULT now() | 最后更新时间 |

**RLS**: 用户只能访问自己的 Session（`user_id = auth.uid()`）。

---

### 4. ChatMessage（对话消息）

| 字段 | 类型 | 约束 | 说明 |
|------|------|------|------|
| id | uuid | PK, DEFAULT gen_random_uuid() | 消息唯一标识 |
| session_id | uuid | FK → chat_sessions, NOT NULL | 所属 Session |
| role | text | NOT NULL, CHECK (role IN ('user', 'assistant')) | 消息角色 |
| content | text | NOT NULL | 消息内容 |
| is_compressed | boolean | NOT NULL, DEFAULT false | 是否已被压缩归入摘要 |
| token_count | integer | NOT NULL, DEFAULT 0 | 该消息的 token 数 |
| created_at | timestamptz | NOT NULL, DEFAULT now() | 发送时间 |

**索引**: session_id + created_at 联合索引，用于按时间排序查询。

---

### 5. InterviewQuestion（面试问题）

| 字段 | 类型 | 约束 | 说明 |
|------|------|------|------|
| id | uuid | PK, DEFAULT gen_random_uuid() | 问题唯一标识 |
| text | text | NOT NULL | 问题文本 |
| type_id | uuid | FK → question_types, NULLABLE | 问题类型（AI 分类后填入） |
| source | text | NOT NULL, CHECK (source IN ('user_input', 'trending', 'mock_generated')) | 问题来源 |
| user_id | uuid | FK → auth.users, NULLABLE | 提问用户（热门问题为 NULL） |
| created_at | timestamptz | NOT NULL, DEFAULT now() | 创建时间 |

---

### 6. QuestionAnalysis（问题分析）

| 字段 | 类型 | 约束 | 说明 |
|------|------|------|------|
| id | uuid | PK, DEFAULT gen_random_uuid() | 分析唯一标识 |
| question_id | uuid | FK → interview_questions, NOT NULL | 关联问题 |
| user_id | uuid | FK → auth.users, NOT NULL | 关联用户 |
| analysis | text | NOT NULL | 问题分析（背后逻辑） |
| thinking_framework | text | NOT NULL | 思考方式（结构化框架） |
| answer_approach | text | NOT NULL | 回答思路（逻辑链） |
| answer_template | text | NOT NULL | 面试回答模板（口语化） |
| created_at | timestamptz | NOT NULL, DEFAULT now() | 创建时间 |

---

### 7. MockInterview（模拟面试）

| 字段 | 类型 | 约束 | 说明 |
|------|------|------|------|
| id | uuid | PK, DEFAULT gen_random_uuid() | 面试唯一标识 |
| user_id | uuid | FK → auth.users, NOT NULL | 关联用户 |
| type_id | uuid | FK → question_types, NOT NULL | 选择的问题类型 |
| total_questions | integer | NOT NULL, CHECK (total_questions IN (3,5,8,10)) | 题目数量 |
| current_question | integer | NOT NULL, DEFAULT 0 | 当前进行到第几题 |
| jd_text | text | | 岗位 JD（选填） |
| resume_text | text | | 简历（选填） |
| status | text | NOT NULL, DEFAULT 'in_progress', CHECK (status IN ('in_progress', 'completed', 'abandoned')) | 面试状态 |
| total_score | numeric(4,1) | | 总分（完成后计算） |
| summary_strengths | text | | 强项分析 |
| summary_weaknesses | text | | 弱项分析 |
| summary_suggestions | text | | 改进建议 |
| weak_skill_modules | jsonb | | 弱项映射的技能模块 ID 列表 |
| created_at | timestamptz | NOT NULL, DEFAULT now() | 创建时间 |
| completed_at | timestamptz | | 完成时间 |

**状态转换**: `in_progress` → `completed`（全部答完）或 `abandoned`（用户中途退出）。

---

### 8. InterviewAnswer（面试作答）

| 字段 | 类型 | 约束 | 说明 |
|------|------|------|------|
| id | uuid | PK, DEFAULT gen_random_uuid() | 作答唯一标识 |
| mock_interview_id | uuid | FK → mock_interviews, NOT NULL | 所属模拟面试 |
| question_number | integer | NOT NULL | 题目序号（从 1 开始） |
| question_text | text | NOT NULL | AI 生成的问题文本 |
| question_type_id | uuid | FK → question_types | 该题的问题类型 |
| user_answer | text | | 用户回答（跳过时为 NULL） |
| score | numeric(3,1) | CHECK (score >= 0 AND score <= 10) | 得分（1-10） |
| gap_analysis | text | | 差距分析 |
| perfect_answer | text | | 满分回答范例 |
| is_skipped | boolean | NOT NULL, DEFAULT false | 是否跳过 |
| created_at | timestamptz | NOT NULL, DEFAULT now() | 创建时间 |
| answered_at | timestamptz | | 回答时间 |

---

### 9. InterviewMethodology（面试方法论）

| 字段 | 类型 | 约束 | 说明 |
|------|------|------|------|
| id | uuid | PK, DEFAULT gen_random_uuid() | 方法论唯一标识 |
| user_id | uuid | FK → auth.users, NOT NULL | 关联用户 |
| type_id | uuid | FK → question_types, NOT NULL | 问题类型 |
| framework | text | NOT NULL | 核心框架描述 |
| key_steps | jsonb | NOT NULL, DEFAULT '[]' | 关键步骤列表 |
| typical_cases | jsonb | NOT NULL, DEFAULT '[]' | 典型案例引用列表 |
| source_count | integer | NOT NULL, DEFAULT 1 | 基于多少条问答数据提炼 |
| created_at | timestamptz | NOT NULL, DEFAULT now() | 创建时间 |
| updated_at | timestamptz | NOT NULL, DEFAULT now() | 最后更新时间 |

**唯一约束**: (user_id, type_id) UNIQUE — 每个用户每个类型只有一份方法论。

---

### 10. TrendingQuestion（热门问题）

| 字段 | 类型 | 约束 | 说明 |
|------|------|------|------|
| id | uuid | PK, DEFAULT gen_random_uuid() | 唯一标识 |
| text | text | NOT NULL | 问题文本 |
| type_id | uuid | FK → question_types | 问题类型 |
| rank | integer | NOT NULL | 热度排名 |
| source | text | | 来源说明 |
| created_at | timestamptz | NOT NULL, DEFAULT now() | 创建时间 |
| updated_at | timestamptz | NOT NULL, DEFAULT now() | 更新时间 |

---

### 11. TypeSkillMapping（问题类型→技能模块映射）

| 字段 | 类型 | 约束 | 说明 |
|------|------|------|------|
| id | uuid | PK, DEFAULT gen_random_uuid() | 唯一标识 |
| type_id | uuid | FK → question_types, NOT NULL | 问题类型 |
| skill_module_id | uuid | NOT NULL | 对应的技能模块 ID（来自技能学习板块） |
| recommended_tasks | jsonb | DEFAULT '[]' | 推荐的学习任务 ID 列表 |
| created_at | timestamptz | NOT NULL, DEFAULT now() | 创建时间 |

**唯一约束**: (type_id, skill_module_id) UNIQUE。

## 验证规则

| 实体 | 规则 |
|------|------|
| ChatMessage.content | 不能为空字符串 |
| InterviewQuestion.text | 长度 ≥ 5 字符，≤ 5000 字符 |
| MockInterview.total_questions | 只能是 3/5/8/10 |
| InterviewAnswer.score | 范围 0-10，精度到 0.5 |
| InterviewMethodology | (user_id, type_id) 唯一 |
| QuestionType.name | 全局唯一，不区分大小写 |
