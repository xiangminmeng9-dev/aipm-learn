# 实施计划: 竞品分析助手

**分支**: `001-competitive-analysis` | **日期**: 2026-04-30 | **规范**: [spec.md](./spec.md)
**输入**: 来自 `/specs/001-competitive-analysis/spec.md` 的功能规范

## 摘要

在面试助手模块中新增"竞品分析"子功能。用户输入产品名，AI 自动生成包含市场定位、功能对比、优劣势、差异化策略四个维度的结构化竞品分析报告，并进行多维度评分。记录持久化保存，支持历史查看，数据看板展示使用统计。

## 技术背景

**语言/版本**: TypeScript (strict mode) / Next.js 16 App Router
**主要依赖**: React 19, Supabase (PostgreSQL + RLS), Claude API (via src/lib/ai/claude.ts), Tailwind CSS, shadcn/ui, ECharts
**存储**: Supabase PostgreSQL (新表 competitive_analyses)
**测试**: Vitest / Jest (单元测试), Playwright (E2E)
**目标平台**: Web (Vercel 部署)
**项目类型**: Web 应用 (Next.js 全栈)
**性能目标**: AI 生成响应 15 秒内返回
**约束条件**: 作为面试助手子功能，共享侧边栏和布局
**规模/范围**: 单用户场景，数据量小

## 章程检查

| 原则 | 状态 | 备注 |
|------|------|------|
| I. 代码质量门禁 | PASS | TypeScript strict, ESLint, Prettier |
| II. 测试纪律 | PASS | 核心逻辑单元测试，关键路径 E2E |
| III. 自校验与生产验证 | PASS | build + dev server 验证 |
| IV. 简洁性与可维护性 | PASS | 遵循 YAGNI，复用现有模式 |
| V. 持续集成 | PASS | 合并前通过完整质量门禁 |
| 技术栈约束 | PASS | Next.js + TS + Tailwind + shadcn/ui + ECharts + Supabase |

## 项目结构

### 文档(此功能)

```
specs/001-competitive-analysis/
├── plan.md              # 此文件
├── spec.md              # 功能规范
├── research.md          # 阶段 0 输出
├── data-model.md        # 阶段 1 输出
├── quickstart.md        # 阶段 1 输出
├── contracts/           # 阶段 1 输出
└── tasks.md             # 阶段 2 输出
```

### 源代码(仓库根目录)

```
src/
├── app/
│   ├── api/interview/
│   │   └── competitive/
│   │       ├── route.ts           # POST: 生成竞品分析
│   │       └── history/route.ts   # GET: 历史记录
│   └── interview/
│       ├── competitive/page.tsx   # 竞品分析主页面
│       └── comp-history/page.tsx  # 竞品分析历史页面
├── components/interview/
│   ├── CompetitiveAnalysisView.tsx  # 分析交互组件
│   └── CompetitiveScoreCard.tsx     # 评分展示组件
├── components/layout/
│   └── Sidebar.tsx                # 添加竞品分析导航项
├── lib/ai/
│   └── prompts.ts                 # 添加竞品分析 prompt
└── types/
    └── index.ts                   # 添加 CompetitiveAnalysis 类型

supabase/migrations/
└── 037_competitive_analysis.sql   # 新表迁移
```

**结构决策**: 遵循现有面试助手模块的文件组织模式，API 路由放在 `api/interview/competitive/`，页面放在 `interview/competitive/`，组件放在 `components/interview/`。

## 复杂度跟踪

无章程违规。
