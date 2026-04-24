# 研究结果: AI PM 模拟工作流程

本文件记录了针对 "AI PM 模拟工作流程" 架构与设计的核心决策。

## 1. 模拟阶段配置 (Simulator Stages) 的存储方式

**Decision**: 将模拟阶段的配置（阶段名称、顺序、背景描述、任务目标、系统提示词、特定角色的设定）作为前端应用内（或共享的 lib 目录内）的静态配置字典（TypeScript 对象），而不是存储在 Supabase 的独立表中。

**Rationale**: 
1. 该工作流程的节点大纲和角色设定属于产品核心逻辑的一部分，不会经常动态变化。
2. 静态配置方便随代码一起版本控制，并且避免了额外查询数据库的延迟。
3. 允许在配置中更方便地关联本地静态资产（如图标、静态文档链接等）。

**Alternatives considered**: 
在 Supabase 数据库中创建 `simulator_stages` 表并在客户端动态拉取。被拒绝是因为增加了初始渲染时的网络开销，且这种元数据较少产生外部动态管理需求。

## 2. 会话进度和历史的持久化 (Simulator Session)

**Decision**: 在 Supabase 中创建新表 `simulator_sessions` 和 `simulator_messages`（如果需要持久化长历史），或者使用单个 JSONB 字段存储交互状态。由于每个用户理论上只有一条活跃或历史的“工作流”路径（可重置），我们采用 `simulator_sessions` 表来存储进度：包含字段 `user_id`、`current_stage_id`、`stage_scores` (JSONB，记录各阶段得分与反馈)、`completed_at`。

对于各阶段的对话记录，可以复用之前创建问答历史的思路，或者通过 `simulator_messages` 记录，以方便 AI 提供前后文。我们决定创建一个 `simulator_sessions` 记录主状态，以及 `simulator_messages` 记录每个阶段具体的对话历史。

**Rationale**: 
1. 工作流是一系列连续的任务，需要持久化跟踪用户到底处于哪个卡点。
2. 隔离这些数据避免污染原有的 `question_analyses` 或 `learning_progress` 等用途不同的表。
3. JSONB 能够很灵活地容纳未来可能增加的多维度评分（如“产品思维”、“沟通技巧”等）。

**Alternatives considered**: 
仅保存在 LocalStorage 中。被拒绝是因为用户如果跨端/跨浏览器使用会丢失体验历史，且后端 AI 打分无法安全保存以供回溯展示。

## 3. AI 对话的流式响应及评分

**Decision**: 复用现有的 `@/lib/ai/claude` 中的 `generateText` 或流式函数，结合专门为各阶段角色（如算法工程师挑战你的需求、业务方提意见）设计的系统提示词。

**Rationale**: 
项目已经具备稳定的基于 Claude API 的调用能力。我们只需要利用 `lib/ai/simulator-prompts.ts` 提供特定的人设，即可达成该阶段场景的需求。最后阶段结束时采用类似 `ASSISTANT_SCORING_SYSTEM_PROMPT` 的做法，让 AI 输出指定 JSON 进行结果评审。

**Alternatives considered**: 
无。这是利用现有团队技术栈最直接有效的方法。
