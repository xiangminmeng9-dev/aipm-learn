-- Boss 1V1 模拟场景
CREATE TABLE IF NOT EXISTS public.boss_1v1_sessions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  boss_type TEXT NOT NULL,
  scenario_id TEXT NOT NULL,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'completed')),
  score INTEGER,
  feedback JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.boss_1v1_sessions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can manage own boss sessions" ON public.boss_1v1_sessions;
CREATE POLICY "Users can manage own boss sessions" ON public.boss_1v1_sessions
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_boss_sessions_user ON public.boss_1v1_sessions(user_id, created_at DESC);

CREATE TABLE IF NOT EXISTS public.boss_1v1_messages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id UUID NOT NULL REFERENCES public.boss_1v1_sessions(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.boss_1v1_messages ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can manage own boss messages" ON public.boss_1v1_messages;
CREATE POLICY "Users can manage own boss messages" ON public.boss_1v1_messages
  FOR ALL USING (session_id IN (SELECT id FROM boss_1v1_sessions WHERE user_id = auth.uid()))
  WITH CHECK (session_id IN (SELECT id FROM boss_1v1_sessions WHERE user_id = auth.uid()));

CREATE INDEX IF NOT EXISTS idx_boss_messages_session ON public.boss_1v1_messages(session_id, created_at ASC);
