export const AI_NEWS_RSS_FEEDS = [
  { url: 'https://36kr.com/feed', source: '36氪', category: 'tech' },
  { url: 'https://www.jiqizhixin.com/rss', source: '机器之心', category: 'ai' },
  { url: 'https://www.qbitai.com/feed', source: '量子位', category: 'ai' },
  { url: 'https://www.woshipm.com/feed', source: '人人都是产品经理', category: 'pm' },
  { url: 'https://www.infoq.cn/rss', source: 'InfoQ 中文', category: 'tech' },
  { url: 'https://sspai.com/feed', source: '少数派', category: 'tech' },
];

const AI_NEWS_KEYWORDS = /(AI|人工智能|大模型|LLM|GPT|生成式|智能体|Agent|机器学习|深度学习|多模态|RAG|Claude|Gemini|DeepSeek|通义|文心|Kimi|智谱|Sora|Copilot|AutoGPT|NLP|CV|AIGC|ChatGPT|Midjourney|Stable Diffusion|开源模型|基座模型|推理优化|向量数据库|知识图谱)/i;

export function isAiRelated(text: string): boolean {
  return AI_NEWS_KEYWORDS.test(text);
}

export interface RawNewsArticle {
  title: string;
  url: string;
  source: string;
  description: string;
  published_at: string;
}
