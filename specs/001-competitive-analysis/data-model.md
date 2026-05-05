# 数据模型: 竞品分析助手

**日期**: 2026-04-30 | **分支**: `001-competitive-analysis`

## 实体

### CompetitiveAnalysis

竞品分析记录，存储用户输入的产品名和 AI 生成的分析报告。

| 字段 | 类型 | 约束 | 说明 |
|------|------|------|------|
| id | UUID | PK, DEFAULT gen_random_uuid() | 主键 |
| user_id | UUID | NOT NULL, FK → auth.users(id) ON DELETE CASCADE | 用户 ID |
| product_name | TEXT | NOT NULL, CHECK(char_length >= 2) | 产品名称 |
| market_position | TEXT | NOT NULL | 市场定位分析内容 (Markdown) |
| feature_comparison | TEXT | NOT NULL | 核心功能对比内容 (Markdown) |
| strengths_weaknesses | TEXT | NOT NULL | 优劣势分析内容 (Markdown) |
| differentiation_strategy | TEXT | NOT NULL | 差异化策略建议内容 (Markdown) |
| total_score | INTEGER | NOT NULL, CHECK(>= 0 AND <= 100) | 总分 |
| dimension_scores | JSONB | NOT NULL DEFAULT '[]' | 维度评分数组 |
| created_at | TIMESTAMPTZ | DEFAULT now() | 创建时间 |

### DimensionScore (嵌入 CompetitiveAnalysis.dimension_scores)

| 字段 | 类型 | 说明 |
|------|------|------|
| dimension | string | 维度名称（分析深度/逻辑结构/洞察质量/策略可行性） |
| score | number | 该维度得分 (0-100) |
| comment | string | 该维度评语 |

## RLS 策略

- SELECT: 用户只能查看自己的记录 (user_id = auth.uid())
- INSERT: 用户只能插入自己的记录 (WITH CHECK user_id = auth.uid())
- UPDATE: 用户只能更新自己的记录 (USING user_id = auth.uid())
- DELETE: 用户只能删除自己的记录 (USING user_id = auth.uid())

## 索引

- idx_competitive_analyses_user_id ON competitive_analyses(user_id)
- idx_competitive_analyses_created_at ON competitive_analyses(created_at DESC)
