-- ============================================================
-- 006_skills_v2_schema.sql
-- 技能树重构：增加层级/前置条件/资源 + JD 分析功能
-- ============================================================

-- 1. skill_modules 增加字段
alter table skill_modules add column if not exists level integer not null default 1 check (level between 1 and 4);
alter table skill_modules add column if not exists level_name text not null default '基础入门';
alter table skill_modules add column if not exists prerequisites uuid[] not null default '{}';

-- 2. learning_tasks 增加字段
alter table learning_tasks add column if not exists resources jsonb not null default '[]';
alter table learning_tasks add column if not exists prerequisites uuid[] not null default '{}';

-- 3. jd_analyses: JD 文本 + AI 提取结果
create table jd_analyses (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  jd_text text not null,
  company_name text,
  position_name text,
  extracted_skills jsonb not null default '[]',
  skill_module_matches jsonb not null default '[]',
  gaps jsonb not null default '[]',
  created_at timestamptz not null default now()
);
create index idx_jd_analyses_user on jd_analyses(user_id);

-- 4. jd_skills: 跨 JD 技能频次聚合
create table jd_skills (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  skill_name text not null,
  category text,
  frequency integer not null default 1,
  first_seen_at timestamptz not null default now(),
  last_seen_at timestamptz not null default now(),
  unique (user_id, skill_name)
);
create index idx_jd_skills_user_freq on jd_skills(user_id, frequency desc);

-- 5. user_custom_tasks: 用户确认的自定义学习任务
create table user_custom_tasks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  module_id uuid references skill_modules(id) on delete set null,
  title text not null,
  objective text not null,
  resources jsonb not null default '[]',
  source_jd_id uuid references jd_analyses(id) on delete set null,
  status text not null default 'not_started' check (status in ('not_started', 'in_progress', 'completed')),
  completed_at timestamptz,
  created_at timestamptz not null default now()
);
create index idx_user_custom_tasks_user on user_custom_tasks(user_id);

-- 6. RLS
alter table jd_analyses enable row level security;
create policy "Users can manage own jd_analyses" on jd_analyses for all using (auth.uid() = user_id);

alter table jd_skills enable row level security;
create policy "Users can manage own jd_skills" on jd_skills for all using (auth.uid() = user_id);

alter table user_custom_tasks enable row level security;
create policy "Users can manage own user_custom_tasks" on user_custom_tasks for all using (auth.uid() = user_id);

-- 7. 删除趋势表
drop table if exists trend_progress cascade;
drop table if exists trend_briefs cascade;
