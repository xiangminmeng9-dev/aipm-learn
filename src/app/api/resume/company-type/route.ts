import { NextRequest, NextResponse } from 'next/server';
import { createClient, createServiceClient } from '@/lib/supabase/server';
import { generateText } from '@/lib/ai/claude';
import type { CompanyType } from '@/types';

const BIG_COMPANY_KEYWORDS = ['字节跳动', '腾讯', '阿里巴巴', '阿里', '百度', '美团', '京东', '拼多多', '网易', '小米', '华为', '快手', '滴滴', '蚂蚁', 'baidu', 'tencent', 'alibaba', 'bytedance', 'meituan', 'jd.com', 'pinduoduo', 'netease', 'xiaomi', 'huawei', 'kuaishou', 'didi'];
const FOREIGN_KEYWORDS = ['google', 'microsoft', 'amazon', 'apple', 'meta', 'facebook', 'intel', 'nvidia', 'amd', 'qualcomm', 'sap', 'oracle', 'ibm', 'cisco', 'dell', 'salesforce', 'adobe', 'spotify', 'uber', 'airbnb', 'stripe', 'paypal', '谷歌', '微软', '亚马逊', '苹果', '脸书', '英特尔', '英伟达'];
const STATE_OWNED_KEYWORDS = ['中国银行', '工商银行', '建设银行', '农业银行', '交通银行', '国家电网', '中国移动', '中国电信', '中国联通', '中石油', '中石化', '中铁', '中建', '国开行', '邮政', '烟草', '电网'];
const STARTUP_KEYWORDS = ['创业', '天使轮', 'a轮', 'b轮', 'pre-a', 'seed', '早期', '初创'];

function detectByKeywords(name: string): CompanyType | null {
  const lower = name.toLowerCase();
  for (const kw of BIG_COMPANY_KEYWORDS) if (lower.includes(kw)) return 'big_company';
  for (const kw of FOREIGN_KEYWORDS) if (lower.includes(kw)) return 'foreign';
  for (const kw of STATE_OWNED_KEYWORDS) if (lower.includes(kw)) return 'state_owned';
  for (const kw of STARTUP_KEYWORDS) if (lower.includes(kw)) return 'startup';
  return null;
}

export async function GET(request: NextRequest) {
  try {
    const companyName = request.nextUrl.searchParams.get('name');
    if (!companyName) return NextResponse.json({ error: '缺少公司名' }, { status: 400 });

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: '未登录' }, { status: 401 });

    // 1. Check user's existing records for this company
    const serviceClient = createServiceClient();
    const { data: existing } = await serviceClient
      .from('resume_applications')
      .select('company_type')
      .eq('user_id', user.id)
      .ilike('company_name', `%${companyName}%`)
      .neq('company_type', 'other')
      .limit(1)
      .maybeSingle();

    if (existing?.company_type) {
      return NextResponse.json({ company_type: existing.company_type, source: 'existing' });
    }

    // 2. Keyword matching
    const keywordResult = detectByKeywords(companyName);
    if (keywordResult) {
      return NextResponse.json({ company_type: keywordResult, source: 'keyword' });
    }

    // 3. AI classification (haiku, fast & cheap)
    try {
      const aiResult = await generateText(
        `请判断以下公司属于哪种类型，只回复一个类型代码：
big_company: 中国/国际大型科技公司（BAT、TMD级别）
foreign: 外企/跨国公司
state_owned: 国企/央企/事业单位
startup: 创业公司/早期公司
traditional: 传统行业（非科技类）
other: 无法判断

公司名：${companyName}

只回复类型代码，不要其他内容。`,
        { model: 'haiku', maxTokens: 20 }
      );
      const type = aiResult.trim().toLowerCase() as CompanyType;
      const validTypes = ['big_company', 'foreign', 'state_owned', 'startup', 'traditional', 'other'];
      if (validTypes.includes(type)) {
        return NextResponse.json({ company_type: type, source: 'ai' });
      }
    } catch (aiErr) {
      console.error('AI company type detection failed:', aiErr);
    }

    return NextResponse.json({ company_type: 'other', source: 'fallback' });
  } catch (err) {
    console.error('Company type detection error:', err);
    return NextResponse.json({ error: '检测失败' }, { status: 500 });
  }
}
