# 实施计划: AI Coding 实操

**分支**: `001-spec-practice` | **日期**: 2026-04-30 | **规范**: [spec.md](./spec.md)
**输入**: 来自 `/specs/001-spec-practice/spec.md` 的功能规范

## 摘要

在 AI Coding 练习模块新增"实操练习"子功能：AI 随机生成符合大厂标准的 AI PM 场景题目，用户编写 Spec，AI 多维度评分并给出优化建议，记录持久保存可回顾，数据看板展示实操统计。

## 技术背景

**语言/版本**: TypeScript (严格模式)
**主要依赖**: Next.js 16 (App Router), React 19, Tailwind CSS, @supabase/ssr, @anthropic-ai/sdk
**存储**: Supabase (PostgreSQL + RLS)
**测试**: Vitest + Playwright
**目标平台**: Web (桌面/移动浏览器)
**项目类型**: Web 应用 (Next.js 全栈)
**性能目标**: 题目生成 <10s, 评分 <30s
**约束条件**: 需登录, AI 调用使用项目已有 Claude API 配置
**规模/范围**: 单用户场景, 预计 <1000 条实操记录

## 章程检查

| 原则 | 状态 | 说明 |
|------|------|------|
| I. 代码质量门禁 | ✅ | ESLint + Prettier + TypeScript 严格模式 |
| II. 测试纪律 | ✅ | 核心逻辑单元测试, 页面流程 E2E |
| III. 自校验与生产验证 | ✅ | 构建验证 + 浏览器实际操作 |
| IV. 简洁性与可维护性 | ✅ | YAGNI, 单一职责, 不引入不相关改动 |
| V. 持续集成 | ✅ | 分支合并前通过完整质量门禁 |

## 项目结构

### 文档(此功能)

```
specs/001-spec-practice/
├── plan.md              # 此文件
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
│   ├── coding/
│   │   ├── spec-practice/
│   │   │   └── page.tsx           # 实操练习主页面
│   │   └── spec-history/
│   │       └── page.tsx           # 实操历史记录页面
│   └── api/
│       └── coding/
│           └── spec-practice/
│               ├── route.ts        # GET(出题) + POST(提交评分)
│               └── history/
│                   └── route.ts    # GET(历史列表)
├── components/
│   └── coding/
│       ├── SpecPracticeView.tsx    # 实操主交互组件(题目+输入+评分)
│       └── SpecScoreCard.tsx       # 评分结果展示组件
├── lib/
│   └── ai/
│       └── prompts.ts             # 新增 spec-practice 相关 prompt
└── types/
    └── index.ts                   # 新增 SpecPractice 类型

supabase/migrations/
└── 036_spec_practice.sql          # 新增 spec_practices 表
```

**结构决策**: 遵循现有 coding 模块的文件组织模式（页面 + API 路由 + 组件 + prompt），保持一致性。
