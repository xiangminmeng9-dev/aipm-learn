-- ============================================================
-- Combined migration: all tables + seed data
-- ============================================================

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- ============================================================
-- 001: Initial Schema
-- ============================================================

create table question_types (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  description text,
  is_seed boolean not null default false,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now()
);

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

create table trending_questions (
  id uuid primary key default gen_random_uuid(),
  text text not null,
  type_id uuid references question_types(id) on delete set null,
  rank integer not null,
  source text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table type_skill_mappings (
  id uuid primary key default gen_random_uuid(),
  type_id uuid not null references question_types(id) on delete cascade,
  skill_module_id uuid not null,
  recommended_tasks jsonb default '[]',
  created_at timestamptz not null default now(),
  unique (type_id, skill_module_id)
);

-- RLS for 001
alter table chat_sessions enable row level security;
create policy "Users can manage own sessions" on chat_sessions for all using (auth.uid() = user_id);

alter table chat_messages enable row level security;
create policy "Users can manage own messages" on chat_messages for all using (session_id in (select id from chat_sessions where user_id = auth.uid()));

alter table interview_questions enable row level security;
create policy "Users can view own and public questions" on interview_questions for select using (user_id = auth.uid() or user_id is null);
create policy "Users can insert own questions" on interview_questions for insert with check (user_id = auth.uid());

alter table question_analyses enable row level security;
create policy "Users can manage own analyses" on question_analyses for all using (user_id = auth.uid());

alter table mock_interviews enable row level security;
create policy "Users can manage own mocks" on mock_interviews for all using (user_id = auth.uid());

alter table interview_answers enable row level security;
create policy "Users can manage own answers" on interview_answers for all using (mock_interview_id in (select id from mock_interviews where user_id = auth.uid()));

alter table interview_methodologies enable row level security;
create policy "Users can manage own methodologies" on interview_methodologies for all using (user_id = auth.uid());

alter table question_types enable row level security;
create policy "Authenticated users can read types" on question_types for select using (auth.role() = 'authenticated');
create policy "Authenticated users can insert types" on question_types for insert with check (auth.role() = 'authenticated');

alter table trending_questions enable row level security;
create policy "Authenticated users can read trending" on trending_questions for select using (auth.role() = 'authenticated');

alter table type_skill_mappings enable row level security;
create policy "Authenticated users can read mappings" on type_skill_mappings for select using (auth.role() = 'authenticated');

-- ============================================================
-- Seed question_types (missing from original migrations!)
-- ============================================================
insert into question_types (name, description, is_seed) values
  ('产品设计类', 'AI 产品设计、功能规划、用户体验相关问题', true),
  ('数据指标类', '数据分析、指标体系、AB测试相关问题', true),
  ('AI 工具使用类', 'AI 工具选型、使用技巧、适用场景相关问题', true),
  ('对 AI 看法/趋势类', 'AI 行业趋势、技术发展、未来展望相关问题', true),
  ('AI 效果评估类', 'AI 模型评测、质量评估、效果衡量相关问题', true),
  ('场景分析类', '业务场景拆解、问题诊断、解决方案相关问题', true),
  ('竞品分析类', '竞品调研、差异化分析、市场定位相关问题', true),
  ('需求分析类', '用户需求挖掘、需求优先级、真伪需求判断相关问题', true),
  ('平衡/权衡类', '多目标权衡、决策框架、风险评估相关问题', true),
  ('开放性问题', '创新思维、深度思考、个人见解相关问题', true),
  ('行为面试类', 'STAR 框架、个人经历、团队协作相关问题', true),
  ('系统设计类', '系统架构、技术方案、流程设计相关问题', true),
  ('商业化/ROI 类', '商业模式、投资回报、成本分析相关问题', true),
  ('AI 伦理与安全类', 'AI 伦理、安全合规、隐私保护相关问题', true),
  ('用户增长类', '用户增长策略、留存优化、渠道管理相关问题', true);

-- ============================================================
-- 004: Coding and Skills tables
-- ============================================================

create table dev_modes (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  description text not null,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

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

-- RLS for 004
alter table dev_modes enable row level security;
create policy "Authenticated users can read dev_modes" on dev_modes for select using (auth.role() = 'authenticated');

alter table dev_flows enable row level security;
create policy "Users can manage own dev_flows" on dev_flows for all using (auth.uid() = user_id);

alter table coding_methodologies enable row level security;
create policy "Users can manage own coding_methodologies" on coding_methodologies for all using (auth.uid() = user_id);

alter table skill_modules enable row level security;
create policy "Authenticated users can read skill_modules" on skill_modules for select using (auth.role() = 'authenticated');

alter table learning_tasks enable row level security;
create policy "Authenticated users can read learning_tasks" on learning_tasks for select using (auth.role() = 'authenticated');

alter table learning_progress enable row level security;
create policy "Users can manage own learning_progress" on learning_progress for all using (auth.uid() = user_id);

alter table trend_briefs enable row level security;
create policy "Authenticated users can read trend_briefs" on trend_briefs for select using (auth.role() = 'authenticated');

alter table trend_progress enable row level security;
create policy "Users can manage own trend_progress" on trend_progress for all using (auth.uid() = user_id);
