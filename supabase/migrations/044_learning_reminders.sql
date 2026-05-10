-- ============================================================
-- 044_learning_reminders.sql
-- 学习提醒 — 用户设置每日学习时间和星期
-- ============================================================

CREATE TABLE IF NOT EXISTS public.learning_reminders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  reminder_time TEXT NOT NULL DEFAULT '20:00',
  enabled_days INTEGER[] DEFAULT '{1,2,3,4,5}',
  enabled BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.learning_reminders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own reminders" ON public.learning_reminders
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
