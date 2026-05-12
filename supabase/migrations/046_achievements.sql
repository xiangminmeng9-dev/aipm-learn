-- 046: Achievement System
CREATE TABLE IF NOT EXISTS public.achievement_types (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  icon TEXT NOT NULL DEFAULT '🏆',
  category TEXT NOT NULL DEFAULT 'general',
  tier TEXT NOT NULL DEFAULT 'bronze' CHECK (tier IN ('bronze', 'silver', 'gold', 'platinum')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.achievement_types ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read achievements" ON public.achievement_types FOR SELECT USING (true);

CREATE TABLE IF NOT EXISTS public.user_achievements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  achievement_key TEXT NOT NULL REFERENCES achievement_types(key) ON DELETE CASCADE,
  unlocked_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, achievement_key)
);

ALTER TABLE public.user_achievements ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users read own achievements" ON public.user_achievements FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "System can insert achievements" ON public.user_achievements FOR INSERT WITH CHECK (true);
CREATE POLICY "Users delete own achievements" ON public.user_achievements FOR DELETE USING (auth.uid() = user_id);

-- Seed: 15 achievement types
INSERT INTO public.achievement_types (key, title, description, icon, category, tier) VALUES
('first_qa', '初次问答', '完成第一次面试问答分析', '🎤', 'practice', 'bronze'),
('qa_10', '勤学好问', '完成 10 次面试问答', '📚', 'practice', 'silver'),
('qa_50', '百炼成钢', '完成 50 次面试问答', '⚔️', 'practice', 'gold'),
('first_mock', '初试锋芒', '完成第一次模拟面试', '🎯', 'mock', 'bronze'),
('mock_5', '身经百战', '完成 5 次模拟面试', '🛡️', 'mock', 'silver'),
('streak_3', '三日坚持', '连续 3 天完成每日挑战', '🔥', 'daily', 'bronze'),
('streak_7', '七日之约', '连续 7 天完成每日挑战', '💪', 'daily', 'silver'),
('streak_30', '月度之星', '连续 30 天完成每日挑战', '⭐', 'daily', 'gold'),
('skill_25', '学有所成', '技能覆盖率达到 25%', '🌱', 'skills', 'bronze'),
('skill_50', '半壁江山', '技能覆盖率达到 50%', '🌿', 'skills', 'silver'),
('skill_75', '融会贯通', '技能覆盖率达到 75%', '🌳', 'skills', 'gold'),
('first_competitive', '初次较量', '完成第一次竞品分析', '🔍', 'analysis', 'bronze'),
('first_resume', '简历达人', '完成第一次简历优化', '📄', 'tools', 'bronze'),
('first_bookmark', '知识收藏家', '收藏第一道面试题', '⭐', 'practice', 'bronze'),
('community_vote', '社区贡献者', '在题库社区投出第一票', '🌐', 'community', 'bronze');
