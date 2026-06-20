# 实施计划: Skill Workshop (技能工坊)

**分支**: `002-skill-workshop` | **日期**: 2026-06-19 | **规范**: [spec.md](./FEATURE_SPEC.md)
**输入**: 来自 `/specs/002-skill-workshop/FEATURE_SPEC.md` 的功能规范

**注意**: 此模板由 `/speckit.plan` 命令填充. 执行工作流程请参见 `.specify/templates/commands/plan.md`.

## 摘要

Skill Workshop 是 AI PM 技能树下的子功能, 提供社区技能浏览(ClawHub + skills.sh)、AI 质量分析(5维度评分)、引导式技能编辑器(4模板+AI辅助)和一键发布能力. 代码已基本实现(4页面、15 API路由、12组件、3数据库表), 但存在若干功能缺口和 bug 需要修复完善.

## 技术背景

**语言/版本**: TypeScript 5.x (strict mode), 运行于 Next.js 16.2.3 (App Router + Turbopack)
**主要依赖**: React 19.2.4, shadcn/ui (base-nova), Tailwind CSS, ECharts 6, @anthropic-ai/sdk 0.88, openai 6.34, @supabase/ssr 0.10.2, zod 4.4.3, framer-motion 12, lucide-react, yaml 2.9
**存储**: Supabase (PostgreSQL) — 无 ORM, 直接使用 Supabase Client 查询. 3张表已创建: user_skill_drafts, skill_workshop_analyses, user_external_tokens
**测试**: Vitest 4.1.4 (单元测试, tests/unit/ 目录目前为空), Playwright 1.59.1 (E2E, tests/e2e/ 仅1个文件)
**目标平台**: Web (Vercel 部署), 中文用户
**项目类型**: Web 应用 (Next.js App Router 全栈)
**性能目标**: 页面首屏 < 2s, AI 分析响应 < 15s, 外部 API 代理 < 5s
**约束条件**: skills.sh 需要 Vercel OIDC token 认证(非简单 API key), 外部 API 调用必须通过服务端代理(CORS), AI 调用有成本约束需限流
**规模/范围**: 单用户场景, 4 个子页面, 15+ API 路由, 12+ 组件

## 章程检查

*门控: 必须在阶段 0 研究前通过. 阶段 1 设计后重新检查.*

| 原则 | 状态 | 说明 |
|------|------|------|
| I. 代码质量门禁 | ⚠️ 部分通过 | ESLint/Prettier/TypeScript 检查机制存在, 但现有代码未全部通过验证; 存在 `any` 类型使用 |
| II. 测试纪律 | ❌ 未通过 | 单元测试目录为空, 无任何 workshop 相关测试; E2E 测试仅1个通用文件, 无 workshop 覆盖 |
| III. 自校验与生产验证 | ⚠️ 部分通过 | skills.sh 502 bug 表明未充分验证; "一键改进"功能标记 coming soon 但未实现 |
| IV. 简洁性与可维护性 | ⚠️ 部分通过 | 类型定义分散在组件中(UnifiedSkill 重复定义); validate API 未被前端调用(死代码) |
| V. 持续集成 | ⚠️ 部分通过 | CI 流程定义存在, 但测试覆盖不足导致门禁形同虚设 |

**门控结论**: 原则 II (测试纪律) 未通过, 需在实施中补齐测试. 其余原则有偏差但可在实施中修正.

### 设计后重新评估 (阶段 1 完成)

| 原则 | 状态 | 修正计划 |
|------|------|----------|
| I. 代码质量门禁 | ✅ 可通过 | 设计中明确: 创建集中类型文件消除 `any` 和类型重复; 所有新代码需通过 ESLint/Prettier/tsc |
| II. 测试纪律 | ✅ 可通过 | 设计中明确: 新增 `tests/unit/workshop/` 和 `tests/e2e/workshop.spec.ts`; 关键路径单元测试 + 主流程 E2E |
| III. 自校验与生产验证 | ✅ 可通过 | 设计中明确: 修复 skills.sh 502 bug; 实现"一键改进"; 生产模式验证清单 |
| IV. 简洁性与可维护性 | ✅ 可通过 | 设计中明确: 集中类型定义; 删除 validate API 死代码或集成到前端; 不引入新依赖 |
| V. 持续集成 | ✅ 可通过 | 测试覆盖补齐后 CI 门禁可有效执行 |

**重新评估结论**: 所有原则在设计阶段均有明确的修正计划, 实施时按计划执行即可通过门禁.

## 项目结构

### 文档(此功能)

```
specs/002-skill-workshop/
├── plan.md              # 此文件 (/speckit.plan 命令输出)
├── research.md          # 阶段 0 输出 (/speckit.plan 命令)
├── data-model.md        # 阶段 1 输出 (/speckit.plan 命令)
├── quickstart.md        # 阶段 1 输出 (/speckit.plan 命令)
├── contracts/           # 阶段 1 输出 (/speckit.plan 命令)
└── tasks.md             # 阶段 2 输出 (/speckit.tasks 命令 - 非 /speckit.plan 创建)
```

### 源代码(仓库根目录)

```
src/
├── app/
│   ├── skills/
│   │   └── workshop/
│   │       ├── browse/page.tsx      # 浏览社区技能
│   │       ├── analyze/page.tsx     # AI 质量分析
│   │       ├── write/page.tsx       # 技能编辑器
│   │       └── publish/page.tsx     # 发布管理
│   └── api/
│       └── skills/
│           └── workshop/
│               ├── clawhub/         # ClawHub 代理路由
│               ├── skillssh/        # skills.sh 代理路由
│               ├── analyze/         # 分析路由 + 历史
│               ├── drafts/          # 草稿 CRUD
│               ├── publish/         # 发布路由
│               ├── tokens/          # Token 管理
│               ├── validate/        # SKILL.md 验证
│               └── write-assist/    # AI 写作辅助
├── components/
│   └── skills/
│       ├── BrowseView.tsx
│       ├── AnalyzeView.tsx
│       ├── AnalysisResult.tsx
│       ├── SkillEditor.tsx
│       ├── FrontmatterForm.tsx
│       ├── SkillPreview.tsx
│       ├── PublishView.tsx
│       ├── SkillCard.tsx
│       ├── SkillDetailDialog.tsx
│       ├── SkillTemplatePicker.tsx
│       ├── ValidationReport.tsx
│       └── WorkshopTabs.tsx
├── lib/
│   ├── ai/
│   │   └── prompts.ts              # 含 workshop 相关 prompt
│   ├── clawhub/
│   │   └── client.ts               # ClawHub API 客户端
│   ├── skillssh/
│   │   └── client.ts               # skills.sh API 客户端
│   └── skills/
│       └── skill-templates.ts       # 4 个技能模板
└── types/
    └── workshop.ts                  # [待创建] 集中类型定义

tests/
├── unit/
│   └── workshop/                    # [待创建] 单元测试
└── e2e/
    └── workshop.spec.ts             # [待创建] E2E 测试
```

**结构决策**: 采用 Next.js App Router 全栈结构, 前后端同仓. 页面和 API 路由按功能域组织, 组件按功能域分目录, 业务逻辑集中在 lib/ 下. 新增 types/workshop.ts 集中管理类型定义, 消除组件间类型重复.

## 复杂度跟踪

| 违规 | 为什么需要 | 拒绝更简单替代方案的原因 |
|-----------|------------|-------------------------------------|
| skills.sh 认证需 Vercel OIDC | skills.sh API 强制要求 OIDC token, 非 API key 模式 | 无法绕过, 平台限制; CLI fallback 已实现 |
| 类型分散在组件中 | 历史实现快速迭代导致 | 集中类型文件更易维护, 消除重复定义 |
