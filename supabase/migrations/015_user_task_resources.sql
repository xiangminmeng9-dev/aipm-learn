-- User-added resources for learning tasks (seed, JD gap, or custom module)
create table if not exists user_task_resources (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  task_id uuid not null,
  task_type text not null check (task_type in ('seed', 'jd_gap', 'custom_module')),
  type text not null check (type in ('article', 'video', 'book', 'note')),
  title text not null,
  url text not null default '',
  source text not null default '',
  notes text,
  created_at timestamptz not null default now()
);

create index if not exists idx_user_task_resources_user_task on user_task_resources(user_id, task_id);

alter table user_task_resources enable row level security;

create policy "Users can manage own user_task_resources"
  on user_task_resources for all
  using (auth.uid() = user_id);
