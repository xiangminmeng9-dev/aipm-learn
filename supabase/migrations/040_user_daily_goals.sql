-- User daily goals for progress tracking
CREATE TABLE IF NOT EXISTS public.user_daily_goals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  daily_minutes_target INTEGER DEFAULT 30,
  weekly_sessions_target INTEGER DEFAULT 5,
  monthly_score_target INTEGER DEFAULT 75,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.user_daily_goals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own goals" ON public.user_daily_goals
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
