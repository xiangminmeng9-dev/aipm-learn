-- ============================================================
-- 025_simulator_projects.sql
-- 项目实战沙盒
-- ============================================================

create table simulator_projects (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  scenario_id text not null,
  title text not null,
  deliverables jsonb not null default '[]',
  status text not null default 'in_progress' check (status in ('in_progress', 'completed', 'abandoned')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_simulator_projects_user on simulator_projects(user_id);

alter table simulator_projects enable row level security;
create policy "Users can manage own projects" on simulator_projects
  for all using (auth.uid() = user_id);

create table simulator_project_messages (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references simulator_projects(id) on delete cascade,
  role text not null check (role in ('user', 'assistant')),
  content text not null,
  created_at timestamptz not null default now()
);

create index idx_simulator_project_messages_project on simulator_project_messages(project_id);

alter table simulator_project_messages enable row level security;
create policy "Users can manage own project messages" on simulator_project_messages
  for all using (
    project_id in (select id from simulator_projects where user_id = auth.uid())
  );

create or replace function update_simulator_projects_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger tr_simulator_projects_updated_at
before update on simulator_projects
for each row
execute function update_simulator_projects_updated_at();
