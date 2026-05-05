# 任务列表: 竞品分析助手

**功能**: 竞品分析助手 | **分支**: `001-competitive-analysis` | **日期**: 2026-04-30
**规范**: [spec.md](./spec.md) | **计划**: [plan.md](./plan.md)

## 实现策略

MVP 优先，增量交付。先完成 US1（AI 生成竞品分析报告）作为核心价值，再叠加 US2（历史记录）和 US3（数据看板）。每个用户故事阶段完成后可独立测试和交付。

---

## 阶段 1: 设置

> 共享基础设施，所有用户故事的前置条件

- [ ] **T001** [Setup] 创建 Supabase 数据库迁移文件
  - 文件: `supabase/migrations/037_competitive_analysis.sql`
  - 创建 `competitive_analyses` 表，包含 id, user_id, product_name, market_position, feature_comparison, strengths_weaknesses, differentiation_strategy, total_score, dimension_scores, created_at
  - 启用 RLS，创建 SELECT/INSERT/UPDATE/DELETE 策略（user_id = auth.uid()）
  - 创建索引: user_id, created_at DESC
  - 参考: data-model.md

- [ ] **T002** [Setup] 添加 TypeScript 类型定义
  - 文件: `src/types/index.ts`
  - 添加 `CompetitiveAnalysis` 接口（id, user_id, product_name, market_position, feature_comparison, strengths_weaknesses, differentiation_strategy, total_score, dimension_scores: DimensionScore[], created_at）
  - 复用现有 `DimensionScore` 类型（如不存在则添加: { dimension: string; score: number; comment: string }）

- [ ] **T003** [Setup] 添加 AI 提示词
  - 文件: `src/lib/ai/prompts.ts`
  - 添加 `COMPETITIVE_ANALYSIS_SYSTEM_PROMPT`：角色为资深 PM 竞品分析专家
  - 添加 `buildCompetitiveAnalysisPrompt(productName: string)`：要求 AI 对指定产品生成四维度分析（市场定位、功能对比、优劣势、差异化策略），先输出 Markdown 格式分析内容，再输出 JSON 格式评分（分析深度/逻辑结构/洞察质量/策略可行性，总分 0-100）
  - 遵循现有 prompt 模式（参考 buildSpecEvaluationPrompt）

---

## 阶段 2: 基础

> 阻塞先决条件，所有用户故事共享

- [ ] **T004** [Foundation] 创建生成竞品分析 API 路由
  - 文件: `src/app/api/interview/competitive/route.ts`
  - POST 方法：接收 productName，验证（2-100字符），调用 AI 生成分析，解析 Markdown 分析内容和 JSON 评分，保存到 Supabase，返回完整分析结果
  - 使用 `createServiceClient()` 写入数据库
  - 使用 `generateText()` 调用 AI
  - 错误处理：AI 异常、数据库异常
  - 参考: contracts/api.md

- [ ] **T005** [Foundation] 创建历史记录 API 路由
  - 文件: `src/app/api/interview/competitive/history/route.ts`
  - GET 方法：接收 page/limit 参数，查询用户历史记录，按 created_at DESC 排序，返回分页结果
  - 使用 `createServiceClient()` 读取数据库
  - 参考: contracts/api.md

---

## 阶段 3: 用户故事 1 — AI 生成竞品分析报告 (P1)

> **故事目标**: 用户输入产品名，AI 生成四维度结构化竞品分析报告并评分
> **独立测试标准**: 输入产品名 → 获得包含市场定位/功能对比/优劣势/差异化策略的分析报告和评分

- [ ] **T006** [US1] 创建评分展示组件
  - 文件: `src/components/interview/CompetitiveScoreCard.tsx`
  - 展示总分（颜色编码：≥80 绿色，≥60 琥珀色，<60 红色）
  - 展示四维度评分条（分析深度/逻辑结构/洞察质量/策略可行性），每个维度有渐变色进度条和评语
  - 参考: src/components/coding/SpecScoreCard.tsx 的设计模式

- [ ] **T007** [US1] 创建竞品分析交互组件
  - 文件: `src/components/interview/CompetitiveAnalysisView.tsx`
  - 产品名输入框（2-100字符验证）
  - "生成分析"按钮，调用 POST /api/interview/competitive
  - 加载状态（spinner + 提示文字）
  - 生成完成后展示：四个维度的 Markdown 分析内容（使用 ReactMarkdown + remarkGfm 渲染）+ CompetitiveScoreCard 评分
  - 错误状态（友好提示 + 重试按钮）
  - 参考: src/components/coding/SpecPracticeView.tsx 的交互模式

- [ ] **T008** [US1] 创建竞品分析页面
  - 文件: `src/app/interview/competitive/page.tsx`
  - 页面标题和说明
  - 引入 CompetitiveAnalysisView 组件
  - 使用 'use client' 指令
  - 参考: src/app/coding/spec-practice/page.tsx 的页面结构

- [ ] **T009** [US1] 添加侧边栏导航项
  - 文件: `src/components/layout/Sidebar.tsx`（或面试助手对应的侧边栏文件）
  - 在面试助手导航区域添加"竞品分析"入口，链接到 /interview/competitive
  - 图标: 🔍

- [ ] **T010** [US1] 添加首页 subFeature 入口
  - 文件: `src/app/page.tsx`
  - 在面试助手卡片的 subFeatures 数组中添加竞品分析和竞品历史入口
  - 链接: /interview/competitive, /interview/comp-history

**检查点 US1**: 用户可以从面试助手侧边栏进入竞品分析页面，输入产品名生成结构化分析报告和评分

---

## 阶段 4: 用户故事 2 — 竞品分析历史记录 (P2)

> **故事目标**: 用户查看所有已生成的竞品分析记录，支持展开查看详情
> **独立测试标准**: 生成多条分析后，历史页面显示记录列表，点击可展开查看完整报告

- [ ] **T011** [US2] 创建竞品分析历史页面
  - 文件: `src/app/interview/comp-history/page.tsx`
  - 调用 GET /api/interview/competitive/history 获取记录
  - 列表展示：产品名、总分、时间，按时间倒序
  - 点击展开详情：四个维度的 Markdown 分析内容 + 评分
  - 分页加载（page + limit）
  - 空状态提示
  - 使用 'use client' + ReactMarkdown + remarkGfm

- [ ] **T012** [US2] 添加历史页面侧边栏导航项
  - 文件: `src/components/layout/Sidebar.tsx`（同 T009 的文件）
  - 在面试助手导航区域添加"竞品历史"入口，链接到 /interview/comp-history
  - 图标: 🕐

**检查点 US2**: 用户可以在历史页面查看所有竞品分析记录，展开查看完整报告详情

---

## 阶段 5: 用户故事 3 — 数据看板埋点 (P3)

> **故事目标**: 设置数据看板展示竞品分析使用次数和平均得分
> **独立测试标准**: 生成分析后，数据看板面试模块区域显示竞品分析统计

- [ ] **T013** [US3] 添加数据看板 API 统计
  - 文件: `src/app/api/learning/dashboard/route.ts`
  - 添加竞品分析统计字段: competitiveAnalysisCount, competitiveAnalysisAvgScore, competitiveAnalysisScoreTrend (近期得分趋势)
  - 查询 competitive_analyses 表，按 user_id 过滤

- [ ] **T014** [US3] 添加数据看板 UI 展示
  - 文件: `src/app/settings/dashboard/page.tsx`
  - 在面试模块统计区域添加：竞品分析次数 + 竞品分析均分
  - 当 competitiveAnalysisCount > 0 时显示得分趋势折线图
  - 使用 ECharts 渲染图表
  - 参考: 现有 spec practice 统计的展示模式

**检查点 US3**: 数据看板准确展示竞品分析次数、均分和得分趋势

---

## 阶段 6: 完善

- [ ] **T015] [Polish] 在 Supabase Dashboard 执行迁移 SQL
  - 手动在 Supabase Dashboard SQL Editor 中执行 037_competitive_analysis.sql
  - 验证表创建成功、RLS 策略生效

- [ ] **T016** [Polish] 端到端验证
  - 启动 dev server (port 3001)
  - 测试完整流程：输入产品名 → 生成分析 → 查看评分 → 查看历史 → 查看数据看板
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
T006 (评分组件) ──→ T007 (交互组件)
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
**US1 并行**: T006 和 T007 的部分工作可并行（T006 是 T007 的依赖，但 T006 完成后 T007-T010 中不同文件的任务可并行）

## MVP 范围

**建议 MVP**: 阶段 1 + 阶段 2 + 阶段 3（US1），共 10 个任务。完成后用户即可输入产品名生成竞品分析报告。
