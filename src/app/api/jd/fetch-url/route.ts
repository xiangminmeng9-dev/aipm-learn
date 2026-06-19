// ─── JD URL Fetch API ──────────────────────────────────────────
// 从招聘网站 URL（BOSS直聘等）抓取岗位描述
// 三层提取策略：Tavily Extract → plain fetch → bookmarklet fallback

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { extractWithTavily } from '@/lib/ai/tavily-extract';

export const maxDuration = 60;

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: '未登录' }, { status: 401 });
  }

  const { url } = await request.json();
  if (!url || typeof url !== 'string') {
    return NextResponse.json({ error: '请提供有效的链接' }, { status: 400 });
  }

  // 验证 URL 格式
  let parsedUrl: URL;
  try {
    parsedUrl = new URL(url);
  } catch {
    return NextResponse.json({ error: '链接格式不正确' }, { status: 400 });
  }

  // 只允许常见招聘网站
  const allowedHosts = [
    'zhipin.com', 'www.zhipin.com',       // BOSS直聘
    'lagou.com', 'www.lagou.com',           // 拉勾
    'liepin.com', 'www.liepin.com',         // 猎聘
    '51job.com', 'www.51job.com',           // 前程无忧
    'zhaopin.com', 'www.zhaopin.com',       // 智联招聘
    'nowcoder.com', 'www.nowcoder.com',     // 牛客网
    'maimai.cn', 'www.maimai.cn',           // 脉脉
    'linkedin.com', 'www.linkedin.com',      // LinkedIn
  ];

  const host = parsedUrl.hostname.toLowerCase();
  const isAllowed = allowedHosts.some(allowed =>
    host === allowed || host.endsWith('.' + allowed)
  );

  if (!isAllowed) {
    return NextResponse.json({
      error: '暂不支持该网站，目前支持：BOSS直聘、拉勾、猎聘、前程无忧、智联招聘、牛客网、脉脉、LinkedIn',
    }, { status: 400 });
  }

  const isZhipin = host.includes('zhipin.com');

  try {
    // ── Tier 1: Tavily Extract ──
    // advanced 模式可处理 JS 渲染页面（如 BOSS直聘）
    const tavilyResult = await extractWithTavily(url, {
      extract_depth: isZhipin ? 'advanced' : 'basic',
      query: 'job description responsibilities requirements 岗位职责 职位描述 任职要求',
      format: 'text',
      timeout: isZhipin ? 30 : 15,
    });

    if (tavilyResult?.results?.length) {
      const rawContent = tavilyResult.results[0].raw_content;
      if (rawContent && rawContent.length > 50) {
        const jdText = cleanTavilyContent(rawContent, url);
        if (jdText && jdText.length > 50) {
          return NextResponse.json({ text: jdText, source: 'tavily' });
        }
      }
    }

    // ── Tier 2: Plain fetch + regex ──
    // zhipin.com 跳过（已知 plain fetch 不行）
    if (!isZhipin) {
      const jdText = await fetchJdFromUrl(url);
      if (jdText) {
        return NextResponse.json({ text: jdText, source: 'fetch' });
      }
    }

    // ── Tier 3: Bookmarklet fallback ──
    return NextResponse.json({
      error: '自动提取失败，请使用书签小工具手动提取',
      fallback: 'bookmarklet',
    }, { status: 404 });

  } catch (err) {
    console.error('[JD Fetch] Error:', err);
    return NextResponse.json({
      error: '抓取失败，请使用书签小工具手动提取',
      fallback: 'bookmarklet',
    }, { status: 500 });
  }
}

// ─── Tavily 内容清洗 ──────────────────────────────────────────

function cleanTavilyContent(rawContent: string, url: string): string | null {
  if (url.includes('zhipin.com')) {
    return extractJdFromTavilyText(rawContent);
  }
  // 其他站点的 Tavily 提取内容通常比较干净
  return rawContent.length > 100 ? rawContent.substring(0, 5000).trim() : null;
}

/**
 * 从 Tavily 提取的文本中截取 JD 相关内容
 * Tavily 可能返回整个页面的文本，需要用关键词定位 JD 段落
 */
function extractJdFromTavilyText(text: string): string | null {
  const jdStartMarkers = ['岗位职责', '职位描述', '工作职责', '职责描述', 'Job Description', 'Responsibilities'];
  const jdEndMarkers = ['公司信息', '公司介绍', '公司地址', '上班地址', '热门推荐', '相似职位', '看了又看', '更多职位', '推荐职位'];

  // 尝试找到 JD 开始位置
  let startIdx = -1;
  for (const marker of jdStartMarkers) {
    const idx = text.indexOf(marker);
    if (idx !== -1) {
      startIdx = idx;
      break;
    }
  }

  // 如果找不到 JD 标记，尝试从"薪资"或职位名开始
  if (startIdx === -1) {
    // 可能 Tavily 返回的内容已经比较精简，直接返回
    return text.length > 100 ? text.substring(0, 5000).trim() : null;
  }

  // 找到 JD 结束位置
  let endIdx = text.length;
  for (const marker of jdEndMarkers) {
    const idx = text.indexOf(marker, startIdx + 10);
    if (idx !== -1 && idx < endIdx) {
      endIdx = idx;
    }
  }

  const jdSection = text.substring(startIdx, Math.min(endIdx, startIdx + 5000)).trim();
  return jdSection.length > 50 ? jdSection : null;
}

// ─── Plain fetch + regex（Tier 2） ────────────────────────────

async function fetchJdFromUrl(url: string): Promise<string | null> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 10000);

  try {
    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'zh-CN,zh;q=0.9,en;q=0.8',
      },
      redirect: 'follow',
    });

    clearTimeout(timer);

    if (!response.ok) return null;

    const html = await response.text();
    return extractJdFromHtml(html, url);
  } catch {
    clearTimeout(timer);
    return null;
  }
}

function extractJdFromHtml(html: string, url: string): string | null {
  // BOSS直聘：优先提取 .job-detail-section 或 .job-sec-text
  if (url.includes('zhipin.com')) {
    return extractBossJd(html);
  }

  // 通用提取：尝试从 meta 标签或常见 JD 容器提取
  return extractGenericJd(html);
}

function extractBossJd(html: string): string | null {
  // 策略1：提取 .job-detail-section 内容
  const detailMatch = html.match(/class="[^"]*job-detail-section[^"]*"[^>]*>([\s\S]*?)<\/div>\s*(?:<div class="[^"]*job-detail-section|$)/i);
  if (detailMatch) {
    const text = htmlToText(detailMatch[1]);
    if (text.length > 50) return text;
  }

  // 策略2：提取 .job-sec-text 内容（职位描述和任职要求）
  const sections: string[] = [];
  const secRegex = /class="[^"]*job-sec-text[^"]*"[^>]*>([\s\S]*?)<\/div>/gi;
  let match;
  while ((match = secRegex.exec(html)) !== null) {
    const text = htmlToText(match[1]);
    if (text.length > 20) sections.push(text);
  }
  if (sections.length > 0) return sections.join('\n\n');

  // 策略3：提取 .job-banner 中的职位名+薪资+地点
  const bannerMatch = html.match(/class="[^"]*job-banner[^"]*"[^>]*>([\s\S]*?)<\/div>/i);
  let header = '';
  if (bannerMatch) {
    header = htmlToText(bannerMatch[1]).substring(0, 200);
  }

  // 策略4：从 JSON-LD 结构化数据提取
  const jsonLdMatch = html.match(/<script type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/i);
  if (jsonLdMatch) {
    try {
      const jsonLd = JSON.parse(jsonLdMatch[1]);
      if (jsonLd.description) {
        const desc = String(jsonLd.description).replace(/<[^>]+>/g, '').trim();
        if (desc.length > 50) {
          return header ? header + '\n\n' + desc : desc;
        }
      }
    } catch { /* ignore */ }
  }

  // 策略5：通用 fallback
  return extractGenericJd(html);
}

function extractGenericJd(html: string): string | null {
  // 从 JSON-LD 提取
  const jsonLdMatches = html.matchAll(/<script type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/gi);
  for (const match of jsonLdMatches) {
    try {
      const jsonLd = JSON.parse(match[1]);
      if (jsonLd.description) {
        const desc = String(jsonLd.description).replace(/<[^>]+>/g, '').trim();
        if (desc.length > 50) return desc;
      }
      // JobPosting 类型
      if (jsonLd['@type'] === 'JobPosting') {
        const parts: string[] = [];
        if (jsonLd.title) parts.push(`职位：${jsonLd.title}`);
        if (jsonLd.hiringOrganization?.name) parts.push(`公司：${jsonLd.hiringOrganization.name}`);
        if (jsonLd.jobLocation) parts.push(`地点：${JSON.stringify(jsonLd.jobLocation)}`);
        if (jsonLd.description) parts.push(String(jsonLd.description).replace(/<[^>]+>/g, ''));
        if (parts.length > 0) return parts.join('\n');
      }
    } catch { /* ignore */ }
  }

  // 从 meta 标签提取 description
  const metaDesc = html.match(/<meta[^>]*name="description"[^>]*content="([^"]*)"[^>]*>/i)
    || html.match(/<meta[^>]*content="([^"]*)"[^>]*name="description"[^>]*>/i);
  if (metaDesc && metaDesc[1].length > 50) {
    return htmlToText(metaDesc[1]);
  }

  // 从 <title> 和正文提取
  const titleMatch = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
  const title = titleMatch ? htmlToText(titleMatch[1]) : '';

  // 尝试提取 body 中看起来像 JD 的内容（包含"职责"/"要求"/"任职"等关键词的段落）
  const bodyMatch = html.match(/<body[^>]*>([\s\S]*?)<\/body>/i);
  if (bodyMatch) {
    const text = htmlToText(bodyMatch[1]);
    // 找包含 JD 关键词的段落
    const jdKeywords = ['岗位职责', '职位描述', '任职要求', '岗位要求', '工作职责', '职责描述', 'Job Description', 'Responsibilities', 'Requirements'];
    const hasJdContent = jdKeywords.some(kw => text.includes(kw));

    if (hasJdContent && text.length > 100) {
      // 截取合理长度
      const truncated = text.substring(0, 3000);
      return title ? title + '\n\n' + truncated : truncated;
    }
  }

  return null;
}

function htmlToText(html: string): string {
  return html
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
    .replace(/<nav[^>]*>[\s\S]*?<\/nav>/gi, '')
    .replace(/<footer[^>]*>[\s\S]*?<\/footer>/gi, '')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/p>/gi, '\n')
    .replace(/<\/li>/gi, '\n')
    .replace(/<\/div>/gi, '\n')
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#\d+;/g, '')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}
