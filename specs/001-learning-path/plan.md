# 实施计划: AI 生成个人学习路径

**分支**: `001-learning-path` | **日期**: 2026-04-30 | **规范**: [spec.md](./spec.md)
**输入**: 来自 `/specs/001-learning-path/spec.md` 的功能规范

## 摘要

在 AI 技能树模块中新增"AI 学习路径"子功能。基于用户的技能弱项数据，AI 自动生成个性化学习路径，包含推荐学习模块、优先级、预估时长和学习理由。记录持久化保存，支持历史查看，数据看板展示使用统计。

## 技术背景

**语言/版本**: TypeScript (strict mode) / Next.js 16 App Router
**主要依赖**: React 19, Supabase (PostgreSQL + RLS), Claude API (via src/lib/ai/claude.ts), Tailwind CSS, shadcn/ui, ECharts
**存储**: Supabase PostgreSQL (新表 learning_paths)
**测试**: Vitest / Jest (单元测试), Playwright (E2E)
**目标平台**: Web (Vercel 部署)
**项目类型**: Web 应用 (Next.js 全栈)
**性能目标**: AI 生成响应 15 秒内返回
**约束条件**: 作为 AI 技能树子功能，共享侧边栏和布局；依赖用户弱项数据
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
specs/001-learning-path/
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
│   ├── api/skills/
│   │   └── learning-path/
│   │       ├── route.ts           # POST: 生成学习路径
│   │       └── history/route.ts   # GET: 历史记录
│   └── skills/
│       └── ai-learning-path/page.tsx  # 学习路径主页面
│       └── path-history/page.tsx      # 学习路径历史页面
├── components/skills/
│   ├── LearningPathView.tsx       # 学习路径交互组件
│   └── LearningPathCard.tsx       # 学习模块卡片组件
├── components/layout/
│   └── SkillsSidebar.tsx          # 确认学习路径导航项
├── lib/ai/
│   └── prompts.ts                 # 添加学习路径 prompt
└── types/
    └── index.ts                   # 添加 LearningPath 类型

supabase/migrations/
└── 038_learning_paths.sql         # 新表迁移
```

**结构决策**: 遵循现有技能树模块的文件组织模式，API 路由放在 `api/skills/learning-path/`，页面放在 `skills/ai-learning-path/`，组件放在 `components/skills/`。

## 复杂度跟踪

无章程违规。
