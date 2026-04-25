-- ============================================================
-- 011_user_skill_modules.sql
-- User-created custom skill modules + their learning tasks
-- ============================================================

-- 1. user_skill_modules: user-owned modules that slot into the 4-level structure
create table user_skill_modules (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  description text not null,
  icon text not null default '✨',
  level integer not null check (level between 1 and 4),
  level_name text not null,
  source_description text not null,
  job_targets jsonb not null default '[]',
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

create index idx_user_skill_modules_user on user_skill_modules(user_id);
create index idx_user_skill_modules_user_level on user_skill_modules(user_id, level);

-- 2. user_module_tasks: tasks within user-created modules
create table user_module_tasks (
  id uuid primary key default gen_random_uuid(),
  module_id uuid not null references user_skill_modules(id) on delete cascade,
  title text not null,
  objective text not null,
  estimated_days numeric(3,1) not null check (estimated_days >= 0.5 and estimated_days <= 3),
  content_summary text not null default '',
  resources jsonb not null default '[]',
  sort_order integer not null default 0,
  status text not null default 'not_started' check (status in ('not_started', 'in_progress', 'completed')),
  completed_at timestamptz,
  created_at timestamptz not null default now()
);

create index idx_user_module_tasks_module on user_module_tasks(module_id);

-- 3. RLS policies
alter table user_skill_modules enable row level security;
create policy "Users can manage own user_skill_modules" on user_skill_modules
  for all using (auth.uid() = user_id);

alter table user_module_tasks enable row level security;
create policy "Users can manage own user_module_tasks" on user_module_tasks
  for all using (
    module_id in (select id from user_skill_modules where user_id = auth.uid())
  );
