# 研究报告: AI 产品经理面试助手

**功能**: 001-ai-pm-interview-assistant
**日期**: 2026-04-14

## 1. 数据库选型

**Decision**: Supabase（PostgreSQL 免费套餐）

**Rationale**:
- 免费套餐提供 500MB 存储、50k MAU、内置 Auth + Row Level Security
- 与 Next.js App Router 有官方 SDK 和 Auth helpers，集成度最高
- 包含用户认证系统，无需额外引入 Auth.js 等库
- PostgreSQL 关系型数据库，完美适配用户/Session/问题/回答等复杂关系模型
- 支持 Realtime 订阅（未来可扩展实时通知）

**Alternatives considered**:
- **Neon**: 500MB 存储、100 compute-hours/月，纯 Postgres 选项优秀，但无内置 Auth，需额外集成
- **Vercel Postgres**: Neon 底层，但免费套餐更小（256MB），且 Hobby 层仅限非商业用途
- **PlanetScale**: 免费套餐已于 2024 年 4 月停止，最低 $5/月，排除
- **Turso**: 5GB 存储最大，但 SQLite 基础，复杂关系查询能力不足

## 2. 长期记忆 Session 策略

**Decision**: 滑动窗口 + 摘要压缩（Sliding Window + Summarization）

**Rationale**:
- 实现复杂度低-中等，适合 MVP 阶段
- Token 效率优秀：保留最近 N 轮完整对话 + 更早对话的 AI 摘要
- 在 Next.js Route Handler 中天然适配，摘要存储在 Supabase
- 70% 阈值自动触发压缩，对用户透明无感知

**实现方案**:
1. 服务端追踪每个 Session 的 token 累计量
2. 当 token 量达到上下文窗口 70% 时，调用 Claude Haiku 压缩第 1~N-10 轮对话为摘要
3. 将摘要存入 Session 的 `compressed_summary` 字段
4. 后续请求发送：system prompt + JD/简历上下文 + 压缩摘要 + 最近 10 轮完整对话

**Alternatives considered**:
- **层级记忆（Hierarchical）**: 质量最好但实现复杂度高，需 Redis（L1/L2）+ pgvector（L3），超出 MVP 范围
- **RAG 记忆**: 需向量数据库和嵌入管道，对顺序对话的连贯性不如滑动窗口
- **Anthropic 原生功能**: 1M context window 可用但全量传递成本过高（10-80x），Memory Tool 仍为 beta

## 3. AI 模型选型

**Decision**: Claude Sonnet 4.6 主模型 + Claude Haiku 4.5 辅助模型

**Rationale**:
- Sonnet 4.6 用于核心生成任务（问题分析、模拟面试评分、方法论提炼），平衡质量与成本
- Haiku 4.5 用于辅助任务（Session 摘要压缩、问题类型分类），成本极低
- 通过 Anthropic TypeScript SDK `@anthropic-ai/sdk` 集成

**Alternatives considered**:
- **Claude Opus 4.6**: 质量最高但成本高，非必要场景过度消费
- **GPT-4o**: 需额外接入 OpenAI，增加依赖复杂度
- **开源模型**: 需自托管，不符合免费云资源约束

## 4. 问题类型动态分类策略

**Decision**: AI 驱动的动态分类 + 数据库标签管理

**Rationale**:
- 每次用户提问或模拟面试产生新问答时，Claude Haiku 对问题进行分类
- 分类结果与数据库中已有类型比对：匹配则归入，不匹配则创建新类型
- 新类型创建时同步生成该类型的初始方法论框架
- 15 种种子类型预置在数据库中，作为分类参考基线

**实现方案**:
1. 分类 prompt 包含已有类型列表 + 类型描述
2. 如果 AI 判断问题不属于任何已有类型，返回建议的新类型名称 + 描述
3. 后端验证后创建新类型记录，触发方法论初始化

## 5. 热门问题数据源

**Decision**: 人工种子数据 + AI 定期分析生成

**Rationale**:
- 初期：人工维护 30-50 道高频面试问题作为种子数据
- 中期：通过 AI 分析公开面试分享内容（牛客网、知乎等），生成新热门问题
- 更新频率：每周至少一次，通过 Vercel Cron Job 或手动触发

**Alternatives considered**:
- **纯爬虫**: 法律和维护风险高
- **纯人工**: 不可持续，更新频率无法保证
- **用户贡献**: 初期用户量不足以形成有效 UGC

## 6. 模拟面试弱项→技能树映射

**Decision**: 问题类型标签与技能模块的预定义映射表

**Rationale**:
- 在数据库中维护一张映射表：问题类型 → 技能模块 + 推荐学习任务
- 动态新增的问题类型，由 AI 在创建时自动推荐最相关的技能模块
- 模拟面试总结时查询映射表，生成弱项推荐链接

## 7. 认证方案

**Decision**: Supabase Auth（邮箱+密码）

**Rationale**:
- Supabase 内置 Auth 功能，零额外成本
- 支持邮箱注册/登录、密码重置
- Row Level Security (RLS) 确保数据隔离
- MVP 阶段足够，后续可扩展 OAuth（GitHub/Google）

**Alternatives considered**:
- **Auth.js (NextAuth)**: 需额外配置，Supabase 已内置更方便
- **Clerk**: 功能强大但免费套餐有限制，增加外部依赖
