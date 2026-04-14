# API 合同: AI 产品经理面试助手

**功能**: 001-ai-pm-interview-assistant
**日期**: 2026-04-14
**基础路径**: `/api/interview`

## 1. 面试问答

### POST /api/interview/analyze

分析面试问题，返回四部分深度分析。

**Request**:
```json
{
  "question": "string (5-5000 字符, 必填)",
  "session_id": "string (uuid, 选填 — 如在 Session 中提问)"
}
```

**Response 200**:
```json
{
  "question_id": "uuid",
  "type": { "id": "uuid", "name": "string", "is_new": false },
  "analysis": "string — 问题分析（背后逻辑）",
  "thinking_framework": "string — 思考方式（结构化框架）",
  "answer_approach": "string — 回答思路（逻辑链）",
  "answer_template": "string — 面试回答模板（口语化）"
}
```

**Response 400**: `{ "error": "问题内容不能为空或超过5000字符" }`
**Response 401**: `{ "error": "未登录" }`

---

### GET /api/interview/trending

获取热门面试问题列表。

**Query Parameters**:
- `limit`: number (默认 10, 最大 30)

**Response 200**:
```json
{
  "questions": [
    {
      "id": "uuid",
      "text": "string",
      "type": { "id": "uuid", "name": "string" },
      "rank": 1,
      "updated_at": "ISO8601"
    }
  ]
}
```

---

## 2. 对话 Session

### GET /api/interview/sessions

获取用户的 Session 列表。

**Query Parameters**:
- `page`: number (默认 1)
- `limit`: number (默认 20)

**Response 200**:
```json
{
  "sessions": [
    {
      "id": "uuid",
      "title": "string",
      "has_jd": true,
      "has_resume": false,
      "message_count": 12,
      "updated_at": "ISO8601"
    }
  ],
  "total": 5
}
```

---

### POST /api/interview/sessions

创建新 Session。

**Request**:
```json
{
  "title": "string (选填, 默认 '新对话')",
  "jd_text": "string (选填)",
  "resume_text": "string (选填)"
}
```

**Response 201**:
```json
{
  "id": "uuid",
  "title": "string",
  "created_at": "ISO8601"
}
```

---

### GET /api/interview/sessions/[id]

获取单个 Session 详情（含消息历史）。

**Response 200**:
```json
{
  "id": "uuid",
  "title": "string",
  "jd_text": "string | null",
  "resume_text": "string | null",
  "compressed_summary": "string | null",
  "is_compressed": false,
  "messages": [
    {
      "id": "uuid",
      "role": "user | assistant",
      "content": "string",
      "created_at": "ISO8601"
    }
  ]
}
```

---

### PATCH /api/interview/sessions/[id]

更新 Session（标题、JD、简历）。

**Request**:
```json
{
  "title": "string (选填)",
  "jd_text": "string (选填)",
  "resume_text": "string (选填)"
}
```

**Response 200**: `{ "success": true }`

---

### DELETE /api/interview/sessions/[id]

删除 Session 及其所有消息。

**Response 200**: `{ "success": true }`

---

### POST /api/interview/sessions/[id]/chat

在 Session 中发送消息，获取 AI 回复。自动处理记忆压缩。

**Request**:
```json
{
  "message": "string (1-5000 字符, 必填)"
}
```

**Response 200** (streaming — text/event-stream):
```
data: {"type": "chunk", "content": "部分回复..."}
data: {"type": "chunk", "content": "更多内容..."}
data: {"type": "done", "message_id": "uuid", "compressed": false}
```

当 `compressed: true` 时表示此次对话触发了自动压缩。

---

## 3. 模拟面试

### POST /api/interview/mock

创建模拟面试并生成第一题。

**Request**:
```json
{
  "type_id": "uuid (问题类型, 必填)",
  "total_questions": 3 | 5 | 8 | 10,
  "jd_text": "string (选填)",
  "resume_text": "string (选填)"
}
```

**Response 201**:
```json
{
  "id": "uuid",
  "status": "in_progress",
  "current_question": 1,
  "total_questions": 5,
  "question": {
    "number": 1,
    "text": "string — AI 生成的面试问题"
  }
}
```

---

### POST /api/interview/mock/[id]/answer

提交当前题目的回答，获取即时评价 + 下一题（如有）。

**Request**:
```json
{
  "answer": "string (必填, 提交回答)",
  "skip": false
}
```

当 `skip: true` 时跳过当前题，`answer` 可省略。

**Response 200 — 还有下一题**:
```json
{
  "evaluation": {
    "score": 7.5,
    "gap_analysis": "string — 差距分析",
    "perfect_answer": "string — 满分回答"
  },
  "next_question": {
    "number": 2,
    "text": "string — 下一道面试问题"
  },
  "is_last": false
}
```

**Response 200 — 最后一题已答完**:
```json
{
  "evaluation": {
    "score": 8.0,
    "gap_analysis": "string",
    "perfect_answer": "string"
  },
  "next_question": null,
  "is_last": true
}
```

---

### GET /api/interview/mock/[id]/summary

获取模拟面试最终总结报告（仅 status=completed 时可用）。

**Response 200**:
```json
{
  "id": "uuid",
  "total_score": 7.2,
  "question_count": 5,
  "answered_count": 4,
  "skipped_count": 1,
  "answers": [
    {
      "number": 1,
      "question": "string",
      "score": 7.5,
      "gap_analysis": "string",
      "is_skipped": false
    }
  ],
  "strengths": "string — 强项分析",
  "weaknesses": "string — 弱项分析",
  "suggestions": "string — 改进建议",
  "weak_skill_modules": [
    {
      "module_id": "uuid",
      "module_name": "string",
      "recommended_tasks": [
        { "task_id": "uuid", "task_name": "string" }
      ]
    }
  ]
}
```

**Response 400**: `{ "error": "面试尚未完成" }`

---

## 4. 方法论

### GET /api/interview/methodology

获取用户的所有方法论列表。

**Response 200**:
```json
{
  "methodologies": [
    {
      "id": "uuid",
      "type": { "id": "uuid", "name": "string" },
      "framework": "string — 核心框架",
      "key_steps": ["step1", "step2"],
      "typical_cases": ["case1", "case2"],
      "source_count": 12,
      "updated_at": "ISO8601"
    }
  ],
  "total_types": 8
}
```

**Response 200 (无数据)**: `{ "methodologies": [], "total_types": 0, "message": "需要至少 10 次问答练习才能生成方法论" }`

---

### GET /api/interview/methodology/[typeId]

获取某一类型的详细方法论。

**Response 200**:
```json
{
  "type": { "id": "uuid", "name": "string" },
  "framework": "string",
  "key_steps": ["string"],
  "typical_cases": ["string"],
  "high_frequency_questions": [
    { "id": "uuid", "text": "string" }
  ],
  "source_count": 12,
  "updated_at": "ISO8601"
}
```

---

## 5. 统计

### GET /api/interview/stats

获取用户的练习统计数据。

**Response 200**:
```json
{
  "total_questions": 45,
  "type_distribution": [
    { "type_name": "产品设计类", "count": 12, "percentage": 26.7 }
  ],
  "mock_interviews": {
    "total": 8,
    "average_score": 7.3,
    "score_trend": [
      { "date": "2026-04-10", "score": 6.5 },
      { "date": "2026-04-14", "score": 8.0 }
    ]
  },
  "weak_areas": [
    {
      "type_name": "数据指标类",
      "average_score": 5.2,
      "recommended_questions": [
        { "id": "uuid", "text": "string" }
      ]
    }
  ]
}
```

---

## 6. 问题类型

### GET /api/interview/question-types

获取所有问题类型列表（含种子类型 + 动态生成类型）。

**Response 200**:
```json
{
  "types": [
    {
      "id": "uuid",
      "name": "string",
      "description": "string",
      "is_seed": true,
      "question_count": 15
    }
  ]
}
```

---

## 通用错误格式

```json
{
  "error": "string — 错误描述（中文）",
  "code": "string — 错误码（如 UNAUTHORIZED, VALIDATION_ERROR, NOT_FOUND）"
}
```

| HTTP 状态码 | 场景 |
|------------|------|
| 400 | 请求参数验证失败 |
| 401 | 未登录或 token 过期 |
| 403 | 无权访问该资源（RLS 拦截） |
| 404 | 资源不存在 |
| 429 | 请求频率过高 |
| 500 | 服务端内部错误 |
