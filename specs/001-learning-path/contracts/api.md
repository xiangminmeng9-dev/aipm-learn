# API 合约: AI 生成个人学习路径

**日期**: 2026-04-30 | **分支**: `001-learning-path`

## POST /api/skills/learning-path

生成个性化学习路径。

### 请求

```json
{}
```

无需请求体，系统自动从用户数据中获取弱项信息。

### 成功响应 (200)

```json
{
  "path": {
    "id": "uuid",
    "weaknessSummary": "用户在竞品分析、数据驱动决策、技术理解力方面存在明显短板...",
    "recommendedModules": [
      {
        "name": "竞品分析框架",
        "priority": "high",
        "estimatedHours": 8,
        "reason": "竞品分析是 PM 面试高频考点，当前分析深度不足"
      },
      {
        "name": "数据驱动决策",
        "priority": "high",
        "estimatedHours": 6,
        "reason": "数据思维是 PM 核心能力，当前缺乏量化分析意识"
      },
      {
        "name": "技术架构理解",
        "priority": "medium",
        "estimatedHours": 10,
        "reason": "技术理解力影响跨团队协作效率"
      }
    ],
    "totalEstimatedHours": 24,
    "createdAt": "2026-04-30T12:00:00Z"
  }
}
```

### 错误响应

| 状态码 | 场景 | 响应体 |
|--------|------|--------|
| 401 | 未登录 | `{ "error": "请先登录" }` |
| 500 | AI 服务异常 | `{ "error": "生成学习路径失败，请稍后重试" }` |

---

## GET /api/skills/learning-path/history

获取学习路径历史记录。

### 请求参数

| 参数 | 类型 | 必填 | 默认值 | 说明 |
|------|------|------|--------|------|
| page | number | 否 | 1 | 页码 |
| limit | number | 否 | 10 | 每页条数（最大 50） |

### 成功响应 (200)

```json
{
  "records": [
    {
      "id": "uuid",
      "weaknessSummary": "...",
      "recommendedModules": [...],
      "totalEstimatedHours": 24,
      "createdAt": "2026-04-30T12:00:00Z"
    }
  ],
  "total": 3,
  "page": 1,
  "limit": 10
}
```

### 错误响应

| 状态码 | 场景 | 响应体 |
|--------|------|--------|
| 401 | 未登录 | `{ "error": "请先登录" }` |
