-- ============================================================
-- 024_daily_challenge.sql
-- 每日挑战 + 知识闪卡
-- ============================================================

-- 每日挑战题目
create table daily_challenges (
  id uuid primary key default gen_random_uuid(),
  date date not null unique,
  question text not null,
  category text not null default 'general',
  difficulty text not null default 'medium' check (difficulty in ('easy', 'medium', 'hard')),
  hint text not null default '',
  perfect_answer text not null default '',
  scoring_rubric jsonb not null default '[]',
  created_at timestamptz not null default now()
);

create index idx_daily_challenges_date on daily_challenges(date);

alter table daily_challenges enable row level security;
create policy "Anyone can read challenges" on daily_challenges for select using (true);

-- 用户提交记录
create table daily_challenge_submissions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  challenge_id uuid not null references daily_challenges(id) on delete cascade,
  answer text not null,
  score integer not null default 0,
  feedback text not null default '',
  time_spent integer not null default 0,
  submitted_at timestamptz not null default now(),
  unique(user_id, challenge_id)
);

create index idx_daily_submissions_user on daily_challenge_submissions(user_id);

alter table daily_challenge_submissions enable row level security;
create policy "Users can manage own submissions" on daily_challenge_submissions
  for all using (auth.uid() = user_id);

-- 知识闪卡
create table flashcards (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  front text not null,
  back text not null,
  category text not null default 'general',
  next_review timestamptz not null default now(),
  interval_days integer not null default 1,
  ease_factor real not null default 2.5,
  repetitions integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_flashcards_user on flashcards(user_id);
create index idx_flashcards_review on flashcards(user_id, next_review);

alter table flashcards enable row level security;
create policy "Users can manage own flashcards" on flashcards
  for all using (auth.uid() = user_id);

-- 闪卡复习记录
create table flashcard_reviews (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  card_id uuid not null references flashcards(id) on delete cascade,
  rating integer not null check (rating between 1 and 5),
  reviewed_at timestamptz not null default now()
);

create index idx_flashcard_reviews_user on flashcard_reviews(user_id);

alter table flashcard_reviews enable row level security;
create policy "Users can manage own reviews" on flashcard_reviews
  for all using (auth.uid() = user_id);

-- 自动更新 updated_at
create or replace function update_flashcards_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger tr_flashcards_updated_at
before update on flashcards
for each row
execute function update_flashcards_updated_at();
