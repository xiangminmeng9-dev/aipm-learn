# 数据模型: Skill Workshop

**日期**: 2026-06-19 | **分支**: 002-skill-workshop

## 现有表 (已创建, 无需修改)

### user_skill_drafts

| 字段 | 类型 | 约束 | 说明 |
|------|------|------|------|
| id | uuid | PK, default gen_random_uuid() | 主键 |
| user_id | uuid | FK → auth.users, NOT NULL | 用户 ID |
| name | text | NOT NULL | 技能名称 |
| description | text | | 技能描述 |
| content | text | NOT NULL | SKILL.md 完整内容 |
| status | text | NOT NULL, default 'draft' | 状态: draft / published |
| clawhub_slug | text | | ClawHub 发布后的 slug |
| clawhub_url | text | | ClawHub 发布后的 URL |
| skillssh_slug | text | | skills.sh 发布后的 slug |
| skillssh_url | text | | skills.sh 发布后的 URL |
| created_at | timestamptz | default now() | 创建时间 |
| updated_at | timestamptz | default now() | 更新时间 |

**RLS**: 用户仅可访问自己的草稿
**索引**: (user_id, updated_at DESC)

### skill_workshop_analyses

| 字段 | 类型 | 约束 | 说明 |
|------|------|------|------|
| id | uuid | PK, default gen_random_uuid() | 主键 |
| user_id | uuid | FK → auth.users, NOT NULL | 用户 ID |
| skill_name | text | | 被分析的技能名称 |
| skill_slug | text | | 被分析的技能 slug |
| skill_source | text | | 来源: clawhub / skillssh / paste |
| skill_content | text | | 被分析的 SKILL.md 内容 |
| analysis_result | jsonb | NOT NULL | AI 分析结果 (5维度评分等) |
| created_at | timestamptz | default now() | 创建时间 |

**RLS**: 用户仅可访问自己的分析记录
**索引**: (user_id, created_at DESC)

**analysis_result JSONB 结构**:
```json
{
  "overall_quality": 75,
  "structure_analysis": {
    "frontmatter_present": true,
    "required_fields": ["name", "description"],
    "missing_fields": [],
    "optional_fields_present": ["metadata", "effort"]
  },
  "quality_scores": {
    "clarity": { "score": 80, "comment": "..." },
    "completeness": { "score": 70, "comment": "..." },
    "practicality": { "score": 85, "comment": "..." },
    "robustness": { "score": 65, "comment": "..." },
    "innovation": { "score": 75, "comment": "..." }
  },
  "use_cases": ["场景1", "场景2"],
  "improvements": [
    { "current": "...", "suggestion": "...", "priority": "high" }
  ],
  "summary": "..."
}
```

### user_external_tokens

| 字段 | 类型 | 约束 | 说明 |
|------|------|------|------|
| id | uuid | PK, default gen_random_uuid() | 主键 |
| user_id | uuid | FK → auth.users, NOT NULL | 用户 ID |
| provider | text | NOT NULL | 平台: clawhub / skillssh |
| token | text | NOT NULL | 加密后的 API token |
| created_at | timestamptz | default now() | 创建时间 |
| updated_at | timestamptz | default now() | 更新时间 |

**RLS**: 用户仅可访问自己的 token
**唯一约束**: (user_id, provider)

## 新增字段 (需迁移)

### user_skill_drafts 新增字段

| 字段 | 类型 | 约束 | 说明 |
|------|------|------|------|
| template_type | text | default 'basic' | 模板类型: basic / agent / workflow / pm-specialist |
| validation_status | text | default 'unknown' | 验证状态: unknown / valid / invalid |
| validation_errors | jsonb | | 验证错误列表 |

### skill_workshop_analyses 新增字段

| 字段 | 类型 | 约束 | 说明 |
|------|------|------|------|
| improved_content | text | | AI 改进后的 SKILL.md 内容 |
| improvement_applied | boolean | default false | 是否已应用改进 |

## 实体关系

```
auth.users
  ├── 1:N → user_skill_drafts (用户可有多份草稿)
  ├── 1:N → skill_workshop_analyses (用户可有多条分析记录)
  └── 1:N → user_external_tokens (用户可有多个平台 token, 每平台一个)
```

## 状态转换

### user_skill_drafts.status

```
draft ──[publish success]──→ published
draft ──[publish fail]──→ draft (保持不变, 显示错误)
published ──[edit]──→ draft (重新编辑, 清除发布信息)
```

### skill_workshop_analyses (无状态转换, 不可变记录)

分析记录创建后不可修改. "一键改进" 产生的新内容存储在 `improved_content` 字段, 不影响原始分析结果.

## 外部数据模型 (API 响应, 非持久化)

### UnifiedSkill (统一技能模型)

```typescript
interface UnifiedSkill {
  id: string;
  name: string;
  description: string;
  author: string;
  installs: number;
  platform: 'clawhub' | 'skillssh';
  url: string;
  slug: string;
  tags?: string[];
  updatedAt?: string;
}
```

### ClawHub Skill (API 响应)

```typescript
interface ClawHubBrowseItem {
  slug: string;
  displayName: string;
  summary: string;
  tags: string[];
  stats: { installsCurrent: number; installsAllTime: number; stars: number };
  createdAt: string;
  updatedAt: string;
  latestVersion: { version: string };
  metadata: Record<string, unknown>;
}
```

### skills.sh Skill (CLI 端点响应)

```typescript
interface SkillsShSearchItem {
  id: string;           // "{source}/{slug}"
  name: string;
  slug: string;
  source: string;       // "owner/repo"
  installs: number;
  sourceType: string;   // "github" | "well-known"
  installUrl: string;
  url: string;
}
```
