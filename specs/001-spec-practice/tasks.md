# 任务: AI Coding 实操

**输入**: 来自 `/specs/001-spec-practice/` 的设计文档
**前置条件**: plan.md(必需)、spec.md(用户故事必需)、research.md、data-model.md、contracts/

**组织结构**: 任务按用户故事分组, 以便每个故事能够独立实施和测试.

## 格式: `[ID] [P] [Story] 描述`
- **[P]**: 可以并行运行(不同文件, 无依赖关系)
- **[Story]**: 此任务属于哪个用户故事(例如: US1、US2、US3)
- 在描述中包含确切的文件路径

## 路径约定
- 单一项目: 仓库根目录下的 `src/`、`supabase/`

---

## 阶段 1: 设置(共享基础设施)

**目的**: 数据库迁移和类型定义, 所有用户故事共享

- [x] T001 创建数据库迁移 `supabase/migrations/036_spec_practice.sql`, 包含 `spec_practices` 表(id, user_id, question, question_category, user_spec, total_score, dimension_scores JSONB, suggestions JSONB, created_at)、RLS 策略(user_id = auth.uid())、索引(user_id, created_at DESC)、CHECK 约束(length >= 50, score 0-100)
- [x] T002 [P] 在 `src/types/index.ts` 新增 SpecPractice 接口及相关类型(DimensionScore, SpecSuggestion), 与 data-model.md 中 JSONB 结构一致

---

## 阶段 2: 基础(阻塞前置条件)

**目的**: AI Prompt 和 API 路由, 所有用户故事依赖

- [x] T003 在 `src/lib/ai/prompts.ts` 新增 `buildSpecPracticeQuestionPrompt()` 和 `SPEC_PRACTICE_QUESTION_SYSTEM_PROMPT`, 要求 AI 生成大厂标准 AI PM 场景题目, 输出 JSON `{ question, question_category }`, 题目类型覆盖需求分析/系统设计/产品规划等方向
- [x] T004 [P] 在 `src/lib/ai/prompts.ts` 新增 `buildSpecEvaluationPrompt(question, userSpec)` 和 `SPEC_EVALUATION_SYSTEM_PROMPT`, 要求 AI 输出 JSON `{ total_score, dimension_scores: [{dimension, score, comment}], suggestions: [{original_text, improvement, suggestion}] }`, 4 个维度: 完整性/可执行性/边界考虑/结构清晰度
- [x] T005 创建 `src/app/api/coding/spec-practice/route.ts` — GET: 调用 AI 生成题目, 返回 `{ question, question_category }`; 支持 `refresh=1` 强制重新生成; POST: 接收 `{ question, question_category, user_spec }`, 校验长度 50-5000, 调用 AI 评分, 存入 `spec_practices` 表, 返回完整评分结果
- [x] T006 创建 `src/app/api/coding/spec-practice/history/route.ts` — GET: 查询当前用户的 spec_practices 记录, 支持 page/limit 分页, 按 created_at DESC 排序, 返回 `{ records, total, page, limit }`

**检查点**: 基础就绪 - API 可通过 curl 测试, 现在可以开始并行实施用户故事

---

## 阶段 3: 用户故事 1 - AI 出题并评价 Spec (优先级: P1) 🎯 MVP

**目标**: 用户进入实操页面, AI 自动生成题目, 用户编写 Spec 并提交, AI 多维度评分并给出优化建议

**独立测试**: 进入 `/coding/spec-practice`, 验证题目自动生成; 编写 Spec 并提交, 验证评分结果展示; 点击"换一题", 验证新题目不同

### 用户故事 1 的实施

- [x] T007 [P] [US1] 创建 `src/components/coding/SpecScoreCard.tsx` — 评分结果展示组件: 总分大字显示(0-100), 4 个维度分数条(带颜色渐变: 红→黄→绿), 优化建议列表(原文引用 + 改进方向 + 建议内容), 使用 Tailwind CSS 样式
- [x] T008 [US1] 创建 `src/components/coding/SpecPracticeView.tsx` — 实操主交互组件: 题目展示区(题目文本 + 类别标签), Spec 输入区(textarea, 字数统计 50-5000), "换一题"按钮(调用 GET ?refresh=1), "提交评分"按钮(调用 POST), 加载状态(题目生成中/评分中), 评分结果区(嵌入 SpecScoreCard)
- [x] T009 [US1] 创建 `src/app/coding/spec-practice/page.tsx` — 实操练习主页面, 引入 CodingSidebar 布局 + SpecPracticeView 组件, 与现有 `/coding/practice` 页面布局模式一致
- [x] T010 [US1] 在 `src/components/layout/CodingSidebar.tsx` 的 navItems 数组中新增"实操练习"导航项: `{ label: '实操练习', href: '/coding/spec-practice', icon: 'pencil' }`, 排在"开发流程生成"之后
- [x] T011 [US1] 在 `src/app/page.tsx` 的 AI Coding 卡片(coding)中: description 新增"实操练习", subFeatures 数组新增 `{ label: '实操练习', href: '/coding/spec-practice' }`

**检查点**: 此时, 用户故事 1 应该完全功能化且可独立测试 — 进入实操页面可出题、写 Spec、提交评分

---

## 阶段 4: 用户故事 2 - 查看历史记录 (优先级: P2)

**目标**: 用户可以进入历史记录页面, 查看所有过往实操记录, 点击展开查看详情

**独立测试**: 完成一次实操后进入 `/coding/spec-history`, 验证记录按时间倒序展示; 点击记录展开显示完整评分和建议

### 用户故事 2 的实施

- [x] T012 [US2] 创建 `src/app/coding/spec-history/page.tsx` — 历史记录页面: 引入 CodingSidebar 布局, 调用 GET /api/coding/spec-practice/history 获取记录列表, 每条记录显示题目/类别/总分/时间, 点击展开显示完整 Spec 内容 + SpecScoreCard 评分详情, 支持分页加载
- [x] T013 [US2] 在 `src/components/layout/CodingSidebar.tsx` 的 navItems 数组中新增"实操历史"导航项: `{ label: '实操历史', href: '/coding/spec-history', icon: 'clock' }`, 排在"实操练习"之后
- [x] T014 [US2] 在 `src/app/page.tsx` 的 AI Coding 卡片中: subFeatures 数组新增 `{ label: '实操历史', href: '/coding/spec-history' }`

**检查点**: 此时, 用户故事 1 和 2 都应该独立运行 — 可出题评分, 可查看历史

---

## 阶段 5: 用户故事 3 - 数据看板展示实操统计 (优先级: P3)

**目标**: 在设置数据看板的 AI Coding 区域新增实操统计: 总次数、平均得分、得分趋势、维度分布

**独立测试**: 完成多次实操后进入设置数据看板, 验证 AI Coding 区域新增实操统计卡片, 数据与实际记录一致

### 用户故事 3 的实施

- [x] T015 [US3] 在 `src/app/api/learning/dashboard/route.ts` 的 coding 查询中新增实操统计: `specPracticeCount`(总次数)、`specPracticeAvgScore`(平均得分)、`specPracticeScoreTrend`(7天得分趋势 `{date, score}[]`)、`specPracticeDimensionDist`(维度平均分分布 `{dimension, avgScore}[]`), 查询 `spec_practices` 表聚合计算
- [x] T016 [US3] 在 `src/app/settings/dashboard/page.tsx` 的 AI Coding 区域新增实操统计卡片: stats row 新增"实操次数"和"平均得分", charts row 新增得分趋势折线图和维度分布雷达图, 使用 ECharts 渲染, 与现有 coding 图表风格一致

**检查点**: 所有用户故事现在应该独立功能化 — 出题评分 + 历史记录 + 数据看板

---

## 阶段 6: 完善与横切关注点

**目的**: 错误处理和边界情况

- [x] T017 [US1] 在 SpecPracticeView 中添加边界处理: 未登录提示、AI 出题失败时显示"重新出题"按钮、空 Spec 提交时提示"请先编写 Spec"、评分超时(60s)提示并提供重试
- [ ] T018 运行 quickstart.md 验证: 进入实操页面验证题目生成 → 编写 Spec 提交验证评分 → 换一题验证新题目 → 进入历史页面验证记录 → 进入数据看板验证统计

---

## 依赖关系与执行顺序

### 阶段依赖关系

- **设置(阶段 1)**: 无依赖关系 - 可立即开始
- **基础(阶段 2)**: 依赖于设置完成 - 阻塞所有用户故事
- **用户故事 1(阶段 3)**: 依赖于基础阶段完成
- **用户故事 2(阶段 4)**: 依赖于基础阶段完成, 可与 US1 并行但建议顺序执行
- **用户故事 3(阶段 5)**: 依赖于基础阶段完成, 建议在 US1+US2 之后
- **完善(阶段 6)**: 依赖于所有用户故事完成

### 用户故事依赖关系

- **US1(P1)**: 可在基础(阶段 2)后开始 - 无其他故事依赖
- **US2(P2)**: 可在基础(阶段 2)后开始 - 依赖 API 路由(T006), 独立于 US1 前端
- **US3(P3)**: 可在基础(阶段 2)后开始 - 依赖数据库有数据, 建议在 US1 之后

### 每个用户故事内部

- 组件在页面之前
- 页面在导航入口之前
- API 路由在前端调用之前

### 并行机会

- T001 和 T002 可并行(不同文件)
- T003 和 T004 可并行(同文件不同函数, 但可同时编写)
- T007 和 T008 可并行(不同组件文件)
- T012 和 T013 可并行(不同文件)
- T015 和 T016 可并行(不同文件)

---

## 并行示例: 用户故事 1

```bash
# 一起启动用户故事 1 的组件:
任务 T007: "创建 SpecScoreCard.tsx 评分展示组件"
任务 T008: "创建 SpecPracticeView.tsx 主交互组件"

# 组件完成后, 顺序执行:
任务 T009: "创建实操练习主页面"
任务 T010: "新增侧边栏导航项"
任务 T011: "新增首页子功能入口"
```

---

## 实施策略

### 仅 MVP(仅用户故事 1)

1. 完成阶段 1: 设置(T001-T002)
2. 完成阶段 2: 基础(T003-T006)
3. 完成阶段 3: 用户故事 1(T007-T011)
4. **停止并验证**: 独立测试用户故事 1
5. 如准备好则部署/演示

### 增量交付

1. 完成设置 + 基础 → 基础就绪
2. 添加用户故事 1 → 独立测试 → 部署/演示(MVP!)
3. 添加用户故事 2 → 独立测试 → 部署/演示
4. 添加用户故事 3 → 独立测试 → 部署/演示
5. 每个故事在不破坏先前故事的情况下增加价值

---

## 注意事项

- [P] 任务 = 不同文件, 无依赖关系
- [Story] 标签将任务映射到特定用户故事以实现可追溯性
- 每个用户故事应该独立可完成和可测试
- 在每个任务或逻辑组后提交
- 在任何检查点停止以独立验证故事
- 避免: 模糊任务、相同文件冲突、破坏独立性的跨故事依赖
