import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { generateText } from '@/lib/ai/claude';

export const maxDuration = 30;

const KG_QA_SYSTEM_PROMPT = `你是一个AI PM技能图谱分析助手，擅长从JD分析数据中提炼洞察。

回答格式要求（严格遵守）：
1. 纯文本，不要用markdown（不要**加粗**、#标题、- 列表符号等）
2. 用中文标点和换行组织，数字用阿拉伯数字

回答结构要求：
1. 技能列表按出现次数从高到低排列，每项标注次数和重要性（高/中/低），全部列出不要省略
2. 未覆盖的技能标注⚠️
3. 最后给出一段分析洞察（这是最重要的部分），包括：
   - 该公司/技能的核心特征是什么
   - 对求职者的关键建议
   - 与行业趋势的关联

示例回答风格：

字节跳动看重的技能（按出现次数排序）：
1. Agent搭建（13次，高）——字节核心方向，所有产品线都在做Agent
2. 大模型应用与落地（11次，高）——强调落地能力而非理论
3. RAG（8次，中）——知识类产品的基础能力
4. Prompt Engineering（7次，中）⚠️未覆盖
5. 数据驱动（6次，中）

分析洞察：
字节跳动最突出的特点是极度重视Agent能力和大模型落地经验，这和抖音、飞书等产品都在往AI Native方向演进有关。对于求职者来说，有实际的Agent产品经验比懂技术原理更受看重。数据驱动是基础要求但不是区分点，RAG和Prompt Engineering是加分项。建议重点准备Agent相关的项目案例，特别是多Agent协作、工具调用方面的经验。`;

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: '请先登录' }, { status: 401 });

    const { query, nodes, edges } = await request.json();
    if (!query?.trim()) return NextResponse.json({ error: '请输入问题' }, { status: 400 });

    // Build a concise data summary for the AI
    const nodeSummary = (nodes as Array<{ id: string; name: string; type: string; data: Record<string, unknown> }>).map(n => {
      const d = n.data;
      switch (n.type) {
        case 'company':
          return `[公司] ${n.name}: JD数=${d.jd_count || 0}`;
        case 'skill':
          return `[技能] ${n.name}: 次数=${d.frequency || 0}, 覆盖=${d.covered ? '是' : '否'}, 重要性=${d.importance_mode || '中'}, 公司=${(d.companies as string[] || []).join('/')}`;
        case 'position':
          return `[职位] ${n.name}: JD数=${d.position_jd_count || 0}`;
        case 'category':
          return `[类别] ${n.name}: 技能数=${d.skill_count || 0}`;
        case 'module':
          return `[模块] ${n.name}: 层级=${d.module_level || '?'}`;
        default:
          return `[${n.type}] ${n.name}`;
      }
    }).join('\n');

    const edgeSummary = (edges as Array<{ source: string; target: string; relation: string; data: Record<string, unknown> }>).map(e => {
      const srcName = (nodes as Array<{ id: string; name: string }>).find(n => n.id === e.source)?.name || e.source;
      const tgtName = (nodes as Array<{ id: string; name: string }>).find(n => n.id === e.target)?.name || e.target;
      const extra = e.relation === '看重' ? `(重要性=${e.data.importance || '中'}, 次数=${e.data.frequency || 1})` :
                     e.relation === '要求' ? `(重要性=${e.data.importance || '中'})` :
                     e.relation === '已覆盖' ? `(匹配度=${e.data.match_score || 0})` : '';
      return `${srcName} -[${e.relation}]-> ${tgtName} ${extra}`;
    }).join('\n');

    const prompt = `图谱数据：

=== 节点 ===
${nodeSummary}

=== 关系 ===
${edgeSummary}

=== 用户问题 ===
${query}

请基于以上图谱数据回答问题。记住：按次数从高到低排列，最后给出分析洞察。`;

    const result = await generateText(prompt, {
      system: KG_QA_SYSTEM_PROMPT,
      maxTokens: 3072,
    });

    return NextResponse.json({ answer: result });
  } catch (error) {
    console.error('KG QA error:', error);
    return NextResponse.json({ error: 'AI 调用失败，请重试' }, { status: 500 });
  }
}
