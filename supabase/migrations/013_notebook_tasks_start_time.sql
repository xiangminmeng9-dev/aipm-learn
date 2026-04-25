-- Add start_time column to notebook_daily_tasks
alter table notebook_daily_tasks add column if not exists start_time text not null default '';
