export const AI_NEWS_RSS_FEEDS = [
  // ─── 中文媒体（原有保留） ───
  { url: 'https://36kr.com/feed', source: '36氪', category: 'tech', lang: 'zh' },
  { url: 'https://www.jiqizhixin.com/rss', source: '机器之心', category: 'ai', lang: 'zh' },
  { url: 'https://www.qbitai.com/feed', source: '量子位', category: 'ai', lang: 'zh' },
  { url: 'https://www.woshipm.com/feed', source: '人人都是产品经理', category: 'pm', lang: 'zh' },
  { url: 'https://www.infoq.cn/rss', source: 'InfoQ 中文', category: 'tech', lang: 'zh' },
  { url: 'https://sspai.com/feed', source: '少数派', category: 'tech', lang: 'zh' },

  // ─── 中文媒体（新增） ───
  { url: 'https://www.huxiu.com/rss', source: '虎嗅', category: 'tech', lang: 'zh' },

  // ─── 国际官方厂商 ───
  { url: 'https://openai.com/news/rss.xml', source: 'OpenAI News', category: 'ai', lang: 'en' },
  { url: 'https://deepmind.google/blog/rss.xml', source: 'Google DeepMind', category: 'ai', lang: 'en' },
  { url: 'https://blog.google/technology/ai/rss/', source: 'Google AI Blog', category: 'ai', lang: 'en' },
  { url: 'https://huggingface.co/blog/feed.xml', source: 'Hugging Face', category: 'ai', lang: 'en' },
  { url: 'https://github.blog/feed/', source: 'GitHub Blog', category: 'tech', lang: 'en' },

  // ─── 国际聚合/分析（覆盖 Anthropic、Mistral 等无 RSS 的厂商） ───
  { url: 'https://lastweekin.ai/feed.xml', source: 'Last Week in AI', category: 'ai', lang: 'en' },
  { url: 'https://simonwillison.net/atom/everything/', source: "Simon Willison", category: 'analysis', lang: 'en' },
  { url: 'https://bair.berkeley.edu/blog/feed.xml', source: 'BAIR Blog', category: 'research', lang: 'en' },
];

export interface RawNewsArticle {
  title: string;
  url: string;
  source: string;
  description: string;
  published_at: string;
  category?: string;
  lang?: string;
}
