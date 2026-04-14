-- ============================================================
-- 001_initial_schema.sql
-- AI 产品经理面试助手 — 初始数据库架构
-- ============================================================

-- 启用 UUID 扩展
create extension if not exists "uuid-ossp";

-- -----------------------------------------------------------
-- 1. question_types（问题类型 — 动态扩展）
-- -----------------------------------------------------------
create table question_types (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  description text,
  is_seed boolean not null default false,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now()
);

-- -----------------------------------------------------------
-- 2. chat_sessions（对话 Session）
-- -----------------------------------------------------------
create table chat_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null default '新对话',
  jd_text text,
  resume_text text,
  compressed_summary text,
  total_tokens integer not null default 0,
  is_compressed boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_chat_sessions_user on chat_sessions(user_id);

-- -----------------------------------------------------------
-- 3. chat_messages（对话消息）
-- -----------------------------------------------------------
create table chat_messages (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references chat_sessions(id) on delete cascade,
  role text not null check (role in ('user', 'assistant')),
  content text not null,
  is_compressed boolean not null default false,
  token_count integer not null default 0,
  created_at timestamptz not null default now()
);

create index idx_chat_messages_session_time on chat_messages(session_id, created_at);

-- -----------------------------------------------------------
-- 4. interview_questions（面试问题）
-- -----------------------------------------------------------
create table interview_questions (
  id uuid primary key default gen_random_uuid(),
  text text not null,
  type_id uuid references question_types(id) on delete set null,
  source text not null check (source in ('user_input', 'trending', 'mock_generated')),
  user_id uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now()
);

create index idx_interview_questions_user on interview_questions(user_id);
create index idx_interview_questions_type on interview_questions(type_id);

-- -----------------------------------------------------------
-- 5. question_analyses（问题分析）
-- -----------------------------------------------------------
create table question_analyses (
  id uuid primary key default gen_random_uuid(),
  question_id uuid not null references interview_questions(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  analysis text not null,
  thinking_framework text not null,
  answer_approach text not null,
  answer_template text not null,
  created_at timestamptz not null default now()
);

create index idx_question_analyses_user on question_analyses(user_id);

-- -----------------------------------------------------------
-- 6. mock_interviews（模拟面试）
-- -----------------------------------------------------------
create table mock_interviews (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  type_id uuid not null references question_types(id) on delete restrict,
  total_questions integer not null check (total_questions in (3, 5, 8, 10)),
  current_question integer not null default 0,
  jd_text text,
  resume_text text,
  status text not null default 'in_progress' check (status in ('in_progress', 'completed', 'abandoned')),
  total_score numeric(4,1),
  summary_strengths text,
  summary_weaknesses text,
  summary_suggestions text,
  weak_skill_modules jsonb,
  created_at timestamptz not null default now(),
  completed_at timestamptz
);

create index idx_mock_interviews_user on mock_interviews(user_id);

-- -----------------------------------------------------------
-- 7. interview_answers（面试作答）
-- -----------------------------------------------------------
create table interview_answers (
  id uuid primary key default gen_random_uuid(),
  mock_interview_id uuid not null references mock_interviews(id) on delete cascade,
  question_number integer not null,
  question_text text not null,
  question_type_id uuid references question_types(id) on delete set null,
  user_answer text,
  score numeric(3,1) check (score >= 0 and score <= 10),
  gap_analysis text,
  perfect_answer text,
  is_skipped boolean not null default false,
  created_at timestamptz not null default now(),
  answered_at timestamptz
);

create index idx_interview_answers_mock on interview_answers(mock_interview_id);

-- -----------------------------------------------------------
-- 8. interview_methodologies（面试方法论）
-- -----------------------------------------------------------
create table interview_methodologies (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  type_id uuid not null references question_types(id) on delete cascade,
  framework text not null,
  key_steps jsonb not null default '[]',
  typical_cases jsonb not null default '[]',
  source_count integer not null default 1,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, type_id)
);

-- -----------------------------------------------------------
-- 9. trending_questions（热门问题）
-- -----------------------------------------------------------
create table trending_questions (
  id uuid primary key default gen_random_uuid(),
  text text not null,
  type_id uuid references question_types(id) on delete set null,
  rank integer not null,
  source text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- -----------------------------------------------------------
-- 10. type_skill_mappings（问题类型→技能模块映射）
-- -----------------------------------------------------------
create table type_skill_mappings (
  id uuid primary key default gen_random_uuid(),
  type_id uuid not null references question_types(id) on delete cascade,
  skill_module_id uuid not null,
  recommended_tasks jsonb default '[]',
  created_at timestamptz not null default now(),
  unique (type_id, skill_module_id)
);

-- -----------------------------------------------------------
-- RLS 策略
-- -----------------------------------------------------------

-- chat_sessions: 用户只能访问自己的
alter table chat_sessions enable row level security;
create policy "Users can manage own sessions" on chat_sessions
  for all using (auth.uid() = user_id);

-- chat_messages: 通过 session 关联控制
alter table chat_messages enable row level security;
create policy "Users can manage own messages" on chat_messages
  for all using (
    session_id in (select id from chat_sessions where user_id = auth.uid())
  );

-- interview_questions: 用户可查看自己的和公共的（trending）
alter table interview_questions enable row level security;
create policy "Users can view own and public questions" on interview_questions
  for select using (user_id = auth.uid() or user_id is null);
create policy "Users can insert own questions" on interview_questions
  for insert with check (user_id = auth.uid());

-- question_analyses: 用户只能访问自己的
alter table question_analyses enable row level security;
create policy "Users can manage own analyses" on question_analyses
  for all using (user_id = auth.uid());

-- mock_interviews: 用户只能访问自己的
alter table mock_interviews enable row level security;
create policy "Users can manage own mocks" on mock_interviews
  for all using (user_id = auth.uid());

-- interview_answers: 通过 mock_interview 关联控制
alter table interview_answers enable row level security;
create policy "Users can manage own answers" on interview_answers
  for all using (
    mock_interview_id in (select id from mock_interviews where user_id = auth.uid())
  );

-- interview_methodologies: 用户只能访问自己的
alter table interview_methodologies enable row level security;
create policy "Users can manage own methodologies" on interview_methodologies
  for all using (user_id = auth.uid());

-- question_types: 所有认证用户可读，可插入
alter table question_types enable row level security;
create policy "Authenticated users can read types" on question_types
  for select using (auth.role() = 'authenticated');
create policy "Authenticated users can insert types" on question_types
  for insert with check (auth.role() = 'authenticated');

-- trending_questions: 所有认证用户可读
alter table trending_questions enable row level security;
create policy "Authenticated users can read trending" on trending_questions
  for select using (auth.role() = 'authenticated');

-- type_skill_mappings: 所有认证用户可读
alter table type_skill_mappings enable row level security;
create policy "Authenticated users can read mappings" on type_skill_mappings
  for select using (auth.role() = 'authenticated');
