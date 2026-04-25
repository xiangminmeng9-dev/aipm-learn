-- ============================================================
-- 023_user_ai_configs.sql
-- 用户自定义 AI 模型配置（支持 Anthropic 协议 + OpenAI 协议）
-- ============================================================

create table user_ai_configs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade unique,
  protocol text not null default 'anthropic' check (protocol in ('anthropic', 'openai')),
  base_url text not null default '',
  api_key text not null default '',
  model text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_user_ai_configs_user on user_ai_configs(user_id);

alter table user_ai_configs enable row level security;
create policy "Users can manage own ai configs" on user_ai_configs
  for all using (auth.uid() = user_id);

create or replace function update_user_ai_configs_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger tr_user_ai_configs_updated_at
before update on user_ai_configs
for each row
execute function update_user_ai_configs_updated_at();
