# 数据模型: AI 生成个人学习路径

**日期**: 2026-04-30 | **分支**: `001-learning-path`

## 实体

### LearningPath

学习路径记录，存储 AI 基于弱项分析生成的个性化学习路径。

| 字段 | 类型 | 约束 | 说明 |
|------|------|------|------|
| id | UUID | PK, DEFAULT gen_random_uuid() | 主键 |
| user_id | UUID | NOT NULL, FK → auth.users(id) ON DELETE CASCADE | 用户 ID |
| weakness_summary | TEXT | NOT NULL | 弱项摘要 (AI 总结的用户弱项) |
| recommended_modules | JSONB | NOT NULL DEFAULT '[]' | 推荐学习模块数组 |
| total_estimated_hours | INTEGER | NOT NULL | 总预估学习时长(小时) |
| created_at | TIMESTAMPTZ | DEFAULT now() | 创建时间 |

### RecommendedModule (嵌入 LearningPath.recommended_modules)

| 字段 | 类型 | 说明 |
|------|------|------|
| name | string | 模块名称 |
| priority | string | 优先级 (high/medium/low) |
| estimatedHours | number | 预估学习时长(小时) |
| reason | string | 学习理由 |

## RLS 策略

- SELECT: 用户只能查看自己的记录 (user_id = auth.uid())
- INSERT: 用户只能插入自己的记录 (WITH CHECK user_id = auth.uid())
- UPDATE: 用户只能更新自己的记录 (USING user_id = auth.uid())
- DELETE: 用户只能删除自己的记录 (USING user_id = auth.uid())

## 索引

- idx_learning_paths_user_id ON learning_paths(user_id)
- idx_learning_paths_created_at ON learning_paths(created_at DESC)
