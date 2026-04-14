# 任务: AI 产品经理面试助手

**输入**: 来自 `/specs/001-ai-pm-interview-assistant/` 的设计文档
**前置条件**: plan.md（必需）、spec.md（必需）、research.md、data-model.md、contracts/

**测试**: 章程要求单元测试（Vitest）和页面级 E2E 测试（Playwright），已包含在任务中。

**组织结构**: 任务按用户故事分组，以便每个故事能够独立实施和测试。

## 格式: `[ID] [P] [Story] 描述`
- **[P]**: 可以并行运行（不同文件，无依赖关系）
- **[Story]**: 此任务属于哪个用户故事（例如: US1、US2、US3）
- 在描述中包含确切的文件路径

## 阶段 1: 设置（共享基础设施）

**目的**: 项目初始化和基本结构

- [ ] T001 使用 Next.js App Router + TypeScript + Tailwind CSS + pnpm 初始化项目，配置 `tsconfig.json` 严格模式
- [ ] T002 [P] 配置 ESLint + Prettier，创建 `.eslintrc.js` 和 `.prettierrc`
- [ ] T003 [P] 配置 Vitest，创建 `vitest.config.ts`
- [ ] T004 [P] 配置 Playwright，创建 `playwright.config.ts`
- [ ] T005 [P] 初始化 shadcn/ui，运行 `npx shadcn@latest init` 并添加基础组件（Button, Input, Card, Dialog, Tabs, Accordion）
- [ ] T006 创建 `.env.example` 和 `.env.local`，包含 Supabase 和 Anthropic 环境变量
- [ ] T007 创建全局类型定义 `src/types/index.ts`，定义所有实体的 TypeScript 接口（User, QuestionType, ChatSession, ChatMessage, InterviewQuestion, QuestionAnalysis, MockInterview, InterviewAnswer, InterviewMethodology, TrendingQuestion, TypeSkillMapping）

---

## 阶段 2: 基础（阻塞前置条件）

**目的**: 在任何用户故事可以实施之前必须完成的核心基础设施

**⚠️ 关键**: 在此阶段完成之前，无法开始任何用户故事工作

- [ ] T008 在 Supabase 中创建数据库迁移文件 `supabase/migrations/001_initial_schema.sql`，包含所有 11 个表的 DDL（question_types, chat_sessions, chat_messages, interview_questions, question_analyses, mock_interviews, interview_answers, interview_methodologies, trending_questions, type_skill_mappings）+ 索引 + RLS 策略
- [ ] T009 在 Supabase 中预置 15 种种子问题类型数据 `supabase/seed.sql`（产品设计类、数据指标类、AI 工具使用类、对 AI 看法/趋势类、AI 效果评估类、场景分析类、竞品分析类、需求分析类、平衡/权衡类、开放性问题、行为面试类、系统设计类、商业化/ROI 类、AI 伦理与安全类、用户增长类）
- [ ] T010 [P] 创建 Supabase 客户端封装 `src/lib/supabase/client.ts`（浏览器端）和 `src/lib/supabase/server.ts`（服务端），使用 `@supabase/ssr`
- [ ] T011 [P] 创建 Supabase Auth 中间件 `src/middleware.ts`，处理会话刷新和路由保护
- [ ] T012 [P] 创建 Claude API 封装 `src/lib/ai/claude.ts`，封装 `@anthropic-ai/sdk`，支持 Sonnet（核心生成）和 Haiku（辅助任务）两个模型
- [ ] T013 [P] 创建 Token 计数工具 `src/lib/utils/tokens.ts`，估算消息的 token 数量
- [ ] T014 实现认证页面 `src/app/(auth)/login/page.tsx` 和 `src/app/(auth)/register/page.tsx`，使用 Supabase Auth 邮箱+密码登录注册
- [ ] T015 [P] 创建根布局 `src/app/layout.tsx`（全局样式、字体、Supabase Provider）和首页 `src/app/page.tsx`（导航到三大板块）
- [ ] T016 [P] 创建面试助手布局 `src/app/interview/layout.tsx`（侧边导航：问答、Session、模拟面试、方法论、统计）和导航组件 `src/components/layout/Sidebar.tsx`

**检查点**: 基础就绪 — 数据库、认证、AI 客户端、布局全部可用，可以开始用户故事

---

## 阶段 3: 用户故事 1 — 面试问题问答与深度分析（优先级: P1）🎯 MVP

**目标**: 用户输入面试问题，获取四部分深度分析（问题分析→思考方式→回答思路→口语化模板）+ 热门问题

**独立测试**: 输入一道问题，验证返回四部分完整输出；点击热门问题自动填入并分析

### 用户故事 1 的测试 ⚠️

- [ ] T017 [P] [US1] 在 `tests/unit/classifier.test.ts` 中为问题类型分类器编写单元测试：测试已有类型匹配、新类型识别
- [ ] T018 [P] [US1] 在 `tests/e2e/qa.spec.ts` 中编写 E2E 测试：输入问题→验证四部分输出、点击热门问题→验证自动分析、空输入→验证错误提示

### 用户故事 1 的实施

- [ ] T019 [P] [US1] 创建 Prompt 模板 `src/lib/ai/prompts.ts`：定义问题分析 prompt（要求输出四部分：问题分析、思考方式、回答思路、口语化模板）
- [ ] T020 [P] [US1] 创建问题类型分类器 `src/lib/ai/classifier.ts`：接收问题文本 + 已有类型列表，调用 Haiku 返回分类结果或建议新类型
- [ ] T021 [US1] 创建问题分析 API `src/app/api/interview/analyze/route.ts`：接收问题文本→分类→调用 Sonnet 生成四部分分析→保存到 interview_questions + question_analyses 表→返回结果
- [ ] T022 [US1] 创建热门问题 API `src/app/api/interview/trending/route.ts`：从 trending_questions 表查询，按 rank 排序，支持 limit 参数
- [ ] T023 [P] [US1] 创建问题输入组件 `src/components/interview/QuestionInput.tsx`：多行文本框 + 生成按钮 + 加载状态 + 取消操作 + 输入验证（5-5000 字符）
- [ ] T024 [P] [US1] 创建分析结果组件 `src/components/interview/AnalysisResult.tsx`：四部分可展开/折叠展示，回答模板部分使用段落式排版（无列表符号）
- [ ] T025 [P] [US1] 创建热门问题组件 `src/components/interview/TrendingQuestions.tsx`：横向滚动卡片列表，点击自动填入输入框
- [ ] T026 [US1] 组装面试问答页面 `src/app/interview/qa/page.tsx`：集成 QuestionInput + TrendingQuestions + AnalysisResult，处理状态流转
- [ ] T027 [US1] 在 trending_questions 表中插入 30 条初始热门面试问题数据 `supabase/migrations/002_seed_trending.sql`

**检查点**: 用户可以输入问题获取四部分分析，可以点击热门问题快速分析。US1 独立可用。

---

## 阶段 4: 用户故事 2 — 长期记忆对话 Session（优先级: P1）

**目标**: 支持多轮对话的 Session 机制，滑动窗口+摘要压缩，支持 JD/简历背景

**独立测试**: 在同一 Session 中进行 5+ 轮对话，验证系统引用前几轮内容；添加 JD 后验证回答针对性

### 用户故事 2 的测试 ⚠️

- [ ] T028 [P] [US2] 在 `tests/unit/memory.test.ts` 中为记忆压缩逻辑编写单元测试：测试 token 计数、阈值判断、压缩触发、摘要生成
- [ ] T029 [P] [US2] 在 `tests/e2e/session.spec.ts` 中编写 E2E 测试：创建 Session→多轮对话→验证上下文保持、添加 JD→验证针对性回答、刷新后→验证数据保留

### 用户故事 2 的实施

- [ ] T030 [US2] 创建记忆压缩逻辑 `src/lib/ai/memory.ts`：实现滑动窗口+摘要压缩策略（70% 阈值触发，Haiku 压缩旧消息为摘要，保留最近 10 轮完整对话）
- [ ] T031 [US2] 创建 Session CRUD API `src/app/api/interview/sessions/route.ts`：GET（列表分页）+ POST（创建新 Session）
- [ ] T032 [US2] 创建单 Session API `src/app/api/interview/sessions/[id]/route.ts`：GET（详情+消息历史）+ PATCH（更新标题/JD/简历）+ DELETE
- [ ] T033 [US2] 创建 Session 对话 API `src/app/api/interview/sessions/[id]/chat/route.ts`：接收消息→组装上下文（system prompt + JD/简历 + 压缩摘要 + 最近消息）→调用 Sonnet 流式输出→保存消息→检查是否需要压缩→返回 SSE 流
- [ ] T034 [P] [US2] 创建 Session 列表页 `src/app/interview/sessions/page.tsx`：展示用户所有 Session 卡片列表，支持新建/删除
- [ ] T035 [P] [US2] 创建 Session 头部组件 `src/components/interview/SessionHeader.tsx`：JD 和简历文本输入区域（可折叠），编辑/保存功能
- [ ] T036 [P] [US2] 创建对话界面组件 `src/components/interview/ChatSession.tsx`：消息气泡列表 + 输入框 + 流式响应展示 + 压缩状态指示
- [ ] T037 [US2] 组装单个 Session 页面 `src/app/interview/sessions/[id]/page.tsx`：集成 SessionHeader + ChatSession，处理 SSE 流式响应

**检查点**: 用户可以创建 Session、多轮对话（带上下文记忆）、添加 JD/简历获取针对性回答。US2 独立可用。

---

## 阶段 5: 用户故事 3 — 基于 JD 和简历的模拟面试（优先级: P1）

**目标**: 逐题交互式模拟面试（AI 出题→用户答→即时评价→下一题→最终总结→弱项映射技能树）

**独立测试**: 选择类型和题数→完成作答→验证每题即时评价→验证最终总结报告含弱项映射

### 用户故事 3 的测试 ⚠️

- [ ] T038 [P] [US3] 在 `tests/e2e/mock-interview.spec.ts` 中编写 E2E 测试：配置面试→答题→验证即时评价→完成→验证总结报告、跳过题目→验证不计分、仅 JD 无简历→验证正常运行

### 用户故事 3 的实施

- [ ] T039 [US3] 创建模拟面试 Prompt 模板：在 `src/lib/ai/prompts.ts` 中追加出题 prompt（基于类型+JD+简历）、评分 prompt（打分+差距+满分回答）、总结 prompt（强弱项+建议+技能映射）
- [ ] T040 [US3] 创建模拟面试 API `src/app/api/interview/mock/route.ts`：POST 创建模拟面试→生成第一题→保存到 mock_interviews + interview_answers 表→返回面试 ID 和第一题
- [ ] T041 [US3] 创建答题评价 API `src/app/api/interview/mock/[id]/answer/route.ts`：接收用户回答→调用 Sonnet 评分→保存评价→如非最后一题则生成下一题→返回评价+下一题
- [ ] T042 [US3] 创建最终总结 API `src/app/api/interview/mock/[id]/summary/route.ts`：汇总所有答题数据→调用 Sonnet 生成总结（强弱项+建议）→查询 type_skill_mappings 映射弱项到技能模块→更新 mock_interviews 记录→返回总结报告
- [ ] T043 [US3] 创建问题类型列表 API `src/app/api/interview/question-types/route.ts`：GET 返回所有问题类型（种子+动态）及各类型题目数量
- [ ] T044 [P] [US3] 创建模拟面试配置页 `src/app/interview/mock/page.tsx`：JD/简历输入 + 类型选择（下拉多选或单选）+ 题数选择（3/5/8/10）+ 开始按钮
- [ ] T045 [P] [US3] 创建答题评价组件 `src/components/interview/AnswerEvaluation.tsx`：展示得分（仪表盘样式）+ 差距分析 + 满分回答（可折叠）
- [ ] T046 [P] [US3] 创建模拟面试流程组件 `src/components/interview/MockInterviewFlow.tsx`：当前题号/总题数进度条 + 问题展示 + 回答输入框 + 提交/跳过按钮 + 评价展示 + 下一题按钮
- [ ] T047 [P] [US3] 创建模拟面试总结组件 `src/components/interview/MockSummary.tsx`：总分 + 各题得分明细表 + 强弱项雷达图/列表 + 改进建议 + 弱项对应技能模块链接
- [ ] T048 [US3] 组装模拟面试进行页 `src/app/interview/mock/[id]/page.tsx`：集成 MockInterviewFlow + AnswerEvaluation + MockSummary，管理面试状态流转（in_progress→completed）
- [ ] T049 [US3] 在 type_skill_mappings 表中插入初始映射数据 `supabase/migrations/003_seed_skill_mappings.sql`：15 种种子类型与技能模块的对应关系

**检查点**: 用户可以配置并完成模拟面试，每题获得即时评价，最终获得总结报告和技能树推荐。US3 独立可用。

---

## 阶段 6: 用户故事 4 — 面试问题方法论提炼（优先级: P1）

**目标**: 基于练习历史动态生成问题类型和方法论，类型不封顶，新类型自动创建

**独立测试**: 完成 10+ 次问答后进入方法论页面，验证按类型展示方法论；提问新类型验证自动创建

### 用户故事 4 的测试 ⚠️

- [ ] T050 [P] [US4] 在 `tests/e2e/methodology.spec.ts` 中编写 E2E 测试：练习不足时→显示提示、练习充足后→按类型展示方法论、新类型→验证自动创建

### 用户故事 4 的实施

- [ ] T051 [US4] 创建方法论生成/更新 Prompt：在 `src/lib/ai/prompts.ts` 中追加方法论提炼 prompt（输入某类型的所有历史问答→输出核心框架+关键步骤+典型案例）
- [ ] T052 [US4] 创建方法论 API `src/app/api/interview/methodology/route.ts`：GET 返回用户所有方法论列表（含类型名、框架摘要、数据源数量）；内部逻辑：检查是否需要基于新数据更新方法论
- [ ] T053 [US4] 创建单类型方法论详情 API `src/app/api/interview/methodology/[typeId]/route.ts`：GET 返回该类型详细方法论 + 高频问题列表
- [ ] T054 [US4] 在问题分析 API（T021）和答题评价 API（T041）中追加方法论更新触发逻辑：每次新问答完成后，异步检查该类型方法论是否需要更新（source_count 变化）；如果是新类型，同步创建初始方法论
- [ ] T055 [P] [US4] 创建方法论卡片组件 `src/components/interview/MethodologyCard.tsx`：展示类型名称、核心框架摘要、数据源数量、最后更新时间
- [ ] T056 [P] [US4] 创建方法论详情展示组件：在 MethodologyCard 展开后显示关键步骤列表 + 典型案例 + 高频问题链接
- [ ] T057 [US4] 组装方法论页面 `src/app/interview/methodology/page.tsx`：方法论卡片网格/列表 + 练习不足提示 + 类型筛选

**检查点**: 方法论页面按类型展示动态提炼的方法论，新类型自动创建。US4 独立可用。

---

## 阶段 7: 用户故事 5 — 练习数据统计与问题总结（优先级: P2）

**目标**: 练习统计面板，展示练习量、类型分布、得分趋势、弱项推荐

**独立测试**: 完成若干练习后查看统计面板，验证数据准确

### 用户故事 5 的实施

- [ ] T058 [US5] 创建统计 API `src/app/api/interview/stats/route.ts`：聚合查询 interview_questions + question_analyses + mock_interviews + interview_answers，返回总练习数、类型分布、模拟面试平均分趋势、弱项领域+推荐题目
- [ ] T059 [P] [US5] 创建统计面板组件 `src/components/interview/StatsPanel.tsx`：总练习数卡片 + 类型分布饼图（使用 ECharts）+ 模拟面试得分趋势折线图 + 弱项领域列表
- [ ] T060 [US5] 组装统计页面 `src/app/interview/stats/page.tsx`：集成 StatsPanel，无数据时显示空状态引导
- [ ] T061 [US5] 安装并配置 ECharts `pnpm add echarts echarts-for-react`，创建图表封装组件 `src/components/interview/charts/PieChart.tsx` 和 `LineChart.tsx`

**检查点**: 统计面板展示准确的练习数据和可视化图表。US5 独立可用。

---

## 阶段 8: 完善与横切关注点

**目的**: 影响多个用户故事的改进

- [ ] T062 [P] 添加全局错误处理 `src/app/error.tsx` 和 `src/app/not-found.tsx`
- [ ] T063 [P] 添加全局加载状态 `src/app/loading.tsx` 和面试板块加载 `src/app/interview/loading.tsx`
- [ ] T064 [P] 添加响应式适配：确保所有页面在移动端（<768px）正常展示
- [ ] T065 运行 Prettier 格式化检查 `npx prettier --check .` 并修复所有格式问题
- [ ] T066 运行 ESLint 检查 `npx eslint .` 并修复所有 lint 问题
- [ ] T067 运行 TypeScript 类型检查 `npx tsc --noEmit` 并修复所有类型错误
- [ ] T068 运行全部单元测试 `pnpm test` 确保全部通过
- [ ] T069 运行全部 E2E 测试 `npx playwright test` 确保全部通过
- [ ] T070 运行生产构建 `pnpm build` 确保零错误
- [ ] T071 运行生产模式 `pnpm start` 并手动验证核心流程（问答→Session 对话→模拟面试→方法论→统计）

---

## 依赖关系与执行顺序

### 阶段依赖关系

- **设置（阶段 1）**: 无依赖关系 — 可立即开始
- **基础（阶段 2）**: 依赖于设置完成 — 阻塞所有用户故事
- **US1 问答（阶段 3）**: 依赖于基础完成 — MVP 核心
- **US2 Session（阶段 4）**: 依赖于基础完成 — 可与 US1 并行
- **US3 模拟面试（阶段 5）**: 依赖于基础完成 — 可与 US1/US2 并行
- **US4 方法论（阶段 6）**: 依赖于 US1 和 US3（需要问答/面试数据源触发方法论）
- **US5 统计（阶段 7）**: 依赖于 US1 和 US3（需要练习数据才有统计内容）
- **完善（阶段 8）**: 依赖于所有用户故事完成

### 用户故事依赖关系

- **US1（P1）**: 基础完成后即可开始 — 无其他故事依赖
- **US2（P1）**: 基础完成后即可开始 — 独立于 US1
- **US3（P1）**: 基础完成后即可开始 — 独立于 US1/US2
- **US4（P1）**: 依赖 US1（分类器和问答数据）和 US3（面试数据）
- **US5（P2）**: 依赖 US1 和 US3（需要数据才能统计）

### 每个用户故事内部

- 测试在实施前编写并确认失败
- Prompt 模板和工具函数优先
- API 路由在组件之前
- 页面组装在组件和 API 之后
- 故事完成后才移至下一个优先级

### 并行机会

- **阶段 1**: T002/T003/T004/T005 全部可并行
- **阶段 2**: T010/T011/T012/T013 可并行；T015/T016 可并行
- **基础完成后**: US1/US2/US3 三个故事可并行开始
- **US1 内**: T017/T018 可并行；T019/T020 可并行；T023/T024/T025 可并行
- **US2 内**: T028/T029 可并行；T034/T035/T036 可并行
- **US3 内**: T044/T045/T046/T047 可并行
- **US4 内**: T055/T056 可并行

---

## 并行示例: 用户故事 1

```bash
# 一起启动 US1 的所有测试:
任务: "在 tests/unit/classifier.test.ts 中为分类器编写单元测试"
任务: "在 tests/e2e/qa.spec.ts 中编写问答 E2E 测试"

# 一起启动 US1 的工具和 Prompt:
任务: "创建 Prompt 模板 src/lib/ai/prompts.ts"
任务: "创建问题类型分类器 src/lib/ai/classifier.ts"

# 一起启动 US1 的所有前端组件:
任务: "创建 QuestionInput 组件"
任务: "创建 AnalysisResult 组件"
任务: "创建 TrendingQuestions 组件"
```

---

## 实施策略

### 仅 MVP（用户故事 1）

1. 完成阶段 1: 设置
2. 完成阶段 2: 基础
3. 完成阶段 3: 用户故事 1（问答）
4. **停止并验证**: 独立测试 US1
5. 部署/演示

### 增量交付

1. 完成设置 + 基础 → 基础就绪
2. 添加 US1 → 独立测试 → 部署（MVP!）
3. 添加 US2 → 独立测试 → 部署（Session 对话）
4. 添加 US3 → 独立测试 → 部署（模拟面试）
5. 添加 US4 → 独立测试 → 部署（方法论）
6. 添加 US5 → 独立测试 → 部署（统计）
7. 完善阶段 → 最终发布

---

## 注意事项

- [P] 任务 = 不同文件，无依赖关系
- [Story] 标签将任务映射到特定用户故事以实现可追溯性
- 每个用户故事应该独立可完成和可测试
- 在实施前验证测试失败
- 在每个任务或逻辑组后提交
- 在任何检查点停止以独立验证故事
- 避免: 模糊任务、相同文件冲突、破坏独立性的跨故事依赖
