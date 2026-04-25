-- Daily AI News: cached articles and AI-generated digests
-- Follows the same public-cache pattern as resume_jobs

CREATE TABLE IF NOT EXISTS public.daily_ai_news_articles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  news_date DATE NOT NULL,
  source TEXT NOT NULL DEFAULT '',
  title TEXT NOT NULL,
  url TEXT NOT NULL DEFAULT '',
  summary TEXT,
  published_at TIMESTAMPTZ,
  fetched_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.daily_ai_news_digests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  news_date DATE NOT NULL UNIQUE,
  digest TEXT NOT NULL,
  article_count INT NOT NULL DEFAULT 0,
  generated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- RLS: globally readable (public cache like resume_jobs)
ALTER TABLE public.daily_ai_news_articles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.daily_ai_news_digests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read ai news articles" ON public.daily_ai_news_articles
  FOR SELECT USING (true);

CREATE POLICY "Anyone can read ai news digests" ON public.daily_ai_news_digests
  FOR SELECT USING (true);

CREATE POLICY "Server can insert articles" ON public.daily_ai_news_articles
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Server can delete articles" ON public.daily_ai_news_articles
  FOR DELETE USING (true);

CREATE POLICY "Server can insert digests" ON public.daily_ai_news_digests
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Server can delete digests" ON public.daily_ai_news_digests
  FOR DELETE USING (true);

CREATE POLICY "Server can update digests" ON public.daily_ai_news_digests
  FOR UPDATE USING (true);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_daily_news_date ON public.daily_ai_news_articles(news_date DESC, published_at DESC);
CREATE INDEX IF NOT EXISTS idx_daily_news_fetched ON public.daily_ai_news_articles(fetched_at DESC);
CREATE INDEX IF NOT EXISTS idx_daily_digest_date ON public.daily_ai_news_digests(news_date DESC);
