-- Fixed task templates: recurring daily task blueprints
create table if not exists notebook_fixed_task_templates (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  description text not null default '',
  start_time text not null default '',
  duration text not null default '',
  sort_order integer not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, title)
);

create index if not exists idx_fixed_task_templates_user_active
  on notebook_fixed_task_templates(user_id, is_active)
  where is_active = true;

alter table notebook_fixed_task_templates enable row level security;

create policy "Users can read own fixed templates" on notebook_fixed_task_templates
  for select using (auth.uid() = user_id);
create policy "Users can insert own fixed templates" on notebook_fixed_task_templates
  for insert with check (auth.uid() = user_id);
create policy "Users can update own fixed templates" on notebook_fixed_task_templates
  for update using (auth.uid() = user_id);
create policy "Users can delete own fixed templates" on notebook_fixed_task_templates
  for delete using (auth.uid() = user_id);

create or replace function update_fixed_task_templates_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger trg_fixed_task_templates_updated_at
  before update on notebook_fixed_task_templates
  for each row execute function update_fixed_task_templates_updated_at();

-- Fixed task skips: records when a fixed task was deleted for a specific date
create table if not exists notebook_fixed_task_skips (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  template_id uuid not null references notebook_fixed_task_templates(id) on delete cascade,
  date date not null,
  created_at timestamptz not null default now(),
  unique (user_id, template_id, date)
);

create index if not exists idx_fixed_task_skips_user_date
  on notebook_fixed_task_skips(user_id, date);

alter table notebook_fixed_task_skips enable row level security;

create policy "Users can read own skips" on notebook_fixed_task_skips
  for select using (auth.uid() = user_id);
create policy "Users can insert own skips" on notebook_fixed_task_skips
  for insert with check (auth.uid() = user_id);
create policy "Users can delete own skips" on notebook_fixed_task_skips
  for delete using (auth.uid() = user_id);

-- Add is_fixed column to notebook_daily_tasks
alter table notebook_daily_tasks
  add column if not exists is_fixed boolean not null default false;
