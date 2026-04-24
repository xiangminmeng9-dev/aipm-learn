# 快速入门: AI PM 模拟工作流程

## 概述

AI PM 模拟工作流程（Simulator）是一个基于大模型角色扮演的沉浸式实战教学模块。用户可以在其中体验一个完整 AI 产品生命周期的关键节点：接收需求、分析竞品、对齐算法、设计容错机制、评测验收。在每个节点，用户将与特定的虚拟 NPC 聊天（如算法老李、业务负责人王总），并提交指定物料，根据系统打分推动剧情。

## 开发准备

### 1. 数据库迁移

你需要运行新的 SQL 迁移来创建进度表：

```sql
create table simulator_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  current_stage_id text not null,
  stage_scores jsonb not null default '{}',
  status text not null default 'in_progress',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table simulator_messages (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references simulator_sessions(id) on delete cascade,
  stage_id text not null,
  role text not null,
  content text not null,
  created_at timestamptz not null default now()
);

-- RLS 策略等略
```

### 2. 核心文件结构

- `src/app/simulator/page.tsx`: 首页，展示阶段路线图（解锁/锁定状态）。
- `src/app/simulator/[stageId]/page.tsx`: 单一阶段的详细视图和聊天面板。
- `src/lib/ai/simulator-config.ts`: 配置了模拟场景的核心数组 `STAGES_CONFIG`。这里包含所有前置阅读书单、背景故事和每个 NPC 的 `systemPrompt`。

### 3. API 与交互流程

1. **进入模块**: 前端调用 `GET /api/simulator/progress`。如果返回 404，则说明是首次进入，调用 `POST` 创建一个状态为 `stage-1` 的 `session`。
2. **进入关卡**: 用户进入第一关，显示背景剧情和建议阅读。
3. **交互**: 用户在聊天框内发言。前端调用 `POST /api/simulator/chat`，将输入推给大模型（带有指定的系统提示词，如“你现在是一个很强势的业务总监...”）。记录对话存入 `simulator_messages`。
4. **提交评估**: 用户点击“提交关卡物料”，调用 `chat` 接口带 `is_submission: true`。模型转为评估模式（不扮演角色了，而是扮演裁判），返回该环节的得分、改进意见以及 `{ passed: true }` 标志。
5. **阶段切换**: 如果过关，前端调用 `POST /api/simulator/progress` 带上得分，更新 `current_stage_id` 至下一阶段。用户解锁路线图下一节点。

## 修改或增加新关卡

无需修改数据库！所有关卡的流转和定义均由前端配置控制：
只需在 `src/lib/simulator-config.ts` 中的 `STAGES_CONFIG` 数组中推入一个新的对象，并确保其 `id` 是唯一的即可。数据库进度中以其 `id` 进行动态映射。
