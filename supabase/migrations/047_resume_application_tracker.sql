-- ============================================================
-- 047_resume_application_tracker.sql
-- 简历仓库 + 投递记录 + 投递看板 数据表
-- ============================================================

-- 1. 简历仓库
create table resume_repository (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  company_name text not null,
  position_name text not null,
  jd_text text not null default '',
  jd_link text,
  file_name text,
  file_url text,
  resume_text text not null,
  resume_version_id uuid references resume_versions(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index idx_resume_repository_user on resume_repository(user_id, created_at desc);
alter table resume_repository enable row level security;
create policy "Users manage own resume_repository" on resume_repository
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- 2. 投递记录
create table resume_applications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  company_name text not null,
  position_name text not null,
  channel text not null default '官网'
    check (channel in ('BOSS', '猎头', '官网', '内推', '脉脉', '其他')),
  status text not null default '已投递'
    check (status in ('已投递', '简历筛选', '初面', '二面', '终面', '已发offer', '已接受', '已拒绝')),
  applied_at date not null default current_date,
  notes text,
  city text,
  position_category text,
  resume_version_id uuid references resume_versions(id) on delete set null,
  status_history jsonb not null default '[]',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index idx_resume_applications_user on resume_applications(user_id, applied_at desc);
create index idx_resume_applications_company on resume_applications(user_id, company_name);
create index idx_resume_applications_status on resume_applications(user_id, status);
alter table resume_applications enable row level security;
create policy "Users manage own resume_applications" on resume_applications
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
