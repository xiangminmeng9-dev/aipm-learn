# API 合同: Skill Workshop

**日期**: 2026-06-19 | **分支**: 002-skill-workshop

## 概述

所有 API 路由位于 `/api/skills/workshop/` 下, 遵循 Next.js App Router 约定. 所有路由需要 Supabase 认证 (401 未认证). 外部 API 调用通过服务端代理避免 CORS.

---

## 浏览 (Browse)

### GET /api/skills/workshop/clawhub/browse

浏览 ClawHub 技能列表.

**Query Parameters**:
| 参数 | 类型 | 必填 | 默认值 | 说明 |
|------|------|------|--------|------|
| cursor | string | 否 | | 分页游标 (首次请求不传) |
| limit | number | 否 | 20 | 每页数量 (1-200) |
| sort | string | 否 | updated | 排序: updated, recommended, installsCurrent, installsAllTime, trending, createdAt |
| q | string | 否 | | 搜索关键词 (≥2字符时触发搜索) |

**Response 200**:
```json
{
  "skills": [
    {
      "id": "slug",
      "name": "Skill Name",
      "description": "Summary",
      "author": "owner-handle",
      "installs": 1500,
      "platform": "clawhub",
      "url": "https://clawhub.ai/skills/slug",
      "slug": "slug",
      "tags": ["tag1"],
      "updatedAt": "2026-01-01T00:00:00Z"
    }
  ],
  "nextCursor": "opaque-cursor-string",
  "total": 100,
  "hasMore": true
}
```

**Response 502**: `{ "error": "ClawHub 服务暂不可用", "skills": [] }`

---

### GET /api/skills/workshop/skillssh/browse

浏览 skills.sh 技能列表 (使用 CLI 无认证端点).

**Query Parameters**:
| 参数 | 类型 | 必填 | 默认值 | 说明 |
|------|------|------|--------|------|
| q | string | 否 | | 搜索关键词 |
| limit | number | 否 | 20 | 每页数量 |

**Response 200**:
```json
{
  "skills": [
    {
      "id": "owner/repo/slug",
      "name": "Skill Name",
      "description": "",
      "author": "owner",
      "installs": 500,
      "platform": "skillssh",
      "url": "https://skills.sh/owner/repo/slug",
      "slug": "slug"
    }
  ],
  "total": 50
}
```

**Response 502**: `{ "error": "skills.sh 服务暂不可用", "skills": [] }`

---

### GET /api/skills/workshop/clawhub/[slug]

获取 ClawHub 技能详情 + SKILL.md 文件内容.

**Path Parameters**: `slug` (ClawHub skill slug)

**Response 200**:
```json
{
  "skill": { "name": "...", "description": "...", "author": "...", "tags": [] },
  "content": "# Skill markdown content..."
}
```

---

### GET /api/skills/workshop/skillssh/[id]

获取 skills.sh 技能详情 + SKILL.md 文件内容.

**Path Parameters**: `id` (格式: `owner/repo/slug`)

**Response 200**:
```json
{
  "skill": { "name": "...", "description": "...", "source": "owner/repo" },
  "content": "# Skill markdown content..."
}
```

---

## 分析 (Analyze)

### POST /api/skills/workshop/analyze

AI 分析 SKILL.md 质量 (5维度评分).

**Request Body**:
```json
{
  "content": "SKILL.md full content",
  "skillName": "optional name",
  "skillSlug": "optional slug",
  "skillSource": "paste | clawhub | skillssh"
}
```

**Response 200**:
```json
{
  "id": "uuid",
  "analysis": {
    "overall_quality": 75,
    "structure_analysis": { "frontmatter_present": true, "required_fields": [], "missing_fields": [] },
    "quality_scores": {
      "clarity": { "score": 80, "comment": "..." },
      "completeness": { "score": 70, "comment": "..." },
      "practicality": { "score": 85, "comment": "..." },
      "robustness": { "score": 65, "comment": "..." },
      "innovation": { "score": 75, "comment": "..." }
    },
    "use_cases": [],
    "improvements": [],
    "summary": "..."
  }
}
```

**Response 429**: `{ "error": "今日分析次数已达上限" }` (限流: 20次/天/用户)

---

### POST /api/skills/workshop/improve

AI 一键改进 SKILL.md (新增路由).

**Request Body**:
```json
{
  "content": "original SKILL.md content",
  "analysisId": "uuid of previous analysis"
}
```

**Response 200**:
```json
{
  "improved_content": "improved SKILL.md content",
  "changes": [
    { "field": "description", "before": "...", "after": "...", "reason": "..." }
  ],
  "analysis_id": "uuid"
}
```

**Response 429**: `{ "error": "今日改进次数已达上限" }`

---

### GET /api/skills/workshop/analyze/history

获取用户分析历史 (最近 20 条).

**Response 200**:
```json
{
  "history": [
    {
      "id": "uuid",
      "skill_name": "...",
      "skill_source": "clawhub",
      "overall_quality": 75,
      "created_at": "2026-01-01T00:00:00Z"
    }
  ]
}
```

---

### GET /api/skills/workshop/analyze/history/[id]

获取单条分析记录详情.

**Path Parameters**: `id` (analysis record UUID)

**Response 200**: 完整分析记录 (含 analysis_result JSONB)

---

## 编辑 (Write)

### GET /api/skills/workshop/drafts

获取用户草稿列表 (最近 50 条).

**Response 200**:
```json
{
  "drafts": [
    {
      "id": "uuid",
      "name": "...",
      "description": "...",
      "status": "draft",
      "template_type": "basic",
      "validation_status": "valid",
      "created_at": "...",
      "updated_at": "..."
    }
  ]
}
```

---

### POST /api/skills/workshop/drafts

创建新草稿.

**Request Body**:
```json
{
  "name": "skill-name",
  "description": "Skill description",
  "content": "full SKILL.md content",
  "template_type": "basic"
}
```

**Response 201**: `{ "id": "uuid", "name": "...", "status": "draft" }`

---

### GET /api/skills/workshop/drafts/[id]

获取草稿详情 (含完整 content).

---

### PUT /api/skills/workshop/drafts/[id]

更新草稿.

**Request Body**:
```json
{
  "name": "updated-name",
  "description": "updated description",
  "content": "updated SKILL.md content",
  "template_type": "agent",
  "validation_status": "valid"
}
```

---

### DELETE /api/skills/workshop/drafts/[id]

删除草稿.

**Response 200**: `{ "success": true }`

---

### POST /api/skills/workshop/validate

服务端验证 SKILL.md 格式.

**Request Body**:
```json
{
  "content": "SKILL.md content to validate"
}
```

**Response 200**:
```json
{
  "valid": true,
  "errors": [],
  "warnings": ["missing optional field: metadata.author"],
  "fields": {
    "name": "skill-name",
    "description": "..."
  }
}
```

---

### POST /api/skills/workshop/write-assist

AI 辅助写作.

**Request Body**:
```json
{
  "description": "What the skill should do",
  "template_type": "basic",
  "existing_content": "optional existing content to improve"
}
```

**Response 200**:
```json
{
  "skill_content": "generated SKILL.md content",
  "explanation": "Why this structure was chosen",
  "tips": ["tip1", "tip2"]
}
```

**Response 429**: `{ "error": "今日辅助写作次数已达上限" }`

---

## 发布 (Publish)

### POST /api/skills/workshop/publish

发布草稿到社区平台.

**Request Body**:
```json
{
  "draftId": "uuid",
  "platform": "clawhub"
}
```

**Response 200 (ClawHub 成功)**:
```json
{
  "success": true,
  "platform": "clawhub",
  "slug": "published-slug",
  "url": "https://clawhub.ai/skills/published-slug",
  "version": "1.0.0"
}
```

**Response 200 (CLI fallback)**:
```json
{
  "success": false,
  "platform": "skillssh",
  "cli_fallback": true,
  "content": "SKILL.md content to copy",
  "instructions": "Use CLI: npx skills add ..."
}
```

**Response 400**: `{ "error": "未配置 ClawHub API Token" }`
**Response 500**: `{ "error": "发布失败: ..." }`

---

### GET /api/skills/workshop/tokens

获取用户已配置的 token 列表 (脱敏).

**Response 200**:
```json
{
  "tokens": [
    { "provider": "clawhub", "has_token": true, "masked": "clh_****1234" }
  ]
}
```

---

### POST /api/skills/workshop/tokens

保存/更新平台 token.

**Request Body**:
```json
{
  "provider": "clawhub",
  "token": "clh_xxxxx"
}
```

**Response 200**: `{ "success": true }`

---

### DELETE /api/skills/workshop/tokens

删除平台 token.

**Request Body**:
```json
{
  "provider": "clawhub"
}
```

**Response 200**: `{ "success": true }`
