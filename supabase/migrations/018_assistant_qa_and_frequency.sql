-- ============================================================
-- 018_assistant_qa_and_frequency.sql
-- 面试助手 Q&A 记录 + 问题频率标签
-- ============================================================

-- 1. 面试助手 Q&A 记录表
create table assistant_qa_records (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  question text not null,
  category text,
  answer text not null,
  resume_text text,
  jd_text text,
  evaluation jsonb,
  created_at timestamptz not null default now()
);

create index idx_assistant_qa_records_user on assistant_qa_records(user_id);
create index idx_assistant_qa_records_user_time on assistant_qa_records(user_id, created_at desc);

-- RLS
alter table assistant_qa_records enable row level security;
create policy "Users can manage own qa records" on assistant_qa_records
  for all using (auth.uid() = user_id);

-- 2. 给 interview_questions 添加频率字段
alter table interview_questions add column if not exists frequency text check (frequency in ('高频', '中频', '低频'));

-- 3. 给 trending_questions 添加频率字段
alter table trending_questions add column if not exists frequency text check (frequency in ('高频', '中频', '低频'));
