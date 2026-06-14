/**
 * 公司名称归一化：将同一公司的不同写法统一到标准名称
 * 用于知识图谱和Dashboard的公司聚合统计
 */

// 常见公司名关键词 -> 标准名
const COMPANY_PATTERNS: Array<{ pattern: RegExp; canonical: string }> = [
  // 字节跳动及子公司
  { pattern: /字节|ByteDance|bytedance/i, canonical: '字节跳动' },
  { pattern: /飞书|Lark|lark|抖音|Douyin|douyin|TikTok|tiktok|朝夕光年|Pico|pico/i, canonical: '字节跳动' },
  // 腾讯
  { pattern: /腾讯|Tencent|tencent|微信|WeChat/i, canonical: '腾讯' },
  // 阿里巴巴
  { pattern: /阿里|Alibaba|alibaba|淘宝|天猫|蚂蚁|Ali/i, canonical: '阿里巴巴' },
  // 百度
  { pattern: /百度|Baidu|baidu/i, canonical: '百度' },
  // 华为
  { pattern: /华为|Huawei|huawei/i, canonical: '华为' },
  // 美团
  { pattern: /美团|Meituan|meituan/i, canonical: '美团' },
  // 京东
  { pattern: /京东|JD\.?com|jd\.?com/i, canonical: '京东' },
  // 小米
  { pattern: /小米|Xiaomi|xiaomi/i, canonical: '小米' },
  // 网易
  { pattern: /网易|NetEase|netease|163/i, canonical: '网易' },
  // 快手
  { pattern: /快手|Kuaishou|kuaishou/i, canonical: '快手' },
  // 滴滴
  { pattern: /滴滴|DiDi|didi/i, canonical: '滴滴' },
  // 微软
  { pattern: /微软|Microsoft|microsoft/i, canonical: '微软' },
  // 谷歌
  { pattern: /谷歌|Google|google/i, canonical: '谷歌' },
  // 苹果
  { pattern: /苹果|Apple[^a-z]|^Apple$/i, canonical: '苹果' },
  // Meta/Facebook
  { pattern: /^Meta$|^Facebook$|^FB$/i, canonical: 'Meta' },
  // OpenAI
  { pattern: /OpenAI|openai/i, canonical: 'OpenAI' },
  // 商汤
  { pattern: /商汤|SenseTime|sensetime/i, canonical: '商汤' },
  // 旷视
  { pattern: /旷视|Megvii|megvii/i, canonical: '旷视' },
  // 科大讯飞
  { pattern: /科大讯飞|讯飞|iFlytek|iflytek/i, canonical: '科大讯飞' },
  // 拼多多
  { pattern: /拼多多|Pinduoduo|pinduoduo|PDD/i, canonical: '拼多多' },
  // 大疆
  { pattern: /大疆|DJI|dji/i, canonical: '大疆' },
];

export function normalizeCompanyName(name: string): string {
  const n = name.trim();
  if (!n) return '未提及公司';

  for (const { pattern, canonical } of COMPANY_PATTERNS) {
    if (pattern.test(n)) return canonical;
  }

  return n;
}

/**
 * 从JD文本中提取公司名（当company_name字段为空时使用）
 * 匹配常见模式："XX公司招聘"、"XX有限公司"、"加入XX"、"在XX工作"等
 */
export function extractCompanyFromText(jdText: string): string | null {
  if (!jdText) return null;

  // 先尝试已知公司关键词
  for (const { pattern, canonical } of COMPANY_PATTERNS) {
    if (pattern.test(jdText.slice(0, 200))) return canonical;
  }

  // 提取"XX公司"、"XX有限公司"、"XX集团"等
  const companyMatch = jdText.slice(0, 300).match(/(?:加入|入职|应聘|招聘于|来自|在)\s*([一-龥]{2,8})(?:公司|有限公司|集团|科技|网络|信息技术|Inc\.|Corp\.|Ltd\.)/);
  if (companyMatch) return companyMatch[1] + '公司';

  // 提取"XX招聘"模式
  const hireMatch = jdText.slice(0, 100).match(/([一-龥]{2,8})(?:招聘|校招|社招)/);
  if (hireMatch) return hireMatch[1];

  return null;
}
