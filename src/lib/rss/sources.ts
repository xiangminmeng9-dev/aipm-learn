// AI Tech: engineering-focused RSS feeds (RAG, Agent, LLM architecture, frontier tech)
// AI PM: product management focused feeds

export interface RssSourceConfig {
  name: string;
  url: string;
  category: 'ai_tech' | 'ai_pm';
  language: 'en' | 'zh';
}

export const RSS_SOURCES: RssSourceConfig[] = [
  // ── AI Tech: 技术路线、RAG/Agent 实现、前沿技术 ──
  { name: 'OpenAI Blog', url: 'https://openai.com/blog/rss.xml', category: 'ai_tech', language: 'en' },
  { name: 'Hugging Face Blog', url: 'https://huggingface.co/blog/feed.xml', category: 'ai_tech', language: 'en' },
  { name: 'Lilian Weng', url: 'https://lilianweng.github.io/index.xml', category: 'ai_tech', language: 'en' },
  { name: 'Simon Willison', url: 'https://simonwillison.net/atom/everything', category: 'ai_tech', language: 'en' },
  { name: 'Drew Breunig', url: 'https://www.dbreunig.com/feed.xml', category: 'ai_tech', language: 'en' },
  { name: 'The Decoder', url: 'https://the-decoder.com/feed/', category: 'ai_tech', language: 'en' },
  { name: "Ben's Bites", url: 'https://bensbites.com/feed', category: 'ai_tech', language: 'en' },
  { name: 'Google AI Blog', url: 'https://blog.google/innovation-and-ai/technology/ai/rss/', category: 'ai_tech', language: 'en' },

  // ── AI PM: 产品经理技术文章 ──
  { name: '人人都是产品经理', url: 'https://www.woshipm.com/feed', category: 'ai_pm', language: 'zh' },
  { name: '36氪', url: 'https://36kr.com/feed', category: 'ai_pm', language: 'zh' },
  { name: '机器之心', url: 'https://www.jiqizhixin.com/rss', category: 'ai_pm', language: 'zh' },
  { name: 'TechCrunch AI', url: 'https://techcrunch.com/category/artificial-intelligence/feed/', category: 'ai_pm', language: 'en' },
];

export function getSourcesForCategory(category: 'ai_tech' | 'ai_pm'): RssSourceConfig[] {
  return RSS_SOURCES.filter((s) => s.category === category);
}