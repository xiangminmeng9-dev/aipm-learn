-- ============================================================
-- 010_add_bonus_mistakes_columns.sql
-- 为 question_analyses 表增加 bonus_points 和 common_mistakes 字段
-- ============================================================

alter table question_analyses
  add column if not exists bonus_points text default '',
  add column if not exists common_mistakes text default '';
