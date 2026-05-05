# 快速开始: AI Coding 实操

**日期**: 2026-04-30 | **规范**: [spec.md](./spec.md)

## 前置条件

- 项目已启动 (`pnpm dev` on port 3001)
- 用户已登录
- Supabase 数据库可访问
- AI API (Claude) 可调用

## 开发步骤

### 1. 数据库迁移

创建 `supabase/migrations/036_spec_practice.sql`，包含：
- `spec_practices` 表（id, user_id, question, question_category, user_spec, total_score, dimension_scores, suggestions, created_at）
- RLS 策略（用户只能操作自己的记录）
- 索引（user_id, created_at DESC）

### 2. AI Prompt

在 `src/lib/ai/prompts.ts` 新增：
- `buildSpecPracticeQuestionPrompt()` — 生成大厂标准 AI PM 题目
- `SPEC_PRACTICE_QUESTION_SYSTEM_PROMPT` — 出题系统 prompt
- `buildSpecEvaluationPrompt(question, userSpec)` — 评分 prompt
- `SPEC_EVALUATION_SYSTEM_PROMPT` — 评分系统 prompt

### 3. API 路由

- `src/app/api/coding/spec-practice/route.ts` — GET(出题) + POST(提交评分)
- `src/app/api/coding/spec-practice/history/route.ts` — GET(历史列表)

### 4. 页面

- `src/app/coding/spec-practice/page.tsx` — 实操主页面
- `src/app/coding/spec-history/page.tsx` — 历史记录页面

### 5. 组件

- `src/components/coding/SpecPracticeView.tsx` — 题目展示 + Spec 输入 + 评分结果
- `src/components/coding/SpecScoreCard.tsx` — 评分卡片（总分 + 维度分数条 + 优化建议）

### 6. 侧边栏 & 首页入口

- `src/components/layout/CodingSidebar.tsx` — 新增"实操练习"和"实操历史"导航项
- `src/app/page.tsx` — 首页 AI Coding 卡片新增子功能入口

### 7. 数据看板

- `src/app/api/learning/dashboard/route.ts` — 新增实操统计查询
- `src/app/settings/dashboard/page.tsx` — AI Coding 区域新增实操统计卡片

### 8. 类型定义

- `src/types/index.ts` — 新增 SpecPractice 接口

## 验证

1. 进入 `/coding/spec-practice`，验证题目自动生成
2. 编写 Spec 并提交，验证评分结果展示
3. 点击"换一题"，验证新题目不同
4. 进入 `/coding/spec-history`，验证历史记录展示
5. 进入设置数据看板，验证实操统计展示
