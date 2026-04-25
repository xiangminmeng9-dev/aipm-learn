-- ============================================================
-- 004_coding_and_skills.sql
-- AI Coding 练习 + AI PM 技能学习 — 数据库架构
-- ============================================================

-- -----------------------------------------------------------
-- 1. dev_modes（6 种预设开发模式）
-- -----------------------------------------------------------
create table dev_modes (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  description text not null,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

-- -----------------------------------------------------------
-- 2. dev_flows（AI Coding 开发流程）
-- -----------------------------------------------------------
create table dev_flows (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  question_text text not null,
  mode_id uuid not null references dev_modes(id) on delete restrict,
  clarification text not null default '',
  breakdown text not null default '',
  steps text not null default '',
  notes text not null default '',
  created_at timestamptz not null default now()
);

create index idx_dev_flows_user on dev_flows(user_id);
create index idx_dev_flows_mode on dev_flows(mode_id);

-- -----------------------------------------------------------
-- 3. coding_methodologies（Coding 方法论提炼）
-- -----------------------------------------------------------
create table coding_methodologies (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  high_freq_questions jsonb not null default '[]',
  common_breakdowns jsonb not null default '[]',
  cross_mode_steps jsonb not null default '[]',
  key_notes jsonb not null default '[]',
  source_count integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id)
);

-- -----------------------------------------------------------
-- 4. skill_modules（7 个技能模块）
-- -----------------------------------------------------------
create table skill_modules (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  description text not null,
  icon text not null default '📚',
  job_targets jsonb not null default '[]',
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

-- -----------------------------------------------------------
-- 5. learning_tasks（细粒度学习任务）
-- -----------------------------------------------------------
create table learning_tasks (
  id uuid primary key default gen_random_uuid(),
  module_id uuid not null references skill_modules(id) on delete cascade,
  title text not null,
  objective text not null,
  estimated_days numeric(3,1) not null check (estimated_days >= 0.5 and estimated_days <= 3),
  content_summary text not null,
  resource_hints text,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

create index idx_learning_tasks_module on learning_tasks(module_id);

-- -----------------------------------------------------------
-- 6. learning_progress（学习进度）
-- -----------------------------------------------------------
create table learning_progress (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  task_id uuid not null references learning_tasks(id) on delete cascade,
  status text not null default 'not_started' check (status in ('not_started', 'completed')),
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  unique (user_id, task_id)
);

create index idx_learning_progress_user on learning_progress(user_id);

-- -----------------------------------------------------------
-- 7. trend_briefs（AI 技术趋势简报）
-- -----------------------------------------------------------
create table trend_briefs (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  published_at timestamptz not null default now(),
  summary_points jsonb not null default '[]',
  impact_analysis text not null default '',
  learning_suggestion text not null default '',
  source_ref text,
  created_at timestamptz not null default now()
);

-- -----------------------------------------------------------
-- 8. trend_progress（趋势学习标记）
-- -----------------------------------------------------------
create table trend_progress (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  trend_id uuid not null references trend_briefs(id) on delete cascade,
  is_learned boolean not null default false,
  marked_at timestamptz,
  created_at timestamptz not null default now(),
  unique (user_id, trend_id)
);

create index idx_trend_progress_user on trend_progress(user_id);

-- -----------------------------------------------------------
-- RLS 策略
-- -----------------------------------------------------------

alter table dev_modes enable row level security;
create policy "Authenticated users can read dev_modes" on dev_modes
  for select using (auth.role() = 'authenticated');

alter table dev_flows enable row level security;
create policy "Users can manage own dev_flows" on dev_flows
  for all using (auth.uid() = user_id);

alter table coding_methodologies enable row level security;
create policy "Users can manage own coding_methodologies" on coding_methodologies
  for all using (auth.uid() = user_id);

alter table skill_modules enable row level security;
create policy "Authenticated users can read skill_modules" on skill_modules
  for select using (auth.role() = 'authenticated');

alter table learning_tasks enable row level security;
create policy "Authenticated users can read learning_tasks" on learning_tasks
  for select using (auth.role() = 'authenticated');

alter table learning_progress enable row level security;
create policy "Users can manage own learning_progress" on learning_progress
  for all using (auth.uid() = user_id);

alter table trend_briefs enable row level security;
create policy "Authenticated users can read trend_briefs" on trend_briefs
  for select using (auth.role() = 'authenticated');

alter table trend_progress enable row level security;
create policy "Users can manage own trend_progress" on trend_progress
  for all using (auth.uid() = user_id);
