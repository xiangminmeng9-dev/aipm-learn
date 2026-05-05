# 任务列表: AI 生成个人学习路径

**功能**: AI 生成个人学习路径 | **分支**: `001-learning-path` | **日期**: 2026-04-30
**规范**: [spec.md](./spec.md) | **计划**: [plan.md](./plan.md)

## 实现策略

MVP 优先，增量交付。先完成 US1（AI 生成个性化学习路径）作为核心价值，再叠加 US2（历史记录）和 US3（数据看板）。每个用户故事阶段完成后可独立测试和交付。

---

## 阶段 1: 设置

> 共享基础设施，所有用户故事的前置条件

- [x] **T001** [Setup] 创建 Supabase 数据库迁移文件
  - 文件: `supabase/migrations/038_learning_paths.sql`
  - 创建 `learning_paths` 表，包含 id, user_id, weakness_summary, recommended_modules, total_estimated_hours, created_at
  - 启用 RLS，创建 SELECT/INSERT/UPDATE/DELETE 策略（user_id = auth.uid()）
  - 创建索引: user_id, created_at DESC
  - 参考: data-model.md

- [x] **T002** [Setup] 添加 TypeScript 类型定义
  - 文件: `src/types/index.ts`
  - 添加 `RecommendedModule` 接口（name: string; priority: 'high' | 'medium' | 'low'; estimatedHours: number; reason: string）
  - 添加 `LearningPath` 接口（id, user_id, weakness_summary, recommended_modules: RecommendedModule[], total_estimated_hours, created_at）

- [x] **T003** [Setup] 添加 AI 提示词
  - 文件: `src/lib/ai/prompts.ts`
  - 添加 `LEARNING_PATH_SYSTEM_PROMPT`：角色为资深 PM 学习规划专家
  - 添加 `buildLearningPathPrompt(weaknessData: string)`：要求 AI 基于用户弱项数据生成个性化学习路径，输出 JSON 格式（weaknessSummary, recommendedModules 数组含 name/priority/estimatedHours/reason, totalEstimatedHours）
  - 如果弱项数据不足，AI 基于 PM 通用能力模型生成建议
  - 遵循现有 prompt 模式

---

## 阶段 2: 基础

> 阻塞先决条件，所有用户故事共享

- [x] **T004** [Foundation] 创建生成学习路径 API 路由
  - 文件: `src/app/api/skills/learning-path/route.ts`
  - POST 方法：从 Supabase 获取用户技能评估数据和面试弱项数据，汇总为弱项摘要文本，调用 AI 生成学习路径，解析 JSON 结果，保存到数据库，返回完整路径
  - 使用 `createServiceClient()` 读写数据库
  - 使用 `generateText()` 调用 AI
  - 错误处理：AI 异常、数据库异常、弱项数据不足时的降级处理
  - 参考: contracts/api.md

- [x] **T005** [Foundation] 创建历史记录 API 路由
  - 文件: `src/app/api/skills/learning-path/history/route.ts`
  - GET 方法：接收 page/limit 参数，查询用户历史记录，按 created_at DESC 排序，返回分页结果
  - 使用 `createServiceClient()` 读取数据库
  - 参考: contracts/api.md

---

## 阶段 3: 用户故事 1 — AI 生成个性化学习路径 (P1)

> **故事目标**: 用户基于弱项数据，AI 自动生成个性化学习路径，包含推荐模块、优先级、时长
> **独立测试标准**: 点击生成 → 获得包含推荐模块列表（名称/优先级/时长/理由）的学习路径

- [x] **T006** [US1] 创建学习模块卡片组件
  - 文件: `src/components/skills/LearningPathCard.tsx`
  - 展示单个学习模块：名称、优先级标签（高=红色、中=琥珀色、低=灰色）、预估时长、学习理由
  - 按优先级排序展示（high → medium → low）
  - 使用语义化颜色 token（bg-card, text-foreground 等）+ dark: 变体

- [x] **T007** [US1] 创建学习路径交互组件
  - 文件: `src/components/skills/LearningPathView.tsx`
  - "生成学习路径"按钮，调用 POST /api/skills/learning-path
  - 加载状态（spinner + 提示文字）
  - 生成完成后展示：弱项摘要 + LearningPathCard 模块列表 + 总预估时长
  - 错误状态（友好提示 + 重试按钮）
  - 防止重复提交

- [x] **T008** [US1] 创建学习路径页面
  - 文件: `src/app/skills/ai-learning-path/page.tsx`
  - 页面标题和说明
  - 引入 LearningPathView 组件
  - 使用 'use client' 指令

- [x] **T009** [US1] 确认/添加侧边栏导航项
  - 文件: `src/components/layout/SkillsSidebar.tsx`（或技能树对应的侧边栏文件）
  - 确认 AI 技能树侧边栏已有"AI 学习路径"入口，如无则添加
  - 链接到 /skills/ai-learning-path
  - 图标: 🗺️

- [x] **T010** [US1] 确认首页 subFeature 入口
  - 文件: `src/app/page.tsx`
  - 确认技能树卡片的 subFeatures 数组中已有学习路径入口，如无则添加

**检查点 US1**: 用户可以从 AI 技能树侧边栏进入学习路径页面，点击生成获得个性化学习路径

---

## 阶段 4: 用户故事 2 — 学习路径历史记录 (P2)

> **故事目标**: 用户查看所有已生成的学习路径记录，支持展开查看详情
> **独立测试标准**: 生成多条路径后，历史页面显示记录列表，点击可展开查看完整路径

- [x] **T011** [US2] 创建学习路径历史页面
  - 文件: `src/app/skills/path-history/page.tsx`
  - 调用 GET /api/skills/learning-path/history 获取记录
  - 列表展示：生成时间、模块数量、总预估时长，按时间倒序
  - 点击展开详情：弱项摘要 + 推荐模块列表
  - 分页加载（page + limit）
  - 空状态提示
  - 使用 'use client'

- [x] **T012** [US2] 添加历史页面侧边栏导航项
  - 文件: `src/components/layout/SkillsSidebar.tsx`（同 T009 的文件）
  - 在 AI 技能树导航区域添加"路径历史"入口，链接到 /skills/path-history
  - 图标: 🕐

**检查点 US2**: 用户可以在历史页面查看所有学习路径记录，展开查看完整路径详情

---

## 阶段 5: 用户故事 3 — 数据看板埋点 (P3)

> **故事目标**: 设置数据看板展示学习路径使用次数和推荐模块总数
> **独立测试标准**: 生成路径后，数据看板技能树模块区域显示学习路径统计

- [x] **T013** [US3] 添加数据看板 API 统计
  - 文件: `src/app/api/learning/dashboard/route.ts`
  - 添加学习路径统计字段: learningPathCount, learningPathTotalModules, learningPathModuleCategoryDist (模块优先级分布)
  - 查询 learning_paths 表，按 user_id 过滤

- [x] **T014** [US3] 添加数据看板 UI 展示
  - 文件: `src/app/settings/dashboard/page.tsx`
  - 在技能树模块统计区域添加：学习路径次数 + 推荐模块总数
  - 当 learningPathCount > 0 时显示模块优先级分布图（饼图或柱状图）
  - 使用 ECharts 渲染图表

**检查点 US3**: 数据看板准确展示学习路径生成次数和推荐模块总数

---

## 阶段 6: 完善

- [ ] **T015** [Polish] 在 Supabase Dashboard 执行迁移 SQL
  - 手动在 Supabase Dashboard SQL Editor 中执行 038_learning_paths.sql
  - 验证表创建成功、RLS 策略生效

- [ ] **T016** [Polish] 端到端验证
  - 启动 dev server (port 3001)
  - 测试完整流程：生成学习路径 → 查看模块列表 → 查看历史 → 查看数据看板
  - 验证暗色模式下的显示效果
  - 修复发现的问题

---

## 依赖关系

```
T001 (DB迁移) ──→ T004 (生成API) ──→ T007 (交互组件) ──→ T008 (页面)
T002 (类型)   ──→ T004 (生成API)
T003 (Prompt) ──→ T004 (生成API)
T004 (生成API) ──→ T011 (历史页面)
T005 (历史API) ──→ T011 (历史页面)
T006 (模块卡片) ──→ T007 (交互组件)
T007 (交互组件) ──→ T008 (页面)
T008 (页面)   ──→ T009 (侧边栏)
T009 (侧边栏) ──→ T010 (首页)
T011 (历史页面) ──→ T012 (侧边栏)
T004 (生成API) ──→ T013 (看板API)
T013 (看板API) ──→ T014 (看板UI)
```

## 并行执行示例

**阶段 1 并行**: T001, T002, T003 可同时执行（不同文件）
**阶段 2 并行**: T004 和 T005 可同时执行（不同文件）
**US1 并行**: T006 完成后，T007-T010 中不同文件的任务可并行

## MVP 范围

**建议 MVP**: 阶段 1 + 阶段 2 + 阶段 3（US1），共 10 个任务。完成后用户即可生成个性化学习路径。
