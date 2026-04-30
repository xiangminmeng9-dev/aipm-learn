-- Fix RLS policies that use "for all using" without "with check"
-- This causes INSERT to silently fail because PostgreSQL doesn't
-- implicitly apply the USING clause as WITH CHECK for INSERT.

-- question_analyses: drop old policy, recreate with explicit WITH CHECK
DROP POLICY IF EXISTS "Users can manage own analyses" ON question_analyses;
CREATE POLICY "Users can manage own analyses" ON question_analyses
  FOR ALL USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

-- mock_interviews: same fix
DROP POLICY IF EXISTS "p6" ON mock_interviews;
CREATE POLICY "Users can manage own mock interviews" ON mock_interviews
  FOR ALL USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

-- interview_answers: check and fix if needed
DROP POLICY IF EXISTS "Users can manage own answers" ON interview_answers;
CREATE POLICY "Users can manage own answers" ON interview_answers
  FOR ALL USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

-- interview_methodologies: same
DROP POLICY IF EXISTS "Users can manage own methodologies" ON interview_methodologies;
CREATE POLICY "Users can manage own methodologies" ON interview_methodologies
  FOR ALL USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

-- chat_sessions
DROP POLICY IF EXISTS "Users can manage own sessions" ON chat_sessions;
CREATE POLICY "Users can manage own sessions" ON chat_sessions
  FOR ALL USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

-- chat_messages
DROP POLICY IF EXISTS "Users can manage own messages" ON chat_messages;
CREATE POLICY "Users can manage own messages" ON chat_messages
  FOR ALL USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
