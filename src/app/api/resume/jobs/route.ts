import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

const CACHE_DURATION_MS = 6 * 60 * 60 * 1000; // 6 hours
const FETCH_TIMEOUT_MS = 8000;

interface Job {
  title: string;
  company: string;
  location: string;
  description: string;
  source: string;
  published_at: string;
  url?: string;
}

// 中国互联网/AI 公司白名单 — 用于从 RSS 内容中识别可信的中国公司
const CN_COMPANIES = [
  // 大厂
  '字节跳动', '抖音', 'TikTok', '飞书', '腾讯', '微信', 'QQ', '阿里巴巴', '阿里', '淘宝', '天猫', '钉钉', '蚂蚁', '支付宝',
  '百度', '文心', '京东', '美团', '滴滴', '拼多多', '多多', '网易', '小米', '华为', '鸿蒙', '荣耀', 'OPPO', 'vivo',
  // 新经济 / AI
  '字节', '快手', '哔哩哔哩', 'B站', 'bilibili', '知乎', '小红书', '得到', '喜马拉雅', '携程', '去哪儿', '贝壳', '链家',
  '理想', '蔚来', '小鹏', '比亚迪', '华为车', '地平线', '商汤', 'SenseTime', '旷视', 'Megvii', '科大讯飞', '讯飞',
  '月之暗面', 'Moonshot', 'Kimi', '智谱', 'Zhipu', '智谱AI', 'DeepSeek', '深度求索', '百川', 'Baichuan', 'MiniMax',
  '零一万物', '01.AI', '面壁', 'ModelBest', '阶跃', 'StepFun', '元象', '稀宇', '昆仑万维', '澜舟', '出门问问',
  'Mobvoi', '光年之外', '潞晨', 'HPC', '生数', '爱诗', '爱奇艺', '优酷', '腾讯视频', '芒果TV', '米哈游', 'mihoyo',
  '莉莉丝', '三七互娱', '完美世界', '叠纸', '游族', '字节游戏', '腾讯游戏', '网易游戏',
  // 金融/SaaS/云
  '招银', '招商银行', '平安', '中信', '蚂蚁金服', '微众', '新希望', '金蝶', '用友', '有赞', '声网', 'Agora',
  '声智', '涂鸦', '奇安信', '绿盟', 'PingCAP', '墨奇', '奥迪威', '销售易', '明略', '第四范式', '4Paradigm',
  '壁仞', 'Biren', '寒武纪', '燧原', '天数智芯', '摩尔线程',
  // 近年热门
  '同程', '贝达', '海康威视', '大疆', 'DJI', '字节火山', '火山引擎', '腾讯云', '阿里云', '百度云', '华为云',
  'Shein', '希音', 'Temu', '拼多多海外', '名创优品', '元气森林', '瑞幸', '霸王茶姬', '喜茶', '茶颜悦色',
];

const AI_PM_KEYWORDS_ZH = /(AI|人工智能|大模型|大语言模型|LLM|GPT|生成式|通用模型|智能体|Agent|算法|机器学习|深度学习|NLP|自然语言|多模态|CV|视觉|数据|推荐|搜索|对话)/i;
const PM_KEYWORDS_ZH = /(产品经理|产品专家|产品负责人|产品总监|Product Manager|PM|产品策划|产品运营)/i;
const AI_KEYWORDS_EN = /(AI|LLM|GPT|ML\b|Machine Learning|Generative|Foundation Model|Multimodal|Agent|NLP|RAG)/i;
const PM_KEYWORDS_EN = /(Product Manager|Product Lead|Head of Product|Product Owner|\bPM\b)/i;

const RSS_FEEDS = [
  { url: 'https://www.v2ex.com/feed/jobs.xml', source: 'V2EX · 酷工作' },
  { url: 'https://www.v2ex.com/feed/create.xml', source: 'V2EX · 创意工作' },
  { url: 'https://ruby-china.org/jobs.atom', source: 'Ruby China · Jobs' },
  { url: 'https://ruby-china.org/topics/node23/feed', source: 'Ruby China · Jobs' },
];

function stripHtml(html: string): string {
  return html
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, ' ')
    .trim();
}

/** 判断一段文本是否含有至少 30% 的中日韩字符 → 认为是"中文 JD" */
function isChineseText(text: string): boolean {
  if (!text) return false;
  const cjk = text.match(/[\u4e00-\u9fa5]/g);
  if (!cjk || cjk.length < 20) return false;
  return cjk.length / text.length > 0.2;
}

/** 从文本里找到匹配的白名单公司名 */
function detectCnCompany(text: string): string | null {
  for (const c of CN_COMPANIES) {
    if (text.includes(c)) return c;
  }
  return null;
}

/** 提取位置：优先匹配中国一线/新一线城市 */
function extractCnLocation(text: string): string {
  const cities = ['北京', '上海', '深圳', '广州', '杭州', '成都', '南京', '武汉', '苏州', '西安', '长沙', '天津', '重庆', '厦门', '青岛', '宁波', '合肥', '郑州', '济南', '福州', '大连', '沈阳', '无锡'];
  const remote = text.match(/(远程|Remote|WFH)/i);
  const hit = cities.find((c) => text.includes(c));
  if (hit && remote) return `${hit}/远程`;
  if (hit) return hit;
  if (remote) return '远程';
  return '中国';
}

async function fetchWithTimeout(url: string): Promise<string> {
  const controller = new AbortController();
  const t = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
  try {
    const res = await fetch(url, {
      signal: controller.signal,
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; AIPMBot/1.0; +https://example.com/bot)' },
      next: { revalidate: 0 },
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.text();
  } finally {
    clearTimeout(t);
  }
}

async function parseFeed(url: string, source: string): Promise<Job[]> {
  const xml = await fetchWithTimeout(url);
  const { XMLParser } = await import('fast-xml-parser');
  const parser = new XMLParser({ ignoreAttributes: false, attributeNamePrefix: '@_' });
  const doc = parser.parse(xml);
  const rawItems = doc?.rss?.channel?.item ?? doc?.feed?.entry ?? [];
  const list: Array<Record<string, unknown>> = Array.isArray(rawItems) ? rawItems : [rawItems];

  const jobs: Job[] = [];
  for (const item of list) {
    const title = String(item.title ?? '').trim();
    if (!title) continue;
    const rawDesc = String(item.description ?? item.summary ?? item['content:encoded'] ?? item.content ?? '');
    const description = stripHtml(rawDesc).slice(0, 800);
    const combined = `${title} ${description}`;

    // 1) 必须是中文 JD
    if (!isChineseText(combined)) continue;

    // 2) 必须命中 AI 或 PM 相关关键词
    const hasAI = AI_PM_KEYWORDS_ZH.test(combined);
    const hasPM = PM_KEYWORDS_ZH.test(combined);
    if (!hasAI && !hasPM) continue;

    // 3) 必须能识别出中国互联网公司
    const company = detectCnCompany(combined);
    if (!company) continue;

    const pub = String(item.pubDate ?? item.published ?? item.isoDate ?? '');
    const published_at = pub ? new Date(pub).toISOString() : new Date().toISOString();
    const linkVal = item.link as unknown;
    const link = typeof linkVal === 'string' ? linkVal : (linkVal as { '@_href'?: string })?.['@_href'] ?? '';

    jobs.push({
      title: title.slice(0, 100),
      company,
      location: extractCnLocation(combined),
      description,
      source,
      published_at,
      url: link,
    });
  }
  return jobs;
}

/** Hacker News "Who is hiring" — 拉最近 3 个月的月度帖，提取顶层评论里的 AI PM 岗位 */
async function fetchHackerNewsHiring(): Promise<Job[]> {
  const HN_USER = 'whoishiring';
  const userRes = await fetch(`https://hacker-news.firebaseio.com/v0/user/${HN_USER}.json`, {
    next: { revalidate: 0 },
  });
  if (!userRes.ok) return [];
  const userData = (await userRes.json()) as { submitted?: number[] };
  const submitted = userData.submitted ?? [];

  const candidateThreads: Array<{ id: number; kids: number[]; time: number }> = [];
  for (const id of submitted.slice(0, 30)) {
    const itemRes = await fetch(`https://hacker-news.firebaseio.com/v0/item/${id}.json`, {
      next: { revalidate: 0 },
    });
    if (!itemRes.ok) continue;
    const item = (await itemRes.json()) as { title?: string; kids?: number[]; time?: number };
    if (item?.title?.toLowerCase().startsWith('ask hn: who is hiring')) {
      candidateThreads.push({ id, kids: item.kids ?? [], time: item.time ?? 0 });
      if (candidateThreads.length >= 3) break;
    }
  }

  const jobs: Job[] = [];
  for (const thread of candidateThreads) {
    const commentIds = thread.kids.slice(0, 80);
    const settled = await Promise.allSettled(
      commentIds.map((cid) =>
        fetch(`https://hacker-news.firebaseio.com/v0/item/${cid}.json`, { next: { revalidate: 0 } })
          .then((r) => (r.ok ? r.json() : null))
      )
    );
    for (const s of settled) {
      if (s.status !== 'fulfilled' || !s.value) continue;
      const c = s.value as { text?: string; by?: string; time?: number };
      if (!c.text) continue;
      const text = stripHtml(c.text);
      if (!AI_KEYWORDS_EN.test(text) || !PM_KEYWORDS_EN.test(text)) continue;
      const firstLine = text.split(/\||·|\s—\s|\s-\s/)[0]?.trim() ?? '';
      const company = firstLine.split(/[,(\s]/)[0]?.slice(0, 60) || (c.by ?? 'Unknown');
      const titleMatch = text.match(/(AI[\w\s]*?Product\s+(?:Manager|Lead|Owner)|Product\s+(?:Manager|Lead)[\w\s,]*?(?:AI|ML|LLM)[\w\s]*)/i);
      const title = (titleMatch?.[0] ?? 'AI Product Manager').slice(0, 100);
      const locMatch = text.match(/(REMOTE|Remote|San Francisco|New York|London|Berlin|Singapore|Beijing|Shanghai|Shenzhen|Hangzhou|Tokyo)[\w,\s/]*/i);
      jobs.push({
        title,
        company,
        location: (locMatch?.[0] ?? 'Remote').slice(0, 60),
        description: text.slice(0, 800),
        source: 'Hacker News · Who is hiring',
        published_at: new Date((c.time ?? thread.time) * 1000).toISOString(),
      });
    }
  }
  return jobs;
}

async function refreshJobsFromRSS(): Promise<Job[]> {
  const results = await Promise.allSettled([
    ...RSS_FEEDS.map((f) => parseFeed(f.url, f.source)),
    fetchHackerNewsHiring(),
  ]);
  const jobs: Job[] = [];
  for (const r of results) {
    if (r.status === 'fulfilled') jobs.push(...r.value);
  }
  const seen = new Set<string>();
  const unique = jobs.filter((j) => {
    const key = `${j.title.toLowerCase()}|${j.company}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
  unique.sort((a, b) => new Date(b.published_at).getTime() - new Date(a.published_at).getTime());
  return unique.slice(0, 40);
}

async function saveJobsToCache(
  supabase: Awaited<ReturnType<typeof createClient>>,
  jobs: Job[]
): Promise<void> {
  try {
    await supabase.from('resume_jobs').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    const rows = jobs.map((job) => ({
      title: job.title,
      company: job.company,
      location: job.location ?? '',
      description: job.description ?? '',
      source: job.source ?? '',
      published_at: job.published_at ?? new Date().toISOString(),
      fetched_at: new Date().toISOString(),
    }));
    if (rows.length > 0) await supabase.from('resume_jobs').insert(rows);
  } catch (err) {
    console.error('Failed to save jobs to cache:', err);
  }
}

async function refreshJobsInBackground(): Promise<void> {
  try {
    const fresh = await refreshJobsFromRSS();
    if (fresh.length === 0) return;
    const supabase = await createClient();
    await saveJobsToCache(supabase, fresh);
  } catch {
    // silent
  }
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const force = url.searchParams.get('refresh') === '1';

  try {
    const supabase = await createClient();
    const { data: cachedJobs, error } = await supabase
      .from('resume_jobs')
      .select('*')
      .order('published_at', { ascending: false });

    if (error) {
      const fresh = await refreshJobsFromRSS().catch(() => [] as Job[]);
      return NextResponse.json({ jobs: fresh });
    }

    const now = Date.now();
    const stale =
      !cachedJobs ||
      cachedJobs.length === 0 ||
      cachedJobs.some((job: { fetched_at?: string }) => {
        if (!job.fetched_at) return true;
        return now - new Date(job.fetched_at).getTime() > CACHE_DURATION_MS;
      });

    if (force || stale) {
      if (!cachedJobs || cachedJobs.length === 0) {
        const fresh = await refreshJobsFromRSS().catch(() => [] as Job[]);
        if (fresh.length > 0) await saveJobsToCache(supabase, fresh);
        return NextResponse.json({ jobs: fresh });
      }
      refreshJobsInBackground().catch(() => {});
      return NextResponse.json({ jobs: cachedJobs });
    }

    return NextResponse.json({ jobs: cachedJobs ?? [] });
  } catch (error) {
    console.error('Resume jobs API error:', error);
    return NextResponse.json({ jobs: [] });
  }
}
