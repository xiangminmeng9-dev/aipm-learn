# 实施计划: AI PM 模拟工作流程

**分支**: `001-ai-pm-simulator` | **日期**: 2026-04-24 | **规范**: [spec.md](./spec.md)
**输入**: 来自 `/specs/001-ai-pm-simulator/spec.md` 的功能规范

## 摘要

在首页增加“AI PM 模拟工作流程”功能，调整顶部导航栏布局使其协调。提供基于 AI PM 实战开发周期的沉浸式路线图（包含需求分析、竞品分析、算法沟通、产品设计、验收评估等阶段）。结合现有大模型接口，实现不同角色的 AI 与用户互动闯关，系统在每个环节对用户的交付和对话进行评分和反馈，并持久化保存进度。

## 技术背景

**语言/版本**: TypeScript (严格模式)
**主要依赖**: Next.js (App Router), Tailwind CSS, shadcn/ui, @/lib/ai/claude
**存储**: Supabase (PostgreSQL)
**测试**: Vitest/Jest (单元测试), Playwright (E2E 测试)
**目标平台**: Web (桌面/移动自适应)
**项目类型**: Web 应用程序 (Next.js 全栈)
**性能目标**: 页面渲染及导航响应迅速，AI 交互具备流式输出体验
**约束条件**: 与现有“AI PM 笔记本”和导航栏保持一致的设计风格；AI 对话能够记忆当前阶段上下文；遵循本项目的代码质量门禁
**规模/范围**: 一条主线多节点的路线图，多个维度的 AI 系统提示词（各角色配置）

## 章程检查

*门控: 必须在阶段 0 研究前通过. 阶段 1 设计后重新检查. *

- [ ] **I. 代码质量门禁**: ESLint, Prettier, TypeScript `tsc --noEmit` 零错误
- [ ] **II. 测试纪律**: 包含组件级单元测试，以及页面核心流程的 E2E 测试
- [ ] **III. 自校验与生产验证**: 需要运行 `next build && next start` 进行端到端功能验证
- [ ] **IV. 简洁性与可维护性**: 不引入多余抽象；避免不相关重构；遵循单一职责原则
- [ ] **V. 持续集成**: 提交粒度小而完整，不破坏原有首页及认证流程逻辑
- [ ] **技术栈约束**: 严格使用 Next.js App Router, Tailwind CSS, TypeScript

## 项目结构

### 文档(此功能)

```
specs/001-ai-pm-simulator/
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
│   ├── (simulator)/            # 或者放在独立路由 /simulator
│   │   ├── simulator/
│   │   │   ├── page.tsx        # 模拟工作流程路线图主页
│   │   │   ├── [stageId]/      # 单个节点的交互页面
│   │   │   │   └── page.tsx
│   ├── api/
│   │   ├── simulator/
│   │   │   ├── progress/route.ts    # 获取/更新会话进度
│   │   │   └── chat/route.ts        # 处理交互提问和AI评估
├── components/
│   ├── simulator/              # 该功能专用的UI组件
│   │   ├── StageRoadmap.tsx    # 路线图组件
│   │   ├── StageDetail.tsx     # 节点任务说明面板
│   │   ├── InteractiveChat.tsx # 角色聊天组件
├── lib/
│   └── ai/
│       └── simulator-prompts.ts # 各阶段不同角色的系统提示词配置
```

**结构决策**: 依托现有的 Next.js App Router 模式。由于该功能独立性较强，可将其放置在 `src/app/simulator/` 目录下。组件代码隔离至 `src/components/simulator/`。针对阶段角色的 Prompt 抽取至 `src/lib/ai/simulator-prompts.ts`，方便维护和调试。

## 复杂度跟踪

*仅在章程检查有必须证明的违规时填写*

| 违规 | 为什么需要 | 拒绝更简单替代方案的原因 |
|-----------|------------|-------------------------------------|
| 无 | N/A | 本功能可在现有架构内利用已有库（Supabase、AI 接口）以常规方式实现 |
