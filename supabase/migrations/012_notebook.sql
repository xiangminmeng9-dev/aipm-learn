-- ============================================================
-- 012: AI PM Notebook - notes and daily tasks
-- ============================================================

-- Notes table
create table if not exists notebook_notes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  content text not null default '',
  category text not null default 'general' check (category in ('problem', 'insight', 'meeting', 'general')),
  tags jsonb not null default '[]',
  pinned boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Daily tasks table
create table if not exists notebook_daily_tasks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  date date not null default current_date,
  title text not null,
  description text not null default '',
  duration text not null default '',
  status text not null default 'todo' check (status in ('todo', 'in_progress', 'done')),
  sort_order integer not null default 0,
  from_template boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, date, title)
);

-- Indexes
create index if not exists idx_notebook_notes_user on notebook_notes(user_id);
create index if not exists idx_notebook_notes_category on notebook_notes(user_id, category);
create index if not exists idx_notebook_notes_pinned on notebook_notes(user_id, pinned) where pinned = true;
create index if not exists idx_notebook_tasks_user_date on notebook_daily_tasks(user_id, date);

-- RLS
alter table notebook_notes enable row level security;
alter table notebook_daily_tasks enable row level security;

create policy "Users can read own notes" on notebook_notes for select using (auth.uid() = user_id);
create policy "Users can insert own notes" on notebook_notes for insert with check (auth.uid() = user_id);
create policy "Users can update own notes" on notebook_notes for update using (auth.uid() = user_id);
create policy "Users can delete own notes" on notebook_notes for delete using (auth.uid() = user_id);

create policy "Users can read own tasks" on notebook_daily_tasks for select using (auth.uid() = user_id);
create policy "Users can insert own tasks" on notebook_daily_tasks for insert with check (auth.uid() = user_id);
create policy "Users can update own tasks" on notebook_daily_tasks for update using (auth.uid() = user_id);
create policy "Users can delete own tasks" on notebook_daily_tasks for delete using (auth.uid() = user_id);

-- Auto-update updated_at
create or replace function update_notebook_notes_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger trg_notebook_notes_updated_at
  before update on notebook_notes
  for each row execute function update_notebook_notes_updated_at();

create or replace function update_notebook_tasks_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger trg_notebook_tasks_updated_at
  before update on notebook_daily_tasks
  for each row execute function update_notebook_tasks_updated_at();
