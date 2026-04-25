-- Daily tech bookmarks table
CREATE TABLE IF NOT EXISTS daily_tech_bookmarks (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  tech_date DATE NOT NULL,
  title TEXT NOT NULL,
  summary TEXT,
  explanation TEXT,
  impact TEXT,
  tags TEXT[] DEFAULT '{}',
  source_url TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, tech_date)
);

ALTER TABLE daily_tech_bookmarks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own bookmarks" ON daily_tech_bookmarks
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own bookmarks" ON daily_tech_bookmarks
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own bookmarks" ON daily_tech_bookmarks
  FOR DELETE USING (auth.uid() = user_id);

-- Daily tech cache table (one tech per day)
CREATE TABLE IF NOT EXISTS daily_tech_cache (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  date DATE NOT NULL UNIQUE,
  title TEXT NOT NULL,
  summary TEXT,
  explanation TEXT,
  impact TEXT,
  tags TEXT[] DEFAULT '{}',
  source_url TEXT,
  source_name TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE daily_tech_cache ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read tech cache" ON daily_tech_cache
  FOR SELECT USING (true);
