# API 合约: 竞品分析助手

**日期**: 2026-04-30 | **分支**: `001-competitive-analysis`

## POST /api/interview/competitive

生成竞品分析报告。

### 请求

```json
{
  "productName": "飞书"
}
```

| 字段 | 类型 | 必填 | 约束 | 说明 |
|------|------|------|------|------|
| productName | string | 是 | 2-100 字符 | 产品名称 |

### 成功响应 (200)

```json
{
  "analysis": {
    "id": "uuid",
    "productName": "飞书",
    "marketPosition": "## 🏢 市场定位\n...",
    "featureComparison": "## ⚡ 核心功能对比\n...",
    "strengthsWeaknesses": "## 💪 优劣势分析\n...",
    "differentiationStrategy": "## 🎯 差异化策略建议\n...",
    "totalScore": 78,
    "dimensionScores": [
      { "dimension": "分析深度", "score": 80, "comment": "..." },
      { "dimension": "逻辑结构", "score": 75, "comment": "..." },
      { "dimension": "洞察质量", "score": 82, "comment": "..." },
      { "dimension": "策略可行性", "score": 74, "comment": "..." }
    ],
    "createdAt": "2026-04-30T12:00:00Z"
  }
}
```

### 错误响应

| 状态码 | 场景 | 响应体 |
|--------|------|--------|
| 400 | 产品名为空或过短 | `{ "error": "请输入有效的产品名称（至少2个字符）" }` |
| 401 | 未登录 | `{ "error": "请先登录" }` |
| 500 | AI 服务异常 | `{ "error": "生成分析失败，请稍后重试" }` |

---

## GET /api/interview/competitive/history

获取竞品分析历史记录。

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
      "productName": "飞书",
      "totalScore": 78,
      "dimensionScores": [...],
      "marketPosition": "...",
      "featureComparison": "...",
      "strengthsWeaknesses": "...",
      "differentiationStrategy": "...",
      "createdAt": "2026-04-30T12:00:00Z"
    }
  ],
  "total": 5,
  "page": 1,
  "limit": 10
}
```

### 错误响应

| 状态码 | 场景 | 响应体 |
|--------|------|--------|
| 401 | 未登录 | `{ "error": "请先登录" }` |
