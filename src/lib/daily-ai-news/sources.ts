export const AI_NEWS_RSS_FEEDS = [
  { url: 'https://36kr.com/feed', source: '36氪', category: 'tech' },
  { url: 'https://www.jiqizhixin.com/rss', source: '机器之心', category: 'ai' },
  { url: 'https://www.qbitai.com/feed', source: '量子位', category: 'ai' },
  { url: 'https://www.woshipm.com/feed', source: '人人都是产品经理', category: 'pm' },
  { url: 'https://www.infoq.cn/rss', source: 'InfoQ 中文', category: 'tech' },
  { url: 'https://sspai.com/feed', source: '少数派', category: 'tech' },
];

export interface RawNewsArticle {
  title: string;
  url: string;
  source: string;
  description: string;
  published_at: string;
}
