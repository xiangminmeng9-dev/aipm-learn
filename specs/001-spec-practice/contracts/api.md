# API 合约: AI Coding 实操

**日期**: 2026-04-30 | **规范**: [spec.md](./spec.md)

---

## POST /api/coding/spec-practice

提交用户 Spec 并获取 AI 评分。

### 请求

```json
{
  "question": "设计一个智能客服助手，支持多轮对话和知识库检索",
  "question_category": "系统设计",
  "user_spec": "一、项目背景..."
}
```

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| question | string | 是 | AI 生成的题目文本 |
| question_category | string | 是 | 题目类别 |
| user_spec | string | 是 | 用户编写的 Spec（50-5000字） |

### 响应 200

```json
{
  "id": "uuid",
  "total_score": 75,
  "dimension_scores": [
    { "dimension": "完整性", "score": 75, "comment": "..." },
    { "dimension": "可执行性", "score": 80, "comment": "..." },
    { "dimension": "边界考虑", "score": 60, "comment": "..." },
    { "dimension": "结构清晰度", "score": 85, "comment": "..." }
  ],
  "suggestions": [
    { "original_text": "...", "improvement": "...", "suggestion": "..." }
  ],
  "created_at": "2026-04-30T12:00:00Z"
}
```

### 错误

| 状态码 | 说明 |
|--------|------|
| 401 | 未登录 |
| 400 | Spec 太短（<50字）或太长（>5000字） |
| 500 | AI 评分失败 |

---

## GET /api/coding/spec-practice

生成一道 AI PM 场景题目。

### 查询参数

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| refresh | string | 否 | 传 "1" 强制重新生成 |

### 响应 200

```json
{
  "question": "设计一个智能客服助手，支持多轮对话和知识库检索",
  "question_category": "系统设计"
}
```

### 错误

| 状态码 | 说明 |
|--------|------|
| 401 | 未登录 |
| 500 | AI 题目生成失败 |

---

## GET /api/coding/spec-practice/history

获取用户的实操历史记录。

### 查询参数

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| page | number | 否 | 页码，默认 1 |
| limit | number | 否 | 每页条数，默认 20 |

### 响应 200

```json
{
  "records": [
    {
      "id": "uuid",
      "question": "...",
      "question_category": "系统设计",
      "total_score": 75,
      "dimension_scores": [...],
      "suggestions": [...],
      "created_at": "2026-04-30T12:00:00Z"
    }
  ],
  "total": 42,
  "page": 1,
  "limit": 20
}
```

### 错误

| 状态码 | 说明 |
|--------|------|
| 401 | 未登录 |
