-- ============================================================
-- 036_fix_chat_messages_interview_answers_rls.sql
-- Fix: 035 used user_id = auth.uid() but chat_messages and
-- interview_answers don't have a user_id column. Use subqueries.
-- ============================================================

-- chat_messages: fix policy to use subquery (no user_id column)
DROP POLICY IF EXISTS "Users can manage own messages" ON chat_messages;
CREATE POLICY "Users can manage own messages" ON chat_messages
  FOR ALL
  USING (session_id IN (SELECT id FROM chat_sessions WHERE user_id = auth.uid()))
  WITH CHECK (session_id IN (SELECT id FROM chat_sessions WHERE user_id = auth.uid()));

-- interview_answers: fix policy to use subquery (no user_id column)
DROP POLICY IF EXISTS "Users can manage own answers" ON interview_answers;
CREATE POLICY "Users can manage own answers" ON interview_answers
  FOR ALL
  USING (mock_interview_id IN (SELECT id FROM mock_interviews WHERE user_id = auth.uid()))
  WITH CHECK (mock_interview_id IN (SELECT id FROM mock_interviews WHERE user_id = auth.uid()));
