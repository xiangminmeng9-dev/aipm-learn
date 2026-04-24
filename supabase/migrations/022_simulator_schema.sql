-- ============================================================
-- 022_simulator_schema.sql
-- AI PM 模拟工作流程的表结构
-- ============================================================

-- 1. simulator_sessions: 追踪用户的模拟工作流进度
create table simulator_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  current_stage_id text not null,
  stage_scores jsonb not null default '{}'::jsonb,
  status text not null default 'in_progress' check (status in ('in_progress', 'completed')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_simulator_sessions_user on simulator_sessions(user_id);

-- 2. simulator_messages: 记录各个阶段的互动聊天
create table simulator_messages (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references simulator_sessions(id) on delete cascade,
  stage_id text not null,
  role text not null check (role in ('user', 'assistant', 'system')),
  content text not null,
  created_at timestamptz not null default now()
);

create index idx_simulator_messages_session on simulator_messages(session_id);

-- 3. RLS 策略
alter table simulator_sessions enable row level security;
create policy "Users can manage own simulator_sessions" on simulator_sessions
  for all using (auth.uid() = user_id);

alter table simulator_messages enable row level security;
-- 联表检查，只有 user_id 匹配 session 的 owner 才能访问
create policy "Users can manage own simulator_messages" on simulator_messages
  for all using (
    exists (
      select 1 from simulator_sessions
      where simulator_sessions.id = simulator_messages.session_id
      and simulator_sessions.user_id = auth.uid()
    )
  );

-- 自动更新 updated_at
create or replace function update_simulator_sessions_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger tr_simulator_sessions_updated_at
before update on simulator_sessions
for each row
execute function update_simulator_sessions_updated_at();
