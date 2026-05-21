-- ============================================================
-- 037_fix_open_rls_policies.sql
-- Restrict INSERT/DELETE/UPDATE on public-cache and achievement
-- tables to service_role only (not any authenticated user).
-- ============================================================

-- daily_ai_news: restrict write ops to service_role
DROP POLICY IF EXISTS "Server can insert articles" ON daily_ai_news_articles;
CREATE POLICY "Service can insert articles" ON daily_ai_news_articles FOR INSERT WITH CHECK (auth.role() = 'service_role');

DROP POLICY IF EXISTS "Server can delete articles" ON daily_ai_news_articles;
CREATE POLICY "Service can delete articles" ON daily_ai_news_articles FOR DELETE USING (auth.role() = 'service_role');

DROP POLICY IF EXISTS "Server can insert digests" ON daily_ai_news_digests;
CREATE POLICY "Service can insert digests" ON daily_ai_news_digests FOR INSERT WITH CHECK (auth.role() = 'service_role');

DROP POLICY IF EXISTS "Server can delete digests" ON daily_ai_news_digests;
CREATE POLICY "Service can delete digests" ON daily_ai_news_digests FOR DELETE USING (auth.role() = 'service_role');

DROP POLICY IF EXISTS "Server can update digests" ON daily_ai_news_digests;
CREATE POLICY "Service can update digests" ON daily_ai_news_digests FOR UPDATE USING (auth.role() = 'service_role');

-- user_achievements: restrict INSERT to service_role only
DROP POLICY IF EXISTS "System can insert achievements" ON user_achievements;
CREATE POLICY "Service can insert achievements" ON user_achievements FOR INSERT WITH CHECK (auth.role() = 'service_role');
