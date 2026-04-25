-- External learning resources added by user (with folder support)
create table if not exists external_resources (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  parent_id uuid references external_resources(id) on delete cascade,
  title text not null,
  url text not null default '',
  type text not null default 'link' check (type in ('link', 'video', 'doc', 'folder')),
  source text not null default '',
  notes text,
  related_module_id uuid,
  related_module_name text,
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);

create index if not exists idx_external_resources_user on external_resources(user_id);
create index if not exists idx_external_resources_parent on external_resources(parent_id) where parent_id is not null;

alter table external_resources enable row level security;

create policy "Users can manage own external_resources"
  on external_resources for all
  using (auth.uid() = user_id);
