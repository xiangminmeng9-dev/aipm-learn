-- RSS Sources table
CREATE TABLE IF NOT EXISTS rss_sources (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  url TEXT NOT NULL UNIQUE,
  category TEXT NOT NULL CHECK (category IN ('ai_tech', 'ai_pm')),
  language TEXT NOT NULL DEFAULT 'en' CHECK (language IN ('en', 'zh')),
  is_active BOOLEAN NOT NULL DEFAULT true,
  last_fetched_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- RSS Articles table
CREATE TABLE IF NOT EXISTS rss_articles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source_id UUID NOT NULL REFERENCES rss_sources(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  original_url TEXT NOT NULL,
  author TEXT,
  published_at TIMESTAMPTZ,
  content_raw TEXT,
  content_summary TEXT,
  plain_explanation TEXT,
  category TEXT NOT NULL CHECK (category IN ('ai_tech', 'ai_pm')),
  tags TEXT[] NOT NULL DEFAULT '{}',
  is_read BOOLEAN NOT NULL DEFAULT false,
  is_translated BOOLEAN NOT NULL DEFAULT false,
  fetched_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_rss_articles_category ON rss_articles(category);
CREATE INDEX IF NOT EXISTS idx_rss_articles_source_id ON rss_articles(source_id);
CREATE INDEX IF NOT EXISTS idx_rss_articles_published_at ON rss_articles(published_at DESC);
CREATE INDEX IF NOT EXISTS idx_rss_articles_tags ON rss_articles USING GIN(tags);
CREATE UNIQUE INDEX IF NOT EXISTS idx_rss_articles_url ON rss_articles(original_url);

-- RLS
ALTER TABLE rss_sources ENABLE ROW LEVEL SECURITY;
ALTER TABLE rss_articles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read rss_sources" ON rss_sources FOR SELECT USING (true);
CREATE POLICY "Anyone can read rss_articles" ON rss_articles FOR SELECT USING (true);
CREATE POLICY "Service role can manage rss_sources" ON rss_sources FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "Service role can manage rss_articles" ON rss_articles FOR ALL USING (auth.role() = 'service_role');

-- Seed RSS sources
INSERT INTO rss_sources (name, url, category, language) VALUES
  -- AI Tech
  ('OpenAI Blog', 'https://openai.com/blog/rss.xml', 'ai_tech', 'en'),
  ('Anthropic Blog', 'https://www.anthropic.com/feed.xml', 'ai_tech', 'en'),
  ('Google AI Blog', 'https://blog.google/technology/ai/rss/', 'ai_tech', 'en'),
  ('Hugging Face Blog', 'https://huggingface.co/blog/feed.xml', 'ai_tech', 'en'),
  ('TechCrunch AI', 'https://techcrunch.com/category/artificial-intelligence/feed/', 'ai_tech', 'en'),
  ('机器之心', 'https://www.jiqizhixin.com/rss', 'ai_tech', 'zh'),
  ('量子位', 'https://www.qbitai.com/feed', 'ai_tech', 'zh'),
  -- AI PM
  ('Lenny''s Newsletter', 'https://lennysnewsletter.com/feed', 'ai_pm', 'en'),
  ('Stratechery', 'https://stratechery.com/feed/', 'ai_pm', 'en'),
  ('SVPG', 'https://svpg.com/feed/', 'ai_pm', 'en'),
  ('36kr AI', 'https://36kr.com/feed', 'ai_pm', 'zh')
ON CONFLICT (url) DO NOTHING;
