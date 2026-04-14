# 实施计划: AI 产品经理面试助手

**分支**: `001-ai-pm-interview-assistant` | **日期**: 2026-04-14 | **规范**: [spec.md](./spec.md)
**输入**: 来自 `/specs/001-ai-pm-interview-assistant/spec.md` 的功能规范

## 摘要

AI 产品经理面试助手是学习平台的第三大板块，包含四个核心子功能：
1. **面试问答**：输入问题获取四部分深度分析（问题分析→思考方式→回答思路→口语化模板），页面上方展示热门问题
2. **长期记忆 Session**：支持多轮对话的 Session 机制，滑动窗口+摘要压缩策略，支持 JD/简历背景
3. **模拟面试**：逐题交互式模拟（AI 出题→用户答→即时评价→下一题→最终总结），弱项映射到技能树
4. **方法论提炼**：基于练习历史动态生成问题类型和方法论，类型不封顶

技术方案：Next.js App Router 全栈 + Supabase（免费云数据库+认证）+ Claude API（AI 生成）+ 滑动窗口摘要压缩（长期记忆）

## 技术背景

**语言/版本**: TypeScript 5.x（严格模式）
**主要依赖**: Next.js 15+ (App Router), Tailwind CSS, shadcn/ui, Anthropic Claude SDK
**存储**: Supabase（PostgreSQL 免费套餐，500MB，含 Auth + RLS）
**测试**: Vitest（单元测试）+ Playwright（E2E 测试）
**目标平台**: Web 浏览器（桌面+移动端响应式）
**项目类型**: Web 应用（Next.js 全栈，前端调用后端 API Route）
**性能目标**: AI 生成响应 <15 秒，页面加载 <3 秒，Session 压缩后响应增幅 <30%
**约束条件**: 免费云资源（Supabase 免费套餐），Claude API 按量付费
**规模/范围**: 初期 <1000 用户，~10 个页面，~25 个 API 端点

## 章程检查

*门控: 必须在阶段 0 研究前通过. 阶段 1 设计后重新检查.*

| 章程原则 | 状态 | 说明 |
|----------|------|------|
| I. 代码质量门禁 | ✅ 通过 | ESLint + Prettier + tsc --noEmit，已纳入计划 |
| II. 测试纪律 | ✅ 通过 | Vitest 单元测试 + Playwright E2E，每个用户故事至少 1 个 E2E |
| III. 自校验与生产验证 | ✅ 通过 | next build + next start 验证纳入工作流 |
| IV. 简洁性与可维护性 | ✅ 通过 | YAGNI 原则，不超前设计 |
| V. 持续集成 | ✅ 通过 | 小粒度提交，合并前全部门禁通过 |
| 技术栈约束 | ✅ 通过 | Next.js + TypeScript + Tailwind + shadcn/ui，无图表需求暂不引入 ECharts |

## 项目结构

### 文档（此功能）

```
specs/001-ai-pm-interview-assistant/
├── plan.md              # 此文件
├── research.md          # 阶段 0 输出
├── data-model.md        # 阶段 1 输出
├── quickstart.md        # 阶段 1 输出
├── contracts/           # 阶段 1 输出
└── tasks.md             # 阶段 2 输出（/speckit.tasks 命令）
```

### 源代码（仓库根目录）

```
src/
├── app/
│   ├── layout.tsx                    # 根布局
│   ├── page.tsx                      # 首页/导航
│   ├── (auth)/
│   │   ├── login/page.tsx
│   │   └── register/page.tsx
│   ├── interview/                    # 面试助手板块
│   │   ├── layout.tsx                # 面试助手布局（侧边导航）
│   │   ├── qa/page.tsx               # 面试问答页
│   │   ├── sessions/
│   │   │   ├── page.tsx              # Session 列表页
│   │   │   └── [id]/page.tsx         # 单个 Session 对话页
│   │   ├── mock/
│   │   │   ├── page.tsx              # 模拟面试配置页
│   │   │   └── [id]/page.tsx         # 模拟面试进行页
│   │   ├── methodology/page.tsx      # 方法论页
│   │   └── stats/page.tsx            # 练习统计页
│   └── api/
│       ├── interview/
│       │   ├── analyze/route.ts      # 问题分析 API
│       │   ├── trending/route.ts     # 热门问题 API
│       │   ├── sessions/
│       │   │   ├── route.ts          # Session CRUD
│       │   │   └── [id]/
│       │   │       ├── route.ts      # 单 Session 操作
│       │   │       ├── chat/route.ts # Session 对话（含记忆压缩）
│       │   │       └── compress/route.ts # 手动压缩
│       │   ├── mock/
│       │   │   ├── route.ts          # 创建模拟面试
│       │   │   └── [id]/
│       │   │       ├── question/route.ts  # 生成下一题
│       │   │       ├── answer/route.ts    # 提交答案+评分
│       │   │       └── summary/route.ts   # 最终总结
│       │   ├── methodology/route.ts  # 方法论查询+更新
│       │   └── stats/route.ts        # 统计数据
│       └── auth/
│           └── [...supabase]/route.ts # Supabase Auth 回调
├── components/
│   ├── ui/                           # shadcn/ui 组件
│   ├── interview/
│   │   ├── QuestionInput.tsx         # 问题输入组件
│   │   ├── AnalysisResult.tsx        # 四部分分析结果
│   │   ├── TrendingQuestions.tsx      # 热门问题列表
│   │   ├── ChatSession.tsx           # Session 对话界面
│   │   ├── SessionHeader.tsx         # JD/简历输入区
│   │   ├── MockInterviewFlow.tsx     # 模拟面试流程
│   │   ├── AnswerEvaluation.tsx      # 答题评价展示
│   │   ├── MockSummary.tsx           # 模拟面试总结
│   │   ├── MethodologyCard.tsx       # 方法论卡片
│   │   └── StatsPanel.tsx            # 统计面板
│   └── layout/
│       ├── Navbar.tsx
│       └── Sidebar.tsx
├── lib/
│   ├── supabase/
│   │   ├── client.ts                 # 浏览器端 Supabase 客户端
│   │   ├── server.ts                 # 服务端 Supabase 客户端
│   │   └── middleware.ts             # Auth 中间件
│   ├── ai/
│   │   ├── claude.ts                 # Claude API 封装
│   │   ├── prompts.ts                # Prompt 模板
│   │   ├── memory.ts                 # 滑动窗口+摘要压缩逻辑
│   │   └── classifier.ts            # 问题类型动态分类
│   └── utils/
│       └── tokens.ts                 # Token 计数工具
└── types/
    └── index.ts                      # 全局类型定义

tests/
├── unit/
│   ├── memory.test.ts                # 记忆压缩逻辑测试
│   ├── classifier.test.ts           # 分类器测试
│   └── tokens.test.ts               # Token 计数测试
├── e2e/
│   ├── qa.spec.ts                    # 问答流程 E2E
│   ├── session.spec.ts              # Session 对话 E2E
│   ├── mock-interview.spec.ts       # 模拟面试 E2E
│   └── methodology.spec.ts          # 方法论页 E2E
└── integration/
    └── api/                          # API 集成测试
```

**结构决策**: 采用 Next.js App Router 全栈结构，前端页面与后端 API Route 在同一项目中。按功能板块（interview）组织路由和组件，AI 逻辑封装在 `lib/ai/` 中，数据库操作封装在 `lib/supabase/` 中。

## 复杂度跟踪

| 违规 | 为什么需要 | 拒绝更简单替代方案的原因 |
|------|----------|------------------------|
| 滑动窗口+摘要压缩（记忆机制） | 20+ 轮对话需要上下文感知但不能无限增长 | 简单截断会丢失关键上下文；全量传递会超出 token 限制和成本 |
| 动态问题类型分类 | 方法论类型不固定，需要 AI 自动识别新类型 | 固定类型列表无法覆盖用户实际遇到的所有问题模式 |
