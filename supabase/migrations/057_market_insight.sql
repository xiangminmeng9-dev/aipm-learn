-- Market Insight: JD market intelligence feature
-- Tables for crawl jobs, crawled JDs, analysis snapshots, and analysis diffs

-- 1. Crawl job tracking
CREATE TABLE market_crawl_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  query_keyword TEXT NOT NULL,
  target_count INTEGER NOT NULL DEFAULT 1000,
  date_from DATE,
  date_to DATE,
  crawled_count INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'running', 'completed', 'failed')),
  error_message TEXT,
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_market_crawl_jobs_user ON market_crawl_jobs(user_id);
CREATE INDEX idx_market_crawl_jobs_status ON market_crawl_jobs(user_id, status);

-- 2. Individual crawled JDs
CREATE TABLE market_crawled_jds (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  crawl_job_id UUID NOT NULL REFERENCES market_crawl_jobs(id) ON DELETE CASCADE,
  source_url TEXT NOT NULL,
  source_platform TEXT NOT NULL DEFAULT 'zhipin',
  job_title TEXT,
  company_name TEXT,
  salary_range TEXT,
  location TEXT,
  jd_text TEXT NOT NULL,
  published_date DATE,
  extracted_skills JSONB NOT NULL DEFAULT '[]',
  is_analyzed BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_market_crawled_jds_user ON market_crawled_jds(user_id);
CREATE INDEX idx_market_crawled_jds_job ON market_crawled_jds(crawl_job_id);
CREATE INDEX idx_market_crawled_jds_url ON market_crawled_jds(user_id, source_url);
CREATE INDEX idx_market_crawled_jds_analyzed ON market_crawled_jds(user_id, is_analyzed);

-- 3. Analysis snapshots
CREATE TABLE market_analysis_snapshots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  query_keyword TEXT NOT NULL,
  jd_count INTEGER NOT NULL,
  date_range_start DATE,
  date_range_end DATE,
  skill_frequency JSONB NOT NULL DEFAULT '{}',
  category_distribution JSONB NOT NULL DEFAULT '{}',
  salary_distribution JSONB NOT NULL DEFAULT '{}',
  location_distribution JSONB NOT NULL DEFAULT '{}',
  company_distribution JSONB NOT NULL DEFAULT '{}',
  report JSONB NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_market_snapshots_user ON market_analysis_snapshots(user_id);
CREATE INDEX idx_market_snapshots_keyword ON market_analysis_snapshots(user_id, query_keyword);

-- 4. Analysis diffs (comparison between consecutive snapshots)
CREATE TABLE market_analysis_diffs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  query_keyword TEXT NOT NULL,
  previous_snapshot_id UUID REFERENCES market_analysis_snapshots(id) ON DELETE SET NULL,
  current_snapshot_id UUID NOT NULL REFERENCES market_analysis_snapshots(id) ON DELETE CASCADE,
  new_skills JSONB NOT NULL DEFAULT '[]',
  disappeared_skills JSONB NOT NULL DEFAULT '[]',
  frequency_changes JSONB NOT NULL DEFAULT '[]',
  category_shifts JSONB NOT NULL DEFAULT '[]',
  narrative TEXT,
  recommendations TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_market_diffs_user ON market_analysis_diffs(user_id);
CREATE INDEX idx_market_diffs_keyword ON market_analysis_diffs(user_id, query_keyword);

-- RLS policies
ALTER TABLE market_crawl_jobs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage own crawl jobs" ON market_crawl_jobs FOR ALL USING (auth.uid() = user_id);

ALTER TABLE market_crawled_jds ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage own crawled jds" ON market_crawled_jds FOR ALL USING (auth.uid() = user_id);

ALTER TABLE market_analysis_snapshots ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage own analysis snapshots" ON market_analysis_snapshots FOR ALL USING (auth.uid() = user_id);

ALTER TABLE market_analysis_diffs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage own analysis diffs" ON market_analysis_diffs FOR ALL USING (auth.uid() = user_id);
