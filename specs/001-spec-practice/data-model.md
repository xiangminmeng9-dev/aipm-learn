# 数据模型: AI Coding 实操

**日期**: 2026-04-30 | **规范**: [spec.md](./spec.md)

## 实体

### spec_practices

实操练习记录表，存储每次练习的题目、用户 Spec、AI 评分和优化建议。

| 字段 | 类型 | 约束 | 说明 |
|------|------|------|------|
| id | UUID | PK, default gen_random_uuid() | 记录 ID |
| user_id | UUID | FK → auth.users, NOT NULL | 用户 ID |
| question | TEXT | NOT NULL | AI 生成的题目 |
| question_category | TEXT | NOT NULL | 题目类别（需求分析/系统设计/产品规划等） |
| user_spec | TEXT | NOT NULL, CHECK(length >= 50) | 用户编写的 Spec |
| total_score | INTEGER | NOT NULL, CHECK(0-100) | 总分 |
| dimension_scores | JSONB | NOT NULL | 维度评分数组 |
| suggestions | JSONB | NOT NULL | 优化建议数组 |
| created_at | TIMESTAMPTZ | default now() | 创建时间 |

### dimension_scores JSONB 结构

```json
[
  { "dimension": "完整性", "score": 75, "comment": "缺少非功能性需求描述" },
  { "dimension": "可执行性", "score": 80, "comment": "步骤清晰，但缺少优先级排序" },
  { "dimension": "边界考虑", "score": 60, "comment": "未考虑异常场景和降级方案" },
  { "dimension": "结构清晰度", "score": 85, "comment": "层次分明，逻辑连贯" }
]
```

### suggestions JSONB 结构

```json
[
  { "original_text": "系统需要支持高并发", "improvement": "量化指标", "suggestion": "建议明确 QPS 目标，如'支持 1000 QPS'，便于后续性能测试和容量规划" },
  { "original_text": "用户可以上传文件", "improvement": "边界定义", "suggestion": "补充文件类型限制、大小上限、上传失败重试策略等边界条件" }
]
```

## 关系

- `spec_practices.user_id` → `auth.users.id` (多对一)
- 每个用户可有多条实操记录，每条记录独立

## RLS 策略

- 用户只能查看和操作自己的记录
- `SELECT`: `user_id = auth.uid()`
- `INSERT`: `user_id = auth.uid()`
- `UPDATE`: `user_id = auth.uid()`
- `DELETE`: `user_id = auth.uid()`

## 索引

- `idx_spec_practices_user_id` ON (user_id) — 按用户查询
- `idx_spec_practices_created_at` ON (created_at DESC) — 按时间排序
