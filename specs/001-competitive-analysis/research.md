# 研究文档: 竞品分析助手

**日期**: 2026-04-30 | **分支**: `001-competitive-analysis`

## 研究项

### 1. 竞品分析报告结构

**Decision**: 采用四维度结构化报告——市场定位、核心功能对比、优劣势分析、差异化策略建议

**Rationale**: 这四个维度覆盖了 PM 面试中竞品分析的核心考察点，也是业界标准的产品竞品分析框架。市场定位回答"在哪竞争"，功能对比回答"怎么竞争"，优劣势回答"竞争力如何"，差异化策略回答"如何胜出"。

**Alternatives considered**:
- 五力模型：过于宏观，不适合产品级竞品分析
- SWOT 分析：可融入优劣势维度，但单独使用不够结构化
- 用户体验对比：可作为功能对比的子维度，不单独成维度

### 2. 评分维度设计

**Decision**: 采用四维度评分——分析深度、逻辑结构、洞察质量、策略可行性，总分 0-100

**Rationale**: 与现有 spec-practice 的评分模式一致（四维度 + 总分），保持用户体验一致性。这四个维度分别评估：分析的全面性、论证的条理性、洞察的独特性、建议的实操性。

**Alternatives considered**:
- 三维度评分：维度过少，评估粒度不够
- 五维度评分：维度过多，用户认知负担重
- 仅总分不分子维度：缺乏改进方向指引

### 3. AI Prompt 输出格式

**Decision**: 分析内容使用 Markdown + emoji 格式输出，评分使用 JSON 格式输出

**Rationale**: 与现有 spec-practice 和 dev-flow 的模式一致——内容类输出用 Markdown 保证可读性，结构化数据用 JSON 保证可解析性。一次 AI 调用中先输出 Markdown 分析内容，再输出 JSON 评分数据。

**Alternatives considered**:
- 全部 JSON：内容部分可读性差，需要额外渲染
- 全部 Markdown：评分部分难以解析，容易出错
- 两次 AI 调用：增加延迟和成本，不必要

### 4. 数据持久化方案

**Decision**: 使用 Supabase PostgreSQL 新表 `competitive_analyses`，启用 RLS，与现有面试助手数据表模式一致

**Rationale**: 与项目现有数据持久化方案一致（spec_practices、assistant_qa_records 等均使用此模式），RLS 保证数据安全，索引优化查询性能。

**Alternatives considered**:
- 复用现有表：字段差异大，不适合复用
- 纯本地存储：无法跨设备同步，不符合项目已有模式
