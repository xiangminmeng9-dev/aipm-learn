// ============================================================
// Web Research — 联网搜索公司信息生成画像
// ============================================================
// 核心原则：搜不到就不用，能搜到就用
// - 整个模块是纯增强，不是必须环节
// - 任何环节失败都静默降级，不报错、不阻塞主流程
// - fetchCompanyInfo 返回空数组 → 跳过，走原有降级逻辑

export interface WebResearchResult {
  content: string;
  source: string;
}

// ── 中国公司域名映射（非12家预置大厂的公司） ──
// 持续可扩展：新公司只需加一行
const COMPANY_DOMAIN_MAP: Record<string, string[]> = {
  '小红书': ['xiaohongshu.com'],
  '得物': ['dewu.com', 'poizon.com'],
  'bilibili': ['bilibili.com'],
  'B站': ['bilibili.com'],
  '携程': ['ctrip.com'],
  '贝壳': ['ke.com', 'beike.com'],
  '知乎': ['zhihu.com'],
  '微博': ['weibo.com'],
  '陌陌': ['immomo.com'],
  '商汤': ['sensetime.com'],
  '旷视': ['megvii.com'],
  '大疆': ['dji.com'],
  'oppo': ['oppo.com'],
  'vivo': ['vivo.com'],
  '蔚来': ['nio.com'],
  '理想': ['lixiang.com'],
  '小鹏': ['xiaopeng.com'],
  '米哈游': ['mihoyo.com'],
  '莉莉丝': ['lilith.com'],
  '三七互娱': ['37.com'],
  'shein': ['shein.com'],
  'shopee': ['shopee.com'],
  'lazada': ['lazada.com'],
  '蚂蚁': ['antgroup.com'],
  '蚂蚁金服': ['antgroup.com'],
  '菜鸟': ['cainiao.com'],
  '钉钉': ['dingtalk.com'],
  '飞书': ['feishu.cn'],
  'soul': ['soulapp.cn'],
  '喜马拉雅': ['ximalaya.com'],
  '虎牙': ['huya.com'],
  '斗鱼': ['douyu.com'],
  '58同城': ['58.com'],
  'Boss直聘': ['zhipin.com'],
  '猎聘': ['liepin.com'],
  'boss直聘': ['zhipin.com'],
  '联想': ['lenovo.com'],
  '中兴': ['zte.com.cn'],
  'tcl': ['tcl.com'],
  '海康威视': ['hikvision.com'],
  '大华': ['dahuatech.com'],
  '中芯国际': ['smic.com.cn'],
  '地平线': ['horizon.ai'],
  '禾赛': ['hesaitech.com'],
  '百川智能': ['baichuan-ai.com'],
  '智谱': ['zhipuai.cn'],
  '月之暗面': ['moonshot.cn'],
  'minimax': ['minimaxi.com'],
  '零一万物': ['01.ai'],
};

/**
 * 生成候选 URL 列表
 * 1. 先查 COMPANY_DOMAIN_MAP → 用真实域名构建
 * 2. 无映射 → slug 方式生成（中文域名基本会失败，没关系，静默降级）
 */
function generateCandidateUrls(companyName: string): string[] {
  const urls: string[] = [];
  const normalized = companyName.trim();

  // 1. 从域名映射表获取
  const mappedDomains = COMPANY_DOMAIN_MAP[normalized]
    || COMPANY_DOMAIN_MAP[normalized.toLowerCase()]
    || null;

  const domains = mappedDomains || [];

  // 如果映射表有域名，用真实域名构建 URL
  if (domains.length > 0) {
    for (const domain of domains) {
      urls.push(
        `https://jobs.${domain}`,
        `https://careers.${domain}`,
        `https://www.${domain}/about/careers`,
        `https://www.${domain}/about`,
        `https://${domain}/careers`,
      );
    }
  } else {
    // 2. 无映射 → slug 方式（中文公司名会生成无效 URL，自然失败）
    const slug = normalized
      .toLowerCase()
      .replace(/[^\w\s-]/g, '')
      .trim()
      .replace(/\s+/g, '-')
      .slice(0, 30);

    if (slug && /^[a-z0-9]/.test(slug)) {
      urls.push(
        `https://jobs.${slug}.com`,
        `https://careers.${slug}.com`,
        `https://www.${slug}.com/about/careers`,
        `https://www.${slug}.com/about`,
        `https://${slug}.com/careers`,
      );
    }
  }

  return urls;
}

/**
 * 抓取单个 URL
 * - 8s 超时
 * - HTML → 纯文本（去标签、去脚本、去样式）
 * - 截取前 3000 字符
 * - 内容 <100 字符视为无效返回 null
 */
async function fetchUrlContent(
  url: string,
  timeoutMs: number = 8000
): Promise<WebResearchResult | null> {
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);

    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; ResumeBot/1.0; +https://github.com/resume-assistant)',
        'Accept': 'text/html,text/plain',
      },
      redirect: 'follow',
    });

    clearTimeout(timer);

    if (!response.ok) return null;

    const html = await response.text();

    // Strip HTML → plain text
    let text = html
      .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')   // Remove scripts
      .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')      // Remove styles
      .replace(/<nav[^>]*>[\s\S]*?<\/nav>/gi, '')           // Remove nav
      .replace(/<footer[^>]*>[\s\S]*?<\/footer>/gi, '')      // Remove footer
      .replace(/<[^>]+>/g, ' ')                              // Strip all tags
      .replace(/&nbsp;/g, ' ')
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/&#\d+;/g, '')
      .replace(/\s+/g, ' ')
      .trim();

    // Truncate to manageable length for AI input
    if (text.length > 3000) {
      text = text.slice(0, 3000);
    }

    // Too little content → probably not a useful page
    if (text.length < 100) return null;

    return { content: text, source: url };
  } catch {
    return null;
  }
}

/**
 * 并行抓取公司信息
 * 尝试多个 URL 模式，返回所有成功的结果
 * 可能返回空数组（所有 URL 都失败）→ 调用方静默降级
 */
export async function fetchCompanyInfo(
  companyName: string
): Promise<WebResearchResult[]> {
  const urls = generateCandidateUrls(companyName);

  if (urls.length === 0) return [];

  // Try all URLs in parallel — most will 404 or timeout, that's expected
  const results = await Promise.allSettled(
    urls.map(url => fetchUrlContent(url))
  );

  const successful: WebResearchResult[] = [];
  for (const result of results) {
    if (result.status === 'fulfilled' && result.value) {
      successful.push(result.value);
    }
  }

  // Deduplicate by source URL, keep first occurrence
  const seen = new Set<string>();
  return successful.filter(r => {
    if (seen.has(r.source)) return false;
    seen.add(r.source);
    return true;
  });
}

/**
 * 用 AI (haiku) 从网页内容生成 CompanyPreference
 * webContents 为空 → 返回 null（调用方走降级逻辑）
 * AI 生成失败 → 返回 null（调用方走降级逻辑）
 */
export async function generateCompanyPreferenceFromWeb(
  companyName: string,
  webContents: WebResearchResult[],
  generateTextFn: (prompt: string, options: { model: string; maxTokens: number }) => Promise<string>
): Promise<{
  preference: {
    persona: string;
    core_skills: Array<{ name: string; count: number }>;
    soft_skills: string[];
    not_care: string;
    suggestion: string;
    strengthen: string;
  };
  source: string;
} | null> {
  if (webContents.length === 0) return null;

  // Combine web contents (limit total input size for AI)
  const combinedContent = webContents
    .map(r => `[来源: ${r.source}]\n${r.content}`)
    .join('\n\n---\n\n')
    .slice(0, 6000);

  const prompt = `你是一位资深互联网招聘分析师，非常了解各大公司的招聘风格和用人偏好。请基于以下从${companyName}官网获取的信息，分析该公司的招聘偏好和用人风格。

官网信息：
${combinedContent}

请严格按以下JSON格式输出（不要输出其他内容）：
{
  "persona": "用非常口语化、直白的语言描述这家公司想要什么样的人，像内部员工私下聊天一样告诉你朋友真相。必须覆盖以下维度并用具体细节填充：1)他们看重什么样的人（性格、做事风格）2)特别看重什么能力或特质 3)面试风格是怎样的 4)喜欢什么类型的人 5)讨厌什么类型的人。每个维度都要有画面感的细节，不能泛泛而谈。",
  "core_skills": [{"name":"技能名","count":1}],
  "soft_skills": ["软技能1","软技能2"],
  "not_care": "用直白的语言说这家公司不太看重什么",
  "suggestion": "给求职者的具体建议，包括怎么准备面试、简历怎么改",
  "strengthen": "目前简历最需要补强的技能"
}

注意：
- 基于官网信息推断，信息不足的部分可以合理推测但要保守
- 如果官网信息不足以推断某个维度，该维度给出保守判断并在suggestion中标注"基于官网信息推断，建议补充实际面经"
- persona要写出鲜明的个性差异，不要写泛泛的"注重执行力和团队协作"`;

  try {
    const result = await generateTextFn(prompt, {
      model: 'haiku',
      maxTokens: 2048,
    });

    const jsonMatch = result.match(/\{[\s\S]*\}/);
    if (!jsonMatch) return null;

    let jsonStr = jsonMatch[0];
    // Bracket repair (same logic as company-profile route)
    const openB = (jsonStr.match(/\[/g) || []).length;
    const closeB = (jsonStr.match(/\]/g) || []).length;
    const openC = (jsonStr.match(/\{/g) || []).length;
    const closeC = (jsonStr.match(/\}/g) || []).length;
    if (openB > closeB || openC > closeC) {
      jsonStr = jsonStr.replace(/,\s*"[^"]*":\s*[^,}\]]*$/g, '');
      jsonStr = jsonStr.replace(/,\s*$/g, '');
      for (let i = 0; i < openB - closeB; i++) jsonStr += ']';
      for (let i = 0; i < openC - closeC; i++) jsonStr += '}';
    }

    const preference = JSON.parse(jsonStr);
    const sourceUrls = webContents.map(r => r.source).join(', ');

    return { preference, source: sourceUrls };
  } catch {
    return null;
  }
}
